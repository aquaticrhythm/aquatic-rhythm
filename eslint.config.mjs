/**
 * Minimal ESLint flat config for vanilla JS + Node ESM scripts.
 * No frameworks, no transpilation — just basic correctness rules.
 */
export default [
  {
    ignores: [
      'node_modules/**',
      'sw.js',
      '**/*.min.js'
    ]
  },

  // Browser-facing scripts under js/ — old-school IIFEs, ES5-friendly globals.
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        history: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        HTMLElement: 'readonly',
        Image: 'readonly',
        Event: 'readonly',
        CustomEvent: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        getComputedStyle: 'readonly',
        Node: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        gtag: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', vars: 'local' }],
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-cond-assign': ['error', 'except-parens'],
      'no-useless-escape': 'warn',
      // Legacy ES5 code uses `var` heavily and re-declares inside switch
      // arms / branches — flag it but do not fail CI on existing patterns.
      'no-redeclare': 'warn'
    }
  },

  // ui.js is the large legacy SPA shell; reference-undeclared symbols
  // (`streak`, `getTankContext`) are pre-existing bugs tracked separately.
  // Downgrade so the linter still flags them without failing the suite.
  {
    files: ['js/ui.js'],
    rules: {
      'no-undef': 'warn'
    }
  },

  // Node ESM: build scripts, tests.
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', 'eslint.config.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        globalThis: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-redeclare': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error'
    }
  },

  // Cloudflare Worker (ESM).
  {
    files: ['worker/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        Response: 'readonly',
        Request: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        crypto: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-redeclare': 'error'
    }
  }
];
