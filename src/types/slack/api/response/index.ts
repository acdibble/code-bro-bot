import PostMessage from './PostMessage';
import AuthTest from './AuthTest';
import Failure from './Failure';

type Responses = PostMessage | AuthTest | Failure;

export {
  PostMessage,
  AuthTest,
  Failure,
};

// eslint-disable-next-line no-undef
export default Responses;
