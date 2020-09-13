import { Producer, ProducerGlobalConfig}  from 'node-rdkafka';


export default class OrderProducer extends Producer{




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
          super
            .on('ready', () => console.log('Started OrderProducer'))
            .on('event.error', (error) => { throw error });
        }

    start (){
        super.connect();
    }

    close(){
        super.disconnect();
    }


  async sendOrder(order: { id: string, table: number, food: string[], drinks: string[] }) {
    await super.produce(`${process.env.KAFKA_TOPIC_PREFIX || ''}order`, null, Buffer.from(JSON.stringify(order)));
    console.log('Order sent to the kitchen!');
  }

}