import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-ignore plain-JS script, no declarations
import { forbiddenFiles, mapsEnabled, missingFiles } from '../../scripts/check-pack-contents.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const configs = readdirSync(root).filter((f) => /^(vite\.config.*\.ts|tsconfig.*\.json)$/.test(f));

describe('check-pack-contents', () => {
  it('flags source maps and declaration maps, and nothing else', () => {
    expect(forbiddenFiles(['dist/index.js', 'dist/index.js.map', 'dist/types/index.d.ts.map', 'README.md'])).toEqual(['dist/index.js.map', 'dist/types/index.d.ts.map']);
  });

  it('asks for the LICENSE and the NOTICE the Apache License wants a copy to keep', () => {
    expect(missingFiles(['LICENSE', 'NOTICE', 'dist/index.js'])).toEqual([]);
    expect(missingFiles(['LICENSE', 'dist/index.js'])).toEqual(['NOTICE']);
  });

  it('reads a map setting in any of its forms', () => {
    expect(mapsEnabled('build: { sourcemap: true }')).toBe(true);
    expect(mapsEnabled("build: { sourcemap: 'hidden' }")).toBe(true);
    expect(mapsEnabled('{ "declarationMap": true }')).toBe(true);
    expect(mapsEnabled('build: { sourcemap: false }')).toBe(false);
  });

  it('no build config of the package turns a map on', () => {
    expect(configs.length).toBeGreaterThan(2); // the walk really found the configs
    expect(configs.filter((f) => mapsEnabled(readFileSync(join(root, f), 'utf8')))).toEqual([]);
  });

  it('package.json leaves every map out of `files` and checks the tarball before a publish', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { files: string[]; scripts: Record<string, string> };
    expect(pkg.files).toContain('!dist/**/*.map');
    expect(pkg.scripts.prepublishOnly).toContain('check-pack-contents.mjs');
  });
});
