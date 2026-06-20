const _state = {
  pat: "",
  githubUser: null,
  profile: {
    name: "",
    role: "",
    tagline: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    photoUrl: "",
    openToWork: true,
    availability: "",
  },
  projects: [],
}

export function getState() {
  return { ..._state }
}

export function setState(partial) {
  Object.assign(_state, partial)
}
