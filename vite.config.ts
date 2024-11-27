/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    setupFiles: './vitestSetup.ts',
    exclude: [...configDefaults.exclude, "e2e"],
  },
    define: {
      //  define this env variable without the VITE_ prefix
      //  so OpenAI() can find that value without explicitly defining it each time
      //  https://vite.dev/config/shared-options.html#envprefix
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY)    }
})
