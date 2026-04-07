import {defineConfig} from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      dev: {command: 'vitepress dev'},
      build: {command: 'vitepress build'},
      preview: {command: 'vitepress preview'},
    },
  },
});
