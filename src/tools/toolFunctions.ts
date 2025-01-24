import { ethers } from 'ethers';
import { bech32 } from 'bech32';
import { Coin, fetchDelegatedBalance, fetchStakingApy } from './api';
/**
 *
 * @param kavaAddress string
 * @returns string representing eth address from given kava address
 */
export function kavaToEthAddress(kavaAddress: string) {
  return ethers.getAddress(
    ethers.hexlify(
      Buffer.from(bech32.fromWords(bech32.decode(kavaAddress).words)),
    ),
  );
}

/**
 *
 * @param ethereumAddress string
 * @returns string representing kava address from give eth address
 */
export function ethToKavaAddress(ethereumAddress: string) {
  return bech32.encode(
    'kava',
    bech32.toWords(
      ethers.getBytes(ethers.toQuantity(ethers.getAddress(ethereumAddress))),
    ),
  );
}

/**
 * Fetches the raw staking rewards value from our JSON api (0.081456) and converts it to a human-readable string to 4 decimals places with percent sign (8.1456%)
 * @returns {Promise<string>} A promise that resolves to a string representing the staking APY in percentage format or a wrapped error of why the call failed
 */
export async function getDisplayStakingApy(): Promise<string> {
  try {
    const stakingApyResponse = await fetchStakingApy();
    const percentage = Number(stakingApyResponse.staking_rewards) * 100;
    const displayValue = percentage.toFixed(4);

    return displayValue.concat('%');
  } catch (e) {
    return `Error fetching staking APY: ${JSON.stringify(e)}`;
  }
}
/**
 * * Retrieves the delegated balance for a given address.
 *  *
 *  * @param {string} arg.address - The address to query delegated balances (either a kava or eth address).
 * @returns {Promise<string>} A user's total delegated KAVA (in display units)
 */
export async function getDelegatedBalance(arg: {
  address: string;
}): Promise<string> {
  const COSMOS_CONVERSION_FACTOR = 10 ** 6;
  const { address } = arg;
  const kavaAddress = address.startsWith('kava')
    ? address
    : ethToKavaAddress(address);

  try {
    const response = await fetchDelegatedBalance(kavaAddress);

    //  this endpoint returns two ukava Coins, one for "vested" and one for "vesting"
    const sumOfVestingAndVested: number = Object.values(response).reduce(
      (acc: number, currentValue: Coin) => {
        acc += Number(currentValue.amount);

        return acc;
      },
      0,
    );

    const displayedSum = sumOfVestingAndVested / COSMOS_CONVERSION_FACTOR;

    return String(displayedSum);
  } catch (e) {
    return `Error fetching delegated balance for: ${kavaAddress}, ${e}`;
  }
}
