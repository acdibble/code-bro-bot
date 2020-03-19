import * as https from 'https';
import { IncomingMessage } from 'http';

interface ExtendedOptions extends https.RequestOptions {
  data?: string;
  handleResponse?: boolean
}

const request = (url: string, options: ExtendedOptions): Promise<IncomingMessage> => (
  new Promise((resolve, reject) => {
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
  })
);

export default request;
