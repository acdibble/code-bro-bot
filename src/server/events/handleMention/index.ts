import { Slack } from '../../../types';
import postMessage from '../../../messages/postMessage';
import getCoronavirusUpdate from './getCoronavirusUpdate';
import getMe from '../../../meta/getMe';
import splitIntoBlocks from './getCoronavirusUpdate/splitIntoBlocks';

export default async (
  { event: { text, channel, user } }: Slack.Payloads.Event,
): Promise<Slack.Responses.PostMessage> => {
  const trimmed = text.trim();
  let message: Slack.Requests.PostMessage = { channel, text: "I don't know what to do with my hands" };

  if (trimmed === `<@${await getMe()}>`) {
    message = { channel, text: `<@${user}>?` };
  } if (trimmed.includes('coronavirus update')) {
    const [summary, data] = await getCoronavirusUpdate();
    message = {
      channel,
      blocks: splitIntoBlocks(data),
    };
    await postMessage({ channel, text: summary });
  }

  return postMessage(message);
};
