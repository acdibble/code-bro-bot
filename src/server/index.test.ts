import chai, { assert } from 'chai';
import { createHmac } from 'crypto';
import nock from 'nock';
import server from '.';
import { Slack, CodeBro } from '../types';
import { teamIdToUserIdMap } from '../meta/getMe';
import Queue from '../Queue';
import getVersion from './services/events/handleMention/getVersion';

import chaiHTTP = require('chai-http');

chai.use(chaiHTTP);

const coerce = <T>(obj: any): T => obj as T;

const authHeaders = (body: Record<string, any>, otherHeaders?: Record<string, string>): Record<string, string> => {
  const timestamp = Math.floor(Date.now() / 1000);
  const headers: Record<string, string> = {
    ...otherHeaders,
    'x-slack-request-timestamp': timestamp.toString(),
    'content-type': 'application/json',
  };

  const signature = createHmac('sha256', process.env.SLACK_SIGNING_SECRET as string)
    .update(`v0:${timestamp}:${JSON.stringify(body)}`)
    .digest('hex');

  headers['x-slack-signature'] = `v0=${signature}`;
  return headers;
};

describe('Server', () => {
  let events: Queue;

  before(async () => {
    ({ events } = await import('./services/events'));
  });

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

  describe('authenticated endpoints', () => {
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

    describe('commands', () => {
      beforeEach(() => {
        nock.cleanAll();
      });

      const responseUrl = 'https://dibble.codes/test/thing/';
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

    describe('events', () => {
      const codeBro = 'C0D3BR0';
      const channel = 'ABCDEF';
      const team = 'TESTTEAM';

      beforeEach(() => {
        nock.cleanAll();
        teamIdToUserIdMap[team] = codeBro;
      });

      it('handles challenges', async () => {
        const res = await chai.request(server)
          .post('/events')
          .send({ challenge: 'abcdef' });

        assert.deepEqual(res.body, { challenge: 'abcdef' });
      });

      it('handles errors', async () => {
        const body = {
          event: {
            channel,
            team,
            type: 'app_mention',
            user: 'Q1W2E3R4',
            text: `<@${codeBro}> wassup`,
          },
        };

        const scope = nock('https://slack.com/api')
          .post('/chat.postMessage', { channel, text: "I don't know what to do with my hands" })
          .reply(500, { ok: false });

        const res = await chai.request(server)
          .post('/events')
          .set(authHeaders(body))
          .send(body);

        assert.equal(res.status, 200);
        await events.ready();
        scope.done();
      });

      describe('app_mention', () => {
        beforeEach(() => {
          nock.cleanAll();
          teamIdToUserIdMap[team] = codeBro;
        });

        it('pongs', async () => {
          const body = {
            event: {
              channel,
              team,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}> ping`,
            },
          };

          const scope = nock('https://slack.com/api')
            .post('/chat.postMessage', { channel, text: 'pong' })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          await events.ready();
          scope.done();
        });

        it('handles unrecognized events', async () => {
          const body = {
            event: {
              channel,
              team,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}> wassup`,
            },
          };

          const scope = nock('https://slack.com/api')
            .post('/chat.postMessage', { channel, text: "I don't know what to do with my hands" })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          await events.ready();
          scope.done();
        });

        it('handles mention events that just ping code bro', async () => {
          delete teamIdToUserIdMap[team];
          const body = {
            event: {
              channel,
              team,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}>`,
            },
          };

          const scope = nock('https://slack.com/api')
            .post('/auth.test')
            .reply(200, { ok: true, user_id: codeBro })
            .post('/chat.postMessage', { channel, text: '<@Q1W2E3R4>?' })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          await events.ready();
          scope.done();
        });

        it('handles version requests', async () => {
          const body = {
            event: {
              channel,
              team,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}> version`,
            },
          };

          const scope = nock('https://slack.com/api')
            .post('/chat.postMessage', { channel, text: `I am running on version ${getVersion()}` })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          await events.ready();
          scope.done();
        });

        it('handles source code requests', async () => {
          const body = {
            event: {
              channel,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}> lemme see your source code`,
            },
          };

          const scope = nock('https://slack.com/api')
            .post('/chat.postMessage', { channel, text: 'https://github.com/acdibble/code-bro-bot' })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          scope.done();
        });
      });
    });
  });
});
