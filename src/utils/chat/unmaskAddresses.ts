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
  const maskPattern = new RegExp(Object.keys(masksToValues).join('|'), 'g');

  // Replace each mask, falling back to the original string if it isn't found
  return message.replace(maskPattern, (match) => masksToValues[match] ?? match);
};
