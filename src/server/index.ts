import 'dotenv/config';
import express from 'express';
import commands from './commands';
import verifySignature from '../authentication/verifySignature';
import captureBuffer from '../authentication/captureBuffer';

const server = express();

server.use(
  '/commands',
  express.urlencoded({ extended: true, verify: captureBuffer }),
  express.json({ verify: captureBuffer }),
  verifySignature,
  commands,
);

server.get('/ping', (req, res) => {
  res.end('pong');
});

server.all('*', (req, res) => {
  res.status(404).end();
});

export default server;
