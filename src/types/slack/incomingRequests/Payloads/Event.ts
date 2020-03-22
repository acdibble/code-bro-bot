export const enum EventType {
  AppMention = 'app_mention'
}

interface Element {
  type: string;
  user_id?: string;
  elements?: Element[];
}

interface Block {
  type: string;
  block_id: string;
  elements: Element[];
}

export default interface Event {
  token: string;
  team_id: string;
  api_app_id: string;
  event: {
    client_msg_id: string;
    type: EventType;
    text: string;
    user: string;
    ts: string;
    team: string;
    blocks: Block[];
    channel: string;
    event_ts: string;
  };
  type: string;
  event_id: string;
  event_time: number;
  authed_users: string[];
}
