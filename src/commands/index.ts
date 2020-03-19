import { Router } from 'express';
import bro from './bro';
import { Slack } from '../types';

export default Router()
  .post(Slack.Command.bro, bro);
