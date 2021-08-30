import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      formats: ['es', 'cjs'],
      entry: path.resolve(process.cwd(), 'src/mod.ts'),
      name: 'Dcosy',
      fileName: (format) => `chemin.${format}.js`,
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
  },
});
