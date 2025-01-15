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

/**
 * Inserts `<wbr>` tags into a string at points where a word exceeds a specified length.
 * This ensures long unbroken words can be wrapped properly in HTML.
 *
 * @param {string} content - The input string to process.
 * @param {number} [maxWordLength=45] - The maximum allowed length of a word before breaking. Slightly longer than 0x addresses
 * @returns {string} - The processed string with `<wbr>` tags inserted at appropriate points.
 */
export const enforceWordBreak = (
  content: string,
  maxWordLength: number = 45,
): string => {
  return content.split(' ').reduce(
    (accumulator, word, index) => {
      const wordLengthWithSpace = word.length + 1;
      const currentLineLength = accumulator.currentLength;

      // If adding this word would exceed maxWordLength, add a break
      if (
        currentLineLength + wordLengthWithSpace > maxWordLength &&
        currentLineLength > 0
      ) {
        return {
          text: accumulator.text + '<wbr> ' + word,
          currentLength: word.length + 1,
        };
      }

      // Add space before word (except at the beginning)
      const prefix = index > 0 ? ' ' : '';
      return {
        text: accumulator.text + prefix + word,
        currentLength: currentLineLength + wordLengthWithSpace,
      };
    },
    {
      text: '',
      currentLength: 0,
    },
  ).text;
};
