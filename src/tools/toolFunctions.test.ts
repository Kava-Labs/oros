import { describe, it, expect, vi } from 'vitest';
import { getDisplayStakingApy } from './toolFunctions.ts';

describe.skip('getStakingApy', () => {
  it('returns a human-readable percentage on success', async () => {
    const result = await getDisplayStakingApy();

    //  verifies that we didn't leave it as a raw value, which would be less than 1
    expect(parseFloat(result)).toBeGreaterThan(1);
    expect(result.endsWith("%")).toBe(true);
  });
  it('returns a wrapped error message on network failure', async () => {
    // Make this next fetch call fail to see the error
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('404 Unauthorized'));

    const result = await getDisplayStakingApy();

    expect(result).toBe("Error fetching staking APY: Error: 404 Unauthorized");
  });
})
