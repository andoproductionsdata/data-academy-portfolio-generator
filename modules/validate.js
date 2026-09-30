export function validatePAT(value) {
  if (!value || !value.trim()) return "Token is required"
  const v = value.trim()
  if (!v.startsWith("ghp_") && !v.startsWith("github_pat_")) {
    return "Token must start with ghp_ or github_pat_"
  }
  if (v.length < 20) return "Token looks too short — did you paste the full token?"
  return null
}

export function validateProfile(profile) {
  const errors = {}
  if (!profile.name?.trim()) errors.name = "Name is required"
  if (!profile.tagline?.trim()) errors.tagline = "Tagline is required"
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.email = "Enter a valid email address"
  }
  if (profile.linkedin && !profile.linkedin.startsWith("http")) {
    errors.linkedin = "LinkedIn URL must start with http"
  }
  if (profile.github && !profile.github.startsWith("http")) {
    errors.github = "GitHub URL must start with http"
  }
  return Object.keys(errors).length > 0 ? errors : null
}

export function validateProject(project) {
  const errors = {}
  if (!project.title?.trim()) errors.title = "Project title is required"
  if (!project.summary?.trim()) errors.summary = "Summary is required"
  return Object.keys(errors).length > 0 ? errors : null
}
