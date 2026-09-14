# Portfolio Editor Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Generate / Edit toggle to Step 1 of the Portfolio Generator so students can load their existing portfolio, make changes across all wizard steps, and push the updated config back to GitHub.

**Architecture:** A pill toggle on Step 1 switches between Generate and Edit mode. Edit mode adds a repo name field, fetches the existing `portfolio-config.json` from GitHub, pre-populates all form fields, and calls `updatePortfolio` instead of `deployPortfolio` on submit. No new modules — all changes extend existing files.

**Tech Stack:** Vanilla HTML/CSS/JS ES modules, GitHub Contents API

---

## File Map

| File | Change |
|---|---|
| `modules/state.js` | Add `mode` and `repoName` to initial state |
| `modules/github.js` | Add `fetchPortfolioConfig` and `updatePortfolio` |
| `index.html` | Toggle pill, repo name field, edit success section |
| `styles.css` | Toggle pill styles |
| `modules/steps.js` | Accept optional `screenId` in `goToStep` |
| `modules/ui.js` | Update `renderReviewPanel`; add `renderEditSuccessScreen` |
| `modules/work-experience-step.js` | `addJobCard(data)` + `initWorkExperienceStep(jobs)` |
| `modules/projects-step.js` | `addProjectCard(data)` + `initProjectsStep(projects)` |
| `modules/certifications-step.js` | `addCertCard(data)` + `initCertificationsStep(certs)` |
| `app.js` | Toggle listeners, Step 1 edit submit, form population, Step 6 edit mode |

---

### Task 1: State — add mode and repoName

**Files:**
- Modify: `modules/state.js`

- [ ] **Step 1: Add mode and repoName to initial state**

Replace the current `_state` object in `modules/state.js`:

```js
const _state = {
  pat: "",
  githubUser: null,
  profilePhotoFile: null,
  profileResumeFile: null,
  mode: "generate",   // "generate" | "edit"
  repoName: "",
  profile: {
    name: "",
    role: "",
    tagline: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    openToWork: true,
    availability: "",
    bio: "",
    focus: "",
    coreStack: "",
  },
  selectedSkills: ["SQL","Power BI","Tableau","Python","Excel","Claude Code","Git","Power Automate","Copilot","Redshift","Salesforce","Jira"],
  customSkills: [],
  workExperience: [],
  projects: [],
  certifications: [],
}
```

- [ ] **Step 2: Verify**

Open `modules/state.js`. Confirm `mode: "generate"` and `repoName: ""` appear in `_state`. No other changes.

- [ ] **Step 3: Commit**

```
git add modules/state.js
git commit -m "feat: add mode and repoName to app state"
```

---

### Task 2: GitHub — fetchPortfolioConfig and updatePortfolio

**Files:**
- Modify: `modules/github.js`

- [ ] **Step 1: Add fetchPortfolioConfig**

Append to the bottom of `modules/github.js`:

```js
export async function fetchPortfolioConfig(pat, ownerLogin, repoName) {
  const res = await fetch(
    `${API}/repos/${ownerLogin}/${repoName}/contents/lib/portfolio-config.json`,
    { headers: headers(pat) }
  )
  if (res.status === 404) throw new Error("Repository or config file not found — check the repo name and try again")
  if (!res.ok) throw new Error(`Could not load portfolio config: ${res.status}`)
  const data = await res.json()
  return JSON.parse(atob(data.content.replace(/\n/g, "")))
}
```

- [ ] **Step 2: Add updatePortfolio**

Append to the bottom of `modules/github.js` (after `fetchPortfolioConfig`):

```js
export async function updatePortfolio(pat, fullName, configJson, photoFile = null, resumeFile = null, customSkills = [], projects = []) {
  if (photoFile)           await uploadPhoto(pat, fullName, photoFile)
  if (resumeFile)          await uploadResume(pat, fullName, resumeFile)
  if (customSkills.length) await uploadSkillIcons(pat, fullName, customSkills)
  if (projects.length)     await uploadProjectAssets(pat, fullName, projects, configJson)
  const sha = await getFileSHA(pat, fullName, "lib/portfolio-config.json")
  await updateFile(pat, fullName, "lib/portfolio-config.json", configJson, sha)
  return `https://github.com/${fullName}`
}
```

- [ ] **Step 3: Verify**

Open `modules/github.js`. Confirm `fetchPortfolioConfig` decodes content with `atob(data.content.replace(/\n/g, ""))`. Confirm `updatePortfolio` has no `createFromTemplate` or `waitForRepo` calls.

- [ ] **Step 4: Commit**

```
git add modules/github.js
git commit -m "feat: add fetchPortfolioConfig and updatePortfolio to github module"
```

---

### Task 3: HTML — toggle pill, repo name field, edit success screen

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add toggle pill and updated description to Step 1**

In `index.html`, find this block inside `#step-1`:

