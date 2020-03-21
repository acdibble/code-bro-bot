export const enum Method {
  PostMessage = 'chat.postMessage'
}

export interface PostMessageOptions {
  channel: string;
  text: string;
}

export type RequestBody = PostMessageOptions;

export interface RequestOptions<T = undefined> {
  httpMethod: 'GET' | 'POST';
  params?: T extends RequestBody ? RequestBody : undefined;
}

export { default as MessageResponseRequest } from './MessageResponseRequest';
