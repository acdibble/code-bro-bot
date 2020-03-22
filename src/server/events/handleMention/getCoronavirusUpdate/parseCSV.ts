import splitIntoBlocks, { createBlock } from './splitIntoBlocks';
import { Slack } from '../../../../types';

const parseDate = (date: string): string => {
  const dateObj = new Date(date);
  return `${(dateObj.getMonth() + 1)}/${dateObj.getDate()}`;
};

export default (csv: string): Slack.Block[] => {
  const [, ...data] = csv.trim().split('\n');
  const [[cases, deaths, recovered], pertinentData] = data
    .reduce(([[c, d, r], lines]: [[number, number, number], string[][]], line) => {
      const [state, country, lastUpdate, fälle, tote, erholte] = line.split(',');
      if (['US'].includes(country)) {
        lines.push([state, parseDate(lastUpdate), fälle, tote, erholte]);
        return [[c + Number(fälle), d + Number(tote), r + Number(erholte)], lines];
      }
      return [[c, d, r], lines];
    }, [[0, 0, 0], []]);

  const columns = [
    'State or territory',
    'Last updated',
    'Confirmed cases',
    'Deaths',
    'Recovered',
  ];

  const columnWidths = columns.map((c) => c.length);

  pertinentData.forEach((line) => {
    line.forEach((val, i) => {
      if (columnWidths[i] < val.length) {
        columnWidths[i] = val.length;
      }
    });
  });

  const summary = [
    `Total cases: ${cases}`,
    `Total deaths: ${deaths}`,
    `Total recovered: ${recovered}`,
  ].join('\n');

  const blocks = splitIntoBlocks([
    columns.map((c, i) => c.padEnd(columnWidths[i], ' ')).join('|').trim(),
    '-'.repeat(columnWidths.reduce((a, b) => a + b) + columnWidths.length - 1),
    ...pertinentData.map((line) => line.map((value, i) => value.padEnd(columnWidths[i], ' ')).join('|').trim()),
  ]);

  return [createBlock(summary, 'plain_text'), ...blocks];
};
