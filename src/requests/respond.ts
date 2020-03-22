import request from './request';
import { Slack } from '../types';

export default (url: string, data: Slack.Requests.MessageResponse): Promise<void> => request(url, {
  data: JSON.stringify(data),
  method: 'POST',
  handleResponse: false,
});
