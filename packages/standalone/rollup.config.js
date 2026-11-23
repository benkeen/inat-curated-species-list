import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
// import { visualizer } from 'rollup-plugin-visualizer';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/index.tsx',
  output: {
    file: 'generated/inat-curated-species-list-standalone.js',
    format: 'iife',
  },
  plugins: [
    resolve({ dedupe: ['react', 'react-dom'] }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    typescript(),
    commonjs(),
    terser(),
    //visualizer(),
  ],
};
