type AddressAccumulator = {
  updatedResult: string;
  maskedValueMap: Record<string, string>;
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

  const { updatedResult, maskedValueMap } =
    addressesToReplace.reduce<AddressAccumulator>(
      (accumulator, addressMatch) => {
        // Convert the matched address to lowercase
        const address = addressMatch[0].toLowerCase();

        // Retrieve existing keys from the maskedValueMap
        const existingEntries = Object.keys(accumulator.maskedValueMap);

        // Check if the address is already in the map
        let key = existingEntries.find(
          (existingKey) => accumulator.maskedValueMap[existingKey] === address,
        );

        // If not, create a new key for this address
        if (!key) {
          key = `address_${existingEntries.length + 1}`;
          accumulator.maskedValueMap[key] = address; // Add lowercased address
        }

        // Create a replacement string with the key
        const replacement = `<${key}>`;

        // Replace all occurrences of the (lowercase) address in the result
        const regex = new RegExp(address, 'gi');
        accumulator.updatedResult = accumulator.updatedResult.replace(
          regex,
          replacement,
        );

        return accumulator;
      },
      {
        updatedResult: message,
        maskedValueMap: {},
      },
    );

  return {
    output: updatedResult,
    maskedValueMap,
  };
};
