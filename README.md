[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG-2.1%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa)

# Genji Passkey

Next.js Web3 starter with passkey auth and [WCAG 2.1 AA](https://www.levelaccess.com/understanding-wcag-emea/) compliant accessibility.

- [Live demo](https://genji.w3hc.org)
- [Tutorial](https://dev.to/julienbrg/getting-started-with-genji-your-web3-adventure-begins-here-3oec)

Includes:

- **[w3pk](https://w3pk.w3hc.org/)** `v0.10.2`
- [Next.js](https://nextjs.org/) `v16.3.1`
- [Ethers](https://docs.ethers.org/) `v6.17.0`
- [Chakra UI](https://chakra-ui.com/) `v3.36.1`

> **Note:** `typescript` and `eslint` are pinned to `6.0.3` and `9.39.5`. `typescript-eslint` doesn't yet support TypeScript 7 or ESLint 10 in a stable release ([tracking issue](https://github.com/typescript-eslint/typescript-eslint/issues/11762)) — revisit once TS 7.1 ships (stable expected November 2026) and `typescript-eslint` catches up.

## Fork

You can [use this template directly](https://github.com/w3hc/genji-passkey/generate), or bootstrap it with create-next-app:

```bash
npx create-next-app --example https://github.com/w3hc/genji-passkey my-app
```

Then run the customization script so you start with a fresh app:

```bash
pnpm customize
```

A reminder to run it is printed after `pnpm install` (npm hides it during create-next-app's install step). The script itself will also self-destruct and remove the reminder.

## Install

```bash
pnpm i
```

## Run

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

## Docs

See the [/docs](docs/) to learn more about the context (for assistants), design guidelines, and [w3pk build verification](https://w3pk.w3hc.org/docs#build-verification).

## License

GPL-3.0

## Contact

**Julien Béranger** ([GitHub](https://github.com/julienbrg))

- Element: [@julienbrg:matrix.org](https://matrix.to/#/@julienbrg:matrix.org)
- Farcaster: [julien-](https://warpcast.com/julien-)
- Telegram: [@julienbrg](https://t.me/julienbrg)
