import { RequestOptions } from 'https';

export enum Command {
  Bro = 'bro',
  Help = 'help'
}

export interface ExtendedOptions extends RequestOptions {
  handleResponse?: boolean;
  data?: string;
}
