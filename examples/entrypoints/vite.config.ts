import tailwindcss from '@tailwindcss/vite';
import {pastoria} from 'pastoria/vite';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), pastoria()],
});
