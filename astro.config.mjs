import path from 'node:path';

import solid from '@astrojs/solid-js';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  srcDir: './site',
  publicDir: './public',
  outDir: './dist',

  integrations: [
    solid(),
    starlight({
      title: '@webf/astro-ui',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/webf-run/astro-ui',
        },
      ],
      components: {
        Header: './site/components/starlight/Header.astro',
      },

      customCss: ['./site/styles/custom.css'],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            {
              label: 'Installation',
              slug: 'getting-started/installation',
            },
          ],
        },
        {
          label: 'Components',
          items: [
            {
              label: 'Button',
              slug: 'components/button',
            },
            { label: 'Navbar', slug: 'components/navbar' },
          ],
        },
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['lucide-astro'],
    },
    server: {
      watch: {
        ignored: ['**/.playground-tmp/**'],
      },
    },
    resolve: {
      alias: {
        '@astrojs/compiler/browser': path.resolve(
          './node_modules/@astrojs/compiler/dist/browser/index.js'
        ),
      },
    },
    optimizeDeps: {
      exclude: ['@astrojs/compiler'],
      include: ['esbuild-wasm'],
    },
  },
});
