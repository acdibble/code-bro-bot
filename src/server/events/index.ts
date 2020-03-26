import { Router } from 'express';
import { Slack } from '../../types';
import Queue from '../../Queue';
import handleMention from './handleMention';

export interface Event {
  type: Slack.Event;
  requestBody: Slack.Payloads.Event;
}

export const queue = new Queue<Event>();

export default Router()
  .post('/', async (req: Slack.IncomingRequest<Slack.Payloads.Event>, res) => {
    queue.enqueue({ type: req.body.event.type, requestBody: req.body });
    res.end();
  });

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
(async (): Promise<never> => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  for await (const { type, requestBody } of queue) {
    try {
      switch (type) {
        case Slack.Event.AppMention:
          await handleMention(requestBody);
          break;
        default:
          console.error('Received unknown event:', type);
      }
    } catch (e) {
      console.error(e);
    }
  }
})();
