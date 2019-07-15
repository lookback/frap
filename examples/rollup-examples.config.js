import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import bundleSize from 'rollup-plugin-bundle-size';

const env = process.env.NODE_ENV || 'development';

export default {
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    resolve({
      browser: true,
    }),
    commonjs({
      namedExports: {
        'node_modules/react/index.js': [
          'Children',
          'Component',
          'PropTypes',
          'createElement',
          'useState',
          'useEffect',
          'useCallback',
        ],
        'node_modules/react-dom/index.js': ['render'],
      },
    }),
    bundleSize(),
  ],
};
