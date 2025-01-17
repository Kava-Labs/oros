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
 * Inserts `<br>` tags into a string at points where a word exceeds a specified length.
 * This ensures long unbroken words can be wrapped properly in HTML.
 *
 * @param {string} text - The input string to process.
 * @param {number} [maxWordLength=45] - The maximum allowed length of a word before breaking. Slightly longer than 0x addresses
 * @returns {string} - The processed string with `<wbr>` tags inserted at appropriate points.
 */
export const enforceLineBreak = (
  text: string,
  maxWordLength: number = 45,
): string => {
  if (text.length <= maxWordLength) return text;

  // Early return if text contains a markdown link
  if (text.match(/\[([^\]]+)\]\(([^)]+)\)/)) {
    return text;
  }

  const words = text.split(' ');
  return words
    .map((word) => {
      // If the word length exceeds maxWordLength
      if (word.length > maxWordLength) {
        // Split the word into chunks of maxWordLength
        const chunks = [];
        for (let i = 0; i < word.length; i += maxWordLength) {
          chunks.push(word.slice(i, i + maxWordLength));
        }
        // Join chunks with <br>
        return chunks.join('<br>');
      }
      return word;
    })
    .join(' ');
};
