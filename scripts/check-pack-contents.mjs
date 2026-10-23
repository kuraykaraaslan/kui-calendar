#!/usr/bin/env node
// A source map carries the original source (`sourcesContent`), comments included, so a published map hands out the
// code as it is written. No build of this package emits one (every vite config says `sourcemap: false`,
// tsconfig.lib.json says `declarationMap: false`) and `files` leaves any stray map out. This asks npm what the tarball
// would hold and fails on a map, so the check sees what a publish would really send. `prepublishOnly` runs it after
// the build.
//
//   node scripts/check-pack-contents.mjs
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Paths a published tarball must never hold: source maps of any kind. */
export const FORBIDDEN = [/\.map$/];

/** The paths of a tarball listing that match a forbidden pattern. */
export function forbiddenFiles(paths) {
  return paths.filter((p) => FORBIDDEN.some((re) => re.test(p)));
}

/** Whether a build config turns a source map or a declaration map on (`true`, "inline" or "hidden"). */
export function mapsEnabled(configText) {
  return /\bsourcemap\s*:\s*(true|["'](inline|hidden)["'])/.test(configText) || /"declarationMap"\s*:\s*true/.test(configText);
}

/** The file list `npm pack` would publish, without running any lifecycle script. */
export function packedFiles(cwd) {
  const out = execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const [entry] = JSON.parse(out);
  return entry.files.map((f) => f.path);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const files = packedFiles(root);
  const bad = forbiddenFiles(files);
  if (bad.length) {
    console.error(`check-pack-contents: the tarball would publish ${bad.length} source map(s):\n  ${bad.slice(0, 20).join('\n  ')}`);
    process.exit(1);
  }
  console.log(`check-pack-contents: ${files.length} files, no source map.`);
}
