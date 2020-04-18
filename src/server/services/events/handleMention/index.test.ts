import nock from 'nock';
import handleMention from '.';
import { Slack } from '../../../../types';

const BASE_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports'; // eslint-disable-line max-len

const formatDate = (date: Date): string => (
  `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`
);

const getPath = (date = new Date()): string => `/${formatDate(date)}.csv`;

describe('handleMention', () => {
  before(() => {
    nock.disableNetConnect();
  });

  after(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  it('handles coronavirus requests', async () => {
    const channel = 'ABC';

    const githubScope = nock(BASE_URL)
      .get(getPath())
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

    await handleMention({
      event: {
        channel,
        text: 'coronavirus update',
        user: 'whoever',
        team: 'whatever',
      },
    } as Slack.Payloads.Event);
    slackScope.done();
    githubScope.done();
  });
});
