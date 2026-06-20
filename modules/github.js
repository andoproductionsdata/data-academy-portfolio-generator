const API = "https://api.github.com"
const TEMPLATE_OWNER = "YOUR_GITHUB_USERNAME"          // ← update after pushing template repo to GitHub
const TEMPLATE_REPO  = "data-academy-portfolio-template"

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
  if (res.status === 404) throw new Error("Template repository not found. Contact your academy.")
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

export async function deployPortfolio(pat, repoName, configJson) {
  const fullName = await createFromTemplate(pat, repoName)
  await waitForRepo(pat, fullName)
  const sha = await getFileSHA(pat, fullName, "lib/portfolio-config.json")
  await updateFile(pat, fullName, "lib/portfolio-config.json", configJson, sha)
  return `https://github.com/${fullName}`
}
