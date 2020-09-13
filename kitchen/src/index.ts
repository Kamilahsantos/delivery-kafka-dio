
import OrderConsumer from './OrderConsumer';
import BalconyProducer from './BalconyProducer';

let CONSUMER_TYPE: 'Cooker' | 'Bartender' = 'Cooker';
if (process.env.CONSUMER_TYPE === 'Bartender') {
  CONSUMER_TYPE = 'Bartender';
}

const balconyProducer = new BalconyProducer();
balconyProducer.start();

const orderConsumer = new OrderConsumer(balconyProducer, CONSUMER_TYPE);
orderConsumer.start();

process.on('exit', () => {
  orderConsumer.close();
  balconyProducer.close();
});