import base from './node_modules/@mparticle/web-kit-wrapper/rollup.base';

export default [
    {
        input: base.input,
        output: {
            ...base.output,
            file: 'build/GoogleTagManager-Kit.js',
            name: 'mp-google-tag-manager-kit'
        },
        plugins: [...base.plugins]
    }
];
