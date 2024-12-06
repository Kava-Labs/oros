import { describe, it, expect, vi } from 'vitest';
import { getDisplayStakingApy, getDelegatedBalance } from './toolFunctions';
import * as apiModule from './api'

describe.skip('getStakingApy', () => {
  it('returns a human-readable percentage on success', async () => {
    const fetchStakingApySpy = vi.spyOn(apiModule, 'fetchStakingApy');
    fetchStakingApySpy.mockResolvedValueOnce({
      staking_rewards: "0.085061193039676390"
    });

    const result = await getDisplayStakingApy();

    expect(result).toBe("8.5061%");
  });

  it('returns a wrapped error message on network failure', async () => {
    const mockError = "Error: 404 Unauthorized";
    const fetchStakingApySpy = vi.spyOn(apiModule, 'fetchStakingApy');
    fetchStakingApySpy.mockRejectedValueOnce(mockError);

    const result = await getDisplayStakingApy();

    expect(result).toBe(`Error fetching staking APY: "${mockError}"`);

describe.skip('getDelegatedBalance', () => {
  it('returns the display total delegated balance with a kava address', async () => {
    const fetchDelegatedBalanceSpy = vi.spyOn(apiModule, 'fetchDelegatedBalance');
    fetchDelegatedBalanceSpy.mockResolvedValue({
      "vested": {
        "denom": "ukava",
        "amount": "199999999"
      },
      "vesting": {
        "denom": "ukava",
        "amount": "1"
      }
    });

    const result = await getDelegatedBalance({
      address: "kava1vlpsrmdyuywvaqrv7rx6xga224sqfwz3fyfhwq"
    });

    expect(result).toBe("200");
  });
});
