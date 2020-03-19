import { IncomingMessage } from 'http';

export default class RequestError extends Error {
  statusCode: number | undefined

  constructor(response: IncomingMessage, message: string) {
    super(message);
    Error.captureStackTrace(this, RequestError);
    this.statusCode = response.statusCode;
  }
}
