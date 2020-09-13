import { KafkaConsumer } from 'node-rdkafka';
import { sleep } from 'sleep';

const TOPIC_NAME = 'delivery';
const GROUP_ID = 'Motoboy';

export default class OrderConsumer extends KafkaConsumer {
  constructor() {
    super(process.env.KAFKA_PASSWORD
      ? {
        'group.id': GROUP_ID,
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
        'sasl.username': process.env.KAFKA_USERNAME,
        'sasl.password': process.env.KAFKA_PASSWORD,
        'sasl.mechanisms': 'SCRAM-SHA-256',
        'socket.keepalive.enable': true,
        'debug': 'generic,broker,security',
        'security.protocol': 'sasl_ssl',
        'enable.auto.commit': false,
      }
      : {
        'group.id': GROUP_ID,
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
        'enable.auto.commit': false,
      }, {});

    const topicName = `${process.env.KAFKA_TOPIC_PREFIX || ''}${TOPIC_NAME}`;
    super
      .on('ready', () => {
        super.subscribe([topicName]);
        super.consume();
        console.log(`Started ${GROUP_ID} consumer on topic ${topicName}`);
      })
      .on('rebalance', () => console.log(`Rebalancing ${GROUP_ID} Consumers...`))
      .on('data', async ({ value }) => await this.deliverOrder(JSON.parse(value.toString())));
  }

  async deliverOrder(order: any): Promise<void> {
    const { id, address } = order;
    const timeToDeliver = Math.floor(Math.random() * 20 + 15);
    console.log(`Delivering order '${id}' to address ${address}, it will take ${timeToDeliver}s. Order: ${JSON.stringify(order)}`);
    sleep(timeToDeliver);
    super.commit();
    console.log(`Delivered order '${id}' in ${timeToDeliver}s!`);
  }

  start(): void {
    super.connect();
  }

  close(): void {
    super.disconnect();
  }
}