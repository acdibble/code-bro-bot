import nock from 'nock';
import chai, { assert } from 'chai';
import slackRequest from '.';
import { Slack } from '../../types';
import HTTPError from '../../HTTPError';

import chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

describe('slackRequest', () => {
  before(() => {
    nock.disableNetConnect();
    nock.cleanAll();
  });

  after(() => {
    nock.enableNetConnect();
  });

  it('handles errors', async () => {
    const scope = nock('https://slack.com/api')
      .post('/chat.postMessage')
      .reply(500, 'whoops');

    const response = slackRequest(Slack.Method.PostMessage, {
      httpMethod: 'POST',
      params: { text: 'test', channel: 'test' },
    });

    await assert.isRejected(response, HTTPError, 'whoops');
  });
});
