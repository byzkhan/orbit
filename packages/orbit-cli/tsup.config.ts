import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['../../src/cli/index.ts'],
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: false,
  // Native modules and large deps stay external (installed via package.json)
  external: ['better-sqlite3', 'electron'],
  // Resolve the @shared path alias
  esbuildOptions(options) {
    options.alias = {
      '@shared': '../../src/shared',
    }
  },
  banner: {
    // Need createRequire for native modules in ESM
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
})
