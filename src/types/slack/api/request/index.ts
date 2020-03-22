import MessageResponse from './MessageResponse';
import PostMessage, { PostMessageWithText } from './PostMessage';

type Requests = PostMessage | MessageResponse;

// eslint-disable-next-line no-undef
export default Requests;

export { MessageResponse, PostMessage, PostMessageWithText };
