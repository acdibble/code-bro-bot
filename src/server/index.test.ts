import chai, { expect } from 'chai';
import server from '.';

import chaiHTTP = require('chai-http');

chai.use(chaiHTTP);

describe('Server', () => {
  it('pongs', async () => {
    const res = await chai.request(server)
      .get('/ping');

    expect(res.status).to.equal(200);
    expect(res.text).to.equal('pong');
  });

  it('handles 404s', async () => {
    const res = await chai.request(server)
      .get('/something');

    expect(res.status).to.equal(404);
  });
});
