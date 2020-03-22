import Payload from './Payloads';

// eslint-disable-next-line no-undef
export default interface IncomingRequest<T extends Payload> {
  body: T;
}
