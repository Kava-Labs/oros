interface AnnualizedRewardsResponse {
  staking_rewards: string;
}

export interface Coin {
  denom: string;
  amount: string;
}

interface DelegatedBalanceResponse {
  vested: Coin;
  vesting: Coin;
}

//  todo - remove hardcoded base URL
export async function fetchStakingApy(): Promise<AnnualizedRewardsResponse> {
  const response = await fetch("https://api2.kava.io/kava/community/v1beta1/annualized_rewards");
  return await response.json();
}


export async function fetchDelegatedBalance(address: string): Promise<DelegatedBalanceResponse> {
  const url = "https://api2.kava.io/kava/liquid/v1beta1/delegated_balance/".concat(address);
  const response = await fetch(url);
  return await response.json();
}

