import { terser } from 'rollup-plugin-terser';
import { plugins as dev_plugins, output } from './rollup.config';

const plugins = dev_plugins.concat([terser()]);

export default [ {
   input: ['src/background.ts', 'src/main.ts'],
   output,
   plugins
}];