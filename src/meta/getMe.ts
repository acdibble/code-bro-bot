import slackRequest from '../requests/slackRequest';
import { Slack } from '../types';

export const teamIdToUserIdMap: Record<string, string> = {};

export default async (team: string): Promise<string> => {
  console.log(teamIdToUserIdMap);
  if (teamIdToUserIdMap[team]) return teamIdToUserIdMap[team];
  const { user_id: me } = await slackRequest(Slack.Method.AuthTest);
  teamIdToUserIdMap[team] = me;
  return teamIdToUserIdMap[team];
};
