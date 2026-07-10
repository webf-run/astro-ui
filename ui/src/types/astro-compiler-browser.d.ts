/**
 * @astrojs/compiler's package.json doesn't declare "./browser" as an
 * export subpath (only "." with a "browser" condition) - astro.config.mjs
 * works around that at bundle time with a vite.resolve.alias pointing
 * "@astrojs/compiler/browser" straight at
 * node_modules/@astrojs/compiler/dist/browser/index.js. TypeScript
 * doesn't know about that alias, so without this declaration it reports
 * "Cannot find module '@astrojs/compiler/browser'" (ts(2307)) even
 * though the import resolves fine at runtime.
 *
 * Kept in sync with node_modules/@astrojs/compiler/dist/browser/index.d.ts
 */
declare module '@astrojs/compiler/browser' {
  export * from '@astrojs/compiler/types';

  export function initialize(options: { wasmURL: string }): Promise<void>;
  export function teardown(): void;
}
