import { render } from 'solid-js/web';

import {
  Playground,
  type PlaygroundHandle,
  type PlaygroundProps,
} from './Playground';

/**
 * Mounts the interactive playground (editor + output iframe only, no
 * toolbar - that's owned permanently by ExampleBlock.astro) into `container`.
 *
 * This file is only ever reached via a dynamic `import()` from
 * ExampleBlock.astro's inline script (never a static import from anywhere
 * else). Vite/Rollup code-splits everything reachable from here - Solid,
 * CodeMirror, Compiler.ts, esbuild-wasm, and by extension astro.wasm /
 * esbuild.wasm - into a separate chunk that's fetched only the first time
 * this function is called on a given page.
 */
export function mountPlayground(
  container: HTMLElement,
  props: Omit<PlaygroundProps, 'onReady'>,
  onReady: (handle: PlaygroundHandle) => void
): () => void {
  const dispose = render(() => Playground({ ...props, onReady }), container);
  return dispose;
}
