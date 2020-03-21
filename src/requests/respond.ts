import request from './request';
import { Slack } from '../types';

export default (url: string, data: Slack.MessageResponseRequest): Promise<void> => request(url, {
  data: JSON.stringify(data),
  method: 'POST',
  handleResponse: false,
});
