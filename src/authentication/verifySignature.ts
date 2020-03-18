import { createHmac } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import bufferStore from './bufferStore';

export default (req: Request, response: Response, next: NextFunction) => {
  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  const body = bufferStore.get(req);
  if (!timestamp || !signature || !body) {
    response.status(401).end();
    return;
  }
  bufferStore.delete(req);


  console.log('headers:', req.headers);
  console.log('secret:', process.env.SLACK_SIGNING_SECRET);

  const stringToSign = `v0:${timestamp}:${body.toString()}`;
  const digest = createHmac('sha256', process.env.SLACK_SIGNING_SECRET as string).update(stringToSign).digest('hex');
  console.log('digest:   ', digest);
  console.log('signature:', signature);
  if (signature !== `v0=${digest}`) {
    response.status(401).end();
    return;
  }

  next();
};
