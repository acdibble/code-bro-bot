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

        it('gets a coronavirus update', async () => {
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
            .replyWithFile(200, path.resolve(__dirname, '..', '..', 'test', 'csv', '03-25-2020.csv'));
          const slackScope = nock('https://slack.com/api')
            .post('/chat.postMessage', {
              channel,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: 'If the data is bad, I got it from here https://github.com/CSSEGISandData\nTotal cases: 65374\nTotal deaths: 940\nTotal recovered: 361\nTotal active: 0', // eslint-disable-line max-len
                  },
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '```State                   |Last updated|Confirmed cases|Deaths|Recovered|Active cases\n-----------------------------------------------------------------------------------\nNew York                |3/25        |30841          |285   |0        |0\nNew Jersey              |3/25        |4402           |62    |0        |0\nCalifornia              |3/25        |2998           |65    |0        |0\nWashington              |3/25        |2591           |133   |0        |0\nMichigan                |3/25        |2289           |43    |0        |0\nIllinois                |3/25        |1865           |19    |0        |0\nMassachusetts           |3/25        |1835           |15    |0        |0\nLouisiana               |3/25        |1795           |65    |0        |0\nFlorida                 |3/25        |1681           |23    |0        |0\nPennsylvania            |3/25        |1260           |15    |0        |0\nGeorgia                 |3/25        |1247           |40    |0        |0\nTexas                   |3/25        |1229           |15    |0        |0\nColorado                |3/25        |1021           |16    |0        |0\nConnecticut             |3/25        |875            |19    |0        |0\nTennessee               |3/25        |816            |3     |0        |0\nOhio                    |3/25        |704            |11    |0        |0\nWisconsin               |3/25        |621            |7     |0        |0\nNorth Carolina          |3/25        |584            |2     |0        |0\nIndiana                 |3/25        |477            |14    |0        |0\nMaryland                |3/25        |425            |4     |0        |0\nSouth Carolina          |3/25        |424            |7     |0        |0\nArizona                 |3/25        |401            |6     |0        |0\nVirginia                |3/25        |388            |9     |0        |0\nAlabama                 |3/25        |381            |1     |0        |0\nMississippi             |3/25        |377            |3     |0        |0\nNevada                  |3/25        |323            |6     |0        |0\nMissouri                |3/25        |311            |8     |0        |0\nUtah                    |3/25        |311            |1     |0        |0\nMinnesota               |3/25        |283            |1     |0        |0\nArkansas                |3/25        |280            |2     |0        |0\nOregon                  |3/25        |266            |10    |0        |0\nKentucky                |3/25        |197            |5     |0        |0\nOklahoma                |3/25        |164            |5     |0        |0\nIowa                    |3/25        |146            |1     |0        |0\nMaine                   |3/25        |142            |0     |0        |0\nKansas                  |3/25        |134            |3     |0        |0\nRhode Island            |3/25        |132            |0     |0        |0```', // eslint-disable-line max-len
                  },
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '```Vermont                 |3/25        |125            |8     |0        |0\nDelaware                |3/25        |119            |0     |0        |0\nNew Hampshire           |3/25        |108            |1     |0        |0\nNew Mexico              |3/25        |100            |1     |0        |0\nIdaho                   |3/25        |91             |0     |0        |0\nHawaii                  |3/25        |91             |0     |0        |0\nNebraska                |3/25        |71             |0     |0        |0\nMontana                 |3/25        |65             |0     |0        |0\nPuerto Rico             |3/25        |51             |2     |0        |0\nDiamond Princess        |3/25        |49             |0     |0        |0\nNorth Dakota            |3/25        |45             |0     |0        |0\nWyoming                 |3/25        |44             |0     |0        |0\nSouth Dakota            |3/25        |41             |1     |0        |0\nWest Virginia           |3/25        |39             |0     |0        |0\nAlaska                  |3/25        |37             |1     |0        |0\nGuam                    |3/25        |37             |1     |0        |0\nGrand Princess          |3/25        |28             |1     |0        |0\nVirgin Islands          |3/25        |17             |0     |0        |0\nAmerican Samoa          |3/25        |0              |0     |0        |0\nNorthern Mariana Islands|3/25        |0              |0     |0        |0\nRecovered               |3/25        |0              |0     |361      |0```', // eslint-disable-line max-len
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
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'plain_text',
                    text: 'I encountered an error retrieving the data :(',
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
      });
    });
  });
});
