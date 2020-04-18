import nock from 'nock';
import { assert } from 'chai';
import * as path from 'path';
import getCoronaVirusUpdate from '.';

const CSV_PATH = path.resolve(__dirname, '../../../../../../test/csv/03-25-2020.csv');
const BASE_URL = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports'; // eslint-disable-line max-len

const formatDate = (date: Date): string => (
  `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`
);

const getPath = (date = new Date()): string => `/${formatDate(date)}.csv`;

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

  it('returns single block response', async () => {
    const scope = nock(BASE_URL)
      .get(getPath())
      .replyWithFile(200, CSV_PATH);

    const blocks = await getCoronaVirusUpdate('coronavirus update for Germany');
    assert.deepEqual(blocks, [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'If the data is bad, I got it from here https://github.com/CSSEGISandData\n'
            + 'Total cases: 37323\n'
            + 'Total deaths: 206\n'
            + 'Total recovered: 3547\n'
            + 'Total active: 33570',
        },
      },
    ]);
    scope.done();
  });

  it('tries retrieve 10 days of history on continual 404 responses', async () => {
    const scope = nock(BASE_URL);

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

  it('gets a coronavirus update', async () => {
    const githubScope = nock(BASE_URL)
      .get(getPath())
      .replyWithFile(200, CSV_PATH);

    const blocks = await getCoronaVirusUpdate('');
    githubScope.done();
    assert.deepEqual(blocks, [
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
            + '------------------------|------------|---------------|------|---------|------------\n'
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
    ]);
  });

  it('returns an error from coronavirus update', async () => {
    const githubScope = nock(BASE_URL)
      .get(getPath())
      .reply(500);

    const blocks = await getCoronaVirusUpdate('');
    githubScope.done();
    assert.deepEqual(blocks, [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'I encountered an error retrieving the data :(',
        },
      },
    ]);
  });
});
