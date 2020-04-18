import chai, { assert } from 'chai';
import { createHmac } from 'crypto';
import nock from 'nock';
import * as path from 'path';
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
                    text: 'If the data is bad, I got it from here https://github.com/CSSEGISandData\n'
                      + 'Total cases: 65778\n'
                      + 'Total deaths: 942\n'
                      + 'Total recovered: 361\n'
                      + 'Total active: 0',
                  },
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '```State                   |Last updated|Confirmed cases|Deaths|Recovered|Active cases\n'
                      + '-----------------------------------------------------------------------------------\n'
                      + 'New York                |3/25        |30841          |285   |0        |0\n'
                      + 'New Jersey              |3/25        |4402           |62    |0        |0\n'
                      + 'California              |3/25        |2998           |65    |0        |0\n'
                      + 'Washington              |3/25        |2591           |133   |0        |0\n'
                      + 'Michigan                |3/25        |2296           |43    |0        |0\n'
                      + 'Illinois                |3/25        |1865           |19    |0        |0\n'
                      + 'Massachusetts           |3/25        |1838           |15    |0        |0\n'
                      + 'Louisiana               |3/25        |1795           |65    |0        |0\n'
                      + 'Florida                 |3/25        |1682           |23    |0        |0\n'
                      + 'Pennsylvania            |3/25        |1260           |15    |0        |0\n'
                      + 'Georgia                 |3/25        |1247           |40    |0        |0\n'
                      + 'Texas                   |3/25        |1229           |15    |0        |0\n'
                      + 'Colorado                |3/25        |1021           |16    |0        |0\n'
                      + 'Tennessee               |3/25        |916            |3     |0        |0\n'
                      + 'Connecticut             |3/25        |875            |19    |0        |0\n'
                      + 'Ohio                    |3/25        |704            |11    |0        |0\n'
                      + 'Wisconsin               |3/25        |621            |7     |0        |0\n'
                      + 'North Carolina          |3/25        |590            |2     |0        |0\n'
                      + 'Indiana                 |3/25        |477            |14    |0        |0\n'
                      + 'Maryland                |3/25        |425            |4     |0        |0\n'
                      + 'South Carolina          |3/25        |424            |7     |0        |0\n'
                      + 'Arizona                 |3/25        |401            |6     |0        |0\n'
                      + 'Virginia                |3/25        |396            |9     |0        |0\n'
                      + 'Alabama                 |3/25        |381            |1     |0        |0\n'
                      + 'Mississippi             |3/25        |377            |3     |0        |0\n'
                      + 'Missouri                |3/25        |354            |8     |0        |0\n'
                      + 'Utah                    |3/25        |340            |1     |0        |0\n'
                      + 'Nevada                  |3/25        |323            |6     |0        |0\n'
                      + 'Minnesota               |3/25        |286            |1     |0        |0\n'
                      + 'Arkansas                |3/25        |280            |2     |0        |0\n'
                      + 'Oregon                  |3/25        |266            |10    |0        |0\n'
                      + 'Kentucky                |3/25        |197            |5     |0        |0\n'
                      + 'District of Columbia    |3/25        |187            |2     |0        |0\n'
                      + 'Oklahoma                |3/25        |164            |5     |0        |0\n'
                      + 'Iowa                    |3/25        |146            |1     |0        |0\n'
                      + 'Maine                   |3/25        |142            |0     |0        |0\n'
                      + 'Kansas                  |3/25        |134            |3     |0        |0```',
                  },
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: '```Rhode Island            |3/25        |132            |0     |0        |0\n'
                      + 'Vermont                 |3/25        |125            |8     |0        |0\n'
                      + 'Delaware                |3/25        |119            |0     |0        |0\n'
                      + 'New Mexico              |3/25        |113            |1     |0        |0\n'
                      + 'New Hampshire           |3/25        |108            |1     |0        |0\n'
                      + 'Idaho                   |3/25        |91             |0     |0        |0\n'
                      + 'Hawaii                  |3/25        |91             |0     |0        |0\n'
                      + 'Nebraska                |3/25        |71             |0     |0        |0\n'
                      + 'Montana                 |3/25        |65             |0     |0        |0\n'
                      + 'Puerto Rico             |3/25        |51             |2     |0        |0\n'
                      + 'Diamond Princess        |3/25        |49             |0     |0        |0\n'
                      + 'North Dakota            |3/25        |45             |0     |0        |0\n'
                      + 'Wyoming                 |3/25        |44             |0     |0        |0\n'
                      + 'Alaska                  |3/25        |41             |1     |0        |0\n'
                      + 'South Dakota            |3/25        |41             |1     |0        |0\n'
                      + 'West Virginia           |3/25        |39             |0     |0        |0\n'
                      + 'Guam                    |3/25        |37             |1     |0        |0\n'
                      + 'Grand Princess          |3/25        |28             |1     |0        |0\n'
                      + 'Virgin Islands          |3/25        |17             |0     |0        |0\n'
                      + 'American Samoa          |3/25        |0              |0     |0        |0\n'
                      + 'Northern Mariana Islands|3/25        |0              |0     |0        |0\n'
                      + 'Recovered               |3/25        |0              |0     |361      |0```',
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
          await events.ready();
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
          await events.ready();
          slackScope.done();
          githubScope.done();
        });
      });
    });
  });
});
