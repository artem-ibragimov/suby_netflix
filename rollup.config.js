import nodeResolve from '@rollup/plugin-node-resolve';
import commonJs from '@rollup/plugin-commonjs';
import typeScript from '@rollup/plugin-typescript';
const output = { dir: 'bin', format: 'cjs' };
const plugins = [
    nodeResolve(),
    commonJs(),
    typeScript({ tsconfig: "tsconfig.json" }),
];

export default [{
    input: ['src/page/options.ts'],
    output,
    plugins
}, {
    input: ['src/background.ts', 'src/main.ts'],
    output,
    plugins
}];