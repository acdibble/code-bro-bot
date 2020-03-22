import { assert } from 'chai';
import nock from 'nock';
import getMe, { teamIdToUserIdMap } from './getMe';

describe('getMe', () => {
  before(() => {
    nock.disableNetConnect();
  });
  after(() => {
    nock.enableNetConnect();
  });

  it('gets code bro id for a team', async () => {
    teamIdToUserIdMap.abcd = '1234';

    assert.equal(await getMe('abcd'), '1234');
  });
});
