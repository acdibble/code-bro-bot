import * as querystring from 'querystring';
import { Slack, CodeBro } from '../../types';
import request from '../request';
import HTTPError from '../../HTTPError';

const BASE_URL = 'https://slack.com/api';

/* eslint-disable max-len */
async function slackRequest(slackMethod: Slack.Method.PostMessage, options: Required<Slack.RequestOptions<Slack.PostMessageOptions>>): Promise<any>;
async function slackRequest(slackMethod: Slack.Method.ConversationsList, options: Slack.RequestOptions): Promise<any>;
async function slackRequest(slackMethod: Slack.Method, { params, httpMethod = 'GET' }: Slack.RequestOptions<Slack.RequestBody | undefined>): Promise<any> {
  const url = `${BASE_URL}/${slackMethod}${httpMethod === 'GET'
    ? `?${querystring.stringify({ token: process.env.SLACK_OAUTH_TOKEN })}`
    : ''}`;

  const opts: CodeBro.ExtendedOptions = { method: httpMethod };

  if (httpMethod === 'POST') {
    opts.data = httpMethod === 'POST' ? JSON.stringify(params) : undefined;
    opts.headers = {
      'content-type': 'application/json;charset=utf8',
      authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
    };
  }

  const res = await request(url, opts);

  return new Promise((resolve, reject) => {
    let body = Buffer.alloc(0);
    res.on('error', reject)
      .on('data', (chunk) => { body = Buffer.concat([body, chunk]); })
      .on('end', () => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new HTTPError(res.statusCode, body.toString()));
        } else {
          resolve(JSON.parse(body.toString()));
        }
      });
  });
}

export default slackRequest;