```html
<h1 class="step-title">Connect Your GitHub Account</h1>
<p class="step-description">
  We use a Personal Access Token to create your portfolio repository.
  Your token is only used during this session and is never stored.
</p>
```

Replace with:

```html
<h1 class="step-title">Connect Your GitHub Account</h1>

<div class="mode-toggle" role="group" aria-label="Mode">
  <button type="button" class="mode-btn active" id="btn-mode-generate" aria-pressed="true">
    Generate Portfolio
  </button>
  <button type="button" class="mode-btn" id="btn-mode-edit" aria-pressed="false">
    Edit Portfolio
  </button>
</div>

<p class="step-description" id="step-1-description">
  We use a Personal Access Token to create your portfolio repository.
  Your token is only used during this session and is never stored.
</p>
```

- [ ] **Step 2: Add repo name field to the auth form**

In `index.html`, inside `#form-auth`, find the closing `</div>` of the PAT field-group (the one containing `#pat-input`). Directly after it, insert:

```html
<div class="field-group hidden" id="repo-name-group">
  <label for="repo-name-input" class="field-label">
    Portfolio Repo Name <span class="required" aria-hidden="true">*</span>
  </label>
  <input type="text" id="repo-name-input" name="repoName" class="field-input"
    placeholder="jane-smith-data-portfolio" autocomplete="off" spellcheck="false" />
  <p class="field-hint">The name of the GitHub repository created when you first generated your portfolio.</p>
  <p class="field-error hidden" id="repo-name-error" role="alert"></p>
</div>
```

- [ ] **Step 3: Add edit success screen**

In `index.html`, after the closing `</section>` of `#screen-success` and before `</main>`, add:

```html
<!-- EDIT SUCCESS SCREEN -->
<section id="screen-success-edit" class="step hidden" aria-label="Portfolio Updated">
  <div class="step-content success-content">
    <div class="success-icon" aria-hidden="true">✓</div>
    <h1 class="step-title">Portfolio Updated!</h1>
    <p class="step-description">Your changes have been pushed to GitHub. Vercel will redeploy automatically within 60 seconds.</p>
    <div class="success-card">
      <h2>Your Repository</h2>
      <a id="edit-success-repo-url" href="#" target="_blank" rel="noreferrer" class="success-link"></a>
    </div>
  </div>
</section>
```

- [ ] **Step 4: Verify**

Open `index.html` and confirm:
- `.mode-toggle` with two `.mode-btn` buttons sits between `<h1>` and `<p id="step-1-description">`
- `#repo-name-group` is inside `#form-auth` with class `hidden`
- `#screen-success-edit` is inside `<main class="step-container">` with class `step hidden`

- [ ] **Step 5: Commit**

```
git add index.html
git commit -m "feat: add mode toggle, repo name field, and edit success screen to HTML"
```

---

### Task 4: CSS — toggle pill styles

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Append toggle styles**

Add to the bottom of `styles.css`:

```css
/* ── Mode Toggle ────────────────────────────────────────────────── */
.mode-toggle {
  display: inline-flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 4px;
  gap: 4px;
  margin-bottom: 1.5rem;
}

.mode-btn {
  padding: 0.45rem 1.25rem;
  border-radius: calc(var(--radius) - 2px);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.mode-btn.active {
  background: var(--primary);
  color: #fff;
}

.mode-btn:not(.active):hover {
  background: var(--surface);
  color: var(--text);
}
```

- [ ] **Step 2: Verify visually**

Serve locally (`npx serve .` from the project directory, then open `http://localhost:3000`). Confirm the toggle pill renders on Step 1 with "Generate Portfolio" highlighted in the primary colour and "Edit Portfolio" in muted style.

- [ ] **Step 3: Commit**

```
git add styles.css
git commit -m "feat: add mode toggle pill styles"
```

---

### Task 5: steps.js — support edit success screen

**Files:**
- Modify: `modules/steps.js`

- [ ] **Step 1: Update goToStep signature**

