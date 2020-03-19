import request from './request';

export default (url: string, data: { text: string }) => request(url, {
  data: JSON.stringify(data),
  method: 'POST',
  handleResponse: false,
});
