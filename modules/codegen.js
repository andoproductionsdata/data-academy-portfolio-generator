import { getState } from "./state.js"

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
}

function parseTools(raw) {
  if (!raw) return []
  return raw.split(",").map(s => s.trim()).filter(Boolean)
}

function toParagraphs(raw) {
  if (!raw || !raw.trim()) return [""]
  return [raw.trim()]
}

export function generateConfigJson() {
  const { profile, projects } = getState()

  const config = {
    profile: {
      name: profile.name || "Your Name",
      role: profile.role || "Data Analyst",
      tagline: profile.tagline || "",
      email: profile.email || "",
      phone: profile.phone || "",
      linkedin: profile.linkedin || "",
      github: profile.github || "",
      photoUrl: profile.photoUrl || "/ando-headshot.jpeg",
      resumeUrl: "/resume-placeholder.pdf",
      openToWork: profile.openToWork !== false,
      availability: profile.availability || "",
    },
    technicalSkills: [
      { name: "SQL",     description: "Data cleaning, joins, CTEs, query optimisation" },
      { name: "Power BI",description: "DAX, interactive dashboards, data modelling" },
      { name: "Tableau", description: "Advanced visualisations, calculated fields, parameters" },
      { name: "Python",  description: "Pandas, NumPy, Matplotlib, data automation" },
      { name: "Excel",   description: "Pivot tables, Power Query, formulas, data validation" },
    ],
    tools: ["Microsoft SQL Server", "Power BI", "Tableau", "VS Code", "Jupyter Notebook"],
    certifications: [
      { name: "Certification Name", organisation: "Issuing Organisation", date: "2024", credentialUrl: "#" },
    ],
    projects: projects.map((p, i) => ({
      slug: toSlug(p.title) || `project-${i + 1}`,
      title: p.title || `Project ${i + 1}`,
      company: p.company || "",
      industry: p.industry || "",
      role: "Data Analyst",
      duration: p.duration || "",
      summary: p.summary || "",
      tools: parseTools(p.tools),
      preview: "/placeholder.svg",
      challenge: toParagraphs(p.challenge),
      whatIBuilt: toParagraphs(p.whatIBuilt),
      outcome: toParagraphs(p.outcome),
      keyDeliverables: [],
      impact: [],
      githubUrl: p.githubUrl || null,
      liveUrl: null,
      gallery: [],
    })),
  }

  return JSON.stringify(config, null, 2)
}
