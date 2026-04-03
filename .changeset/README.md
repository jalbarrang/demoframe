# Changesets

Use Changesets to track user-facing changes that should become part of the next DemoFrame release.

## Create a changeset

```bash
pnpm changeset
```

Choose the package (`demoframe`), select the semver bump, and write a short summary.

## Release flow

1. Feature PRs add one or more changesets.
2. After they land on `main`, the Changesets workflow opens or updates a version PR.
3. Merge that version PR.
4. The tag workflow creates the matching `v<version>` tag automatically.
5. That tag triggers `.github/workflows/release.yml`, which builds and publishes release artifacts for all platforms.
