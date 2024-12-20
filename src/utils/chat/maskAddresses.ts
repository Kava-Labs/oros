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
        const address = addressMatch[0]; // The first element in the array is the match

        const existingEntries = Object.keys(accumulator.maskedValueMap);

        // Check if this value has already been added to the map
        let key = existingEntries.find(
          (existingKey) => accumulator.maskedValueMap[existingKey] === address,
        );

        // If it hasn't, create a new key
        if (!key) {
          key = `address_${existingEntries.length + 1}`;
          accumulator.maskedValueMap[key] = address;
        }

        // Use put '<>' around the value when we replace it in the text
        //  but not in the map
        const replacement = `<${key}>`;
        accumulator.updatedResult = accumulator.updatedResult.replace(
          address,
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
