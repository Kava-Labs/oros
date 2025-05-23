import { configDefaults, defineWorkspace } from 'vitest/config';

//  https://vitest.dev/guide/workspace
export default defineWorkspace([
  {
    test: {
      name: 'Unit tests',
      root: './src',
      include: ['**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: './vitestSetup.ts',
      exclude: [...configDefaults.exclude, 'e2e'],
      globals: true,
    },
  },
  {
    test: {
      name: 'Integration tests',
      root: './tests',
      include: ['**/*.test.ts'],
      environment: 'node',
      globals: true,
    },
  },
]);
