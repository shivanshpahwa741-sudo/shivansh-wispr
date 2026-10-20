# Shivansh Pahwa, Growth Analytics

A single application page for the Growth Analytics internship at Wispr Flow,
Bengaluru, built in Flow's own design language.

Every figure on the page traces to a verified record. Rupee amounts carry a
dollar equivalent at 95.65 INR to the dollar.

## Run it

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`.

## Deploying

The built site is published to the `gh-pages` branch.

```bash
npm run build
git push origin `git subtree split --prefix dist main`:gh-pages --force
```

To switch to GitHub Actions instead, run `gh auth refresh -s workflow` once,
then move `deploy/github-pages-workflow.yml.txt` to
`.github/workflows/deploy.yml` and push.
