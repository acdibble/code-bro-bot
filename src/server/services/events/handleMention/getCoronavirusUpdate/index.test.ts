import nock from 'nock';
import { assert } from 'chai';
import getCoronaVirusUpdate from '.';


const baseUrl = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports'; // eslint-disable-line max-len

const formatDate = (date: Date): string => (
  `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`
);

const getPath = (date: Date): string => `/${formatDate(date)}.csv`;

describe('getCoronaVirusUpdate', () => {
  before(() => {
    nock.disableNetConnect();
  });

  after(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  it('tries retrieve 10 days of history on continual 404 responses', async () => {
    const scope = nock(baseUrl);

    for (let i = 0; i <= 10; i += 1) {
      scope
        .get(getPath(new Date(Date.now() - i * 24 * 60 * 60 * 1000)))
        .reply(404);
    }

    const blocks = await getCoronaVirusUpdate('for US');
    scope.done();
    assert.lengthOf(blocks, 1);
    assert.deepEqual(blocks[0], {
      type: 'section',
      text: {
        text: "I couldn't find any data within the past 10 days.",
        type: 'plain_text',
      },
    });
  });
});
