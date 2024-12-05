import { describe, it, expect, vi } from 'vitest';
import { getDisplayStakingApy } from './toolFunctions.ts';
import * as apiModule from './api'

describe('getStakingApy', () => {
  it('returns a human-readable percentage on success', async () => {
    const fetchStakingApySpy = vi.spyOn(apiModule, 'fetchStakingApy');
    fetchStakingApySpy.mockResolvedValueOnce({
      staking_rewards: "0.085061193039676390"
    });

    const result = await getDisplayStakingApy();

    expect(result).toBe("8.5061%");
  });

  it('returns a wrapped error message on network failure', async () => {
    const fetchStakingApySpy = vi.spyOn(apiModule, 'fetchStakingApy');
    fetchStakingApySpy.mockRejectedValueOnce(new Error('404 Unauthorized'));

    const result = await getDisplayStakingApy();

    expect(result).toBe("Error fetching staking APY: Error: 404 Unauthorized");
  });
})
