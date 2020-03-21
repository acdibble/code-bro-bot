import { Slack } from '../../types';
import respond from '../../requests/respond';
import postMessage from '../../messages/postMessage';

const isAtUser = (user: string): boolean => /<@[A-Z0-9]+\|\w+>/.test(user);

export default async (body: Slack.CommandRequest): Promise<void> => {
  const {
    text,
    channel_name: channelName,
    channel_id: channelId,
    response_url: responseUrl,
  } = body;

  const [, user] = text.split(' ');

  if (channelName === 'directmessage') {
    await respond(responseUrl, { text: "bro you can't do that here bro", response_type: 'ephemeral' });
  } else if (!user || !isAtUser(user)) {
    await respond(responseUrl, { text: 'bro you need to @someone bro', response_type: 'ephemeral' });
  } else {
    await postMessage(channelId, `${user}, bro...`);
  }
};
