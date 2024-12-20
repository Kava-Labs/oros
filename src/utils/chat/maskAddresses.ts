import { TestCase } from './tokenAddressMaskingCases';

type AddressAccumulator = {
  updatedResult: string;
  maskedValueMap: { [key: string]: string };
};

export const maskAddresses = (testCase: TestCase) => {
  //  find exactly 40 characters after '0x' (inclusive)
  const ethAddressRegex = /0x[a-fA-F0-9]{40}(?!0)/g;

  const addressesToReplace = Array.from(
    testCase.input.matchAll(ethAddressRegex),
  );

  const { updatedResult, maskedValueMap } =
    addressesToReplace.reduce<AddressAccumulator>(
      (accumulator, addressMatch) => {
        const address = addressMatch[0]; // The first element in the array is the match

        const existingEntries = Object.keys(accumulator.maskedValueMap);

        //  check if this value has already been added to the map
        //  if it has, we will use the same masked value
        let replacement = existingEntries.find(
          (key) => accumulator.maskedValueMap[key] === address,
        );

        // If it hasn't create a new one
        if (!replacement) {
          replacement = `<address_${existingEntries.length + 1}>`;
          accumulator.maskedValueMap[replacement] = address;
        }

        //  rebuild the user message with the replacements
        accumulator.updatedResult = accumulator.updatedResult.replace(
          address,
          replacement,
        );

        //  build the map of replacements to values
        accumulator.maskedValueMap[replacement] = address;

        return accumulator;
      },
      {
        updatedResult: testCase.input,
        maskedValueMap: {},
      },
    );

  return {
    output: updatedResult,
    maskedValueMap,
  };
};
