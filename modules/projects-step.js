import { setState } from "./state.js"

const MAX_PROJECTS = 6

export function collectProjects() {
  const cards = document.querySelectorAll("#projects-list .project-card")
  const projects = Array.from(cards).map(card => {
    const form = card.querySelector(".project-form")
    const get  = name => form.querySelector(`[name="${name}"]`)?.value?.trim() ?? ""
    return {
      title:      get("title"),
      company:    get("company"),
      industry:   get("industry"),
      duration:   get("duration"),
      summary:    get("summary"),
      challenge:  get("challenge"),
      whatIBuilt: get("whatIBuilt"),
      outcome:    get("outcome"),
      tools:      get("tools"),
      githubUrl:  get("githubUrl"),
    }
  })
  setState({ projects })
}

export function addProjectCard() {
  const list = document.getElementById("projects-list")
  const currentCount = list.querySelectorAll(".project-card").length

  if (currentCount >= MAX_PROJECTS) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_PROJECTS} projects allowed`, "info")
    )
    return
  }

  const template = document.getElementById("project-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".project-card")

  card.querySelector(".project-number").textContent = String(currentCount + 1)

  card.querySelector(".btn-remove-project").addEventListener("click", () => {
    card.remove()
    renumberCards()
  })

  list.appendChild(card)
  updateAddButton()
}

function renumberCards() {
  document.querySelectorAll("#projects-list .project-card").forEach((card, i) => {
    card.querySelector(".project-number").textContent = String(i + 1)
  })
  updateAddButton()
}

function updateAddButton() {
  const count = document.querySelectorAll("#projects-list .project-card").length
  const btn   = document.getElementById("btn-add-project")
  btn.disabled    = count >= MAX_PROJECTS
  btn.textContent = count >= MAX_PROJECTS ? `Maximum ${MAX_PROJECTS} projects reached` : "+ Add Project"
}

export function initProjectsStep() {
  if (document.querySelectorAll("#projects-list .project-card").length === 0) {
    addProjectCard()
  }
}
