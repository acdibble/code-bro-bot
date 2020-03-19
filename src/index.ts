import 'dotenv/config';
import express from 'express';
import commands from './commands';
import verifySignature from './authentication/verifySignature';
import captureBuffer from './authentication/captureBuffer';

const app = express();

// app.use(
//   express.json({ verify: captureBuffer }),
// );

app.use(
  '/commands',
  express.urlencoded({ extended: true, verify: captureBuffer }),
  verifySignature,
  commands,
);

app.get('/ping', (req, res) => {
  res.end('pong');
});

app.all('*', (req, res) => {
  res.status(404).end();
});

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});

export default app;
