/**
 * Transforms masked addresses back to their original Ethereum addresses.
 *
 * @param {string} message - The input message containing masked addresses (e.g., address_1)
 * @param {Record<string, string>} masksToValues - A map where keys are placeholders and values are the original addresses
 * @returns {string} The message with masked addresses replaced by their original values
 */
export const unmaskAddresses = (
  message: string,
  masksToValues: Record<string, string>,
): string => {
  // Create a regular expression that matches any of the masks
  const maskPattern = new RegExp(Object.keys(masksToValues).join('|'), 'g');

  // Replace each mask, falling back to the original string if any mapping is missing
  const result = message.replace(
    maskPattern,
    (match) => masksToValues[match] ?? match,
  );

  // If no replacements were made , return original message
  if (result === message) {
    return message;
  } else {
    return result;
  }
};
