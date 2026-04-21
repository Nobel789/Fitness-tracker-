# PulsePath Fitness Tracker

A lightweight static fitness goal tracker built with HTML, CSS, and vanilla JavaScript.

## Run locally

```bash
python -m http.server 4173
```

Then open `http://localhost:4173`.

## Deploy (GitHub Pages)

This repo now includes an automated GitHub Pages workflow:

- Workflow file: `.github/workflows/deploy.yml`
- Trigger: push to `main` or `master`, or manual dispatch

### One-time repo setup

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push this branch to your repo default branch (`main` or `master`).

After the workflow succeeds, your live app URL will appear in the workflow run summary.
