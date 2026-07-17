/**
 * In-browser compile + render pipeline for the docs playground.
 *
 * Everything here runs on the client, no server round trip:
 *
 *   1. `@astrojs/compiler` (the real, official Astro compiler, compiled to
 *      WASM - https://github.com/withastro/compiler) turns the user's
 *      `.astro` source into a JS/TS module.
 *   2. `esbuild-wasm` strips the leftover TypeScript syntax the compiler
 *      output still contains (interfaces, `Astro.props` type params, ...).
 *   3. The result is loaded as a real ES module via a Blob URL.
 *   4. Its bare imports ("astro/runtime/server/index.js" and
 *      "@webf/astro-ui") are resolved through a browser import map that
 *      we build and inject *at runtime*, pointing at Blob URLs for
 *      public/play/astro-runtime.js and public/play/astro-ui.lib.js
 *      (both produced by scripts/build-playground.mjs).
 *
 * WHY BLOB URLS INSTEAD OF JUST POINTING THE IMPORT MAP AT /play/*.js
 * ---------------------------------------------------------------------
 * Astro/Vite's dev server explicitly refuses to serve files under
 * `public/` through its ES module `import()` machinery ("This file is in
 * /public and will be copied as-is ... should not be imported from
 * source code"). That guard only exists in `astro dev` - a production
 * build just copies `public/` into `dist/` and serves it as plain static
 * files, so it would work there - but relying on dev/prod behaving
 * differently is asking for trouble. `fetch()` isn't subject to that
 * guard (it isn't part of Vite's import-analysis pipeline), so we fetch
 * the two files as text ourselves and hand the browser Blob URLs
 * instead. This works identically in dev and prod, and it's the same
 * Blob URL technique already used below to load compiled playground
 * snippets.
 */

const RUNTIME_URL = '/play/astro-runtime.js';
const LIB_URL = '/play/astro-ui.lib.js';

interface ImportMapUrls {
  runtimeBlobUrl: string;
  libBlobUrl: string;
}

let compilerPromise: Promise<
  typeof import('@astrojs/compiler/browser')
> | null = null;
let esbuildInitPromise: Promise<typeof import('esbuild-wasm')> | null = null;
let importMapPromise: Promise<ImportMapUrls> | null = null;
let runtimePromise: Promise<any> | null = null;

async function getCompiler() {
  if (!compilerPromise) {
    compilerPromise = (async () => {
      const compiler = await import('@astrojs/compiler/browser');
      // A plain fetch(), not an import() - not affected by the /public
      // import guard described above.
      await compiler.initialize({ wasmURL: '/play/astro.wasm' });
      return compiler;
    })();
  }
  return compilerPromise;
}

async function getEsbuild() {
  if (!esbuildInitPromise) {
    esbuildInitPromise = (async () => {
      const esbuild = await import('esbuild-wasm');
      await esbuild.initialize({ wasmURL: '/play/esbuild.wasm' });
      return esbuild;
    })();
  }
  return esbuildInitPromise;
}

/** Fetches the runtime + library bundles as text, turns them into Blob
 * URLs, and injects a browser import map pointing at those Blob URLs -
 * once. Must resolve before anything imports "astro/runtime/server/index.js"
 * or "@webf/astro-ui". */
async function ensureImportMap(): Promise<ImportMapUrls> {
  if (!importMapPromise) {
    importMapPromise = (async () => {
      const [runtimeCode, libCode] = await Promise.all([
        fetch(RUNTIME_URL).then((res) => {
          if (!res.ok)
            throw new Error(`Couldn't load ${RUNTIME_URL} (${res.status})`);
          return res.text();
        }),
        fetch(LIB_URL).then((res) => {
          if (!res.ok)
            throw new Error(`Couldn't load ${LIB_URL} (${res.status})`);
          return res.text();
        }),
      ]);

      const runtimeBlobUrl = URL.createObjectURL(
        new Blob([runtimeCode], { type: 'text/javascript' })
      );
      const libBlobUrl = URL.createObjectURL(
        new Blob([libCode], { type: 'text/javascript' })
      );

      const mapEl = document.createElement('script');
      mapEl.type = 'importmap';
      mapEl.textContent = JSON.stringify({
        imports: {
          'astro/runtime/server/index.js': runtimeBlobUrl,
          '@webf/astro-ui': libBlobUrl,
        },
      });
      document.head.appendChild(mapEl);

      return { runtimeBlobUrl, libBlobUrl };
    })();
  }
  return importMapPromise;
}

function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = ensureImportMap().then(
      ({ runtimeBlobUrl }) => import(/* @vite-ignore */ runtimeBlobUrl)
    );
  }
  return runtimePromise;
}

export interface CompileResult {
  code?: string;
  error?: string;
}

/** Astro source -> a plain JS ES module string, ready to be imported. */
export async function compileAstroSource(
  source: string
): Promise<CompileResult> {
  try {
    const compiler = await getCompiler();
    const { code, diagnostics } = await compiler.transform(source, {
      sourcemap: false,
    });

    const fatal = diagnostics?.filter((d: any) => d.severity === 1) ?? [];
    if (fatal.length) {
      return { error: fatal.map((d: any) => d.text).join('\n') };
    }

    const esbuild = await getEsbuild();
    const stripped = await esbuild.transform(code, {
      loader: 'ts',
      format: 'esm',
      target: 'esnext',
    });

    return { code: stripped.code };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export interface RenderResult {
  html?: string;
  error?: string;
}

/** A compiled module string -> rendered HTML for the preview iframe. */
export async function renderCompiledModule(
  code: string
): Promise<RenderResult> {
  let objectUrl: string | undefined;
  try {
    // Make sure the import map (and therefore the runtime) is ready
    // before importing anything that might reference those specifiers.
    await ensureImportMap();
    const runtime = await getRuntime();

    const blob = new Blob([code], { type: 'text/javascript' });
    objectUrl = URL.createObjectURL(blob);
    const mod = await import(/* @vite-ignore */ objectUrl);

    if (typeof mod.default !== 'function') {
      return { error: 'This snippet has no default export to render.' };
    }

    const html = await runtime.renderComponentToStaticHTML(mod.default, {}, {});
    return { html };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

/** Compile + render in one call - what the playground UI actually uses. */
export async function runAstroSource(source: string): Promise<RenderResult> {
  const compiled = await compileAstroSource(source);
  if (compiled.error || !compiled.code) {
    return { error: compiled.error ?? 'Compilation produced no output.' };
  }
  return renderCompiledModule(compiled.code);
}
