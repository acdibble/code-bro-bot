import { Slack } from '../../../../types';

const createBlock = (text: string): Slack.Block => ({
  type: 'section',
  text: {
    type: 'mrkdwn',
    text: `\`\`\`${text}\`\`\``,
  },
});


export default (lines: string[]): Slack.Block[] => {
  let pointer = 0;
  let length = 0;
  const blockTexts: string[][] = [[]];

  // eslint-disable-next-line no-restricted-syntax
  for (const line of lines) {
    if (length + line.length > 3000) {
      pointer += 1;
      length = line.length;
      blockTexts.push([line]);
    } else {
      blockTexts[pointer].push(line);
      length += line.length;
    }
  }

  return blockTexts.map((text) => createBlock(text.join('\n')));
};
