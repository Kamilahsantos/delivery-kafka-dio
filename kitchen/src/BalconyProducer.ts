import { Producer, ProducerGlobalConfig } from 'node-rdkafka';
import { Order } from './OrderConsumer';

export default class BalconyProducer extends Producer {
  constructor() {
    const config: ProducerGlobalConfig = process.env.KAFKA_PASSWORD
      ? {
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
        'dr_cb': true,
        'sasl.username': process.env.KAFKA_USERNAME,
        'sasl.password': process.env.KAFKA_PASSWORD,
        'sasl.mechanisms': 'SCRAM-SHA-256',
        'socket.keepalive.enable': true,
        'debug': 'generic,broker,security',
        'security.protocol': 'sasl_ssl',
      }
      : {
        'metadata.broker.list': process.env.KAFKA_BROKER_URI || 'localhost:9092',
        'dr_cb': true,
      };
    super(config, {});
    super.on('ready', () => console.log('Started BalconyProducer'));
  }

  async sendOrderToBalcony(order: Order): Promise<void>{
    const topic = order.table ? 'balcony' : 'deliveryBalcony'
    await super.produce(`${process.env.KAFKA_TOPIC_PREFIX || ''}${topic}`, null, Buffer.from(JSON.stringify(order)));
    console.log('\x1b[42m%s\x1b[0m', `Order ${order.id} ${Object.keys(order).includes('food') ? 'food' : 'drinks'} sent to the ${topic}!`);
  }

  start(): void {
    super.connect();
  }

  close(): void {
    super.disconnect();
  }
}