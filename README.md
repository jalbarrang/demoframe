# DemoFrame

A desktop app for recording short product demos, tutorials, and step-by-step walkthroughs.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```

### Updates

DemoFrame uses GitHub Releases for auto-updates.

#### Versioning with Changesets

```bash
# Add a release note and bump intent in a feature PR
$ pnpm changeset
```

When changesets land on `main`, `.github/workflows/changesets.yml` creates or updates a **Version Packages** PR.
Merging that PR updates `package.json` and changelog state for the next release.

#### Publishing a release

```bash
# After merging the version PR, push the matching release tag
$ pnpm release:tag
```

That tag triggers `.github/workflows/release.yml`, which builds and publishes macOS, Windows, and Linux artifacts to GitHub Releases.

If you want to publish the current platform manually, you can still run:

```bash
$ GH_TOKEN=your_token pnpm release
```

In development, updater checks are disabled by default. To test them locally against `dev-app-update.yml`, run the app with `DEMOFRAME_ENABLE_DEV_UPDATES=1`.
