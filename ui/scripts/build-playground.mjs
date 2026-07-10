// Builds the static browser assets the in-browser Astro playground needs:
//
//   public/play/astro-runtime.js  - our minimal runtime (see
//                                    src/playground/runtime/astro-server-runtime.js)
//   public/play/astro-ui.lib.js   - @webf/astro-ui, precompiled from
//                                    .astro source with the REAL
//                                    @astrojs/compiler and bundled
//                                    with esbuild
//   public/play/astro.wasm        - the official Astro compiler's WASM
//                                    binary, served so the browser can
//                                    run it directly
//   public/play/esbuild.wasm      - esbuild's WASM binary, used
//                                    client-side to strip the
//                                    TypeScript left in the compiler's
//                                    output
//
// Run automatically before `dev`/`build` (see package.json). Re-run this
// any time @webf/astro-ui's source changes and you want the playground's
// copy of the library to pick it up.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { transform } from '@astrojs/compiler';
import * as esbuild from 'esbuild-wasm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(__dirname, '..');
const libEntry = path.resolve(uiRoot, '../lib/src/index.ts');
const outDir = path.resolve(uiRoot, 'public/play');

fs.mkdirSync(outDir, { recursive: true });

// esbuild plugin: whenever esbuild encounters a `.astro` file (either in
// the workspace or in a dependency like lucide-astro), run it through the
// official compiler's `transform()` first. The compiler's output is valid
// TS/JS that imports its runtime helpers from
// "astro/runtime/server/index.js" - we leave that import untouched
// (marked `external` below) so every compiled component, ours and the
// user's, shares the exact same runtime module in the browser.
const astroCompilerPlugin = {
  name: 'astro-compiler',
  setup(build) {
    build.onLoad({ filter: /\.astro$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');
      const { code, diagnostics } = await transform(source, {
        sourcemap: false,
        resolvePath: async (specifier) => specifier,
      });
      const fatal = diagnostics?.filter((d) => d.severity === 1) ?? [];
      if (fatal.length) {
        return {
          errors: fatal.map((d) => ({ text: d.text, location: null })),
        };
      }
      return {
        contents: code,
        loader: 'ts',
        resolveDir: path.dirname(args.path),
      };
    });
  },
};

async function buildRuntime() {
  const entry = path.resolve(uiRoot, 'src/playground/runtime/astro-runtime.js');
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
  });
  fs.writeFileSync(
    path.join(outDir, 'astro-runtime.js'),
    result.outputFiles[0].text
  );
}

async function buildLibrary() {
  const result = await esbuild.build({
    entryPoints: [libEntry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    // Shared with every compiled playground snippet via the import map in
    // the site's <head> - see the starlight().head config in astro.config.mjs
    external: ['astro/runtime/server/index.js'],
    plugins: [astroCompilerPlugin],
    loader: { '.ts': 'ts' },
  });
  fs.writeFileSync(
    path.join(outDir, 'astro-ui.lib.js'),
    result.outputFiles[0].text
  );
}

function copyWasmBinaries() {
  const compilerWasm = path.resolve(
    uiRoot,
    'node_modules/@astrojs/compiler/dist/astro.wasm'
  );
  const esbuildWasm = path.resolve(
    uiRoot,
    'node_modules/esbuild-wasm/esbuild.wasm'
  );
  fs.copyFileSync(compilerWasm, path.join(outDir, 'astro.wasm'));
  fs.copyFileSync(esbuildWasm, path.join(outDir, 'esbuild.wasm'));
}

async function main() {
  await buildRuntime();
  await buildLibrary();
  copyWasmBinaries();
  await esbuild.stop?.();
  console.log(
    '[playground] built public/play/{astro-runtime.js,astro-ui.lib.js,astro.wasm,esbuild.wasm}'
  );
}

main().catch((err) => {
  console.error('[playground] build failed:', err);
  process.exit(1);
});
