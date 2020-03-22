import { createHmac, timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import bufferStore from './bufferStore';
import HTTPError from '../HTTPError';

export default (req: Request, response: Response, next: NextFunction): void => {
  const timestamp = Number.parseInt(req.headers['x-slack-request-timestamp'] as string, 10);
  const signature = req.headers['x-slack-signature'];
  const body = bufferStore.get(req);
  bufferStore.delete(req);

  if (Number.isNaN(timestamp) || !signature || !body) {
    return next(new HTTPError(401));
  }

  if (Date.now() - timestamp * 1000 > 5 * 60 * 1000) {
    return next(new HTTPError(401));
  }

  const stringToSign = `v0:${timestamp}:${body}`;
  const digest = createHmac('sha256', process.env.SLACK_SIGNING_SECRET as string).update(stringToSign).digest('hex');

  try {
    timingSafeEqual(Buffer.from(`v0=${digest}`, 'utf8'), Buffer.from(signature as string, 'utf8'));
  } catch {
    return next(new HTTPError(401));
  }

  return next();
};
