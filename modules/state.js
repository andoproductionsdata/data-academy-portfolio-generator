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
  customSkills: [], // [{name, logoFile, description}]
  workExperience: [],
  projects: [],
  certifications: [],
}

export function getState() {
  return { ..._state }
}

export function setState(partial) {
  Object.assign(_state, partial)
}
