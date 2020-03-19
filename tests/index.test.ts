import chai, { expect } from 'chai';
import app from '../src';

import chaiHTTP = require('chai-http')

chai.use(chaiHTTP);

describe('Server', () => {
  it('pongs', async () => {
    const res = await chai.request(app)
      .get('/ping');

    expect(res.status).to.equal(200);
    expect(res.text).to.eql('pong');
  });
});
