import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    {
        ignores: ['dist/**'],
    },
    js.configs.recommended,
    eslintConfigPrettier,
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                DOMPurify: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            'no-console': 'off',
        },
    },

    // api/ runs on Vercel's Node runtime, not in the browser.
    {
        files: ['api/**/*.js'],
        languageOptions: {
            globals: { ...globals.node },
            sourceType: 'module',
        },
    },

    // tools/ are Node scripts and the suite runs under Node (vitest + jsdom), so
    // both see Node globals as well as the browser ones. Without this, `npm run
    // lint` had exited 1 on `process` since the booking tools landed in 4.56.0.
    {
        files: ['tools/**/*.{js,mjs}', 'tests/**/*.js'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },
];
