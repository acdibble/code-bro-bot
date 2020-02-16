import express from 'express';
import { clap } from './commands';

const app = express();

app.use(clap);

app.get('/', (_req, res) => {
  res.json({ response: 'test' });
});

app.listen(3000, () => {
  console.log('Listening on 3000');
});
