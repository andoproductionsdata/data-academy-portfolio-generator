# Data Academy Portfolio Generator

A zero-backend web app that lets students create a personal data portfolio in minutes.

## How It Works

1. Open `index.html` in Chrome, Edge, or Firefox
2. Enter a GitHub Personal Access Token (PAT) — created once, used only for this session
3. Fill in name, role, tagline, and contact links
4. Add project descriptions
5. Click "Create My Portfolio" — the app creates a portfolio repository under their GitHub account and injects their data
6. Follow the Vercel link to deploy for free

## Running the Generator

No install required. Open `index.html` directly in a browser (`file://` protocol works).

Optional: host the generator files on GitHub Pages or Netlify for a shareable link.

## Template Repository

The portfolio template lives at:
`https://github.com/TEMPLATE_OWNER/data-academy-portfolio-template`

If the template repo moves, update the two constants at the top of `modules/github.js`:

```js
const TEMPLATE_OWNER = "new-owner"
const TEMPLATE_REPO  = "new-repo-name"
```

## What Gets Injected

The generator creates a fresh repository from the template, then overwrites `lib/portfolio-config.json` with the student's data. All other template files remain unchanged.

## Student Token Scope

Students need a classic PAT with the `repo` scope (full control of private/public repositories). Fine-grained tokens need "Contents: read and write" on "All repositories."

## What Students Edit After Deployment

- **Skills, tools, certifications:** Edit `lib/portfolio-config.json` in their GitHub repo directly
- **Profile photo:** Upload a photo file to `public/` in their repo; update `photoUrl` in `portfolio-config.json`
- **Bigger edits:** Paste HTML/component sections into Claude free tier and describe what to change

## v1 Limitations

- Skills, tools, and certifications sections use template defaults — students customise after deploy
- One portfolio per name (repo is named `firstname-lastname-data-portfolio`)
- No custom domains (students can add their own via Vercel free tier settings)
