/* eslint-disable max-len */
import { Slack, CodeBro } from '../../types';
import request from '../request';

const BASE_URL = 'https://slack.com/api';

async function slackRequest(slackMethod: Slack.Method.AuthTest): Promise<Slack.Responses.AuthTest>;
async function slackRequest(slackMethod: Slack.Method.PostMessage, params: Slack.Requests.PostMessage): Promise<Slack.Responses.PostMessage>;
async function slackRequest(slackMethod: Slack.Method, params?: Slack.Request): Promise<Slack.Response> {
  const url = `${BASE_URL}/${slackMethod}`;

  const opts: CodeBro.ExtendedOptions = {
    method: 'POST',
    headers: {
      'content-type': 'application/json;charset=utf8',
      authorization: `Bearer ${process.env.SLACK_OAUTH_TOKEN}`,
    },
  };

  if (params) {
    opts.data = JSON.stringify(params);
  }

  const res: Slack.Response = await request(url, opts);

  if (!res.ok) {
    throw new Error(res.error);
  }

  return res;
}

export default slackRequest;
