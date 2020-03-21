export default interface PostMessageResponse {
  ok: boolean;
  channel: string;
  ts: string;
  message: {
    bot_id: string;
    type: string;
    text: string;
    user: string;
    ts: string;
    team: string;
    bot_profile: {
      id: string;
      deleted: boolean;
      name: string;
      updated: number;
      app_id: string;
      icons: Record<string, string>;
      team_id: string;
    };
  };
}
