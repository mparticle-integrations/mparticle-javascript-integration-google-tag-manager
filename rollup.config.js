import base from './node_modules/@mparticle/web-kit-wrapper/rollup.base';

export default [
    {
        input: base.input,
        output: {
            ...base.output,
            format: 'iife',
            file: 'build/GoogleTagManager-Kit.js',
            name: 'mpGoogleTagManagerKit'
        },
        plugins: [...base.plugins]
    },
    {
        input: base.input,
        output: {
            ...base.output,
            format: 'iife',
            file: 'dist/GoogleTagManager-Kit.iife.js',
            name: 'mpGoogleTagManagerKit'
        },
        plugins: [...base.plugins]
    },
    {
        input: base.input,
        output: {
            ...base.output,
            format: 'cjs',
            file: 'dist/GoogleTagManager-Kit.common.js',
            name: 'mpGoogleTagManagerKit'
        },
        plugins: [...base.plugins]
    }
];
