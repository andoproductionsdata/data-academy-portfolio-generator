import { getState, setState } from "./modules/state.js"
import { goToStep }          from "./modules/steps.js"
import { validatePAT, validateProfile } from "./modules/validate.js"
import { verifyPAT, deployPortfolio, fetchPortfolioConfig, updatePortfolio } from "./modules/github.js"
import { generateConfigJson }           from "./modules/codegen.js"
import {
  showToast, hideToast,
  setButtonLoading, setFieldError, clearFormErrors,
  renderReviewPanel, renderSuccessScreen, renderEditSuccessScreen, generateRepoName,
} from "./modules/ui.js"
import { addProjectCard, collectProjects, initProjectsStep }           from "./modules/projects-step.js"
import { addJobCard, collectWorkExperience, initWorkExperienceStep }   from "./modules/work-experience-step.js"
import { addCertCard, collectCertifications, initCertificationsStep }  from "./modules/certifications-step.js"

// ── Skills checkboxes (rendered on boot) ────────────────────────
const ALL_SKILLS = ["SQL","Power BI","Tableau","Python","Excel","Claude Code","Git","Power Automate","Copilot","Redshift","Salesforce","Jira"]

function renderSkillsCheckboxes() {
  const container = document.getElementById("skills-checkboxes")
  const { selectedSkills, customSkills } = getState()
  container.innerHTML = ""

  const allNames = [...ALL_SKILLS, ...customSkills.map(s => s.name)]

  allNames.forEach(skillName => {
    const isCustom = !ALL_SKILLS.includes(skillName)
    const checked  = selectedSkills.includes(skillName)
    const label    = document.createElement("label")
    label.innerHTML = `<input type="checkbox" value="${skillName}" ${checked ? "checked" : ""} /><span>${skillName}</span>${isCustom ? `<button type="button" class="skill-remove" data-skill="${skillName}" aria-label="Remove">×</button>` : ""}`

    label.querySelector("input").addEventListener("change", () => {
      const selected = Array.from(document.querySelectorAll("#skills-checkboxes input:checked")).map(el => el.value)
      setState({ selectedSkills: selected })
    })

    const removeBtn = label.querySelector(".skill-remove")
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault()
        const name  = removeBtn.dataset.skill
        const state = getState()
        setState({
          customSkills:   state.customSkills.filter(s => s.name !== name),
          selectedSkills: state.selectedSkills.filter(s => s !== name),
        })
        renderSkillsCheckboxes()
      })
    }

    container.appendChild(label)
  })
}

let pendingSkillIconFile = null

document.getElementById("custom-skill-icon-file").addEventListener("change", (e) => {
  const file    = e.target.files[0]
  const preview = document.getElementById("custom-skill-icon-preview")
  if (!file) { pendingSkillIconFile = null; preview.classList.add("hidden"); return }
  pendingSkillIconFile = file
  preview.src = URL.createObjectURL(file)
  preview.classList.remove("hidden")
})

document.getElementById("btn-add-skill").addEventListener("click", () => {
  const nameInput = document.getElementById("custom-skill-input")
  const descInput = document.getElementById("custom-skill-description")
  const name      = nameInput.value.trim()
  if (!name) return
  const state = getState()
  if (state.customSkills.find(s => s.name === name) || ALL_SKILLS.includes(name)) return
  setState({
    customSkills:   [...state.customSkills, { name, logoFile: pendingSkillIconFile, description: descInput.value.trim() }],
    selectedSkills: [...state.selectedSkills, name],
  })
  nameInput.value = ""
  descInput.value = ""
  pendingSkillIconFile = null
  document.getElementById("custom-skill-icon-preview").classList.add("hidden")
  document.getElementById("custom-skill-icon-file").value = ""
  renderSkillsCheckboxes()
})

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

// ── Step 1: GitHub Auth ──────────────────────────────────────────

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

// ── Step 2: Profile ──────────────────────────────────────────────

document.getElementById("btn-back-to-1").addEventListener("click", () => goToStep(1))

document.getElementById("profile-photo-file").addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (!file) return
  const preview = document.getElementById("photo-preview")
  preview.src = URL.createObjectURL(file)
  preview.classList.remove("hidden")
  setState({ profilePhotoFile: file })
})

