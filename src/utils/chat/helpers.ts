import {
  CoinRecord,
  ERC20Record,
} from '../../features/blockchain/config/chainsRegistry';
//  todo - convert to use interface
export const getStoredMasks = (): {
  masksToValues: Record<string, string>;
  valuesToMasks: Record<string, string>;
} => {
  try {
    return {
      masksToValues: JSON.parse(localStorage.getItem('masksToValues') || '{}'),
      valuesToMasks: JSON.parse(localStorage.getItem('valuesToMasks') || '{}'),
    };
  } catch (e) {
    console.error('Error parsing masks from localStorage:', e);
    return { masksToValues: {}, valuesToMasks: {} };
  }
};

export const updateStoredMasks = (
  masksToValues: Record<string, string>,
  valuesToMasks: Record<string, string>,
) => {
  localStorage.setItem('masksToValues', JSON.stringify(masksToValues));
  localStorage.setItem('valuesToMasks', JSON.stringify(valuesToMasks));
};

export const getERC20Record = (
  denom: string,
  records: Record<string, ERC20Record>,
): ERC20Record | null => {
  if (records[denom]) return records[denom];
  if (records[denom.toUpperCase()]) return records[denom.toUpperCase()];

  for (const record of Object.values(records)) {
    if (record.displayName === denom) return record;
    if (record.displayName === denom.toUpperCase()) return record;
    if (record.displayName.toUpperCase() === denom.toUpperCase()) return record;
  }

  return null;
};

export const getCoinRecord = (
  denom: string,
  records: Record<string, CoinRecord>,
) => {
  if (records[denom]) return records[denom];
  if (records[denom.toUpperCase()]) return records[denom.toUpperCase()];

  for (const record of Object.values(records)) {
    if (record.displayName === denom) return record;
    if (record.displayName === denom.toUpperCase()) return record;
    if (record.displayName.toUpperCase() === denom.toUpperCase()) return record;
  }

  return null;
};
