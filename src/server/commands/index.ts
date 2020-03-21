import { Router } from 'express';
import { Slack, CodeBro } from '../../types';
import bro from './bro';

export default Router()
  .post('/', async (req: Slack.IncomingRequest<Slack.CommandRequest>, res) => {
    res.end();
    const { text } = req.body;
    const command = text.match(/^\w+/)?.[0];
    switch (command) {
      case CodeBro.Command.Bro:
        await bro(req.body);
        break;
      default:
        console.log('this is the default case');
    }
  });
