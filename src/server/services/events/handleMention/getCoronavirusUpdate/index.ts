import request from '../../../../../requests/request';
import HTTPError from '../../../../../HTTPError';
import parseCSV from './parseCSV';
import { Slack } from '../../../../../types';
import { createBlock } from './splitIntoBlocks';

const padNumber = (number: number): string => String(number).padStart(2, '0');

const formatDate = (date: Date): string => (
  `${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}-${date.getFullYear()}`
);

const getUrl = (date: string): string => (
  // eslint-disable-next-line max-len
  `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/${date}.csv`
);

const getCoronaVirusUpdate = async (mention: string): Promise<Slack.Block[]> => {
  const { place } = mention.match(/for (?<place>\w)+/)?.groups || { place: 'US' };

  for (let i = 0; i <= 10; i += 1) {
    const date = formatDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    try {
      // eslint-disable-next-line no-await-in-loop
      const response: string = await request(getUrl(date), { method: 'GET' });
      return parseCSV(response, place);
    } catch (e) {
      if (!(e instanceof HTTPError && e.statusCode === 404)) {
        return [createBlock('I encountered an error retrieving the data :(', 'plain_text')];
      }
    }
  }

  return [createBlock("I couldn't find any data within the past 10 days.", 'plain_text')];
};

export default getCoronaVirusUpdate;
