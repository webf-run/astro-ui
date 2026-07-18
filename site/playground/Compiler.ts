import { initialize, transform } from '@astrojs/compiler';
import * as esbuild from 'esbuild-wasm';

/**
 * In-browser compile + render pipeline for the docs playground.
 *
 * Everything here runs on the client, no server round trip:
 * - `@astrojs/compiler` (the official Astro compiler, compiled to WASM) turns the user's `.astro` source into a JS/TS module.
 * - `esbuild-wasm` strips the leftover TypeScript syntax the compiler output still contains (interfaces, `Astro.props` type params, etc.).
 * - The result is loaded as a real ES module via a Blob URL.
 * - Its bare imports ("astro/runtime/server/index.js" and "@webf/astro-ui") are resolved through a browser `importmap` that we inject at runtime.
 */

const compileReadyP = initialize({
  wasmURL: '/play/astro.wasm',
});

const esbuildReadyP = esbuild.initialize({
  wasmURL: '/play/esbuild.wasm',
  worker: false,
});

function getRuntime() {
  const runtime = 'astro/runtime/server/index.js';

  return import(/* @vite-ignore */ runtime);
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
    await compileReadyP;

    const { code, diagnostics } = await transform(source, {
      sourcemap: false,
    });

    const fatal = diagnostics?.filter((d: any) => d.severity === 1) ?? [];

    if (fatal.length) {
      return { error: fatal.map((d: any) => d.text).join('\n') };
    }

    await esbuildReadyP;

    const stripped = await esbuild.transform(code, {
      loader: 'ts',
      format: 'esm',
      target: 'esnext',
    });

    return {
      code: stripped.code,
    };
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
