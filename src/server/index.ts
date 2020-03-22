import 'dotenv/config';
import express from 'express';
import commands from './commands';
import verifySignature from '../authentication/verifySignature';
import captureBuffer from '../authentication/captureBuffer';
import respondToChallenge from '../authentication/respondToChallenge';
import events from './events';

const server = express();

server.use(
  express.urlencoded({ extended: true, verify: captureBuffer }),
  express.json({ verify: captureBuffer }),
);

server.use(
  '/commands',
  verifySignature,
  commands,
);

server.use(
  '/events',
  respondToChallenge,
  events,
);

server.get('/ping', (req, res) => {
  res.end('pong');
});

server.all('*', (req, res) => {
  res.status(404).end();
});

export default server;
