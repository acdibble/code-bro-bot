import request from '../../../../requests/request';
import HTTPError from '../../../../HTTPError';
import parseCSV from './parseCSV';

const formatDate = (date: Date): string => (
  `${String(date.getMonth() + 1).padStart(2, '0')}-${date.getDate()}-${date.getFullYear()}`
);

const getUrl = (date: string): string => (
  // eslint-disable-next-line max-len
  `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/${date}.csv`
);

const getCoronaVirusUpdate = async (daysBack = 0): Promise<[string, string]> => {
  if (daysBack === 10) return ['Could not find any data within past 10 days.', ''];

  const date = formatDate(new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000));
  const url = getUrl(date);

  try {
    const response: string = await request(url, { method: 'GET' });
    return parseCSV(response);
  } catch (e) {
    if (e instanceof HTTPError && e.statusCode === 404) {
      return getCoronaVirusUpdate(daysBack + 1);
    }

    throw e;
  }
};

export default getCoronaVirusUpdate;
