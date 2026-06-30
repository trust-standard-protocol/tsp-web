import { defineConfig } from 'astro/config';

// Canonical public site for the Trust Standard Protocol.
// Boring, old, stable, agent-readable: static output, no UI framework,
// one tokenized stylesheet, interactivity as small vanilla-TS islands.
export default defineConfig({
  site: 'https://truststandardprotocol.com',
  output: 'static',
  srcDir: './src',
  publicDir: './public',
  outDir: './dist',
  build: {
    inlineStylesheets: 'auto'
  },
  server: {
    host: '127.0.0.1',
    port: 4321
  }
});
