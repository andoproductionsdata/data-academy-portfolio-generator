export function generateRepoName(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40) + "-data-portfolio"
  )
}

export function showToast(message, type = "error") {
  const toast = document.getElementById("toast")
  const msgEl = document.getElementById("toast-message")
  msgEl.textContent = message
  toast.classList.remove("hidden", "error", "info")
  toast.classList.add(type)
  clearTimeout(toast._timeout)
  toast._timeout = setTimeout(() => toast.classList.add("hidden"), 6000)
}

export function hideToast() {
  document.getElementById("toast").classList.add("hidden")
}

export function setButtonLoading(btn, loading) {
  btn.disabled = loading
  const text    = btn.querySelector(".btn-text")
  const spinner = btn.querySelector(".btn-spinner")
  if (text)    text.style.opacity = loading ? "0" : "1"
  if (spinner) spinner.classList.toggle("hidden", !loading)
}

export function setFieldError(errorId, message) {
  const el    = document.getElementById(errorId)
  if (!el) return
  const input = el.previousElementSibling
  if (message) {
    el.textContent = message
    el.classList.remove("hidden")
    if (input) input.classList.add("invalid")
  } else {
    el.textContent = ""
    el.classList.add("hidden")
    if (input) input.classList.remove("invalid")
  }
}

export function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach(el => {
    el.textContent = ""
    el.classList.add("hidden")
  })
  form.querySelectorAll(".field-input.invalid").forEach(el => el.classList.remove("invalid"))
}

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

export function renderSuccessScreen(repoUrl) {
  const linkEl = document.getElementById("success-repo-url")
  linkEl.href = repoUrl
  linkEl.textContent = repoUrl
}

export function renderEditSuccessScreen(repoUrl) {
  const linkEl = document.getElementById("edit-success-repo-url")
  linkEl.href = repoUrl
  linkEl.textContent = repoUrl
}
