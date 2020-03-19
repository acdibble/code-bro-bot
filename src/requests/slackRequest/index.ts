import * as querystring from 'querystring';
import RequestError from './RequestError';
import { Slack } from '../../types';
import request from '../request';

const BASE_URL = 'https://slack.com/api';


const slackRequest: Slack.Request = async (
  slackMethod: Slack.Method,
  { query, httpMethod = 'GET' }: Slack.RequestOptions,
): Promise<any> => {
  const url = `${BASE_URL}/${slackMethod}?${querystring.stringify({
    ...query,
    token: process.env.SLACK_OAUTH_TOKEN,
  })}`;

  const res = await request(url, {
    method: httpMethod,
  });

  return new Promise((resolve, reject) => {
    let body = Buffer.alloc(0);
    res.on('error', reject)
      .on('data', (chunk) => { body = Buffer.concat([body, chunk]); })
      .on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new RequestError(res, body.toString()));
        } else {
          resolve(JSON.parse(body.toString()));
        }
      });
  });
};

export default slackRequest;
