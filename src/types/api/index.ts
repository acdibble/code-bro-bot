import { RequestOptions } from 'https';

// eslint-disable-next-line @typescript-eslint/no-namespace
export enum Command {
  bro = '/bro'
}

export interface ExtendedOptions extends RequestOptions {
  handleResponse?: boolean;
  data?: string;
}
