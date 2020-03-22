import slackRequest from '../requests/slackRequest';
import { Slack } from '../types';

let me: string;

export default async (): Promise<string> => {
  if (me) return me;
  ({ user_id: me } = await slackRequest(Slack.Method.AuthTest));
  return me;
};
