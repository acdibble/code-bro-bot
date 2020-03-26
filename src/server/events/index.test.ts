import { assert } from 'chai';
import sinon from 'sinon';
import { events } from '.';

describe('eventQueue', () => {
  const errorSpy = sinon.spy(console, 'error');

  after(() => {
    errorSpy.restore();
  });

  it('handles unknown events', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    events.enqueue({ type: 'unknown', requestBody: {} });
    await events.ready();
    assert.isTrue(errorSpy.calledOnceWith('Received unknown event:', 'unknown'));
  });
});
