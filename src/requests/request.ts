import * as https from 'https';
import { IncomingMessage } from 'http';
import { CodeBro } from '../types';

type NoHandleResponseOptions = { handleResponse: false } & CodeBro.ExtendedOptions;

type HandleResponseOptions = { handleResponse: true | undefined } & CodeBro.ExtendedOptions;

function request(url: string, options: NoHandleResponseOptions): Promise<void>;
function request(url: string, options: HandleResponseOptions): Promise<IncomingMessage>;
function request(url: string, options: CodeBro.ExtendedOptions): Promise<IncomingMessage>;
function request(url: string, options: CodeBro.ExtendedOptions): Promise<IncomingMessage | void> {
  return new Promise((resolve, reject) => {
    const {
      data,
      handleResponse = true,
      ...opts
    } = options;
    const req = https.request(url, opts, handleResponse ? resolve : undefined)
      .on('error', reject);

    req.write(data || null);
    req.end();

    if (!handleResponse) {
      resolve();
    }
  });
}

export default request;
