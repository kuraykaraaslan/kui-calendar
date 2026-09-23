import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);

/*
 * Pin the process timezone to one that observes DST. The date math is all
 * local-time based, so a suite that runs in UTC (as CI usually does) can never
 * catch a 23- or 25-hour day. America/New_York in 2026: clocks spring forward
 * on 8 March and fall back on 1 November. Set here, before the test workers
 * are spawned, so every worker inherits it.
 */
process.env.TZ = 'America/New_York';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Same collision the demo config works around: the repo's top-level
    // ./react folder must never shadow the npm `react` package.
    alias: [
      { find: /^react$/, replacement: require.resolve('react') },
      { find: /^react-dom$/, replacement: require.resolve('react-dom') },
      { find: '@', replacement: resolve(import.meta.dirname, '.') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/{unit,component}/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['modules/**/*.ts', 'react/**/*.{ts,tsx}', 'libs/**/*.ts'],
      exclude: [
        // Re-export barrels and type-only modules: no logic to cover.
        'modules/index.ts',
        'react/index.ts',
        'modules/calendar/calendar.types.ts',
      ],
      // A few points under what the suite measured when it was written
      // (94.0 stmts / 86.9 branches / 97.3 funcs / 96.7 lines), not an
      // aspirational target. Raise them when a change genuinely lifts them.
      thresholds: { statements: 90, branches: 82, functions: 93, lines: 92 },
    },
  },
});
