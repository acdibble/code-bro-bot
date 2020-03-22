import { Slack } from '../../../types';
import postMessage from '../../../messages/postMessage';
import getCoronavirusUpdate from './getCoronavirusUpdate';
import getMe from '../../../meta/getMe';
import splitIntoBlocks from './getCoronavirusUpdate/splitIntoBlocks';

export default async (
  { event: { text, channel, user } }: Slack.Payloads.Event,
): Promise<Slack.Responses.PostMessage> => {
  const trimmed = text.trim();
  const message: {channel: string; text?: string; blocks?: Slack.Block[]} = { channel };

  if (trimmed === `<@${await getMe()}>`) {
    message.text = `<@${user}>?`;
  } else if (trimmed.includes('coronavirus update')) {
    const [summary, data] = await getCoronavirusUpdate();
    message.blocks = splitIntoBlocks(data);
    await postMessage({ channel, text: summary });
  } else if (trimmed.includes('your source code')) {
    message.text = 'https://github.com/acdibble/code-bro-bot';
  }

  return postMessage(message as Slack.Requests.PostMessage);
};
