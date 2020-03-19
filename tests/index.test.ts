import chai, { expect } from 'chai';
import app from '../src/server';

import chaiHTTP = require('chai-http')

chai.use(chaiHTTP);

describe('Server', () => {
  it('pongs', async () => {
    const res = await chai.request(app)
      .get('/ping');

    expect(res.status).to.equal(200);
    expect(res.text).to.equal('pong');
  });

  it('handles 404s', async () => {
    const res = await chai.request(app)
      .get('/something');

    expect(res.status).to.equal(404);
  });
});
