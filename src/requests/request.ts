import * as https from 'https';
import { CodeBro } from '../types';
import HTTPError, { STATUS_CODES } from '../HTTPError';

type NoHandleResponse = { handleResponse: false } & CodeBro.ExtendedOptions;

type HandleResponse = { handleResponse: true | undefined } & CodeBro.ExtendedOptions;

function request(url: string, options: NoHandleResponse): Promise<void>;
function request(url: string, options: HandleResponse | CodeBro.ExtendedOptions): Promise<any>;
function request(url: string, options: CodeBro.ExtendedOptions): Promise<any | void> {
  return new Promise((resolve, reject) => {
    const {
      data,
      handleResponse = true,
      ...opts
    } = options;
    const req = https.request(url, opts, !handleResponse ? undefined : (res): void => {
      let body = Buffer.alloc(0);
      res.on('error', reject)
        .on('data', (chunk) => { body = Buffer.concat([body, chunk]); })
        .on('end', () => {
          /* eslint-disable @typescript-eslint/no-non-null-assertion */
          if (res.statusCode! < 200 || res.statusCode! >= 300) {
            return reject(new HTTPError(res.statusCode as keyof typeof STATUS_CODES, body.toString()));
            /* eslint-disable @typescript-eslint/no-non-null-assertion */
          }

          if (res.headers['content-type']?.includes('json')) {
            return resolve(JSON.parse(body.toString()));
          }

          return resolve(body.toString());
        });
    })
      .on('error', reject);

    if (typeof data === 'string') req.write(data);
    req.end();

    if (!handleResponse) {
      resolve();
    }
  });
}

export default request;
