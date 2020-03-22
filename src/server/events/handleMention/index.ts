import { Slack } from '../../../types';
import postMessage from '../../../messages/postMessage';
import getCoronavirusUpdate from './getCoronavirusUpdate';
import getMe from '../../../meta/getMe';

export default async (
  {
    event: {
      text,
      channel,
      user,
      team,
    },
  }: Slack.Payloads.Event,
): Promise<Slack.Responses.PostMessage> => {
  const trimmed = text.trim();
  const message: {channel: string; text?: string; blocks?: Slack.Block[]} = { channel };

  if (trimmed.includes('coronavirus update')) {
    const [summary, blocks] = await getCoronavirusUpdate();
    if (blocks) {
      message.blocks = blocks;
      await postMessage({ channel, text: summary });
    } else {
      message.text = summary;
    }
  } else if (trimmed.includes('your source code')) {
    message.text = 'https://github.com/acdibble/code-bro-bot';
  } else if (trimmed.startsWith('<') && trimmed.endsWith('>') && trimmed === `<@${await getMe(team)}>`) {
    message.text = `<@${user}>?`;
  } else {
    message.text = "I don't know what to do with my hands";
  }

  return postMessage(message as Slack.Requests.PostMessage);
};