document.getElementById("profile-resume-file").addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (!file) return
  document.getElementById("resume-filename").textContent = file.name
  setState({ profileResumeFile: file })
})

document.getElementById("form-profile").addEventListener("submit", (e) => {
  e.preventDefault()
  const form = e.target
  clearFormErrors(form)

  const profile = {
    name:         form.querySelector("#profile-name").value.trim(),
    tagline:      form.querySelector("#profile-tagline").value.trim(),
    email:        form.querySelector("#profile-email").value.trim(),
    phone:        form.querySelector("#profile-phone").value.trim(),
    location:     form.querySelector("#profile-location").value.trim(),
    linkedin:     form.querySelector("#profile-linkedin").value.trim(),
    github:       form.querySelector("#profile-github").value.trim(),
    openToWork:   form.querySelector("#profile-open-to-work").checked,
    availability: form.querySelector("#profile-availability").value.trim(),
    bio:          form.querySelector("#profile-bio").value.trim(),
    focus:        form.querySelector("#profile-focus").value.trim(),
    coreStack:    form.querySelector("#profile-core-stack").value.trim(),
  }

  const errors = validateProfile(profile)
  if (errors) {
    if (errors.name)     setFieldError("profile-name-error", errors.name)
    if (errors.tagline)  setFieldError("profile-tagline-error", errors.tagline)
    if (errors.email)    setFieldError("profile-email-error", errors.email)
    if (errors.linkedin) setFieldError("profile-linkedin-error", errors.linkedin)
    if (errors.github)   setFieldError("profile-github-error", errors.github)
    return
  }

  setState({ profile })
  initWorkExperienceStep()
  goToStep(3)
})

// ── Step 3: Work Experience ──────────────────────────────────────

document.getElementById("btn-back-to-2").addEventListener("click", () => goToStep(2))
document.getElementById("btn-add-job").addEventListener("click", () => addJobCard())

document.getElementById("btn-to-step-4").addEventListener("click", () => {
  collectWorkExperience()
  initProjectsStep()
  goToStep(4)
})

// ── Step 4: Projects ─────────────────────────────────────────────

document.getElementById("btn-back-to-3").addEventListener("click", () => goToStep(3))
document.getElementById("btn-add-project").addEventListener("click", () => addProjectCard())

document.getElementById("btn-to-step-5").addEventListener("click", () => {
  collectProjects()
  initCertificationsStep()
  goToStep(5)
})

// ── Step 5: Certifications ───────────────────────────────────────

document.getElementById("btn-back-to-4").addEventListener("click", () => goToStep(4))
document.getElementById("btn-add-cert").addEventListener("click", () => addCertCard())

document.getElementById("btn-to-step-6").addEventListener("click", () => {
  collectCertifications()
  const state            = getState()
  const repoNameOverride = state.mode === "edit" ? state.repoName : null
  renderReviewPanel(state, repoNameOverride)

  const step6Title    = document.querySelector("#step-6 .step-title")
  const deployBtnText = document.querySelector("#btn-deploy .btn-text")
  if (state.mode === "edit") {
    step6Title.textContent    = "Review & Update"
    deployBtnText.textContent = "Update My Portfolio"
  } else {
    step6Title.textContent    = "Review & Deploy"
    deployBtnText.textContent = "Create My Portfolio"
  }

  goToStep(6)
})

// ── Step 6: Review & Deploy ──────────────────────────────────────

document.getElementById("btn-back-to-5").addEventListener("click", () => goToStep(5))

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

// ── Toast close ──────────────────────────────────────────────────

document.getElementById("toast-close").addEventListener("click", () => hideToast())

// ── Dashboard slide cards ────────────────────────────────────────

