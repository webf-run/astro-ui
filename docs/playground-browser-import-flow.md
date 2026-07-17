# Interactive playground for Astro

This note explains how we make interactive Astro playground for our site that completely runs in the browser:

## Quick flow

1. The user clicks Run in the docs playground UI.
2. The snippet is compiled in the browser with Astro WASM.
3. Remaining TypeScript syntax is stripped with esbuild WASM.
4. The playground injects an import map that maps @webf/astro-ui to a Blob URL.
5. The compiled snippet is imported as a Blob module and rendered to HTML.
6. HTML is written into the preview iframe.

## At build time

- The standalone library is compile using `build-playground.ts` script.
- This script build Astro library as pure JS code and bundles using ESBuild.

## At runtime

TODO.

## Where the import is resolved

The browser resolves @webf/astro-ui through an import map created at runtime in:

- [site/playground/compile.ts](../site/playground/compile.ts)

That file:

- fetches /play/astro-ui.lib.js
- creates a Blob URL from it
- injects a script type="importmap" with:
  - @webf/astro-ui -> blob:...
  - astro/runtime/server/index.js -> blob:...

So the snippet keeps a normal bare import, and the browser maps it at module-load time.

## Where /play/astro-ui.lib.js comes from

It is generated before dev/build by:

- [scripts/build-playground.ts](../scripts/build-playground.ts)
- [package.json](../package.json)

The build script bundles the library entry from:

- [lib/index.ts](../lib/index.ts)

and writes browser assets to public/play.

## Why Blob URLs are used

In dev, direct module import behavior for files under public can be tricky with Vite import analysis.
The playground avoids that by fetching the files as text and converting them to Blob module URLs.
This keeps behavior consistent between dev and production.
