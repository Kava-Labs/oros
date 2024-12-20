type AddressAccumulator = {
  updatedResult: string;
  masksToValues: Record<string, string>;
  valuesToMasks: Record<string, string>;
};

/**
 * Masks unique 0x addresses in a given message with placeholders (e.g., <address_1>, <address_2>, etc.).
 * If no addresses are found, the original input message is returned.
 *
 * @param {string} message - The input message potentially containing 0x addresses to be masked.
 * @param {Record<string, string>} [processedValuesToMasks={}] - An existing map of Ethereum addresses to their corresponding placeholder keys.
 * @param {Record<string, string>} [processedMasksToValues={}] - An existing map of placeholder keys to their corresponding Ethereum addresses.
 * @returns {Object} An object containing:
 *   - `output` {string}: The message with Ethereum addresses replaced by placeholders.
 *   - `masksToValues` {Record<string, string>}: A map where keys are placeholders (e.g., `<address_1>`) and values are the original 0x addresses.
 *   - `valuesToMasks` {Record<string, string>}: A map where keys are 0x addresses and values are their corresponding placeholders, the reverse of `masksToValues`
 */
export const maskAddresses = (
  message: string,
  processedValuesToMasks: Record<string, string>,
  processedMasksToValues: Record<string, string>,
) => {
  // Find exactly 40 characters after '0x' (inclusive)
  const ethAddressRegex = /0x[a-fA-F0-9]{40}(?!0)/g;

  const addressesToReplace = Array.from(message.matchAll(ethAddressRegex));

  const { updatedResult, masksToValues, valuesToMasks } =
    addressesToReplace.reduce<AddressAccumulator>(
      (accumulator, addressMatch) => {
        // Convert the matched address to lowercase
        const address = addressMatch[0].toLowerCase();

        // Check if the address has already been processed
        let mask = accumulator.valuesToMasks[address];

        // If not, create a new key for this address
        if (!mask) {
          const existingMasks = Object.keys(accumulator.masksToValues);
          mask = `address_${existingMasks.length + 1}`;
          //  build both maps with the new entry
          accumulator.masksToValues[mask] = address;
          accumulator.valuesToMasks[address] = mask;
        }

        // Create a replacement string with the mask
        const replacement = `<${mask}>`;

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
        //  start with the existing values
        masksToValues: { ...processedMasksToValues },
        valuesToMasks: { ...processedValuesToMasks },
      },
    );

  return {
    output: updatedResult,
    masksToValues,
    valuesToMasks,
  };
};
