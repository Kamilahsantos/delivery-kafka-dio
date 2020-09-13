
import { KafkaConsumer } from 'node-rdkafka';
import BalconyProducer from './BalconyProducer';
import { sleep } from 'sleep';

export type Order = {
  id: string,
  table: number,
  address: string,
  food: string[],
  drinks: string[],
}

export default class OrderConsumer extends KafkaConsumer {
  constructor(
    private readonly balconyProducer: BalconyProducer,
    private readonly consumerType: 'Cooker' | 'Bartender',
  ) {
    super(process.env.KAFKA_PASSWORD
      ? {
        'group.id': consumerType,
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
        'sasl.username': process.env.KAFKA_USERNAME,
        'sasl.password': process.env.KAFKA_PASSWORD,
        'sasl.mechanisms': 'SCRAM-SHA-256',
        'socket.keepalive.enable': true,
        'debug': 'generic,broker,security',
        'security.protocol': 'sasl_ssl',
      }
      : {
        'group.id': consumerType,
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
      }, {});

    const topicName = `${process.env.KAFKA_TOPIC_PREFIX || ''}order`;
    super
      .on('ready', () => {
        super.subscribe([topicName]);
        super.consume();
        console.log(`Started ${consumerType} consumer on topic ${topicName}`);
      })
      .on('rebalance', () => console.log(`Rebalancing ${consumerType} Consumers...`))
      .on('data', async ({ value }) => await this.prepareOrder(JSON.parse(value.toString()) as unknown as Order));
  }

  async prepareOrder(order: Order): Promise<void> {
    if (this.consumerType === 'Cooker') {
      delete order.drinks;
    } else {
      delete order.food;
    }
    const { id, ...rest } = order;
    const timeToPrepare = Math.floor(Math.random() * 7 + 3);
    console.log('\x1b[46m%s\x1b[0m', `Preparing order '${id}' (will take ${timeToPrepare}s): ${JSON.stringify(rest)}`);
    sleep(timeToPrepare);
    console.log('\x1b[44m%s\x1b[0m', `Finished order '${id}' preparing, sending to balcony...`);
    this.balconyProducer.sendOrderToBalcony(order);
  }

  start(): void {
    super.connect();
  }

  close(): void {
    super.disconnect();
  }
}