import splitIntoBlocks, { createBlock } from './splitIntoBlocks';
import { Slack } from '../../../../types';

interface CovidData {
  lastUpdate: Date;
  confirmed: number;
  deaths: number;
  recovered: number;
  active: number;
}

const formatDate = (date: Date): string => `${(date.getMonth() + 1)}/${date.getDate()}`;

const blankCovidData = (): CovidData => ({
  lastUpdate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
  confirmed: 0,
  deaths: 0,
  recovered: 0,
  active: 0,
});

export default (csv: string): Slack.Block[] => {
  const [, ...data] = csv.trim().split('\n');
  const tabulatedData = data.reduce((acc, line) => {
    if (!line.endsWith(' US"')) return acc;
    const [,, state,, lastUpdate,,, confirmed, deaths, recovered, active] = line.split(',');
    acc[state] = acc[state] || blankCovidData();

    const currentLineLastUpdate = new Date(lastUpdate);
    acc[state].confirmed += Number(confirmed);
    acc[state].deaths += Number(deaths);
    acc[state].recovered += Number(recovered);
    acc[state].active += Number(active);
    acc.total.confirmed += Number(confirmed);
    acc.total.deaths += Number(deaths);
    acc.total.recovered += Number(recovered);
    acc.total.active += Number(active);
    acc[state].lastUpdate = currentLineLastUpdate < acc[state].lastUpdate
      ? currentLineLastUpdate
      : acc[state].lastUpdate;

    return acc;
  }, { total: blankCovidData() } as Record<string, CovidData>);

  const columns = [
    'State',
    'Last updated',
    'Confirmed cases',
    'Deaths',
    'Recovered',
    'Active cases',
  ];

  const columnWidths = columns.map((c) => c.length);

  const pertinentData = Object.keys(tabulatedData).map((key) => {
    const {
      lastUpdate,
      active,
      recovered,
      deaths,
      confirmed,
    } = tabulatedData[key];

    return [key, formatDate(lastUpdate), String(confirmed), String(deaths), String(recovered), String(active)];
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const totals: string[] = pertinentData.shift()!;

  pertinentData
    .sort(([,, a], [,, b]) => Number(b) - Number(a))
    .forEach((line) => {
      line.forEach((val, i) => {
        if (columnWidths[i] < val.length) {
          columnWidths[i] = val.length;
        }
      });
    });


  const summary = [
    'If the data is bad, I got it from here https://github.com/CSSEGISandData',
    `Total cases: ${totals[2]}`,
    `Total deaths: ${totals[3]}`,
    `Total recovered: ${totals[4]}`,
    `Total active: ${totals[5]}`,
  ].join('\n');

  const blocks = splitIntoBlocks([
    columns.map((c, i) => c.padEnd(columnWidths[i], ' ')).join('|').trim(),
    '-'.repeat(columnWidths.reduce((a, b) => a + b) + columnWidths.length - 1),
    ...pertinentData.map((line) => line.map((value, i) => value.padEnd(columnWidths[i], ' ')).join('|').trim()),
  ]);

  blocks.unshift(createBlock(summary, 'plain_text'));
  blocks[0].text.type = 'mrkdwn';
  return blocks;
};
