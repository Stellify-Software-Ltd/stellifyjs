import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';

export default {
  input: {
    Application: 'src/Application.js',
    AppServiceProvider: 'src/providers/AppServiceProvider.js',
    ValidationServiceProvider: 'src/providers/AppServiceProvider.js'
  },
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].js', // Keeps correct filenames
    chunkFileNames: '[name].js', // Prevents renaming
    preserveModules: true, // ✅ Prevents Rollup from merging modules
    exports: 'named' // ✅ Keeps named exports
  },
  plugins: [
    resolve(),
    commonjs(),
    esbuild({ minify: false }) // ✅ Prevents renaming of exports
  ]
};
