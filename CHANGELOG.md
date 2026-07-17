# Changelog

## Unreleased

### Changed

- Updated dependencies: `next` / `eslint-config-next` 16.2.10, `@chakra-ui/react` 3.36.0, `ethers` 6.17.0, `react-icons` 5.7.0, `prettier` 3.9.5, `@eslint/eslintrc` 3.3.6, `eslint` 9.39.5, `@types/node` 26.1.1, `typescript` 6.0.3
- Held back `eslint` at v9 (`@typescript-eslint/parser` crashes at runtime under ESLint 10, and `eslint-plugin-jsx-a11y` caps its peer range at v9) and `typescript` at 6.0.3 (`typescript-eslint` requires `<6.1.0`, and the Next.js 16.2 build worker crashes with TypeScript 7)
