import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get(
    'https://api2.kava.io/kava/community/v1beta1/annualized_rewards',
    () => {
      return HttpResponse.json({
        staking_rewards: '0.085061193039676390',
      });
    },
  ),
  http.get(
    'https://api2.kava.io/kava/liquid/v1beta1/delegated_balance/*',
    () => {
      return HttpResponse.json({
        vested: {
          denom: 'ukava',
          amount: '199999999',
        },
        vesting: {
          denom: 'ukava',
          amount: '1',
        },
      });
    },
  ),
];
