import { getState } from "./state.js"

const ALL_SKILLS = [
  { name: "SQL",            description: "Data cleaning, joins, CTEs, query optimisation",                           logo: "/logo-sql.png" },
  { name: "Power BI",       description: "DAX, interactive dashboards, data modelling",                              logo: "/logo-powerbi.png" },
  { name: "Tableau",        description: "Advanced visualisations, calculated fields, parameters",                   logo: "/logo-tableau.png" },
  { name: "Python",         description: "Pandas, NumPy, Matplotlib, data automation",                               logo: "/logo-python.png" },
  { name: "Excel",          description: "Pivot tables, Power Query, formulas, data validation",                     logo: "/logo-excel.png" },
  { name: "Claude Code",    description: "AI-assisted development, prompt engineering, automation workflows",         logo: "/logo-claude.png" },
  { name: "Git",            description: "Version control, branching strategies, collaborative workflows",            logo: "/logo-git.png" },
  { name: "Power Automate", description: "Workflow automation, scheduled flows, data integration",                   logo: "/logo-power-automate.png" },
  { name: "Copilot",        description: "AI-powered productivity, code assistance, intelligent insights",            logo: "/logo-copilot.png" },
  { name: "Redshift",       description: "Cloud data warehousing, large-scale analytics, SQL querying",              logo: "/logo-redshift.png" },
  { name: "Salesforce",     description: "CRM data analysis, reporting, pipeline and sales insights",                logo: "/logo-salesforce.png" },
  { name: "Jira",           description: "Project tracking, agile workflows, sprint reporting",                      logo: "/logo-jira.png" },
]

function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60)
}

function toParagraphs(raw) {
  if (!raw || !raw.trim()) return []
  return [raw.trim()]
}

function toLines(raw) {
  if (!raw || !raw.trim()) return []
  return raw.split("\n").map(s => s.trim()).filter(Boolean)
}

export function generateConfigJson() {
  const { profile, profilePhotoFile, profileResumeFile, selectedSkills, customSkills, workExperience, projects, certifications, existingConfig, theme } = getState()

  const photoUrl = profilePhotoFile
    ? `/profile-photo.${profilePhotoFile.name.split(".").pop().toLowerCase()}`
    : (existingConfig?.profile?.photoUrl || "/placeholder.svg")

  const resumeUrl = profileResumeFile
    ? "/resume.pdf"
    : (existingConfig?.profile?.resumeUrl || "/resume-placeholder.pdf")

  const technicalSkills = [
    ...ALL_SKILLS.filter(s => selectedSkills.includes(s.name)),
    ...customSkills.filter(s => selectedSkills.includes(s.name)).map(s => {
      const slug          = s.name.toLowerCase().replace(/[^a-z0-9]/g, "-")
      const existingSkill = existingConfig?.technicalSkills?.find(sk => sk.name === s.name)
      const logo          = s.logoFile
        ? `/skill-${slug}.${s.logoFile.name.split(".").pop().toLowerCase()}`
        : (existingSkill?.logo || "")
      return { name: s.name, description: s.description || "", logo }
    }),
  ]

  const config = {
    theme: theme || "purple",
    profile: {
      name:         profile.name || "Your Name",
      role:         "Data Analyst",
      tagline:      profile.tagline || "",
      email:        profile.email || "",
      phone:        profile.phone || "",
      location:     profile.location || "",
      linkedin:     profile.linkedin || "",
      github:       profile.github || "",
      photoUrl,
      resumeUrl,
      openToWork:   profile.openToWork !== false,
      availability: profile.availability || "",
    },
    about: {
      bio:       profile.bio || "",
      focus:     profile.focus || "",
      coreStack: profile.coreStack || "",
    },
    technicalSkills,
    tools: [],
    workExperience: workExperience.map(job => ({
      title:            job.title || "",
      company:          job.company || "",
      location:         job.location || "",
      duration:         job.duration || "",
      type:             "Full-time",
      responsibilities: toLines(job.responsibilities),
    })),
    certifications: certifications.length > 0
      ? certifications
      : [{ name: "Certification Name", organisation: "Issuing Organisation", date: "2024", credentialUrl: "#" }],
    projects: projects.map((p, i) => {
      const existingProject = existingConfig?.projects?.[i]
      const slug            = toSlug(p.title) || `project-${i + 1}`

      const thumbExt = p.thumbnailFile ? p.thumbnailFile.name.split(".").pop().toLowerCase() : null
      const preview  = thumbExt
        ? `/project-${slug}-thumb.${thumbExt}`
        : (existingProject?.preview || "/placeholder.svg")

      const buildImage = p.whatIBuiltImageFile
        ? `/project-${slug}-build.${p.whatIBuiltImageFile.name.split(".").pop().toLowerCase()}`
        : (existingProject?.buildImage || "")

      const outcomeImage = p.outcomeImageFile
        ? `/project-${slug}-outcome.${p.outcomeImageFile.name.split(".").pop().toLowerCase()}`
        : (existingProject?.outcomeImage || "")

      const dashboardSlides = (p.dashboardSlides ?? []).map((s, si) => {
        const existingSlide = existingProject?.dashboardSlides?.[si]
        const ext           = s.imageFile ? s.imageFile.name.split(".").pop().toLowerCase() : null
        const img           = ext
          ? `/project-${slug}-slide-${si + 1}.${ext}`
          : (existingSlide?.image || "")
        return { title: s.title, description: s.description ? [s.description] : [], image: img }
      })

      return {
        slug,
        title:                p.title || `Project ${i + 1}`,
        tools:                [],
        company:              p.company || "",
        industry:             p.industry || "",
        role:                 "Data Analyst",
        duration:             "",
        summary:              p.summary || "",
        preview,
        challenge:            toParagraphs(p.summary),
        requirements:         toParagraphs(p.requirements),
        customSections:       (p.customSections ?? []).map(s => ({ title: s.title, content: s.content })),
        keyDeliverables:      [],
        kpiTargets:           [],
        whatIBuilt:           toParagraphs(p.whatIBuilt1),
        dashboardTitle:       p.dashboardTitle || "",
        dashboardDescription: p.dashboardDescription || "",
        dashboardSlides,
        buildImage,
        sqlSnippet:           p.sqlSnippet || "",
        sqlDescription:       p.codeDescription || "",
        outcome:              toParagraphs(p.outcome),
        outcomeImage,
        impact:               [],
        githubUrl:            p.githubUrl || null,
        liveUrl:              null,
        gallery:              [],
      }
    }),
  }

  return JSON.stringify(config, null, 2)
}
