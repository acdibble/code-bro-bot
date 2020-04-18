import { EventEmitter } from 'events';

interface EventNode<T> {
  message: T;
  next: EventNode<T> | null;
}

export default class Queue<T = any> extends EventEmitter {
  private nextMessage = Symbol('nextMessage');

  private isReady = Symbol('isReady');

  private head: EventNode<T> | null = null;

  private tail: EventNode<T> | null = null;

  // should be fixed in ts 3.9 https://github.com/microsoft/TypeScript/issues/37564
  /* eslint-disable @typescript-eslint/ban-ts-ignore, no-await-in-loop */
  // @ts-ignore
  async* [Symbol.asyncIterator](): AsyncGenerator<T, never, Promise<undefined>> {
    while (true) {
      let current = this.head;
      while (current !== null) {
        this.head = current.next;
        if (this.head === null) {
          this.tail = null;
        }
        // @ts-ignore
        await (yield current.message);
        current = this.head;
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
    if (this.emit(this.nextMessage, message)) {
      return this;
    }

    if (this.head === null || this.tail === null) {
      this.head = { message, next: null };
      this.tail = this.head;
    } else {
      this.tail.next = { message, next: null };
      this.tail = this.tail.next;
    }

    return this;
  }

  public ready(): Promise<void> {
    return new Promise((resolve) => {
      this.once(this.isReady, resolve);
    });
  }
}
