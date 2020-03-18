import 'dotenv/config';
import express from 'express';
import { clap } from './commands';

const app = express();

app.use('/api', clap);

app.get('/ping', (req, res) => {
  res.end('pong');
});

app.all('*', (req, res) => {
  res.status(404).end();
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
