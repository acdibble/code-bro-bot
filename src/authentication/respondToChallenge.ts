import { Response, NextFunction } from 'express';
import { Slack } from '../types';

export default (
  req: Slack.IncomingRequest<Slack.Payloads.Challenge | Slack.Payloads.Event>,
  res: Response,
  next: NextFunction,
): void => {
  if ('challenge' in req.body) {
    res.json({ challenge: req.body.challenge });
  } else {
    next();
  }
};
