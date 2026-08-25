import { initialize, transform } from '@astrojs/compiler';
import * as esbuild from 'esbuild-wasm';

/**
 * In-browser compile + render pipeline for the docs playground.
 *
 * The compiler and esbuild run in the browser. Compiled Astro modules are
 * loaded from a Blob URL, so their runtime/library imports are rewritten to
 * absolute browser URLs before the module is imported. This avoids relying
 * on an import map being applied to a Blob URL.
 */

const compileReadyP = initialize({
  wasmURL: '/play/astro.wasm',
});

const esbuildReadyP = esbuild.initialize({
  wasmURL: '/play/esbuild.wasm',
  worker: false,
});

const RUNTIME_SPECIFIER = 'astro/runtime/server/index.js';
const LIBRARY_SPECIFIER = '@webf/astro-ui';
const LUCIDE_SPECIFIERS = ['lucide-astro', '@lucide/astro'];

function browserAssetUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

/**
 * Resolve the imports emitted by @astrojs/compiler to browser assets.
 *
 * This is important because the compiled user's module is loaded from a Blob
 * URL. Using absolute URLs here makes the playground independent of import
 * map resolution for Blob modules.
 */
function resolveBrowserImports(code: string): string {
  const runtimeUrl = browserAssetUrl('/play/astro-runtime.js');
  const libraryUrl = browserAssetUrl('/play/astro-ui.lib.js');

  return code
    .replaceAll(`"${RUNTIME_SPECIFIER}"`, JSON.stringify(runtimeUrl))
    .replaceAll(`'${RUNTIME_SPECIFIER}'`, JSON.stringify(runtimeUrl))
    .replaceAll(`"${LIBRARY_SPECIFIER}"`, JSON.stringify(libraryUrl))
    .replaceAll(`'${LIBRARY_SPECIFIER}'`, JSON.stringify(libraryUrl))
    .replaceAll(`"${LUCIDE_SPECIFIERS[0]}"`, JSON.stringify(libraryUrl))
    .replaceAll(`'${LUCIDE_SPECIFIERS[0]}'`, JSON.stringify(libraryUrl))
    .replaceAll(`"${LUCIDE_SPECIFIERS[1]}"`, JSON.stringify(libraryUrl))
    .replaceAll(`'${LUCIDE_SPECIFIERS[1]}'`, JSON.stringify(libraryUrl));
}

async function getRuntime() {
  return import(/* @vite-ignore */ browserAssetUrl('/play/astro-runtime.js'));
}

export interface CompileResult {
  code?: string;
  error?: string;
}

/**
 * Astro source -> plain JavaScript ES module.
 */
export async function compileAstroSource(
  source: string
): Promise<CompileResult> {
  try {
    await compileReadyP;

    const { code, diagnostics } = await transform(source, {
      sourcemap: false,
    });

    const fatal = diagnostics?.filter((d: any) => d.severity === 1) ?? [];

    if (fatal.length) {
      return {
        error: fatal.map((d: any) => d.text).join('\n'),
      };
    }

    await esbuildReadyP;

    const stripped = await esbuild.transform(code, {
      loader: 'ts',
      format: 'esm',
      target: 'esnext',
    });

    return {
      code: resolveBrowserImports(stripped.code),
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface RenderResult {
  html?: string;
  error?: string;
}

/**
 * Compiled ES module -> rendered HTML.
 */
export async function renderCompiledModule(
  code: string
): Promise<RenderResult> {
  let objectUrl: string | undefined;

  try {
    const runtime = await getRuntime();

    const blob = new Blob([code], {
      type: 'text/javascript',
    });

    objectUrl = URL.createObjectURL(blob);

    const mod = await import(/* @vite-ignore */ objectUrl);

    if (typeof mod.default !== 'function') {
      return {
        error: 'This snippet has no default export to render.',
      };
    }

    const html = await runtime.renderComponentToStaticHTML(mod.default, {}, {});

    return {
      html,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

/**
 * Compile + render.
 */
export async function runAstroSource(source: string): Promise<RenderResult> {
  const compiled = await compileAstroSource(source);

  if (compiled.error || !compiled.code) {
    return {
      error: compiled.error ?? 'Compilation produced no output.',
    };
  }

  return renderCompiledModule(compiled.code);
}
