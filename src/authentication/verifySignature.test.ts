import { assert } from 'chai';
import sinon from 'sinon';
import { Request, Response } from 'express';
import verifySignature from './verifySignature';
import HTTPError from '../HTTPError';
import bufferStore from './bufferStore';

const coerce = <T>(obj: any): T => obj as unknown as T;
const response = coerce<Response>({});

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
    verifySignature(coerce({ headers: { 'x-slack-request-timestamp': '1' } }), response, stub);
    const error: HTTPError = stub.args[0][0];

    assert.instanceOf(error, HTTPError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized');
  });

  it('rejects requests without a request body', () => {
    const stub = sinon.stub();
    verifySignature(
      coerce({ headers: { 'x-slack-request-timestamp': '1', 'x-slack-signature': 'sig' } }),
      response,
      stub,
    );
    const error: HTTPError = stub.args[0][0];

    assert.instanceOf(error, HTTPError);
    assert.equal(error.statusCode, 401);
    assert.equal(error.message, 'Unauthorized');
  });

  it('rejects requests if the signatures do not match', () => {
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

  it('allows valid requests through', () => {
    const request = coerce<Request>({
      headers: {
        'x-slack-request-timestamp': '1',
        'x-slack-signature': 'v0=7dc8eec6b9883ad392e6abb39fa279a18e24d36fc83cc286f8c79c92b096dc6a',
      },
    });

    bufferStore.set(request, Buffer.from('body'));

    const stub = sinon.stub();
    verifySignature(request, response, stub);

    assert.isUndefined(stub.args[0][0]);
  });
});
