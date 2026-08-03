# Changelog

## Unreleased

### Added

- `postinstall` hint that reminds users to run `pnpm customize` after installing (e.g. after `npx create-next-app --example https://github.com/w3hc/genji-passkey my-app`); `customize.js` removes the hint along with itself when it self-destructs

### Fixed

- Login button on a device with no registered passkey now opens the registration modal directly instead of triggering the browser's cross-device "scan this QR code" passkey dialog (the W3PK context now exposes `hasLocalCredentials()`, checked before calling `login()`)
- `isNoPasskeyError` now recognizes the w3pk 0.10.x "No passkey found" error message, so cancelling a passkey prompt with no account still falls back to the registration modal

### Changed

- Disabled the AI-powered security inspection feature (the "Security Inspect" cards on the Settings page, the `about` page feature bullet, the `window.w3pk.inspect()`/`inspectNow()` console shortcuts, and the related `BuildVerification` console hint); the underlying `w3pk` `inspect`/`inspectNow` calls are commented out rather than removed
- The Settings page (accounts, backup, device sync, social recovery, browser/security inspection, all toasts and dialogs), the About page (intro, features list, email subscription), and the remaining Home page strings (sign-message toast, loading/not-available states) are now fully translated in all 10 supported languages, closing the gap left by the earlier partial translation pass (large expansion of `settings` and new top-level `about` section in `src/translations/index.ts`)
- The "Sign a message" button on the home page is now translated in all 10 supported languages (new `home.signMessage` translation key)
- Username validation error in the registration modal is now cleared in the input's `onChange` handler instead of a `useEffect`, avoiding a redundant second render per keystroke (fixes the `react-hooks/set-state-in-effect` pattern)
- Updated dependencies: `next` / `eslint-config-next` 16.2.10, `@chakra-ui/react` 3.36.0, `ethers` 6.17.0, `react-icons` 5.7.0, `prettier` 3.9.5, `@eslint/eslintrc` 3.3.6, `eslint` 9.39.5, `@types/node` 26.1.1, `typescript` 6.0.3
- Held back `eslint` at v9 (`@typescript-eslint/parser` crashes at runtime under ESLint 10, and `eslint-plugin-jsx-a11y` caps its peer range at v9) and `typescript` at 6.0.3 (`typescript-eslint` requires `<6.1.0`, and the Next.js 16.2 build worker crashes with TypeScript 7)
