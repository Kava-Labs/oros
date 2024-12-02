import { configDefaults, defineWorkspace } from 'vitest/config';
import react from '@vitejs/plugin-react';

//  https://vitest.dev/guide/workspace
export default defineWorkspace([
  {
    plugins: [react()],
    server: {
      port: 3000,
    },
    test: {
      name: 'Unit tests',
      root: './src',
      include: ['**/*.test.{ts,tsx}'],
      environment: "jsdom",
      setupFiles: './vitestSetup.ts',
      exclude: [...configDefaults.exclude, "e2e"],
    },
  },
  {
    server: {
      port: 5555,
    },
    test: {
      name: 'Integration tests',
      root: './tests',
      include: ['**/*.test.ts'],
      environment: 'node',
    },
    define: {
      //  define this env variable without the VITE_ prefix
      //  so OpenAI() can find that value without explicitly defining it each time
      //  https://vite.dev/config/shared-options.html#envprefix
      //  todo - helper to automate this transformation?
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY),
      'import.meta.env.PROXY_ENDPOINT': JSON.stringify(process.env.VITE_PROXY_ENDPOINT),
      'import.meta.env.BYPASS_PROXY': JSON.stringify(process.env.VITE_BYPASS_PROXY),
    }
  },
])
