import express, { Application } from 'express';
import OrderProducer from './OrderProducer';
import BalconyConsumer from './BalconyConsumer';

const PORT = process.env.PORT || 3000;

const app: Application = express();
app.use(express.json())

const orderProducer = new OrderProducer();
orderProducer.start();

const balconyConsumer = new BalconyConsumer();
balconyConsumer.start();

app.post('/order', async (req, res) => {
  try {
    const order = { ...req.body, id: `table-${req.body.table}-${Date.now()}` };
    if (!order.drinks?.length && !order.food?.length) {
      res.status(400).send('You must send Drinks array or Food array!');
    } else {
      await orderProducer.sendOrder(order);
      res.send(`Order ${order.id} sent!`);
    }
  } catch (error) {
    console.error(error);
    res.send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Waiter-${PORT} is listening at http://localhost:${PORT}`)
});

process.on('exit', () => {
  orderProducer.close();
  balconyConsumer.close();
});