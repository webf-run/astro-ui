import fs from 'node:fs/promises';
import path from 'node:path';

import { transform } from '@astrojs/compiler';
import * as esbuild from 'esbuild-wasm';
import type { Plugin } from 'esbuild-wasm';

// Builds the static browser assets the in-browser Astro playground needs:
//
// public/play/astro-runtime.js - Our minimal runtime (src/playground/runtime/astro-server-runtime.js).
// public/play/astro-ui.lib.js  - @webf/astro-ui, precompiled from .astro source with the REAL @astrojs/compiler and bundled with esbuild.
// public/play/astro.wasm       - The official Astro compiler's WASM binary, served so the browser can run it directly.
// public/play/esbuild.wasm     - Esbuild's WASM binary, used client-side to strip the TypeScript left in the compiler's output.

const root = process.cwd();

const libEntry = path.resolve(root, './lib/index.ts');
const outDir = path.resolve(root, 'public/play');

async function buildRuntime() {
  const entry = path.resolve(root, 'site/playground/runtime/astro-runtime.js');

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
  });

  await fs.writeFile(
    path.join(outDir, 'astro-runtime.js'),
    result.outputFiles[0].text
  );
}

async function buildLibrary() {
  // This is an esbuild plugin that wraps the official Astro compiler to precompile .astro files in the library,
  // so we can ship them as JS/TS to the browser playground.
  const astroCompilerPlugin: Plugin = {
    name: 'astro-compiler',
    setup(build) {
      build.onLoad({ filter: /\.astro$/ }, async (args) => {
        const source = await fs.readFile(args.path, 'utf8');

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

  // Note: Keep the Astro runtime external import untouched
  // (marked `external` below) so every compiled component, ours and
  // the user's, shares the exact same runtime module in the browser.
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

  await fs.writeFile(
    path.join(outDir, 'astro-ui.lib.js'),
    result.outputFiles[0].text
  );
}

async function copyWasmBinaries() {
  const compilerWasm = path.resolve(
    root,
    'node_modules/@astrojs/compiler/dist/astro.wasm'
  );
  const esbuildWasm = path.resolve(
    root,
    'node_modules/esbuild-wasm/esbuild.wasm'
  );

  await fs.copyFile(compilerWasm, path.join(outDir, 'astro.wasm'));
  await fs.copyFile(esbuildWasm, path.join(outDir, 'esbuild.wasm'));
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });

  await buildRuntime();
  await buildLibrary();
  await copyWasmBinaries();

  await esbuild.stop?.();
  console.log(
    '[playground] built public/play/{astro-runtime.js,astro-ui.lib.js,astro.wasm,esbuild.wasm}'
  );
}

main().catch((err) => {
  console.error('[playground] build failed:', err);
  process.exit(1);
});
