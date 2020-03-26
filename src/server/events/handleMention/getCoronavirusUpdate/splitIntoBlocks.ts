import { Slack } from '../../../../types';

export const createBlock = (text: string, type: 'mrkdwn' | 'plain_text'): Slack.Block => ({
  type: 'section',
  text: {
    type,
    text: type === 'mrkdwn' ? `\`\`\`${text}\`\`\`` : text,
  },
});


export default (lines: string[]): Slack.Block[] => {
  let pointer = 0;
  let length = 0;
  const blockTexts: string[][] = [[]];

  for (const line of lines) {
    if (length + line.length > 2900) {
      pointer += 1;
      length = line.length;
      blockTexts.push([line]);
    } else {
      blockTexts[pointer].push(line);
      length += line.length;
    }
  }

  return blockTexts.map((text) => createBlock(text.join('\n'), 'mrkdwn'));
};