Replace the entire contents of `modules/steps.js`:

```js
export function goToStep(stepNumber, screenId = "screen-success") {
  document.querySelectorAll(".step").forEach(el => el.classList.add("hidden"))

  if (stepNumber === 0) {
    document.getElementById(screenId).classList.remove("hidden")
    document.querySelectorAll(".progress-step").forEach(el => {
      el.classList.remove("active")
      el.classList.add("completed")
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  const target = document.getElementById(`step-${stepNumber}`)
  if (!target) throw new Error(`Step ${stepNumber} not found in DOM`)
  target.classList.remove("hidden")

  document.querySelectorAll(".progress-step").forEach(el => {
    const n = Number(el.dataset.step)
    el.classList.remove("active", "completed")
    if (n < stepNumber) el.classList.add("completed")
    else if (n === stepNumber) el.classList.add("active")
  })

  window.scrollTo({ top: 0, behavior: "smooth" })
}
```

- [ ] **Step 2: Verify**

All existing callers pass no second argument, so they default to `"screen-success"` — behaviour unchanged. The only new call will be `goToStep(0, "screen-success-edit")` added in Task 11.

- [ ] **Step 3: Commit**

```
git add modules/steps.js
git commit -m "feat: allow goToStep to specify which success screen to show"
```

---

### Task 6: ui.js — renderReviewPanel and renderEditSuccessScreen

**Files:**
- Modify: `modules/ui.js`

- [ ] **Step 1: Update renderReviewPanel to accept a repo name override**

Replace the `renderReviewPanel` function in `modules/ui.js`:

```js
export function renderReviewPanel(state, repoNameOverride = null) {
  const { profile, workExperience, projects, certifications, selectedSkills } = state
  const repoName = repoNameOverride || generateRepoName(profile.name)

  document.getElementById("review-panel").innerHTML = `
    <div class="review-section">
      <span class="review-label">Name</span>
      <span class="review-value">${profile.name}</span>
    </div>
    <div class="review-section">
      <span class="review-label">Role</span>
      <span class="review-value">${profile.role}</span>
    </div>
    <div class="review-section">
      <span class="review-label">Tagline</span>
      <span class="review-value">${profile.tagline}</span>
    </div>
    ${profile.location ? `<div class="review-section"><span class="review-label">Location</span><span class="review-value">${profile.location}</span></div>` : ""}
    ${profile.email ? `<div class="review-section"><span class="review-label">Email</span><span class="review-value">${profile.email}</span></div>` : ""}
    ${profile.linkedin ? `<div class="review-section"><span class="review-label">LinkedIn</span><span class="review-value">${profile.linkedin}</span></div>` : ""}
    ${profile.github ? `<div class="review-section"><span class="review-label">GitHub</span><span class="review-value">${profile.github}</span></div>` : ""}
    <div class="review-section">
      <span class="review-label">Skills</span>
      <span class="review-value">${selectedSkills.length === 0 ? "None selected" : selectedSkills.join(", ")}</span>
    </div>
    <div class="review-section">
      <span class="review-label">Work experience</span>
      <span class="review-value">${workExperience.length === 0 ? "None added" : workExperience.map(j => `${j.title} at ${j.company}`).join(", ")}</span>
    </div>
    <div class="review-section">
      <span class="review-label">Projects</span>
      <span class="review-value">${projects.length === 0 ? "None added" : projects.map(p => p.title || "Untitled").join(", ")}</span>
    </div>
    <div class="review-section">
      <span class="review-label">Certifications</span>
      <span class="review-value">${certifications.length === 0 ? "None added" : certifications.map(c => c.name).join(", ")}</span>
    </div>
    <div class="review-section">
      <span class="review-label">Repository name</span>
      <span class="review-value">${repoName}</span>
    </div>
  `
}
```

- [ ] **Step 2: Add renderEditSuccessScreen**

Append to `modules/ui.js`:

```js
export function renderEditSuccessScreen(repoUrl) {
  const linkEl = document.getElementById("edit-success-repo-url")
  linkEl.href = repoUrl
  linkEl.textContent = repoUrl
}
```

- [ ] **Step 3: Verify**

Confirm `renderReviewPanel` uses `repoNameOverride || generateRepoName(profile.name)`. Confirm `renderEditSuccessScreen` targets `#edit-success-repo-url`.

- [ ] **Step 4: Commit**

