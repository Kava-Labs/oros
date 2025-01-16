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
});
