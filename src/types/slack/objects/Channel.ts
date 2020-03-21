interface ChannelAttachment {
  test: string;
  id: number;
  fallback: string;
}

export default interface Channel {
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
