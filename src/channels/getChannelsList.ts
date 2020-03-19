import slackRequest from '../requests/slackRequest';
import { Slack } from '../types';

export default async (): Promise<Slack.Channel[]> => {
  const { channels } = await slackRequest(Slack.Method.ConversationsList, { httpMethod: 'GET' });

  return channels;
};
