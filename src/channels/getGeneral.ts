import getChannelsList from './getChannelsList';
import { Slack } from '../types';

let general: Slack.Channel;

export default async (): Promise<Slack.Channel> => {
  if (general) return general;

  general = (await getChannelsList()).find((channel) => channel.is_general)!;

  return general;
};
