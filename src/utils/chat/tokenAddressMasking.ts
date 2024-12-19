import { TestCase } from './tokenAddressMaskingCases';

type AddressAccumulator = {
  updatedResult: string;
  maskedValueMap: { [key: string]: string };
};

export const tokenAddressMasking = (testCase: TestCase) => {
  //  find exactly 40 characters after '0x' (inclusive)
  const ethAddressRegex = /0x[a-fA-F0-9]{40}(?!0)/g;

  const addressesToReplace = Array.from(
    testCase.input.matchAll(ethAddressRegex),
  );

  const { updatedResult, maskedValueMap } =
    addressesToReplace.reduce<AddressAccumulator>(
      (accumulator, addressMatch, i) => {
        const address = addressMatch[0]; // The first element in the array is the match
        const replacement = `<address_${i + 1}>`;

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
