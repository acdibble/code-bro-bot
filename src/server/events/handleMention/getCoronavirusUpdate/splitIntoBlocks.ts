import { Slack } from '../../../../types';

const createBlock = (text: string): Slack.Block => ({
  type: 'section',
  text: {
    text,
    type: 'mrkdwn',
  },
});


export default (data: string): Slack.Block[] => {
  if (data.length > 3000) {
    const split = data.split('\n');
    return [
      createBlock(`\`\`\`${split.slice(0, Math.floor(split.length / 2)).join('\n')}\`\`\``),
      createBlock(`\`\`\`${split.slice(Math.floor(split.length / 2) + 1).join('\n')}\`\`\``),
    ];
  }

  return [createBlock(data)];
};
