import { Router } from 'express';
import { Slack } from '../../../types';
import events from '../../services/events';

export default Router()
  .post('/', async (req: Slack.IncomingRequest<Slack.Payloads.Event>, res) => {
    events.enqueue({ type: req.body.event.type, requestBody: req.body });
    res.end();
  });
