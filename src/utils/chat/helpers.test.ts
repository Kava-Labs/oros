import { enforceLineBreak } from './helpers';

describe('enforceLineBreak', () => {
  test('breaks up a long string', () => {
    const input = 'A'.repeat(120);
    const result = enforceLineBreak(input);
    expect(result).toBe(
      `${'A'.repeat(45)}<br>${'A'.repeat(45)}<br>${'A'.repeat(30)}`,
    );
  });
  test('shorter strings remain intact', () => {
    const input = 'A'.repeat(45);
    const result = enforceLineBreak(input);
    expect(result).toBe(input);
  });
  test('long markdown links remain intact', () => {
    const input =
      '[here](https://www.mintscan.io/kava/tx/9492F63D1BBFCAE137A56063C75B27B5A81E8985A4940714173BE06D6562289A)';
    const result = enforceLineBreak(input);
    expect(result).toBe(input);
  });
});
