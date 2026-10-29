import { defineConfig } from 'vite-plus';

// The workspace root owns the shared static analysis: per the Vite+ monorepo
// rules, `vp check` in a package still reads these `fmt` and `lint` blocks, so
// a package config only ever holds its own `pack` and `test` settings.
export default defineConfig({
  // The codebase was formatted by Prettier. These five keys reproduce that
  // style exactly in Oxfmt, so adopting the new formatter reformats nothing.
  fmt: {
    singleQuote: true,
    semi: true,
    tabWidth: 2,
    trailingComma: 'es5',
    printWidth: 80,
    sortPackageJson: false,
    ignorePatterns: [
      '**/dist/**',
      'node_modules',
      'resource',
      'package-lock.json',
      'package.json',
      'packages/*/package.json',
      '.tmp-research',
    ],
  },
  // tsgolint powers both the type-aware lint rules and the type check that
  // `vp check` runs, so it stands in for `tsc --noEmit`.
  lint: {
    // dist/ is generated output: linting it reports on code nobody wrote and
    // `vp check` in a package would otherwise scan its own bundle.
    ignorePatterns: ['**/dist/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  // Staged-file checks, run from the husky pre-commit hook.
  staged: {
    '*': 'vp check --fix',
  },
});
