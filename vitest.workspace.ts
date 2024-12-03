import { configDefaults, defineWorkspace } from 'vitest/config';
import react from '@vitejs/plugin-react';

//  https://vitest.dev/guide/workspace
export default defineWorkspace([
  {
    plugins: [react()],
    test: {
      name: 'Unit tests',
      root: './src',
      include: ['**/*.test.{ts,tsx}'],
      environment: "jsdom",
      setupFiles: './vitestSetup.ts',
      exclude: [...configDefaults.exclude, "e2e"],
    }
  },
  {
    test: {
      name: 'Integration tests',
      root: './tests',
      include: ['**/*.test.ts'],
      environment: 'node',
    }
  }
])
