const API = "https://api.github.com"
const TEMPLATE_OWNER = "andoproductionsdata"
const TEMPLATE_REPO  = "data-academy-portfolio-template"

const SYNC_FILES = [
  "app/globals.css",
  "app/page.tsx",
  "app/projects/[slug]/page.tsx",
  "components/rich-text.tsx",
  "components/dashboard-carousel.tsx",
  "components/section-heading.tsx",
  "components/site-header.tsx",
  "components/sections/hero-section.tsx",
  "components/sections/about-section.tsx",
  "components/sections/projects-section.tsx",
  "components/sections/skills-section.tsx",
  "components/sections/certifications-section.tsx",
  "components/sections/work-experience-section.tsx",
  "components/sections/contact-section.tsx",
  "lib/portfolio-data.ts",
]

function headers(pat) {
  return {
    "Authorization": `Bearer ${pat}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  }
}

export async function verifyPAT(pat) {
  const res = await fetch(`${API}/user`, { headers: headers(pat) })
  if (res.status === 401) throw new Error("Token rejected — check it and try again")
  if (!res.ok) throw new Error(`GitHub returned ${res.status}: ${res.statusText}`)
  const data = await res.json()
  return { login: data.login, avatar_url: data.avatar_url }
}

export async function createFromTemplate(pat, repoName) {
  const checkRes = await fetch(`${API}/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}`, { headers: headers(pat) })
  if (!checkRes.ok) throw new Error(`Cannot reach template repo (${checkRes.status}): ${TEMPLATE_OWNER}/${TEMPLATE_REPO}`)
  const templateData = await checkRes.json()
  if (!templateData.is_template) throw new Error(`"Template repository" is not enabled on ${TEMPLATE_OWNER}/${TEMPLATE_REPO} — enable it in repo Settings.`)

  const res = await fetch(`${API}/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/generate`, {
    method: "POST",
    headers: headers(pat),
    body: JSON.stringify({
      name: repoName,
      description: "My Data Analytics Portfolio",
      private: false,
      include_all_branches: false,
    }),
  })
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`404 from GitHub: ${body.message || "Template repository not found"} — repo: ${TEMPLATE_OWNER}/${TEMPLATE_REPO}`)
  }
  if (res.status === 422) {
    const body = await res.json().catch(() => ({}))
    const msg = body.errors?.[0]?.message || ""
    if (msg.includes("already exists")) throw new Error("A repository with that name already exists in your account.")
    throw new Error(body.message || "Repository could not be created (422)")
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Failed to create repository: ${res.status}`)
  }
  const data = await res.json()
  return data.full_name
}

export async function waitForRepo(pat, fullName, maxWait = 30000) {
  const deadline = Date.now() + maxWait
  while (Date.now() < deadline) {
    const repoRes = await fetch(`${API}/repos/${fullName}`, { headers: headers(pat) })
    if (repoRes.ok) {
      const repo = await repoRes.json()
      if (repo.default_branch) {
        const branchRes = await fetch(
          `${API}/repos/${fullName}/branches/${repo.default_branch}`,
          { headers: headers(pat) }
        )
        if (branchRes.ok) {
          const branch = await branchRes.json()
          return branch.commit.sha
        }
      }
    }
    await new Promise(r => setTimeout(r, 2000))
  }
  throw new Error("Portfolio creation timed out. Refresh GitHub and try again.")
}

export async function getFileSHA(pat, fullName, filePath) {
  const res = await fetch(`${API}/repos/${fullName}/contents/${filePath}`, {
    headers: headers(pat),
  })
  if (res.status === 404) throw new Error(`File not found in your new repo: ${filePath}`)
  if (!res.ok) throw new Error(`Could not read ${filePath}: ${res.status}`)
  const data = await res.json()
  return data.sha
}

