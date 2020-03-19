/* eslint-disable import/prefer-default-export */
/* eslint-disable camelcase */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Slack {
  export enum Method {
    ConversationsList = 'conversations.list',
    PostMessage = 'chat.postMessage'
  }

  export interface RequestOptions {
    httpMethod: 'GET';
    query?: Record<string, any>;
  }

  export type Request = {
    (method: Method.ConversationsList, opts: RequestOptions):
        Promise<{ ok: boolean; channels: Channel[] }>;
    (method: Method.PostMessage, opts: RequestOptions): Promise<any>;
    (method: Method, opts: RequestOptions): Promise<any>;
  }

  export interface ChannelAttachment {
    test: string;
    id: number;
    fallback: string;
  }

  export interface Channel {
    id: string;
    name: string;
    is_channel: boolean;
    created: number;
    creator: string;
    is_archived: boolean;
    is_general: boolean;
    name_normalized: string;
    is_shared: boolean;
    is_org_shared: boolean;
    is_member: boolean;
    is_private: boolean;
    is_mpim: boolean;
    last_read: string;
    latest: {
      text: string;
      username: string;
      bot_id: string;
      attachments: ChannelAttachment[];
      type: string;
      subtype: string;
      ts: string;
    };
    unread_count: number;
    unread_count_display: number;
    members: string[];
    topic: {
      value: string;
      creator: string;
      last_set: number;
    };
    purpose: {
      value: string;
      creator: string;
      last_set: number;
    };
    previous_names: string[];
  }

  export enum Command {
    bro = '/bro'
  }

  export interface CommandRequest {
    token: string;
    team_id: string;
    team_domain: string;
    channel_id: string;
    channel_name: string;
    user_id: string;
    user_name: string;
    command: Command;
    text: string;
    response_url: string;
    trigger_id: string;
  }
}
