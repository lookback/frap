import defaultConfig from '../rollup-examples.config';

export default {
  ...defaultConfig,
  input: 'build/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'esm',
    sourcemap: true,
  },
};
