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

