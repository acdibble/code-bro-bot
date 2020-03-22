import chai, { assert } from 'chai';
import { createHmac } from 'crypto';
import nock from 'nock';
import * as path from 'path';
import server from '.';
import { Slack, CodeBro } from '../types';
import { teamIdToUserIdMap } from '../meta/getMe';

import chaiHTTP = require('chai-http');

chai.use(chaiHTTP);

const coerce = <T>(obj: any): T => obj as T;
const tick = (ms = 100): Promise<void> => new Promise((resolve) => { setTimeout(resolve, ms); });

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

      it('handles challenges', async () => {
        const res = await chai.request(server)
          .post('/events')
          .send({ challenge: 'abcdef' });

        assert.deepEqual(res.body, { challenge: 'abcdef' });
      });

      describe('app_mention', () => {
        beforeEach(() => {
          nock.cleanAll();
          teamIdToUserIdMap[team] = codeBro;
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
          await tick();
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
          await tick();
          scope.done();
        });

        it('handles souce code requests', async () => {
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

        /* eslint-disable max-len */
        const today = new Date();
        const date = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
        const baseUrl = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports';
        /* eslint-enable max-len */

        it('gets coronavirus update and splits it into several blocks', async () => {
          const body = {
            event: {
              channel,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}> coronavirus update`,
            },
          };

          const githubScope = nock(baseUrl)
            .get(`/${date}.csv`)
            .replyWithFile(200, path.resolve(__dirname, '..', '..', 'test', 'csv', '03-21-2020.csv'));
          const slackScope = nock('https://slack.com/api')
            .post('/chat.postMessage', {
              channel,
              text: 'Total cases: 25493\nTotal deaths: 307\nTotal recovered: 171',
            })
            .reply(200, { ok: true })
            .post('/chat.postMessage', {
              channel,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '```State or territory          |Last updated|Confirmed cases|Deaths|Recovered\n--------------------------------------------------------------------------\nNew York                    |3/21        |11710          |60    |0\nWashington                  |3/21        |1793           |94    |0\nCalifornia                  |3/21        |1364           |24    |0\nNew Jersey                  |3/21        |1327           |16    |0\nMichigan                    |3/21        |788            |5     |0\nIllinois                    |3/21        |753            |6     |0\nFlorida                     |3/21        |659            |13    |0\nLouisiana                   |3/21        |585            |16    |0\nTexas                       |3/21        |581            |5     |0\nMassachusetts               |3/21        |525            |1     |0\nGeorgia                     |3/21        |507            |14    |0\nPennsylvania                |3/21        |396            |2     |0\nColorado                    |3/21        |390            |4     |0\nTennessee                   |3/21        |371            |1     |0\nWisconsin                   |3/21        |282            |4     |0\nNorth Carolina              |3/21        |253            |0     |0\nOhio                        |3/21        |248            |3     |0\nConnecticut                 |3/21        |194            |4     |0\nMaryland                    |3/21        |193            |2     |0\nSouth Carolina              |3/21        |171            |3     |0\nNevada                      |3/21        |161            |2     |0\nVirginia                    |3/21        |156            |2     |0\nMississippi                 |3/21        |140            |1     |0\nMinnesota                   |3/21        |138            |1     |0\nUtah                        |3/21        |136            |0     |0\nAlabama                     |3/21        |131            |0     |0\nIndiana                     |3/21        |128            |4     |0\nArkansas                    |3/21        |122            |0     |0\nArizona                     |3/21        |118            |1     |0\nOregon                      |3/21        |114            |5     |0\nKentucky                    |3/21        |87             |3     |0\nDistrict of Columbia        |3/21        |77             |1     |0\nMissouri                    |3/21        |74             |3     |0\nMaine                       |3/21        |70             |0     |0\nIowa                        |3/21        |68             |0     |0\nRhode Island                |3/21        |66             |0     |0\nKansas                      |3/21        |57             |2     |0\nNew Hampshire               |3/21        |55             |0     |0\nOklahoma                    |3/21        |53             |1     |0\nDiamond Princess            |3/20        |49             |0     |0\nDelaware                    |3/21        |45             |0     |0```', // eslint-disable-line max-len
                  },
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '```New Mexico                  |3/20        |43             |0     |0\nNebraska                    |3/21        |38             |0     |0\nHawaii                      |3/21        |37             |0     |0\nIdaho                       |3/21        |36             |0     |0\nVermont                     |3/20        |29             |2     |0\nNorth Dakota                |3/21        |28             |0     |0\nGrand Princess              |3/20        |23             |0     |0\nWyoming                     |3/21        |23             |0     |0\nMontana                     |3/21        |21             |0     |0\nPuerto Rico                 |3/21        |21             |1     |0\nAlaska                      |3/21        |15             |0     |0\nGuam                        |3/21        |15             |0     |0\nSouth Dakota                |3/20        |14             |1     |0\nWest Virginia               |3/21        |8              |0     |0\nUnited States Virgin Islands|3/21        |6              |0     |0\nUS                          |3/21        |1              |0     |171```', // eslint-disable-line max-len
                  },
                }],
            })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          await tick();
          slackScope.done();
          githubScope.done();
        });

        it('gets coronavirus update and fits it in one block', async () => {
          const body = {
            event: {
              channel,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}> coronavirus update`,
            },
          };

          const githubScope = nock(baseUrl)
            .get(`/${date}.csv`)
            .replyWithFile(200, path.resolve(__dirname, '..', '..', 'test', 'csv', '03-20-2020.csv'));
          const slackScope = nock('https://slack.com/api')
            .post('/chat.postMessage', {
              channel,
              text: 'Total cases: 11710\nTotal deaths: 60\nTotal recovered: 0',
            })
            .reply(200, { ok: true })
            .post('/chat.postMessage', {
              channel,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '```State or territory|Last updated|Confirmed cases|Deaths|Recovered\n----------------------------------------------------------------\nNew York          |3/21        |11710          |60    |0```', // eslint-disable-line max-len
                  },
                },
              ],
            })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          await tick();
          slackScope.done();
          githubScope.done();
        });
        /* eslint-enable max-len */

        it('returns an error from coronavirus update', async () => {
          const body = {
            event: {
              channel,
              type: 'app_mention',
              user: 'Q1W2E3R4',
              text: `<@${codeBro}> coronavirus update`,
            },
          };

          const githubScope = nock(baseUrl)
            .get(`/${date}.csv`)
            .reply(500);
          const slackScope = nock('https://slack.com/api')
            .post('/chat.postMessage', {
              channel,
              text: 'I encountered an error retrieving the data :(',
            })
            .reply(200, { ok: true });

          const res = await chai.request(server)
            .post('/events')
            .set(authHeaders(body))
            .send(body);

          assert.equal(res.status, 200);
          await tick();
          slackScope.done();
          githubScope.done();
        });
      });
    });
  });
});
