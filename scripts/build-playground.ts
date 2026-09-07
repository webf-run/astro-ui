import fs from 'node:fs/promises';
import path from 'node:path';

import { transform } from '@astrojs/compiler';
import * as esbuild from 'esbuild-wasm';
import type { Plugin } from 'esbuild-wasm';

// Builds the static browser assets required by the in-browser Astro playground:
//
// public/play/astro-runtime.js
//   Minimal browser runtime used by compiled Astro components.
//
// public/play/astro-ui.lib.js
//   Browser-ready @webf/astro-ui library. Astro components are precompiled
//   with the real @astrojs/compiler and bundled with esbuild.
//
// public/play/astro.wasm
//   Official Astro compiler WASM binary.
//
// public/play/esbuild.wasm
//   Esbuild WASM binary used by the browser playground.

const root = process.cwd();

const libEntry = path.resolve(root, './lib/index.ts');
const outDir = path.resolve(root, 'public/play');

const ASTRO_RUNTIME_BROWSER_PATH = '/play/astro-runtime.js';

/**
 * Every bare specifier that compiled .astro output (or a dependency's own
 * precompiled .astro/.ts, e.g. @lucide/astro's createLucideIcon.ts) may use
 * to reach Astro's server runtime.
 *
 * IMPORTANT: 'astro/runtime/server/index.js' is not the only one. Newer
 * @lucide/astro versions import their render/createComponent/renderComponent
 * helpers from 'astro/compiler-runtime' instead. If a specifier here is
 * missing, esbuild won't treat it as external and will bundle Astro's real,
 * full server runtime (zod, client-directive validation, etc.) straight into
 * astro-ui.lib.js. That real runtime's `renderComponent` expects a full
 * `result` object (e.g. `result.clientDirectives`) that our minimal
 * playground `createResult()` in Runtime.mjs doesn't provide, which throws
 * "Cannot read properties of undefined (reading 'keys')" the moment an
 * affected component (any block that renders an <Icon>, like StatCard,
 * FeatureCard, PlacementStatCard) is mounted in the live editor.
 */
const ASTRO_RUNTIME_SPECIFIERS = [
  'astro/runtime/server/index.js',
  'astro/compiler-runtime',
];

/**
 * Rewrites the Astro server-runtime import emitted by the Astro compiler
 * to the browser runtime served by the playground.
 *
 * The compiled library is eventually loaded from a Blob URL in the browser.
 * Therefore we cannot rely on normal Vite/Node module resolution here.
 * Using an absolute browser URL makes the runtime resolution deterministic.
 */
function rewriteRuntimeImport(code: string): string {
  const runtimeUrl = JSON.stringify(ASTRO_RUNTIME_BROWSER_PATH);

  return ASTRO_RUNTIME_SPECIFIERS.reduce(
    (acc, specifier) =>
      acc
        .replaceAll(JSON.stringify(specifier), runtimeUrl)
        .replaceAll(`'${specifier}'`, runtimeUrl),
    code
  );
}

async function buildRuntime() {
  const entry = path.resolve(root, 'site/playground/Runtime.mjs');

  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    write: false,
  });

  const output = result.outputFiles?.[0];

  if (!output) {
    throw new Error('[playground] Runtime build produced no output.');
  }

  await fs.writeFile(
    path.join(outDir, 'astro-runtime.js'),
    output.text,
    'utf8'
  );
}

async function buildLibrary() {
  /**
   * Precompile .astro source files with the real Astro compiler.
   *
   * This allows the browser playground to consume the component library
   * without needing a full Astro/Vite build inside the browser.
   */
  const astroCompilerPlugin: Plugin = {
    name: 'astro-compiler',

    setup(build) {
      build.onLoad({ filter: /\.astro$/ }, async (args) => {
        const source = await fs.readFile(args.path, 'utf8');

        const { code, diagnostics } = await transform(source, {
          sourcemap: false,

          /*
           * Keep the original specifier in the generated code.
           *
           * The Astro runtime is handled separately below and rewritten
           * to /play/astro-runtime.js after esbuild finishes.
           */
          resolvePath: async (specifier) => specifier,
        });

        const fatal =
          diagnostics?.filter((diagnostic) => diagnostic.severity === 1) ?? [];

        if (fatal.length) {
          return {
            errors: fatal.map((diagnostic) => ({
              text: diagnostic.text,
              location: null,
            })),
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

  const result = await esbuild.build({
    entryPoints: [libEntry],

    bundle: true,

    format: 'esm',

    platform: 'browser',

    target: 'es2020',

    write: false,

    /**
     * Do not bundle Astro's server runtime.
     *
     * The browser playground has its own minimal runtime implementation
     * in site/playground/Runtime.mjs.
     *
     * We rewrite these imports to /play/astro-runtime.js after bundling.
     * See ASTRO_RUNTIME_SPECIFIERS above for why there's more than one.
     */
    external: ASTRO_RUNTIME_SPECIFIERS,

    plugins: [astroCompilerPlugin],

    loader: {
      '.ts': 'ts',
    },
  });

  const output = result.outputFiles?.[0];

  if (!output) {
    throw new Error('[playground] Astro UI library build produced no output.');
  }

  /**
   * IMPORTANT:
   *
   * esbuild leaves the Astro runtime external because of the `external`
   * configuration above.
   *
   * The generated browser module cannot resolve:
   *
   *   astro/runtime/server/index.js
   *
   * when it is imported from a Blob URL.
   *
   * Rewrite it to the runtime asset generated by buildRuntime().
   */
  const browserLibraryCode = rewriteRuntimeImport(output.text);

  await fs.writeFile(
    path.join(outDir, 'astro-ui.lib.js'),
    browserLibraryCode,
    'utf8'
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
  await fs.mkdir(outDir, {
    recursive: true,
  });

  console.log('[playground] building browser runtime...');

  await buildRuntime();

  console.log('[playground] building Astro UI library...');

  await buildLibrary();

  console.log('[playground] copying WASM binaries...');

  await copyWasmBinaries();

  await esbuild.stop?.();

  console.log(
    '[playground] built public/play/{astro-runtime.js,astro-ui.lib.js,astro.wasm,esbuild.wasm}'
  );
}

main().catch((error) => {
  console.error('[playground] build failed:', error);

  process.exit(1);
});
