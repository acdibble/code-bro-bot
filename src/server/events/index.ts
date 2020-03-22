import { Router } from 'express';
import { Slack } from '../../types';
import handleMention from './handleMention';

export default Router()
  .post('/', async (req: Slack.IncomingRequest<Slack.Payloads.Event>, res) => {
    res.end();
    switch (req.body.event.type) {
      case Slack.Event.AppMention:
        await handleMention(req.body);
        break;
      default:
        console.error(`Why am I not handling ${req.body.event.type}?`);
    }
    res.end();
  });