```
git add modules/ui.js
git commit -m "feat: update renderReviewPanel for edit mode; add renderEditSuccessScreen"
```

---

### Task 7: work-experience-step.js — pre-fill support

**Files:**
- Modify: `modules/work-experience-step.js`

- [ ] **Step 1: Update addJobCard to accept optional data**

Replace the `addJobCard` function:

```js
export function addJobCard(data = null) {
  const list = document.getElementById("jobs-list")
  const currentCount = list.querySelectorAll(".job-card").length

  if (currentCount >= MAX_JOBS) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_JOBS} jobs allowed`, "info")
    )
    return
  }

  const template = document.getElementById("job-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".job-card")

  card.querySelector(".job-number").textContent = String(currentCount + 1)

  card.querySelector(".btn-remove-job").addEventListener("click", () => {
    card.remove()
    renumberCards()
  })

  if (data) {
    const form = card.querySelector(".job-form")
    const set  = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`)
      if (el) el.value = value ?? ""
    }
    set("title",    data.title)
    set("company",  data.company)
    set("location", data.location)
    set("duration", data.duration)
    set("responsibilities", Array.isArray(data.responsibilities)
      ? data.responsibilities.join("\n")
      : (data.responsibilities ?? ""))
  }

  list.appendChild(card)
  updateAddButton()
}
```

- [ ] **Step 2: Update initWorkExperienceStep**

Replace `initWorkExperienceStep`:

```js
export function initWorkExperienceStep(jobs = []) {
  if (jobs.length > 0) {
    jobs.forEach(job => addJobCard(job))
  } else if (document.querySelectorAll("#jobs-list .job-card").length === 0) {
    addJobCard()
  }
}
```

- [ ] **Step 3: Verify**

Confirm `responsibilities` array from config (e.g. `["Led dashboards", "Wrote SQL"]`) becomes `"Led dashboards\nWrote SQL"` in the textarea — one item per line.

- [ ] **Step 4: Commit**

```
git add modules/work-experience-step.js
git commit -m "feat: add pre-fill support to work experience step"
```

---

### Task 8: projects-step.js — pre-fill support

**Files:**
- Modify: `modules/projects-step.js`

- [ ] **Step 1: Update addProjectCard to accept data and return the card**

Replace the `addProjectCard` function:

```js
export function addProjectCard(data = null) {
  const list = document.getElementById("projects-list")
  const currentCount = list.querySelectorAll(".project-card").length

  if (currentCount >= MAX_PROJECTS) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_PROJECTS} projects allowed`, "info")
    )
    return null
  }

  const template = document.getElementById("project-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".project-card")
  const form     = card.querySelector(".project-form")

  card.querySelector(".project-number").textContent = String(currentCount + 1)

  const buildLabel = Array.from(form.querySelectorAll(".project-section-label"))
    .find(el => el.textContent.trim() === "Build")

  const customContainer = document.createElement("div")
  customContainer.className = "custom-sections-list"

  const addSectionBtn = document.createElement("button")
  addSectionBtn.type = "button"
  addSectionBtn.className = "btn-add-section"
  addSectionBtn.textContent = "+ Add Custom Section"
  addSectionBtn.addEventListener("click", () => customContainer.appendChild(makeCustomSectionRow()))

  buildLabel.before(customContainer)
  buildLabel.before(addSectionBtn)

  card.querySelector(".btn-remove-project").addEventListener("click", () => {
    card.remove()
    renumberCards()
  })

  list.appendChild(card)

  if (data) {
    const set = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`)
      if (el) el.value = value ?? ""
    }
    set("title",                data.title)
    set("company",              data.company)
    set("industry",             data.industry)
    set("githubUrl",            data.githubUrl ?? "")
    set("summary",              data.summary)
    set("requirements",         Array.isArray(data.requirements)
      ? data.requirements.join("\n\n") : (data.requirements ?? ""))
    set("whatIBuilt1",          Array.isArray(data.whatIBuilt)
      ? data.whatIBuilt.join("\n\n") : (data.whatIBuilt ?? ""))
    set("sqlSnippet",           data.sqlSnippet)
    set("codeDescription",      data.sqlDescription)
    set("dashboardTitle",       data.dashboardTitle)
    set("dashboardDescription", data.dashboardDescription)
    set("outcome",              Array.isArray(data.outcome)
      ? data.outcome.join("\n\n") : (data.outcome ?? ""))

    if (Array.isArray(data.customSections)) {
      data.customSections.forEach(section => {
        const row = makeCustomSectionRow()
        row.querySelector('[name="customSectionTitle"]').value   = section.title ?? ""
        row.querySelector('[name="customSectionContent"]').value = section.content ?? ""
        customContainer.appendChild(row)
      })
    }

    if (Array.isArray(data.dashboardSlides)) {
      const addSlideBtn = card.querySelector(".btn-add-slide")
      const slidesList  = card.querySelector(".slides-list")
      data.dashboardSlides.forEach(slide => {
        addSlideBtn.click()
        const slideCards = slidesList.querySelectorAll(".slide-card")
        const newSlide   = slideCards[slideCards.length - 1]
        if (!newSlide) return
        const descText = Array.isArray(slide.description)
          ? slide.description.join("\n\n")
          : (slide.description ?? "")
        newSlide.querySelector('[name="slideTitle"]').value       = slide.title ?? ""
        newSlide.querySelector('[name="slideDescription"]').value = descText
      })
    }
  }

  updateAddButton()
  return card
}
```

- [ ] **Step 2: Update initProjectsStep**

Replace `initProjectsStep`:

```js
export function initProjectsStep(projects = []) {
  if (projects.length > 0) {
    projects.forEach(p => addProjectCard(p))
  } else if (document.querySelectorAll("#projects-list .project-card").length === 0) {
    addProjectCard()
  }
}
```

- [ ] **Step 3: Verify**

Confirm `addProjectCard` returns the card. Confirm `whatIBuilt` (array in config) maps to `whatIBuilt1` (textarea). Confirm slides are created by clicking `.btn-add-slide` then filled immediately — not before `list.appendChild(card)`.

- [ ] **Step 4: Commit**

```
git add modules/projects-step.js
git commit -m "feat: add pre-fill support to projects step"
```

---

### Task 9: certifications-step.js — pre-fill support

**Files:**
- Modify: `modules/certifications-step.js`

- [ ] **Step 1: Update addCertCard to accept optional data**

Replace `addCertCard`:

```js
export function addCertCard(data = null) {
  const list = document.getElementById("certs-list")
  const currentCount = list.querySelectorAll(".cert-card").length

  if (currentCount >= MAX_CERTS) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_CERTS} certifications allowed`, "info")
    )
    return
  }

  const template = document.getElementById("cert-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".cert-card")

  card.querySelector(".cert-number").textContent = String(currentCount + 1)
  card.querySelector(".btn-remove-cert").addEventListener("click", () => {
    card.remove()
    renumberCards()
  })

  if (data) {
    const form = card.querySelector(".cert-form")
    const set  = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`)
      if (el) el.value = value ?? ""
    }
    set("name",          data.name)
    set("organisation",  data.organisation)
    set("date",          data.date)
    set("credentialUrl", data.credentialUrl === "#" ? "" : (data.credentialUrl ?? ""))
  }

  list.appendChild(card)
  updateAddButton()
}
```

- [ ] **Step 2: Update initCertificationsStep**

Replace `initCertificationsStep`:

```js
export function initCertificationsStep(certs = []) {
  if (certs.length > 0) {
    certs.forEach(c => addCertCard(c))
  } else if (document.querySelectorAll("#certs-list .cert-card").length === 0) {
    addCertCard()
  }
}
```

- [ ] **Step 3: Verify**

Confirm `credentialUrl: "#"` from config is treated as empty string (the `#` is a placeholder, not a real URL).

- [ ] **Step 4: Commit**

```
git add modules/certifications-step.js
git commit -m "feat: add pre-fill support to certifications step"
```

---

### Task 10: app.js — toggle listeners, Step 1 edit submit, form population

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Update imports**

Replace the two import lines at the top of `app.js`:

```js
import { verifyPAT, deployPortfolio, fetchPortfolioConfig, updatePortfolio } from "./modules/github.js"
import {
  showToast, hideToast,
  setButtonLoading, setFieldError, clearFormErrors,
  renderReviewPanel, renderSuccessScreen, renderEditSuccessScreen, generateRepoName,
} from "./modules/ui.js"
```

- [ ] **Step 2: Add toggle listeners**

Find the comment `// ── Step 1: GitHub Auth ──` in `app.js`. Directly above it, insert:

```js
// ── Mode Toggle ──────────────────────────────────────────────────

document.getElementById("btn-mode-generate").addEventListener("click", () => {
  setState({ mode: "generate" })
  document.getElementById("btn-mode-generate").classList.add("active")
  document.getElementById("btn-mode-generate").setAttribute("aria-pressed", "true")
  document.getElementById("btn-mode-edit").classList.remove("active")
  document.getElementById("btn-mode-edit").setAttribute("aria-pressed", "false")
  document.getElementById("repo-name-group").classList.add("hidden")
  document.getElementById("step-1-description").textContent =
    "We use a Personal Access Token to create your portfolio repository. Your token is only used during this session and is never stored."
  setFieldError("repo-name-error", null)
})

document.getElementById("btn-mode-edit").addEventListener("click", () => {
  setState({ mode: "edit" })
  document.getElementById("btn-mode-edit").classList.add("active")
  document.getElementById("btn-mode-edit").setAttribute("aria-pressed", "true")
  document.getElementById("btn-mode-generate").classList.remove("active")
  document.getElementById("btn-mode-generate").setAttribute("aria-pressed", "false")
  document.getElementById("repo-name-group").classList.remove("hidden")
  document.getElementById("step-1-description").textContent =
    "Enter your GitHub token and the name of the repository we created for you. We'll load your existing portfolio so you can make changes."
})
```

- [ ] **Step 3: Replace the Step 1 auth submit handler**

Find and replace the entire `document.getElementById("form-auth").addEventListener("submit", ...)` block:

```js
document.getElementById("form-auth").addEventListener("submit", async (e) => {
  e.preventDefault()
  const pat      = document.getElementById("pat-input").value.trim()
  const repoName = document.getElementById("repo-name-input").value.trim()
  const { mode } = getState()

  setFieldError("pat-error", null)
  setFieldError("repo-name-error", null)

  const patErr = validatePAT(pat)
  if (patErr) { setFieldError("pat-error", patErr); return }

  if (mode === "edit" && !repoName) {
    setFieldError("repo-name-error", "Repo name is required in Edit mode")
    return
  }

  const btn = document.getElementById("btn-verify-token")
  setButtonLoading(btn, true)
  try {
    const user = await verifyPAT(pat)
    setState({ pat, githubUser: user })
    document.getElementById("auth-avatar").src           = user.avatar_url
    document.getElementById("auth-username").textContent = `@${user.login}`
    document.getElementById("auth-user-card").classList.remove("hidden")

    if (mode === "edit") {
      setState({ repoName })
      const config = await fetchPortfolioConfig(pat, user.login, repoName)
      populateFormsFromConfig(config)
      await new Promise(r => setTimeout(r, 800))
      goToStep(2)
    } else {
      await new Promise(r => setTimeout(r, 800))
      goToStep(2)
    }
  } catch (err) {
    if (mode === "edit" && err.message.includes("not found")) {
      setFieldError("repo-name-error", err.message)
    } else {
      setFieldError("pat-error", err.message)
    }
  } finally {
    setButtonLoading(btn, false)
  }
})
```

- [ ] **Step 4: Add populateFormsFromConfig helper**

Find the `// ── Boot ─────────────────────────` comment at the bottom of `app.js`. Directly above it, insert:

```js
// ── Edit mode: form population ───────────────────────────────────

function populateFormsFromConfig(config) {
  const { profile, about, technicalSkills, workExperience, projects, certifications } = config

  const set = (id, value) => {
    const el = document.getElementById(id)
    if (el) el.value = value ?? ""
  }
  set("profile-name",         profile.name)
  set("profile-tagline",      profile.tagline)
  set("profile-email",        profile.email)
  set("profile-phone",        profile.phone)
  set("profile-location",     profile.location)
  set("profile-linkedin",     profile.linkedin)
  set("profile-github",       profile.github)
  set("profile-bio",          about.bio)
  set("profile-focus",        about.focus)
  set("profile-core-stack",   about.coreStack)
  set("profile-availability", profile.availability)
  document.getElementById("profile-open-to-work").checked = profile.openToWork !== false

  const ALL_BUILT_IN      = ["SQL","Power BI","Tableau","Python","Excel","Claude Code","Git","Power Automate","Copilot","Redshift","Salesforce","Jira"]
  const configSkillNames  = (technicalSkills || []).map(s => s.name)
  const selectedBuiltIn   = configSkillNames.filter(n => ALL_BUILT_IN.includes(n))
  const customFromConfig  = (technicalSkills || [])
    .filter(s => !ALL_BUILT_IN.includes(s.name))
    .map(s => ({ name: s.name, description: s.description, logoFile: null }))

  setState({ selectedSkills: selectedBuiltIn, customSkills: customFromConfig })
  renderSkillsCheckboxes()

  document.getElementById("jobs-list").innerHTML     = ""
  document.getElementById("projects-list").innerHTML = ""
  document.getElementById("certs-list").innerHTML    = ""

  initWorkExperienceStep(workExperience || [])
  initProjectsStep(projects || [])
  initCertificationsStep(certifications || [])
}
```

- [ ] **Step 5: Verify toggle behaviour**

Serve locally. On Step 1:
- Click "Edit Portfolio" — repo name field appears, description text changes
- Click "Generate Portfolio" — repo name field hides, description reverts
- No console errors

- [ ] **Step 6: Commit**

```
git add app.js
git commit -m "feat: add toggle listeners, edit mode Step 1 submit, and form population"
```

---

### Task 11: app.js — Step 6 edit mode and edit success

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Update btn-to-step-6 handler**

Find and replace the `document.getElementById("btn-to-step-6").addEventListener("click", ...)` block:

```js
document.getElementById("btn-to-step-6").addEventListener("click", () => {
  collectCertifications()
  const state          = getState()
  const repoNameOverride = state.mode === "edit" ? state.repoName : null
  renderReviewPanel(state, repoNameOverride)

  const step6Title = document.querySelector("#step-6 .step-title")
  const deployBtnText = document.querySelector("#btn-deploy .btn-text")
  if (state.mode === "edit") {
    step6Title.textContent  = "Review & Update"
    deployBtnText.textContent = "Update My Portfolio"
  } else {
    step6Title.textContent  = "Review & Deploy"
    deployBtnText.textContent = "Create My Portfolio"
  }

  goToStep(6)
})
```

- [ ] **Step 2: Replace the deploy button handler**

Find and replace the entire `document.getElementById("btn-deploy").addEventListener("click", ...)` block:

```js
document.getElementById("btn-deploy").addEventListener("click", async () => {
  const state = getState()
  if (!state.pat) {
    showToast("Session expired — please restart and re-enter your token")
    goToStep(1)
    return
  }

  const btn = document.getElementById("btn-deploy")
  setButtonLoading(btn, true)
  try {
    const configJson = generateConfigJson()

    if (state.mode === "edit") {
      const fullName   = `${state.githubUser.login}/${state.repoName}`
      const photoFile  = state.profilePhotoFile  || null
      const resumeFile = state.profileResumeFile || null
      const repoUrl    = await updatePortfolio(state.pat, fullName, configJson, photoFile, resumeFile, state.customSkills, state.projects)
      renderEditSuccessScreen(repoUrl)
      goToStep(0, "screen-success-edit")
    } else {
      const repoName   = generateRepoName(state.profile.name)
      const photoFile  = state.profilePhotoFile  || null
      const resumeFile = state.profileResumeFile || null
      const repoUrl    = await deployPortfolio(state.pat, repoName, configJson, photoFile, resumeFile, state.customSkills, state.projects)
      renderSuccessScreen(repoUrl)
      goToStep(0)
    }
  } catch (err) {
    showToast(err.message)
  } finally {
    setButtonLoading(btn, false)
  }
})
```

- [ ] **Step 3: Verify generate mode still works**

Serve locally. Complete the full Generate flow (Steps 1–6). Confirm:
- Step 6 title: "Review & Deploy"
- Button: "Create My Portfolio"
- Deploy succeeds and shows the original generate success screen

- [ ] **Step 4: Verify edit mode end-to-end**

Switch to "Edit Portfolio". Enter a valid PAT and existing repo name. Click "Verify Token". Confirm:
- Step 2 profile fields are pre-filled from the config
- Step 3 existing jobs appear pre-filled
- Step 4 existing projects appear pre-filled (text only, image fields empty)
- Step 5 existing certs appear pre-filled
- Step 6 title: "Review & Update", button: "Update My Portfolio"
- Review panel shows the existing repo name (not a newly generated one)
- Clicking "Update My Portfolio" fires a PUT to `contents/lib/portfolio-config.json` (check Network tab)
- Edit success screen shows with the correct repo URL

- [ ] **Step 5: Commit**

```
git add app.js
git commit -m "feat: wire up Step 6 edit mode deploy and edit success screen"
```
