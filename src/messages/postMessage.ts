import slackRequest from '../requests/slackRequest';
import { Slack } from '../types';

export default (channelId: string, text: string): Promise<{ ok: boolean }> => slackRequest(Slack.Method.PostMessage, {
  httpMethod: 'POST',
  params: {
    channel: channelId,
    text,
  },
});
