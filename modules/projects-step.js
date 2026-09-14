import { setState } from "./state.js"

const MAX_PROJECTS = 6

export function collectProjects() {
  const cards = document.querySelectorAll("#projects-list .project-card")
  const projects = Array.from(cards).map(card => {
    const form = card.querySelector(".project-form")
    const get  = name => form.querySelector(`[name="${name}"]`)?.value?.trim() ?? ""

    const thumbnailFile       = card.querySelector('input[name="thumbnailFile"]')?.files?.[0] || null
    const outcomeImageFile    = card.querySelector('input[name="outcomeImage"]')?.files?.[0] || null
    const whatIBuiltImageFile = card.querySelector('input[name="whatIBuiltImage"]')?.files?.[0] || null

    const dashboardSlides = Array.from(card.querySelectorAll(".slide-card")).map(slide => ({
      title:       slide.querySelector('[name="slideTitle"]')?.value?.trim() ?? "",
      description: slide.querySelector('[name="slideDescription"]')?.value?.trim() ?? "",
      imageFile:   slide.querySelector('[name="slideImage"]')?.files?.[0] || null,
    })).filter(s => s.title || s.description || s.imageFile)

    const customSections = Array.from(card.querySelectorAll(".custom-section-row")).map(row => ({
      title:   row.querySelector('[name="customSectionTitle"]')?.value?.trim() ?? "",
      content: row.querySelector('[name="customSectionContent"]')?.value?.trim() ?? "",
    })).filter(s => s.title || s.content)

    return {
      thumbnailFile,
      outcomeImageFile,
      whatIBuiltImageFile,
      title:                get("title"),
      company:              get("company"),
      industry:             get("industry"),
      summary:              get("summary"),
      requirements:         get("requirements"),
      customSections,
      whatIBuilt1:          get("whatIBuilt1"),
      codeTitle:            get("codeTitle"),
      codeDescription:      get("codeDescription"),
      sqlSnippet:           get("sqlSnippet"),
      dashboardTitle:       get("dashboardTitle"),
      dashboardDescription: get("dashboardDescription"),
      outcome:              get("outcome"),
      githubUrl:            get("githubUrl"),
      dashboardSlides,
    }
  })
  setState({ projects })
}

function makeCustomSectionRow() {
  const row = document.createElement("div")
  row.className = "custom-section-row"

  const header = document.createElement("div")
  header.className = "custom-section-header"

  const titleInput = document.createElement("input")
  titleInput.type = "text"
  titleInput.name = "customSectionTitle"
  titleInput.className = "field-input"
  titleInput.placeholder = "Section title e.g. Key Performance Targets"

  const removeBtn = document.createElement("button")
  removeBtn.type = "button"
  removeBtn.className = "btn-remove-section"
  removeBtn.setAttribute("aria-label", "Remove section")
  removeBtn.textContent = "×"
  removeBtn.addEventListener("click", () => row.remove())

  header.appendChild(titleInput)
  header.appendChild(removeBtn)

  const content = document.createElement("textarea")
  content.name = "customSectionContent"
  content.className = "field-input field-textarea"
  content.rows = 3
  content.placeholder = "Your content here — describe the section in a few sentences or bullet points."

  row.appendChild(header)
  row.appendChild(content)
  return row
}

export function addProjectCard(data = null) {
  const list = document.getElementById("projects-list")
  const currentCount = list.querySelectorAll(".project-card").length

  if (currentCount >= MAX_PROJECTS) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_PROJECTS} projects allowed`, "info")
    )
    return null
  }

  const template = document.getElementById("project-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".project-card")
  const form     = card.querySelector(".project-form")

  card.querySelector(".project-number").textContent = String(currentCount + 1)

  // Inject custom sections UI before the Build section label
  const buildLabel = Array.from(form.querySelectorAll(".project-section-label"))
    .find(el => el.textContent.trim() === "Build")

  const customContainer = document.createElement("div")
  customContainer.className = "custom-sections-list"

  const addSectionBtn = document.createElement("button")
  addSectionBtn.type = "button"
  addSectionBtn.className = "btn-add-section"
  addSectionBtn.textContent = "+ Add Custom Section"
  addSectionBtn.addEventListener("click", () => customContainer.appendChild(makeCustomSectionRow()))

  buildLabel.before(customContainer)
  buildLabel.before(addSectionBtn)

  card.querySelector(".btn-remove-project").addEventListener("click", () => {
    card.remove()
    renumberCards()
  })

  list.appendChild(card)

  if (data) {
    const set = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`)
      if (el) el.value = value ?? ""
    }
    set("title",                data.title)
    set("company",              data.company)
    set("industry",             data.industry)
    set("githubUrl",            data.githubUrl ?? "")
    set("summary",              data.summary)
    set("requirements",         Array.isArray(data.requirements)
      ? data.requirements.join("\n\n") : (data.requirements ?? ""))
    set("whatIBuilt1",          Array.isArray(data.whatIBuilt)
      ? data.whatIBuilt.join("\n\n") : (data.whatIBuilt ?? ""))
    set("sqlSnippet",           data.sqlSnippet)
    set("codeDescription",      data.sqlDescription)
    set("dashboardTitle",       data.dashboardTitle)
    set("dashboardDescription", data.dashboardDescription)
    set("outcome",              Array.isArray(data.outcome)
      ? data.outcome.join("\n\n") : (data.outcome ?? ""))

    if (Array.isArray(data.customSections)) {
      data.customSections.forEach(section => {
        const row = makeCustomSectionRow()
        row.querySelector('[name="customSectionTitle"]').value   = section.title ?? ""
        row.querySelector('[name="customSectionContent"]').value = section.content ?? ""
        customContainer.appendChild(row)
      })
    }

    if (Array.isArray(data.dashboardSlides)) {
      const addSlideBtn = card.querySelector(".btn-add-slide")
      const slidesList  = card.querySelector(".slides-list")
      data.dashboardSlides.forEach(slide => {
        addSlideBtn.click()
        const slideCards = slidesList.querySelectorAll(".slide-card")
        const newSlide   = slideCards[slideCards.length - 1]
        if (!newSlide) return
        const descText = Array.isArray(slide.description)
          ? slide.description.join("\n\n")
          : (slide.description ?? "")
        newSlide.querySelector('[name="slideTitle"]').value       = slide.title ?? ""
        newSlide.querySelector('[name="slideDescription"]').value = descText
      })
    }
  }

  updateAddButton()
  return card
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

export function initProjectsStep(projects = []) {
  if (projects.length > 0) {
    projects.forEach(p => addProjectCard(p))
  } else if (document.querySelectorAll("#projects-list .project-card").length === 0) {
    addProjectCard()
  }
}
