import { RequestOptions } from 'https';

export enum Command {
  Bro = 'bro'
}

export interface ExtendedOptions extends RequestOptions {
  handleResponse?: boolean;
  data?: string;
}
