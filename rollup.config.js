// import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import bundleSize from 'rollup-plugin-bundle-size';
import pkg from './package.json';

export default [
  {
    input: pkg.module,
    plugins: [resolve(), commonjs(), terser(), bundleSize()],
    output: [
      { file: pkg.unpkg, format: 'umd', name: pkg.name, sourcemap: 'inline' },
    ],
  },
];
