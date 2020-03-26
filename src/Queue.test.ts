import sinon from 'sinon';
import { assert } from 'chai';
import Queue from './Queue';

describe('Queue', () => {
  it('builds up and then process all events', async () => {
    const stub = sinon.stub().resolves(1);
    const queue = new Queue<sinon.SinonStub>();

    queue.enqueue(stub)
      .enqueue(stub)
      .enqueue(stub)
      .enqueue(stub);

    // eslint-disable-next-line no-async-promise-executor
    await new Promise(async (resolve) => {
      resolve(queue.ready());
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      for await (const fn of queue) {
        await fn();
      }
    });

    assert.equal(stub.callCount, 4);
  });
});
