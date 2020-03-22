import { assert } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import { createHmac } from 'crypto';
import verifySignature from './verifySignature';
import HTTPError from '../HTTPError';
import bufferStore from './bufferStore';

const coerce = <T>(obj: any): T => obj as unknown as T;
const response = coerce<Response>({});
const timestamp = Math.floor(Date.now() / 1000);

describe('verifySignature', () => {
  const oldEnv = process.env;

  before(() => {
    process.env.SLACK_SIGNING_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  });

  after(() => {
    process.env = oldEnv;
  });

  it('rejects requests without a timestamp header', () => {
    const stub = sinon.stub();
    verifySignature(coerce({ headers: {} }), response, stub);
    const error: HTTPError = stub.args[0][0];

    assert.instanceOf(error, HTTPError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized');
  });

  it('rejects requests without a signature header', () => {
    const stub = sinon.stub();
    verifySignature(coerce({ headers: { 'x-slack-request-timestamp': timestamp } }), response, stub);
    const error: HTTPError = stub.args[0][0];

    assert.instanceOf(error, HTTPError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized');
  });

  it('rejects requests without a request body', () => {
    const stub = sinon.stub();
    verifySignature(
      coerce({ headers: { 'x-slack-request-timestamp': timestamp, 'x-slack-signature': 'sig' } }),
      response,
      stub,
    );
    const error: HTTPError = stub.args[0][0];

    assert.instanceOf(error, HTTPError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized');
  });

  it('rejects requests if the timestamp is old', () => {
    const request = coerce<Request>({
      headers: {
        'x-slack-request-timestamp': '1',
        'x-slack-signature': 'sig',
      },
    });

    bufferStore.set(request, Buffer.from('body'));

    const stub = sinon.stub();
    verifySignature(request, response, stub);
    const error: HTTPError = stub.args[0][0];

    assert.instanceOf(error, HTTPError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized');
  });

  it('rejects requests if the signatures do not match', () => {
    const request = coerce<Request>({
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': 'sig',
      },
    });

    bufferStore.set(request, Buffer.from('body'));

    const stub = sinon.stub();
    verifySignature(request, response, stub);
    const error: HTTPError = stub.args[0][0];

    assert.instanceOf(error, HTTPError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized');
  });

  it('allows valid requests through', () => {
    const signature = createHmac('sha256', process.env.SLACK_SIGNING_SECRET as string)
      .update(`v0:${timestamp}:body`)
      .digest('hex');
    const request = coerce<Request>({
      headers: {
        'x-slack-request-timestamp': timestamp,
        'x-slack-signature': `v0=${signature}`,
      },
    });

    bufferStore.set(request, Buffer.from('body'));

    const stub = sinon.stub();
    verifySignature(request, response, stub);

    assert.isUndefined(stub.args[0][0]);
  });
});
