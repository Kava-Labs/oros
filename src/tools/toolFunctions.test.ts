import { getDisplayStakingApy, getDelegatedBalance } from './toolFunctions';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('getStakingApy', () => {
  it('returns a human-readable percentage on success', async () => {
    const result = await getDisplayStakingApy();
    expect(result).toBe('8.5061%');
  });

  it('returns a wrapped error message on network failure', async () => {
    server.use(
      http.get(
        'https://api2.kava.io/kava/community/v1beta1/annualized_rewards',
        () => {
          return new HttpResponse(null, { status: 404 });
        },
      ),
    );

    const result = await getDisplayStakingApy();
    expect(result).toMatch(/Error fetching staking APY/);
  });
});

describe('getDelegatedBalance', () => {
  it('returns the display total delegated balance with a kava address', async () => {
    const result = await getDelegatedBalance({
      address: 'kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq',
    });

    expect(result).toBe('200');
  });
});
