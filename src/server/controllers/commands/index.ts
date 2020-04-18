import { Router } from 'express';
import { Slack } from '../../../types';
import commands from '../../services/commands';

export default Router()
  .post('/', async (req: Slack.IncomingRequest<Slack.Payloads.Command>, res) => {
    res.end();
    const command = req.body.text.match(/^\w+/)?.[0].toLowerCase();
    commands.enqueue({ command, requestBody: req.body });
  });
