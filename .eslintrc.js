module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "project": [
            "./src/tsconfig.app.json",
            "./spec/tsconfig.spec.json"
        ],
        "sourceType": "module"
    },
    "plugins": [
        "eslint-plugin-jsdoc",
        "@typescript-eslint",
    ],
    "rules": {
        "@typescript-eslint/adjacent-overload-signatures": "error",
        "@typescript-eslint/array-type": [
            "error",
            {
                "default": "array"
            }
        ],
        "@typescript-eslint/ban-types": "off",
        "brace-style": "off",
        "@typescript-eslint/brace-style": [
            "error",
            "stroustrup",
            {
                "allowSingleLine": true
            }
        ],
        "@typescript-eslint/consistent-type-assertions": "error",
        "@typescript-eslint/dot-notation": "error",
        "@typescript-eslint/member-delimiter-style": [
            "error",
            {
                "multiline": {
                    "delimiter": "none",
                    "requireLast": true
                },
                "overrides": {
                    "interface": {
                        "multiline": {
                            "delimiter": "semi",
                            "requireLast": true
                        }
                    }
                },
                "singleline": {
                    "delimiter": "semi",
                    "requireLast": true
                }
            }
        ],
        "@typescript-eslint/naming-convention": [
            "error",
            {
                "format": null,
                "selector": "enum"
            }
        ],
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-misused-new": "error",
        "@typescript-eslint/no-namespace": "error",
        "@typescript-eslint/no-parameter-properties": "off",
        "@typescript-eslint/no-shadow": [
            "error",
            {
                "hoist": "all"
            }
        ],
        "@typescript-eslint/no-unused-expressions": "error",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-var-requires": "error",
        "@typescript-eslint/prefer-for-of": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/prefer-namespace-keyword": "error",
        "semi": "off",
        "@typescript-eslint/semi": [
            "error"
        ],
        "@typescript-eslint/triple-slash-reference": [
            "error",
            {
                "lib": "always",
                "path": "always",
                "types": "prefer-import"
            }
        ],
        "@typescript-eslint/unified-signatures": "error",
        "comma-dangle": [
            "error",
            {
                "arrays": "never",
                "exports": "never",
                "functions": "never",
                "imports": "always",
                "objects": "never"
            }
        ],
        "complexity": "off",
        "constructor-super": "error",
        "curly": "error",
        "eol-last": "error",
        "eqeqeq": [
            "error"
        ],
        "guard-for-in": "error",
        "id-blacklist": [
            "error",
            "any",
            "Number",
            "number",
            "String",
            "string",
            "Boolean",
            "boolean",
            "Undefined",
            "undefined"
        ],
        "id-match": "error",
        "jsdoc/check-alignment": "error",
        "jsdoc/check-indentation": "error",
        "max-classes-per-file": "off",
        "new-parens": "error",
        "no-bitwise": "off",
        "no-caller": "error",
        "no-cond-assign": "error",
        "no-console": "error",
        "no-debugger": "error",
        "no-empty": "error",
        "no-eval": "error",
        "no-fallthrough": "error",
        "no-invalid-this": "error",
        "no-new-wrappers": "error",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-underscore-dangle": "error",
        "no-unsafe-finally": "error",
        "no-unused-labels": "error",
        "no-var": "error",
        "object-shorthand": "error",
        "one-var": [
            "error",
            "never"
        ],
        "prefer-arrow-callback": [
            "error",
            {
                "allowNamedFunctions": false,
                "allowUnboundThis": false
            }
        ],
        "prefer-const": "error",
        "radix": "error",
        "spaced-comment": [
            "error",
            "always",
            {
                "markers": [
                    "/"
                ]
            }
        ],
        "use-isnan": "error",
        "valid-typeof": "off"
    }
};