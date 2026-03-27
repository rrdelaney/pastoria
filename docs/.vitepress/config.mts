import {defineConfig} from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Pastoria',
  description:
    'A full-stack React framework for building data-driven apps with Relay, powered by Vite.',
  head: [['link', {rel: 'icon', type: 'image/png', href: '/favicon.png'}]],
  vite: {configFile: false},
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [],
    sidebar: [],
    socialLinks: [
      {icon: 'github', link: 'https://github.com/rrdelaney/pastoria'},
    ],
    outline: {
      label: 'Documentation',
      level: 'deep',
    },
  },
});
