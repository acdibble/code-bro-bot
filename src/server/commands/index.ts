import { Router } from 'express';
import { Slack, CodeBro } from '../../types';
import bro from './bro';
import help from './help';

export default Router()
  .post('/', async (req: Slack.IncomingRequest<Slack.CommandRequest>, res) => {
    res.end();
    const { text } = req.body;
    const command = text.match(/^\w+/)?.[0].toLowerCase();
    switch (command) {
      case CodeBro.Command.Bro:
        await bro(req.body);
        break;
      case CodeBro.Command.Help:
      default:
        await help(req.body.response_url);
    }
  });
