import { KafkaConsumer } from 'node-rdkafka';
import { OrderStatus, Order } from './OrderProducer';
import { AsyncRedisClient } from './index';
import MotoboyProducer from './MotoboyProducer';

const TOPIC_NAME = 'deliveryBalcony';
const groupId = 'Waiter';

export default class DeliveryBalconyConsumer extends KafkaConsumer {
  constructor(
    private readonly redisClient: AsyncRedisClient,
    private readonly motoboyProducer: MotoboyProducer,
  ) {
    super(process.env.KAFKA_PASSWORD 
      ? {
        'group.id': groupId,
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
        'sasl.username': process.env.KAFKA_USERNAME,
        'sasl.password': process.env.KAFKA_PASSWORD,
        'sasl.mechanisms': 'SCRAM-SHA-256',
        'socket.keepalive.enable': true,
        'debug': 'generic,broker,security',
        'security.protocol': 'sasl_ssl',
      }
      : {
        'group.id': groupId,
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
      }, {},
    );

    const topicName = `${process.env.KAFKA_TOPIC_PREFIX || ''}${TOPIC_NAME}`;
    super
      .on('ready', () => {
        super.subscribe([topicName]);
        super.consume();
        console.log(`Started ${groupId} consumer`);
      })
      .on('rebalance', () => console.log(`Rebalancing ${groupId} Consumers...`))
      .on('data', ({ value }) => this.orderReceivedOnBalcony(JSON.parse(value.toString())))
      .on('event.error', (error) => { throw error });
  }

  async orderReceivedOnBalcony(receivedOrder: Order) {
    if (receivedOrder.food?.length) {
      await this.foodReceived(receivedOrder);
    } else {
      await this.drinksReceived(receivedOrder);
    }
  }

  async foodReceived({ id }: Order) {
    const [orderStatus, stringifiedOrder] = await Promise.all([
      this.redisClient.getsetAsync(`${id}-status`, OrderStatus.FOOD_READY),
      this.redisClient.getAsync(id),
    ]);
    const order = JSON.parse(stringifiedOrder);
    if (orderStatus === OrderStatus.DRINKS_READY || !order.drinks?.length) {
      console.log('\x1b[33m%s\x1b[0m', `Order '${id}' food ready...`);
      await this.setOrderStatus(id, OrderStatus.DONE);
      this.sendToMotoboy(order);
    } else {
      console.log('\x1b[31m%s\x1b[0m', `Order '${id}' food ready, waiting drinks...`);
    }
  }

  async drinksReceived({ id }: Order) {
    const [orderStatus, stringifiedOrder] = await Promise.all([
      this.redisClient.getsetAsync(`${id}-status`, OrderStatus.DRINKS_READY),
      this.redisClient.getAsync(id),
    ]);
    const order = JSON.parse(stringifiedOrder);
    if (orderStatus === OrderStatus.FOOD_READY || !order.food?.length) {
      console.log('\x1b[33m%s\x1b[0m', `Order '${id}' drinks ready...`);
      await this.setOrderStatus(id, OrderStatus.DONE);
      this.sendToMotoboy(order);
    } else {
      console.log('\x1b[31m%s\x1b[0m', `Order '${order.id}' drinks ready, waiting food...`);
    }
  }

  async setOrderStatus(orderId: string, status: OrderStatus) {
    await this.redisClient.setAsync(`${orderId}-status`, status);
  }

  async sendToMotoboy(order: Order) {
    await this.motoboyProducer.sendOrderToMotoboy(order);
  }

  start() {
    super.connect();
  }

  close() {
    super.disconnect();
  }
}