# Portfolio Editor Toggle — Design Spec
**Date:** 2026-09-14  
**Status:** Approved

## Overview

Add an Edit mode to the existing Portfolio Generator. Students who have already deployed a portfolio can return to the same tool, switch to Edit mode, load their existing data, make changes across all 6 wizard steps, and push the updated config back to GitHub — triggering an automatic Vercel redeploy.

## Architecture

No new modules. Changes are confined to existing files.

| File | Change |
|---|---|
| `index.html` | Toggle pill + repo name field on Step 1; edit-mode success screen |
| `app.js` | Mode-aware Step 1 submit; populate forms from fetched config; mode-aware deploy |
| `modules/state.js` | Add `mode` (`"generate"` \| `"edit"`) and `repoName` fields |
| `modules/github.js` | Add `fetchPortfolioConfig()` and `updatePortfolio()` |
| `modules/work-experience-step.js` | Accept pre-fill data when initialising |
| `modules/projects-step.js` | Accept pre-fill data when initialising |
| `modules/certifications-step.js` | Accept pre-fill data when initialising |
| `styles.css` | Toggle pill styles |

## Step 1 — UI Changes

A `Generate Portfolio | Edit Portfolio` pill toggle is inserted between the page title and the PAT instructions. Default is Generate (existing behaviour unchanged).

When **Edit** is selected:
- A **Repo Name** field appears below the PAT field
  - Label: "Portfolio Repo Name"
  - Hint: "The name of the repo created when you first generated your portfolio — e.g. jane-smith-portfolio"
  - Required in Edit mode only
- Errors use the same inline error pattern as the PAT field

On Step 1 submit in Edit mode:
1. Validate PAT format
2. Validate repo name is not empty
3. Verify PAT via GitHub API (same as Generate)
4. Fetch `lib/portfolio-config.json` from `{userLogin}/{repoName}`
5. If repo or file not found: show inline error on repo name field
6. Store fetched config in state
7. Pre-populate all form fields (see below)
8. Advance to Step 2

## Form Pre-Population

Pre-population runs immediately after config is fetched, before the student reaches Step 2.

**Profile (Step 2)**
Set `.value` directly on each input from `config.profile` and `config.about`. Set checkbox state for `openToWork`.

**Skills (Step 2)**
- Built-in skills present in `config.technicalSkills` → added to `selectedSkills` (checked)
- Built-in skills absent from `config.technicalSkills` → not selected (unchecked)
- Skills in `config.technicalSkills` not in the built-in list → added to `customSkills`
- Re-render the skills checkboxes

**Work Experience (Step 3)**
`initWorkExperienceStep()` accepts an optional array of existing jobs. For each job, a card is created and all fields pre-filled (title, company, duration, responsibilities). Fully editable — student can change fields, add new jobs, or remove existing ones.

**Projects (Step 4)**
`initProjectsStep()` accepts existing projects. Each project card is created and text fields pre-filled. Image fields (thumbnail, build image, outcome image, slides) are left empty — if student does not upload a new file, the existing image in the repo is untouched.

**Certifications (Step 5)**
`initCertificationsStep()` accepts existing certifications. Each cert card is created and pre-filled.

**Image rule:** If no new file is chosen for any image field, nothing is uploaded — the existing file already in the repo is preserved.

## Step 6 — Edit Mode Differences

- Page title: "Review & Update" (not "Review & Deploy")
- Button text: "Update My Portfolio" (not "Create My Portfolio")
- Review panel content: unchanged

## GitHub — New Functions

### `fetchPortfolioConfig(pat, ownerLogin, repoName)`
Fetches `lib/portfolio-config.json` from `repos/{ownerLogin}/{repoName}/contents/lib/portfolio-config.json`. Decodes base64 content and returns parsed JSON. Throws a user-friendly error if the repo or file is not found (404) or the request fails.

### `updatePortfolio(pat, fullName, configJson, photoFile, resumeFile, customSkills, projects)`
Same as `deployPortfolio` but skips `createFromTemplate` and `waitForRepo`. Steps:
1. Upload photo if `photoFile` provided
2. Upload resume if `resumeFile` provided
3. Upload skill icons for any custom skills with a `logoFile`
4. Upload project assets for any projects with new image files
5. Fetch current SHA of `lib/portfolio-config.json`
6. Write updated config via `updateFile`
7. Return `https://github.com/{fullName}`

## Success Screen — Edit Mode

Replaces the generate success screen (which includes Vercel setup instructions). Edit mode shows:

```
✓ Portfolio Updated!

Your changes have been pushed to GitHub.
Vercel will redeploy automatically within 60 seconds.

[ View Your Repository → ]
```

## State Shape Changes

```js
// New fields added to initial state
{
  mode: "generate",   // "generate" | "edit"
  repoName: "",       // only used in edit mode
  // ... existing fields unchanged
}
```

## Out of Scope

- Preview before committing (separate feature)
- Deleting the portfolio repository
- Switching Vercel deployment settings
- Any changes to the portfolio template itself
