import chai, { assert } from 'chai';
import server from '.';

import chaiHTTP = require('chai-http');

chai.use(chaiHTTP);

describe('Server', () => {
  it('pongs', async () => {
    const res = await chai.request(server)
      .get('/ping');

    assert.equal(res.status, 200);
    assert.equal(res.text, 'pong');
  });

  it('handles 404s', async () => {
    const res = await chai.request(server)
      .get('/something');

    assert.equal(res.status, 404);
  });
});
