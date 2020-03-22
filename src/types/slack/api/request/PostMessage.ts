import { Block } from '../object';

export interface PostMessageWithText {
  channel: string;
  text: string;
}

export interface PostMessageWithBlocks {
  channel: string;
  blocks: Block[];
}

type PostMessage = PostMessageWithText | PostMessageWithBlocks;

// eslint-disable-next-line no-undef
export default PostMessage;
