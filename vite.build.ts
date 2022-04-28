const path = require('path');
import { defineConfig } from 'vite';
import dts from "vite-dts";
import react from '@vitejs/plugin-react';

const isExternal = (id: string) => !id.startsWith(".") && !path.isAbsolute(id);

// https://vitejs.dev/config/
export default defineConfig({
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: (format) => `bundle.${format}.js`,
    },
    rollupOptions: {
      external: isExternal,
    },
  },
  plugins: [react(), dts()],
});
