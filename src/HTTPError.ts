import * as http from 'http';

export default class HTTPError extends Error {
  statusCode: number | undefined;

  constructor(statusCode = 500, message: string = http.STATUS_CODES[statusCode] || '') {
    super(message);
    Error.captureStackTrace(this, HTTPError);
    this.statusCode = statusCode;
  }
}
