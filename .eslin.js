/**
 * We are using the .JS version of an ESLint config file here so that we can
 * add lots of comments to better explain and document the setup.
 *
 * JSON-based configuration files are often easier to write tooling for
 * because they can be statically analyzed more easily, so may wish to
 * consider converting this once you have read through the comments.
 */
module.exports = {
    /**
     * See packages/eslint-plugin/src/configs/README.md
     * for what this recommended config contains.
     */
    extends: [
        'plugin:@angular-eslint/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
        'plugin:import/typescript',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:json/recommended',
        'prettier',
        'plugin:prettier/recommended',
        'prettier/@typescript-eslint',
    ],

    /**
     * We use a dedicated tsconfig file for the compilation related to linting so that we
     * have complete control over what gets included and we can maximize performance
     */
    parserOptions: {
        project: './tsconfig.eslint.json',
    },

    rules: {
        // ORIGINAL tslint.json -> "directive-selector": [true, "attribute", "app", "camelCase"],
        '@angular-eslint/directive-selector': [
            'error',
            { type: 'attribute', prefix: 'app', style: 'camelCase' },
        ],

        // ORIGINAL tslint.json -> "component-selector": [true, "element", "app", "kebab-case"],
        '@angular-eslint/component-selector': [
            'error',
            { type: 'element', prefix: 'app', style: 'kebab-case' },
        ],

        quotes: ['error', 'single', { allowTemplateLiterals: true }],
    },
    overrides: [
        {
            files: ['*.component.html'],
            parser: '@angular-eslint/template-parser',
            plugins: ['@angular-eslint/template'],
            rules: {
                '@angular-eslint/template/banana-in-a-box': 'error',
                '@angular-eslint/template/cyclomatic-complexity': 'error',
                '@angular-eslint/template/no-call-expression': 'error',
                '@angular-eslint/template/no-negated-async': 'error',
                '@angular-eslint/template/i18n': [
                    'error',
                    {
                        checkId: false,
                        checkText: true,
                        checkAttributes: true,
                        ignoreAttributes: ['field', 'identifier'],
                    },
                ],
            },
        },
    ],
};
