import 'dotenv/config';
import express from 'express';
import { clap } from './commands';

const app = express();

app.use(clap);

app.get('/', (_req, res) => {
  res.json({ response: 'test' });
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
