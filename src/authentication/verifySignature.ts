import { createHmac } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import bufferStore from './bufferStore';
import HTTPError from '../HTTPError';

export default (req: Request, response: Response, next: NextFunction): void => {
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  const body = bufferStore.get(req);
  bufferStore.delete(req);

  if (!timestamp || !signature || !body) {
    return next(new HTTPError(401));
  }

  const stringToSign = `v0:${timestamp}:${body.toString()}`;
  const digest = createHmac('sha256', process.env.SLACK_SIGNING_SECRET as string).update(stringToSign).digest('hex');

  if (signature !== `v0=${digest}`) {
    return next(new HTTPError(401));
  }

  return next();
};
