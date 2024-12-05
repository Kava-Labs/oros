interface AnnualizedRewardsResponse {
  staking_rewards: string;
}

//  todo - remove hardcoded base URL
export async function fetchStakingApy(): Promise<AnnualizedRewardsResponse> {
  const response = await fetch("https://api2.kava.io/kava/community/v1beta1/annualized_rewards");
  return await response.json();
}
