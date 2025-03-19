import path from 'path';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';

export default {
    input: {
        application: 'src/Application.js', // Main application entry
        AppServiceProvider: 'src/providers/AppServiceProvider.js', // Include provider separately
    },
    output: {
        dir: 'dist',
        format: 'esm', // Ensures ES module compatibility
        entryFileNames: '[name].js', // Generates files with same names as input
        chunkFileNames: '[name]-[hash].js',
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        esbuild()
    ],
    external: [], // Ensure external dependencies are handled correctly
};