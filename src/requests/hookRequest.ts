import request from './request';

export default (url: string, data: { text: string }): Promise<void> => request(url, {
  data: JSON.stringify(data),
  method: 'POST',
  handleResponse: false,
});
