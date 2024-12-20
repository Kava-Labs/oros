type AddressAccumulator = {
  updatedResult: string;
  masksToValues: Record<string, string>;
  valuesToMasks: Record<string, string>;
};
/**
 * Masks unique addresses in a given message with placeholders (e.g., <address_1>, <address_2>, etc.).
 * If no addresses are found, the original input message is returned.
 *
 * @param {string} message - The input message containing masked addresses.
 * @returns {Object} An object containing:
 *   - `result` {string}: The message with addresses replaced by placeholders.
 *   - `maskedValueMap` {Object}: A map where keys are placeholders and values are the original addresses.
 */
export const maskAddresses = (message: string) => {
  //  find exactly 40 characters after '0x' (inclusive)
  const ethAddressRegex = /0x[a-fA-F0-9]{40}(?!0)/g;

  const addressesToReplace = Array.from(message.matchAll(ethAddressRegex));

  const { updatedResult, masksToValues, valuesToMasks } =
    addressesToReplace.reduce<AddressAccumulator>(
      (accumulator, addressMatch) => {
        // Convert the matched address to lowercase
        const address = addressMatch[0].toLowerCase();

        // Retrieve existing keys from the masksToValues map
        const existingEntries = Object.keys(accumulator.masksToValues);

        // Check if the address is already in the masksToValues map
        let key = existingEntries.find(
          (existingKey) => accumulator.masksToValues[existingKey] === address,
        );

        // If not, create a new key for this address
        if (!key) {
          key = `address_${existingEntries.length + 1}`;
          accumulator.masksToValues[key] = address; // Add lowercased address
          accumulator.valuesToMasks[address] = key; // Create reverse mapping
        }

        // Create a replacement string with the key
        const replacement = `<${key}>`;

        // Replace all occurrences of the address in the result
        const regex = new RegExp(address, 'gi');
        accumulator.updatedResult = accumulator.updatedResult.replace(
          regex,
          replacement,
        );

        return accumulator;
      },
      {
        updatedResult: message,
        masksToValues: {},
        valuesToMasks: {},
      },
    );

  return {
    output: updatedResult,
    masksToValues,
    valuesToMasks,
  };
};
