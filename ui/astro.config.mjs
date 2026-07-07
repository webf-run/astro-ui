import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
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
        Header: './src/components/starlight/Header.astro',
      },

      customCss: ['./src/styles/custom.css'],
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
    ssr: {
      noExternal: ['lucide-astro'],
    },
  },
});
