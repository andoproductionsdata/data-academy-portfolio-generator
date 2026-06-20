import { getState, setState } from "./modules/state.js"
import { goToStep }          from "./modules/steps.js"
import { validatePAT, validateProfile } from "./modules/validate.js"
import { verifyPAT, deployPortfolio }   from "./modules/github.js"
import { generateConfigJson }           from "./modules/codegen.js"
import {
  showToast, hideToast,
  setButtonLoading, setFieldError, clearFormErrors,
  renderReviewPanel, renderSuccessScreen, generateRepoName,
} from "./modules/ui.js"
import { addProjectCard, collectProjects, initProjectsStep } from "./modules/projects-step.js"

// ── Step 1: GitHub Auth ──────────────────────────────────────────

document.getElementById("form-auth").addEventListener("submit", async (e) => {
  e.preventDefault()
  const pat = document.getElementById("pat-input").value.trim()
  setFieldError("pat-error", null)

  const patErr = validatePAT(pat)
  if (patErr) { setFieldError("pat-error", patErr); return }

  const btn = document.getElementById("btn-verify-token")
  setButtonLoading(btn, true)
  try {
    const user = await verifyPAT(pat)
    setState({ pat, githubUser: user })
    document.getElementById("auth-avatar").src   = user.avatar_url
    document.getElementById("auth-username").textContent = `@${user.login}`
    document.getElementById("auth-user-card").classList.remove("hidden")
    await new Promise(r => setTimeout(r, 800))
    goToStep(2)
  } catch (err) {
    setFieldError("pat-error", err.message)
  } finally {
    setButtonLoading(btn, false)
  }
})

// ── Step 2: Profile ──────────────────────────────────────────────

document.getElementById("btn-back-to-1").addEventListener("click", () => goToStep(1))

document.getElementById("form-profile").addEventListener("submit", (e) => {
  e.preventDefault()
  const form = e.target
  clearFormErrors(form)

  const profile = {
    name:         form.querySelector("#profile-name").value.trim(),
    role:         form.querySelector("#profile-role").value.trim(),
    tagline:      form.querySelector("#profile-tagline").value.trim(),
    email:        form.querySelector("#profile-email").value.trim(),
    phone:        form.querySelector("#profile-phone").value.trim(),
    linkedin:     form.querySelector("#profile-linkedin").value.trim(),
    github:       form.querySelector("#profile-github").value.trim(),
    photoUrl:     form.querySelector("#profile-photo").value.trim(),
    openToWork:   form.querySelector("#profile-open-to-work").checked,
    availability: form.querySelector("#profile-availability").value.trim(),
  }

  const errors = validateProfile(profile)
  if (errors) {
    if (errors.name)     setFieldError("profile-name-error", errors.name)
    if (errors.role)     setFieldError("profile-role-error", errors.role)
    if (errors.tagline)  setFieldError("profile-tagline-error", errors.tagline)
    if (errors.email)    setFieldError("profile-email-error", errors.email)
    if (errors.linkedin) setFieldError("profile-linkedin-error", errors.linkedin)
    if (errors.github)   setFieldError("profile-github-error", errors.github)
    return
  }

  setState({ profile })
  initProjectsStep()
  goToStep(3)
})

// ── Step 3: Projects ─────────────────────────────────────────────

document.getElementById("btn-back-to-2").addEventListener("click", () => goToStep(2))
document.getElementById("btn-add-project").addEventListener("click", () => addProjectCard())

document.getElementById("btn-to-step-4").addEventListener("click", () => {
  collectProjects()
  renderReviewPanel(getState())
  goToStep(4)
})

// ── Step 4: Review & Deploy ──────────────────────────────────────

document.getElementById("btn-back-to-3").addEventListener("click", () => goToStep(3))

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
    const repoName   = generateRepoName(state.profile.name)
    const repoUrl    = await deployPortfolio(state.pat, repoName, configJson)
    renderSuccessScreen(repoUrl)
    goToStep(0)
  } catch (err) {
    showToast(err.message)
  } finally {
    setButtonLoading(btn, false)
  }
})

// ── Toast close ──────────────────────────────────────────────────

document.getElementById("toast-close").addEventListener("click", () => hideToast())

// ── Boot ─────────────────────────────────────────────────────────

goToStep(1)
