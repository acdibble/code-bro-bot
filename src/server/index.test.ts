import chai, { assert } from 'chai';
import { createHmac } from 'crypto';
import nock from 'nock';
import server from '.';
import { Slack, CodeBro } from '../types';

import chaiHTTP = require('chai-http');

chai.use(chaiHTTP);

const coerce = <T>(obj: any) => obj as T;

const authHeaders = (body: Record<string, any>, otherHeaders?: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = {
    ...otherHeaders,
    'x-slack-request-timestamp': '1',
    'content-type': 'application/json',
  };

  const signature = createHmac('sha256', process.env.SLACK_SIGNING_SECRET as string)
    .update(`v0:1:${JSON.stringify(body)}`)
    .digest('hex');

  headers['x-slack-signature'] = `v0=${signature}`;
  return headers;
};

describe('Server', () => {
  it('pongs', async () => {
    const res = await chai.request(server)
      .get('/ping');

    assert.equal(res.status, 200);
    assert.equal(res.text, 'pong');
  });

  it('handles 404s', async () => {
    const res = await chai.request(server)
      .get('/something');

    assert.equal(res.status, 404);
  });

  describe('commands', () => {
    const responseUrl = 'https://dibble.codes/test/thing/';
    const oldEnv = process.env;

    before(() => {
      nock.enableNetConnect('127.0.0.1');
      nock.cleanAll();
      process.env.SLACK_SIGNING_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      process.env.SLACK_OAUTH_TOKEN = 'xoxb-000000000000-1111111111111-ABCDABCDABCDABCDABCDABCD';
    });

    after(() => {
      nock.enableNetConnect();
      process.env = oldEnv;
    });

    ['', 'help'].forEach((commandText) => {
      it(`handles help request (${commandText})`, async () => {
        const body = coerce<Slack.Payloads.Command>({
          text: commandText,
          response_url: responseUrl,
        });

        const text = ['Available commands:', ...Object.values(CodeBro.Command)].join('\n');
        const scope = nock(responseUrl)
          .post('/', { text, response_type: 'ephemeral' })
          .reply(200);

        const res = await chai.request(server)
          .post('/commands')
          .set(authHeaders(body))
          .send(body);
        assert.equal(res.status, 200);
        scope.done();
      });
    });


    ['bro', 'Bro', 'BRO'].forEach((text) => {
      it(`sends ephemeral response if in direct message (${text})`, async () => {
        const body = coerce<Slack.Payloads.Command>({
          text,
          response_url: responseUrl,
          channel_name: 'directmessage',
        });

        const scope = nock(responseUrl)
          .post('/', { text: "bro you can't do that here bro", response_type: 'ephemeral' })
          .reply(200);

        const res = await chai.request(server)
          .post('/commands')
          .set(authHeaders(body))
          .send(body);
        assert.equal(res.status, 200);
        scope.done();
      });
    });

    it('sends ephemeral response if no user given', async () => {
      const body = coerce<Slack.Payloads.Command>({
        text: 'bro',
        response_url: responseUrl,
      });

      const scope = nock(responseUrl)
        .post('/', { text: 'bro you need to @someone bro', response_type: 'ephemeral' })
        .reply(200);

      const res = await chai.request(server)
        .post('/commands')
        .set(authHeaders(body))
        .send(body);
      assert.equal(res.status, 200);
      scope.done();
    });

    it('sends bro message to invocation channel with user passed in', async () => {
      const user = '<@ABCDEF|test>';
      const channelId = 'Q1W2E3R4';
      const body = coerce<Slack.Payloads.Command>({
        text: `bro ${user}`,
        response_url: responseUrl,
        channel_id: channelId,
      });

      const scope = nock('https://slack.com/api')
        .post('/chat.postMessage', { text: `${user}, bro...`, channel: channelId })
        .matchHeader('authorization', `Bearer ${process.env.SLACK_OAUTH_TOKEN}`)
        .matchHeader('content-type', 'application/json;charset=utf8')
        .reply(200, { ok: true });

      const res = await chai.request(server)
        .post('/commands')
        .set(authHeaders(body))
        .send(body);
      assert.equal(res.status, 200);
      scope.done();
    });
  });
});
