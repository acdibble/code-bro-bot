import { EventEmitter } from 'events';

export default class Queue<T = any> extends EventEmitter {
  private nextMessage = Symbol('nextMessage');

  private isReady = Symbol('isReady');

  private messages: T[] = [];

  // should be fixed in ts 3.9 https://github.com/microsoft/TypeScript/issues/37564
  /* eslint-disable @typescript-eslint/ban-ts-ignore, no-await-in-loop */
  // @ts-ignore
  async* [Symbol.asyncIterator](): AsyncGenerator<T, never, Promise<undefined>> {
    while (true) {
      for (let message = this.messages.shift(); message !== undefined; message = this.messages.shift()) {
        // @ts-ignore
        await (yield message);
      }

      this.emit(this.isReady);

      // @ts-ignore
      await (yield new Promise<T>((resolve) => {
        this.once(this.nextMessage, resolve);
      }));
    }
  }
  /* eslint-enable @typescript-eslint/ban-ts-ignore, no-await-in-loop */

  public enqueue(message: T): this {
    if (!this.emit(this.nextMessage, message)) {
      this.messages.push(message);
    }

    return this;
  }

  public ready(): Promise<void> {
    return new Promise((resolve) => {
      this.on(this.isReady, resolve);
    });
  }
}
