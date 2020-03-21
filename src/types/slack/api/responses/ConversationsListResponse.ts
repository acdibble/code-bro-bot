import Channel from '../../objects/Channel';

export default interface ConversationsListResponse {
  ok: boolean;
  channels: Channel[];
}
