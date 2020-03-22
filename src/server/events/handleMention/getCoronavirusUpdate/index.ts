import request from '../../../../requests/request';
import HTTPError from '../../../../HTTPError';
import parseCSV from './parseCSV';

const padNumber = (number: number): string => String(number).padStart(2, '0');

const formatDate = (date: Date): string => (
  `${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}-${date.getFullYear()}`
);

const getUrl = (date: string): string => (
  // eslint-disable-next-line max-len
  `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/${date}.csv`
);

const internalLoop = async (daysBack: number): Promise<[string, string?]> => {
  const date = formatDate(new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000));

  try {
    const response: string = await request(getUrl(date), { method: 'GET' });
    return parseCSV(response);
  } catch (e) {
    if (daysBack === 10) return ["I couldn't find any data within the past 10 days."];

    if (e instanceof HTTPError && e.statusCode === 404) {
      return internalLoop(daysBack + 1);
    }

    return ['I encountered an error retrieving the data :('];
  }
};

const getCoronaVirusUpdate = async (): Promise<[string, string?]> => internalLoop(0);

export default getCoronaVirusUpdate;
