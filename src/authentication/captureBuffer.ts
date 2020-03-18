import { Request, Response } from 'express';
import bufferStore from './bufferStore';

export default (request: Request, res: Response, buf: Buffer) => {
  bufferStore.set(request, buf);
};
