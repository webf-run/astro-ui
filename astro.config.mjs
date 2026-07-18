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
      head: [
        {
          tag: 'script',

          attrs: {
            type: 'importmap',
          },
          content: JSON.stringify({
            imports: {
              'astro/runtime/server/index.js': '/play/astro-runtime.js',
              '@webf/astro-ui': '/play/astro-ui.lib.js',
            },
          }),
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
      alias: {},
    },
    optimizeDeps: {
      exclude: ['@astrojs/compiler'],
      include: ['esbuild-wasm'],
    },
  },
});
