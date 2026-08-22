import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        plugins: {
            '@stylistic': stylistic,
        },
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            '@stylistic/quotes': ['error', 'double', { avoidEscape: true }],
            '@stylistic/jsx-quotes': ['error', 'prefer-double'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/comma-dangle': ['error', 'never'],
            '@stylistic/arrow-parens': ['error', 'as-needed'],
            '@stylistic/brace-style': ['error', 'stroustrup'],
            '@stylistic/object-curly-newline': ['error', { ImportDeclaration: 'never' }],
            '@stylistic/padding-line-between-statements': ['error', { blankLine: 'never', prev: 'import', next: 'import' }],
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
])