function makeSlideCard(number) {
  const card = document.createElement("div")
  card.className = "slide-card"

  const header = document.createElement("div")
  header.className = "slide-card-header"
  header.innerHTML = `<span class="slide-number">Page ${number}</span>`

  const removeBtn = document.createElement("button")
  removeBtn.type = "button"
  removeBtn.className = "btn-remove-slide"
  removeBtn.setAttribute("aria-label", "Remove page")
  removeBtn.textContent = "×"
  header.appendChild(removeBtn)

  const titleInput = document.createElement("input")
  titleInput.type = "text"
  titleInput.name = "slideTitle"
  titleInput.className = "field-input"
  titleInput.placeholder = "e.g. Summary Page, Operations Overview"

  const descTextarea = document.createElement("textarea")
  descTextarea.name = "slideDescription"
  descTextarea.className = "field-input field-textarea"
  descTextarea.rows = 2
  descTextarea.placeholder = "What does this page show? What can users see or do here?"

  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.name = "slideImage"
  fileInput.accept = "image/*"
  fileInput.style.display = "none"

  const fileLabel = document.createElement("label")
  fileLabel.className = "btn-upload-thumb"
  fileLabel.textContent = "Choose Image"
  fileLabel.appendChild(fileInput)

  const filename = document.createElement("span")
  filename.className = "thumb-filename"
  filename.textContent = "No file chosen"

  const preview = document.createElement("img")
  preview.className = "thumb-preview"
  preview.alt = "Slide preview"
  preview.style.display = "none"

  const imageRow = document.createElement("div")
  imageRow.className = "thumb-upload-row"
  imageRow.appendChild(fileLabel)
  imageRow.appendChild(filename)
  imageRow.appendChild(preview)

  card.appendChild(header)
  card.appendChild(titleInput)
  card.appendChild(descTextarea)
  card.appendChild(imageRow)
  return card
}

document.addEventListener("click", (e) => {
  if (e.target.matches(".btn-add-slide")) {
    const projectCard = e.target.closest(".project-card")
    const list = projectCard.querySelector(".slides-list")
    list.appendChild(makeSlideCard(list.children.length + 1))
  }
  if (e.target.matches(".btn-remove-slide")) {
    const list = e.target.closest(".slides-list")
    e.target.closest(".slide-card").remove()
    Array.from(list.children).forEach((c, i) => {
      c.querySelector(".slide-number").textContent = `Page ${i + 1}`
    })
  }
})

document.addEventListener("change", (e) => {
  if (e.target.matches('input[name="slideImage"]')) {
    const file = e.target.files[0]
    if (!file) return
    const card = e.target.closest(".slide-card")
    card.querySelector(".thumb-preview").src = URL.createObjectURL(file)
    card.querySelector(".thumb-preview").style.display = "block"
    card.querySelector(".thumb-filename").textContent = file.name
  }
})

// ── Project image previews (thumbnail + outcome, delegated) ──────

document.addEventListener("change", (e) => {
  if (e.target.matches('input[name="outcomeImage"]')) {
    const file = e.target.files[0]
    if (!file) return
    const card = e.target.closest(".project-card")
    card.querySelector(".outcome-preview").src = URL.createObjectURL(file)
    card.querySelector(".outcome-preview").style.display = "block"
    card.querySelector(".outcome-filename").textContent = file.name
    return
  }
  if (e.target.matches('input[name="whatIBuiltImage"]')) {
    const file = e.target.files[0]
    if (!file) return
    const card = e.target.closest(".project-card")
    card.querySelector(".whatIBuilt-preview").src = URL.createObjectURL(file)
    card.querySelector(".whatIBuilt-preview").style.display = "block"
    card.querySelector(".whatIBuilt-filename").textContent = file.name
    return
  }
  if (!e.target.matches('input[name="thumbnailFile"]')) return
  const file = e.target.files[0]
  if (!file) return
  const card = e.target.closest(".project-card")
  if (!card) return
  card.querySelector(".thumb-preview").src = URL.createObjectURL(file)
  card.querySelector(".thumb-preview").style.display = "block"
  card.querySelector(".thumb-filename").textContent = file.name
})

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

  const ALL_BUILT_IN     = ["SQL","Power BI","Tableau","Python","Excel","Claude Code","Git","Power Automate","Copilot","Redshift","Salesforce","Jira"]
  const configSkillNames = (technicalSkills || []).map(s => s.name)
  const selectedBuiltIn  = configSkillNames.filter(n => ALL_BUILT_IN.includes(n))
  const customFromConfig = (technicalSkills || [])
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

// ── Boot ─────────────────────────────────────────────────────────

renderSkillsCheckboxes()
goToStep(1)