export async function updateFile(pat, fullName, filePath, content, sha) {
  const encoded = btoa(unescape(encodeURIComponent(content)))
  const res = await fetch(`${API}/repos/${fullName}/contents/${filePath}`, {
    method: "PUT",
    headers: headers(pat),
    body: JSON.stringify({
      message: "chore: inject portfolio data via Data Academy generator",
      content: encoded,
      sha,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Failed to update ${filePath}: ${res.status}`)
  }
}

async function getPublicFileSHA(pat, fullName, filename) {
  const res = await fetch(`${API}/repos/${fullName}/contents/public/${filename}`, {
    headers: headers(pat),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.sha
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function uploadPhoto(pat, fullName, file) {
  const ext     = file.name.split(".").pop().toLowerCase()
  const name    = `profile-photo.${ext}`
  const base64  = await fileToBase64(file)
  const sha     = await getPublicFileSHA(pat, fullName, name)
  const payload = { message: "chore: add profile photo", content: base64 }
  if (sha) payload.sha = sha
  const res = await fetch(`${API}/repos/${fullName}/contents/public/${name}`, {
    method: "PUT",
    headers: headers(pat),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Failed to upload photo: ${res.status}`)
  }
  return `/${name}`
}

export async function uploadResume(pat, fullName, file) {
  const base64  = await fileToBase64(file)
  const sha     = await getPublicFileSHA(pat, fullName, "resume.pdf")
  const payload = { message: "chore: add resume", content: base64 }
  if (sha) payload.sha = sha
  const res = await fetch(`${API}/repos/${fullName}/contents/public/resume.pdf`, {
    method: "PUT",
    headers: headers(pat),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Failed to upload resume: ${res.status}`)
  }
}

export async function uploadSkillIcons(pat, fullName, customSkills) {
  for (const skill of customSkills) {
    if (!skill.logoFile) continue
    const ext      = skill.logoFile.name.split(".").pop().toLowerCase()
    const slug     = skill.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
    const filename = `skill-${slug}.${ext}`
    const base64   = await fileToBase64(skill.logoFile)
    const sha      = await getPublicFileSHA(pat, fullName, filename)
    const payload  = { message: "chore: add skill icon", content: base64 }
    if (sha) payload.sha = sha
    const res = await fetch(`${API}/repos/${fullName}/contents/public/${filename}`, {
      method: "PUT",
      headers: headers(pat),
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Failed to upload icon for ${skill.name}`)
    }
  }
}

async function putPublicFile(pat, fullName, filename, file, message) {
  const base64  = await fileToBase64(file)
  const sha     = await getPublicFileSHA(pat, fullName, filename)
  const payload = { message, content: base64 }
  if (sha) payload.sha = sha
  const res = await fetch(`${API}/repos/${fullName}/contents/public/${filename}`, {
    method: "PUT",
    headers: headers(pat),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Failed to upload ${filename}`)
  }
}

async function uploadProjectAssets(pat, fullName, projects, configJson) {
  const config = JSON.parse(configJson)
  for (let i = 0; i < projects.length; i++) {
    const p    = projects[i]
    const slug = config.projects[i]?.slug || `project-${i + 1}`

    if (p.thumbnailFile) {
      const ext = p.thumbnailFile.name.split(".").pop().toLowerCase()
      await putPublicFile(pat, fullName, `project-${slug}-thumb.${ext}`, p.thumbnailFile, `chore: add thumbnail for ${slug}`)
    }

    if (p.outcomeImageFile) {
      const ext = p.outcomeImageFile.name.split(".").pop().toLowerCase()
      await putPublicFile(pat, fullName, `project-${slug}-outcome.${ext}`, p.outcomeImageFile, `chore: add outcome image for ${slug}`)
    }

    if (p.whatIBuiltImageFile) {
      const ext = p.whatIBuiltImageFile.name.split(".").pop().toLowerCase()
      await putPublicFile(pat, fullName, `project-${slug}-build.${ext}`, p.whatIBuiltImageFile, `chore: add build image for ${slug}`)
    }

    for (let ci = 0; ci < (p.codeSections ?? []).length; ci++) {
      const section = p.codeSections[ci]
      if (!section.imageFile) continue
      const ext = section.imageFile.name.split(".").pop().toLowerCase()
      await putPublicFile(pat, fullName, `project-${slug}-code-${ci}.${ext}`, section.imageFile, `chore: add code section image for ${slug}`)
    }

    for (let di = 0; di < (p.dashboards ?? []).length; di++) {
      const dashboard = p.dashboards[di]
      for (let si = 0; si < (dashboard.slides ?? []).length; si++) {
        const slide = dashboard.slides[si]
        if (!slide.imageFile) continue
        const ext = slide.imageFile.name.split(".").pop().toLowerCase()
        await putPublicFile(pat, fullName, `project-${slug}-dash-${di}-slide-${si + 1}.${ext}`, slide.imageFile, `chore: add slide for dashboard ${di + 1} of ${slug}`)
      }
    }

    for (let ci = 0; ci < (p.customSections ?? []).length; ci++) {
      const section = p.customSections[ci]
      if (!section.imageFile) continue
      const ext = section.imageFile.name.split(".").pop().toLowerCase()
      await putPublicFile(pat, fullName, `project-${slug}-custom-${ci}.${ext}`, section.imageFile, `chore: add custom section image for ${slug}`)
    }

    for (let ci = 0; ci < (p.customContent ?? []).length; ci++) {
      const section = p.customContent[ci]
      if (section.type === "text" || section.type === "code") {
        if (!section.imageFile) continue
        const ext = section.imageFile.name.split(".").pop().toLowerCase()
        await putPublicFile(pat, fullName, `project-${slug}-cc-${ci}.${ext}`, section.imageFile, `chore: add custom content image for ${slug}`)
      } else if (section.type === "dashboard") {
        for (let si = 0; si < (section.slides ?? []).length; si++) {
          const slide = section.slides[si]
          if (!slide.imageFile) continue
          const ext = slide.imageFile.name.split(".").pop().toLowerCase()
          await putPublicFile(pat, fullName, `project-${slug}-cc-${ci}-slide-${si + 1}.${ext}`, slide.imageFile, `chore: add custom dashboard slide for ${slug}`)
        }
      }
    }
  }
}

export async function deployPortfolio(pat, repoName, configJson, photoFile = null, resumeFile = null, customSkills = [], projects = []) {
  const fullName = await createFromTemplate(pat, repoName)
  await waitForRepo(pat, fullName)
  if (photoFile)            await uploadPhoto(pat, fullName, photoFile)
  if (resumeFile)           await uploadResume(pat, fullName, resumeFile)
  if (customSkills.length)  await uploadSkillIcons(pat, fullName, customSkills)
  if (projects.length)      await uploadProjectAssets(pat, fullName, projects, configJson)
  const sha = await getFileSHA(pat, fullName, "lib/portfolio-config.json")
  await updateFile(pat, fullName, "lib/portfolio-config.json", configJson, sha)
  return `https://github.com/${fullName}`
}

export async function fetchPortfolioConfig(pat, ownerLogin, repoName) {
  const res = await fetch(
    `${API}/repos/${ownerLogin}/${repoName}/contents/lib/portfolio-config.json`,
    { headers: headers(pat) }
  )
  if (res.status === 404) throw new Error("Repository or config file not found — check the repo name and try again")
  if (!res.ok) throw new Error(`Could not load portfolio config: ${res.status}`)
  const data  = await res.json()
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, "")), c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

async function syncTemplateFiles(pat, fullName) {
  for (const filePath of SYNC_FILES) {
    try {
      const templateRes = await fetch(`${API}/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/contents/${filePath}`, {
        headers: headers(pat),
      })
      if (!templateRes.ok) continue
      const templateData = await templateRes.json()
      const content = templateData.content.replace(/\n/g, "")

      const studentRes = await fetch(`${API}/repos/${fullName}/contents/${filePath}`, {
        headers: headers(pat),
      })
      const payload = { message: "chore: sync latest template updates", content }
      if (studentRes.ok) {
        const studentData = await studentRes.json()
        if (studentData.sha === templateData.sha) continue
        payload.sha = studentData.sha
      }

      await fetch(`${API}/repos/${fullName}/contents/${filePath}`, {
        method: "PUT",
        headers: headers(pat),
        body: JSON.stringify(payload),
      })
    } catch {
      // non-fatal — skip this file and continue
    }
  }
}

export async function updatePortfolio(pat, fullName, configJson, photoFile = null, resumeFile = null, customSkills = [], projects = []) {
  await syncTemplateFiles(pat, fullName)
  if (photoFile)           await uploadPhoto(pat, fullName, photoFile)
  if (resumeFile)          await uploadResume(pat, fullName, resumeFile)
  if (customSkills.length) await uploadSkillIcons(pat, fullName, customSkills)
  if (projects.length)     await uploadProjectAssets(pat, fullName, projects, configJson)
  const sha = await getFileSHA(pat, fullName, "lib/portfolio-config.json")
  await updateFile(pat, fullName, "lib/portfolio-config.json", configJson, sha)
  return `https://github.com/${fullName}`
}
