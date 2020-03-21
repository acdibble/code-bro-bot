import { Request } from 'express';
import { CommandRequest } from './CommandRequest';

type Payload = CommandRequest;

export interface IncomingRequest<T extends Payload> extends Request {
  body: T;
}

export { CommandRequest };
