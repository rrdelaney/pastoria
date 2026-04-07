import {defineConfig} from 'vitepress';

const siteUrl = 'https://pastoria.org';
const siteTitle = 'Pastoria';
const siteDescription = `A full-stack React framework for building data-driven apps with Relay, powered by Vite.`;
const ogImage = `${siteUrl}/og_image.png`;

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: siteTitle,
  description: siteDescription,
  sitemap: {hostname: siteUrl},
  head: [
    ['link', {rel: 'icon', type: 'image/png', href: '/favicon.png'}],
    ['meta', {property: 'og:type', content: 'website'}],
    ['meta', {property: 'og:url', content: siteUrl}],
    ['meta', {property: 'og:title', content: siteTitle}],
    ['meta', {property: 'og:description', content: siteDescription}],
    ['meta', {property: 'og:image', content: ogImage}],
    ['meta', {property: 'og:image:width', content: '1216'}],
    ['meta', {property: 'og:image:height', content: '574'}],
    ['meta', {name: 'twitter:card', content: 'summary_large_image'}],
    ['meta', {name: 'twitter:url', content: siteUrl}],
    ['meta', {name: 'twitter:title', content: siteTitle}],
    ['meta', {name: 'twitter:description', content: siteDescription}],
    ['meta', {name: 'twitter:image', content: ogImage}],
  ],
  vite: {configFile: false},
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {src: '/favicon.png'},
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
