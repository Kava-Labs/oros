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
        updatedResult: testCase.input,
        maskedValueMap: {},
      },
    );

  return {
    output: updatedResult,
    maskedValueMap,
  };
};
