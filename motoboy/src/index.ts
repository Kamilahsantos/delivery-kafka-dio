import DeliveryConsumer from './DeliveryConsumer';

const orderConsumer = new DeliveryConsumer();
orderConsumer.start();

process.on('exit', () => {
  orderConsumer.close();
});