import { enforceLineBreak } from './helpers';

describe('enforceLineBreak', () => {
  test('breaks up a long string', () => {
    const input = 'A'.repeat(46);
    const result = enforceLineBreak(input);
    expect(result).toBe(`${'A'.repeat(45)}<br>A`);
  });
  test('shorter strings remain intact', () => {
    const input = 'A'.repeat(45);
    const result = enforceLineBreak(input);
    expect(result).toBe(input);
  });
});
