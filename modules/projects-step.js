import { setState } from "./state.js?v=3"

const MAX_PROJECTS = 6

export function collectProjects() {
  const cards = document.querySelectorAll("#projects-list .project-card")
  const projects = Array.from(cards).map(card => {
    const form = card.querySelector(".project-form")
    const get  = name => form.querySelector(`[name="${name}"]`)?.value?.trim() ?? ""

    const thumbnailFile       = card.querySelector('input[name="thumbnailFile"]')?.files?.[0] || null
    const isCustomMode        = card.querySelector(".template-fields")?.classList.contains("hidden") ?? false
    const tf                  = card.querySelector(".template-fields")

    const outcomeImageFile    = tf?.querySelector('input[name="outcomeImage"]')?.files?.[0] || null
    const whatIBuiltImageFile = tf?.querySelector('input[name="whatIBuiltImage"]')?.files?.[0] || null

    const collectDashRow = dashRow => {
      const slides = Array.from(dashRow.querySelectorAll(".slide-card")).map(slide => ({
        title:       slide.querySelector('[name="slideTitle"]')?.value?.trim() ?? "",
        description: slide.querySelector('[name="slideDescription"]')?.value?.trim() ?? "",
        imageFile:   slide.querySelector('[name="slideImage"]')?.files?.[0] || null,
      })).filter(s => s.title || s.description || s.imageFile)
      return {
        title:       dashRow.querySelector('[name="dashboardSectionTitle"]')?.value?.trim() ?? "",
        description: dashRow.querySelector('[name="dashboardSectionDescription"]')?.value?.trim() ?? "",
        slides,
      }
    }

    let codeSections = [], dashboards = [], customSections = [], customContent = []

    if (!isCustomMode) {
      codeSections = Array.from(tf?.querySelectorAll(".code-section-row") ?? []).map(row => ({
        title:       row.querySelector('[name="codeSectionTitle"]')?.value?.trim() ?? "",
        description: row.querySelector('[name="codeSectionDescription"]')?.value?.trim() ?? "",
        snippet:     row.querySelector('[name="codeSectionSnippet"]')?.value?.trim() ?? "",
        imageFile:   row.querySelector('[name="codeSectionImage"]')?.files?.[0] || null,
      })).filter(s => s.title || s.description || s.snippet || s.imageFile)

      dashboards = Array.from(tf?.querySelectorAll(".dashboard-section-row") ?? [])
        .map(collectDashRow)
        .filter(d => d.title || d.description || d.slides.length > 0)

      customSections = Array.from(tf?.querySelectorAll(".custom-section-row") ?? []).map(row => ({
        title:     row.querySelector('[name="customSectionTitle"]')?.value?.trim() ?? "",
        content:   row.querySelector('[name="customSectionContent"]')?.value?.trim() ?? "",
        imageFile: row.querySelector('[name="customSectionImage"]')?.files?.[0] || null,
      })).filter(s => s.title || s.content || s.imageFile)
    } else {
      customContent = Array.from(card.querySelectorAll(".custom-content-list > *")).map(section => {
        if (section.classList.contains("custom-section-row")) return {
          type:      "text",
          title:     section.querySelector('[name="customSectionTitle"]')?.value?.trim() ?? "",
          content:   section.querySelector('[name="customSectionContent"]')?.value?.trim() ?? "",
          imageFile: section.querySelector('[name="customSectionImage"]')?.files?.[0] || null,
        }
        if (section.classList.contains("code-section-row")) return {
          type:        "code",
          title:       section.querySelector('[name="codeSectionTitle"]')?.value?.trim() ?? "",
          description: section.querySelector('[name="codeSectionDescription"]')?.value?.trim() ?? "",
          snippet:     section.querySelector('[name="codeSectionSnippet"]')?.value?.trim() ?? "",
          imageFile:   section.querySelector('[name="codeSectionImage"]')?.files?.[0] || null,
        }
        if (section.classList.contains("dashboard-section-row")) return {
          type: "dashboard",
          ...collectDashRow(section),
        }
        return null
      }).filter(Boolean)
    }

    return {
      projectMode:          isCustomMode ? "custom" : "template",
      thumbnailFile,
      outcomeImageFile,
      whatIBuiltImageFile,
      title:                get("title"),
      company:              get("company"),
      industry:             get("industry"),
      summary:              get("summary"),
      customSections,
      codeSections,
      dashboards,
      customContent,
      whatIBuilt1:          get("whatIBuilt1"),
      outcome:              get("outcome"),
      githubUrl:            get("githubUrl"),
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
  titleInput.placeholder = "Section title e.g. Business Problem, Requirements, Key Performance Targets"

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

  const imageLabel = document.createElement("label")
  imageLabel.className = "field-label"
  imageLabel.style.marginTop = "0.5rem"
  imageLabel.style.display = "block"
  imageLabel.textContent = "Image "
  const optionalSpan = document.createElement("span")
  optionalSpan.className = "optional-label"
  optionalSpan.textContent = "(optional)"
  imageLabel.appendChild(optionalSpan)

  const fileLabel = document.createElement("label")
  fileLabel.className = "btn-upload-thumb"
  fileLabel.textContent = "Choose Image"
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.name = "customSectionImage"
  fileInput.accept = "image/*"
  fileInput.style.display = "none"
  fileLabel.appendChild(fileInput)

  const filename = document.createElement("span")
  filename.className = "custom-section-filename"
  filename.textContent = "No file chosen"

  const preview = document.createElement("img")
  preview.className = "custom-section-preview"
  preview.alt = "Section image preview"
  preview.style.display = "none"

  const imageRow = document.createElement("div")
  imageRow.className = "thumb-upload-row"
  imageRow.appendChild(fileLabel)
  imageRow.appendChild(filename)
  imageRow.appendChild(preview)

  const editHint = document.createElement("p")
  editHint.className = "field-hint edit-img-hint hidden"
  editHint.innerHTML = '<span class="edit-img-check">✓</span> Image on file — upload to replace'

  row.appendChild(header)
  row.appendChild(content)
  row.appendChild(imageLabel)
  row.appendChild(imageRow)
  row.appendChild(editHint)
  return row
}

function makeCodeSectionRow() {
  const row = document.createElement("div")
  row.className = "code-section-row code-block-group"

  const titleRow = document.createElement("div")
  titleRow.className = "code-block-title-row"

  const titleInput = document.createElement("input")
  titleInput.type = "text"
  titleInput.name = "codeSectionTitle"
  titleInput.className = "field-input code-title-input"
  titleInput.placeholder = "e.g. SQL Script, Python Script, R Script"

  const removeBtn = document.createElement("button")
  removeBtn.type = "button"
  removeBtn.className = "btn-remove-section"
  removeBtn.setAttribute("aria-label", "Remove code section")
  removeBtn.textContent = "×"
  removeBtn.addEventListener("click", () => row.remove())

  titleRow.appendChild(titleInput)
  titleRow.appendChild(removeBtn)

  const description = document.createElement("textarea")
  description.name = "codeSectionDescription"
  description.className = "field-input field-textarea"
  description.rows = 2
  description.placeholder = "Briefly describe what this code does and why it matters."

  const snippet = document.createElement("textarea")
  snippet.name = "codeSectionSnippet"
  snippet.className = "field-input field-textarea field-code"
  snippet.rows = 6
  snippet.placeholder = "Paste your code here — it will be displayed as a formatted code block."

  const imageLabel = document.createElement("label")
  imageLabel.className = "field-label"
  imageLabel.style.marginTop = "0.75rem"
  imageLabel.style.display = "block"
  imageLabel.textContent = "Image "
  const imgOptSpan = document.createElement("span")
  imgOptSpan.className = "optional-label"
  imgOptSpan.textContent = "(optional)"
  imageLabel.appendChild(imgOptSpan)

  const fileLabel = document.createElement("label")
  fileLabel.className = "btn-upload-thumb"
  fileLabel.textContent = "Choose Image"
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.name = "codeSectionImage"
  fileInput.accept = "image/*"
  fileInput.style.display = "none"
  fileLabel.appendChild(fileInput)

  const filename = document.createElement("span")
  filename.className = "code-section-filename"
  filename.textContent = "No file chosen"

  const preview = document.createElement("img")
  preview.className = "code-section-preview"
  preview.alt = "Code section image preview"
  preview.style.display = "none"

  const imageRow = document.createElement("div")
  imageRow.className = "thumb-upload-row"
  imageRow.appendChild(fileLabel)
  imageRow.appendChild(filename)
  imageRow.appendChild(preview)

  const editHint = document.createElement("p")
  editHint.className = "field-hint edit-img-hint hidden"
  editHint.innerHTML = '<span class="edit-img-check">✓</span> Image on file — upload to replace'

  row.appendChild(titleRow)
  row.appendChild(description)
  row.appendChild(snippet)
  row.appendChild(imageLabel)
  row.appendChild(imageRow)
  row.appendChild(editHint)
  return row
}

function makeDashboardSectionRow() {
  const row = document.createElement("div")
  row.className = "dashboard-section-row code-block-group"

  const titleRow = document.createElement("div")
  titleRow.className = "code-block-title-row"

  const titleInput = document.createElement("input")
  titleInput.type = "text"
  titleInput.name = "dashboardSectionTitle"
  titleInput.className = "field-input code-title-input"
  titleInput.placeholder = "e.g. Power BI Dashboard, Tableau Dashboard"

  const removeBtn = document.createElement("button")
  removeBtn.type = "button"
  removeBtn.className = "btn-remove-section"
  removeBtn.setAttribute("aria-label", "Remove dashboard section")
  removeBtn.textContent = "×"
  removeBtn.addEventListener("click", () => row.remove())

  titleRow.appendChild(titleInput)
  titleRow.appendChild(removeBtn)

  const description = document.createElement("textarea")
  description.name = "dashboardSectionDescription"
  description.className = "field-input field-textarea"
  description.rows = 2
  description.placeholder = "What does the dashboard show? Who uses it?"

  const pagesLabel = document.createElement("p")
  pagesLabel.className = "field-hint"
  pagesLabel.style.marginTop = "0.5rem"
  pagesLabel.textContent = "Each page below becomes a slide in the carousel on your portfolio."

  const slidesList = document.createElement("div")
  slidesList.className = "slides-list"

  const addSlideBtn = document.createElement("button")
  addSlideBtn.type = "button"
  addSlideBtn.className = "btn-add-slide"
  addSlideBtn.textContent = "+ Add Dashboard Page"

  row.appendChild(titleRow)
  row.appendChild(description)
  row.appendChild(pagesLabel)
  row.appendChild(slidesList)
  row.appendChild(addSlideBtn)
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

  card.querySelector(".btn-remove-project").addEventListener("click", () => {
    card.remove()
    renumberCards()
  })

  // Wire up custom sections (template mode)
  const customContainer   = card.querySelector(".custom-sections-list")
  const addSectionBtn     = card.querySelector(".btn-add-section")
  addSectionBtn.addEventListener("click", () => customContainer.appendChild(makeCustomSectionRow()))

  // Wire up code sections (template mode)
  const codeSectionsList = card.querySelector(".code-sections-list")
  const addCodeSectionBtn = card.querySelector(".btn-add-code-section")
  addCodeSectionBtn.addEventListener("click", () => codeSectionsList.appendChild(makeCodeSectionRow()))

  // Wire up dashboard sections (template mode)
  const dashboardSectionsList = card.querySelector(".dashboard-sections-list")
  const addDashboardSectionBtn = card.querySelector(".btn-add-dashboard-section")
  addDashboardSectionBtn.addEventListener("click", () => dashboardSectionsList.appendChild(makeDashboardSectionRow()))

  // Wire up template/custom toggle
  const templateFields  = card.querySelector(".template-fields")
  const customFields    = card.querySelector(".custom-content-fields")
  const customList      = card.querySelector(".custom-content-list")
  const pickerWrap      = card.querySelector(".section-picker-wrap")
  const pickerToggleBtn = card.querySelector(".btn-add-section-picker")
  const picker          = card.querySelector(".section-picker")

  card.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      card.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"))
      btn.classList.add("active")
      const isCustom = btn.dataset.mode === "custom"
      templateFields.classList.toggle("hidden", isCustom)
      customFields.classList.toggle("hidden", !isCustom)
    })
  })

  pickerToggleBtn.addEventListener("click", () => picker.classList.toggle("hidden"))

  card.querySelectorAll(".btn-pick-section").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type
      let row
      if (type === "text")      row = makeCustomSectionRow()
      if (type === "code")      row = makeCodeSectionRow()
      if (type === "dashboard") row = makeDashboardSectionRow()
      if (row) customList.appendChild(row)
      picker.classList.add("hidden")
    })
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
    // Activate the right mode (custom is default; only switch for template)
    if (data.projectMode === "template") {
      card.querySelectorAll(".mode-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.mode === "template")
      })
      templateFields.classList.remove("hidden")
      customFields.classList.add("hidden")
    }

    set("whatIBuilt1",          Array.isArray(data.whatIBuilt)
      ? data.whatIBuilt.join("\n\n") : (data.whatIBuilt ?? ""))
    set("outcome",              Array.isArray(data.outcome)
      ? data.outcome.join("\n\n") : (data.outcome ?? ""))

    const showImgHint = (inputName) => {
      const hint = card.querySelector(`[name="${inputName}"]`).closest(".field-group")?.querySelector(".edit-img-hint")
      if (hint) hint.classList.remove("hidden")
    }
    if (data.preview && data.preview !== "/placeholder.svg") showImgHint("thumbnailFile")
    if (data.buildImage)   showImgHint("whatIBuiltImage")
    if (data.outcomeImage) showImgHint("outcomeImage")

    // Populate code sections (new format) or fall back to legacy flat fields
    const sectionsToLoad = Array.isArray(data.codeSections) && data.codeSections.length > 0
      ? data.codeSections
      : (data.sqlSnippet || data.sqlDescription || data.codeTitle)
        ? [{ title: data.codeTitle, description: data.sqlDescription, snippet: data.sqlSnippet, image: data.codeImage }]
        : []
    sectionsToLoad.forEach(section => {
      const row = makeCodeSectionRow()
      row.querySelector('[name="codeSectionTitle"]').value       = section.title ?? ""
      row.querySelector('[name="codeSectionDescription"]').value = section.description ?? ""
      row.querySelector('[name="codeSectionSnippet"]').value     = section.snippet ?? ""
      if (section.image) row.querySelector(".edit-img-hint").classList.remove("hidden")
      codeSectionsList.appendChild(row)
    })

    if (Array.isArray(data.customSections)) {
      data.customSections.forEach(section => {
        const row = makeCustomSectionRow()
        row.querySelector('[name="customSectionTitle"]').value   = section.title ?? ""
        row.querySelector('[name="customSectionContent"]').value = section.content ?? ""
        if (section.image) row.querySelector(".edit-img-hint").classList.remove("hidden")
        customContainer.appendChild(row)
      })
    }

    // Populate dashboards (new format) or fall back to legacy flat fields
    const dashboardsToLoad = Array.isArray(data.dashboards) && data.dashboards.length > 0
      ? data.dashboards
      : (data.dashboardTitle || data.dashboardDescription || (Array.isArray(data.dashboardSlides) && data.dashboardSlides.length > 0))
        ? [{ title: data.dashboardTitle, description: data.dashboardDescription, slides: data.dashboardSlides ?? [] }]
        : []
    dashboardsToLoad.forEach(dashboard => {
      const dashRow = makeDashboardSectionRow()
      dashRow.querySelector('[name="dashboardSectionTitle"]').value       = dashboard.title ?? ""
      dashRow.querySelector('[name="dashboardSectionDescription"]').value = dashboard.description ?? ""
      const slidesList  = dashRow.querySelector(".slides-list")
      const addSlideBtn = dashRow.querySelector(".btn-add-slide")
      ;(dashboard.slides ?? []).forEach(slide => {
        addSlideBtn.click()
        const slideCards = slidesList.querySelectorAll(".slide-card")
        const newSlide   = slideCards[slideCards.length - 1]
        if (!newSlide) return
        const descText = Array.isArray(slide.description) ? slide.description.join("\n\n") : (slide.description ?? "")
        newSlide.querySelector('[name="slideTitle"]').value       = slide.title ?? ""
        newSlide.querySelector('[name="slideDescription"]').value = descText
        if (slide.image) {
          const hint = newSlide.querySelector(".edit-img-hint")
          if (hint) hint.classList.remove("hidden")
        }
      })
      dashboardSectionsList.appendChild(dashRow)
    })

    // Populate custom content (custom mode)
    if (Array.isArray(data.customContent)) {
      data.customContent.forEach(section => {
        let row
        if (section.type === "text") {
          row = makeCustomSectionRow()
          row.querySelector('[name="customSectionTitle"]').value   = section.title ?? ""
          row.querySelector('[name="customSectionContent"]').value = section.content ?? ""
          if (section.image) row.querySelector(".edit-img-hint").classList.remove("hidden")
        } else if (section.type === "code") {
          row = makeCodeSectionRow()
          row.querySelector('[name="codeSectionTitle"]').value       = section.title ?? ""
          row.querySelector('[name="codeSectionDescription"]').value = section.description ?? ""
          row.querySelector('[name="codeSectionSnippet"]').value     = section.snippet ?? ""
          if (section.image) row.querySelector(".edit-img-hint").classList.remove("hidden")
        } else if (section.type === "dashboard") {
          row = makeDashboardSectionRow()
          row.querySelector('[name="dashboardSectionTitle"]').value       = section.title ?? ""
          row.querySelector('[name="dashboardSectionDescription"]').value = section.description ?? ""
          const slidesList  = row.querySelector(".slides-list")
          const addSlideBtn = row.querySelector(".btn-add-slide")
          ;(section.slides ?? []).forEach(slide => {
            addSlideBtn.click()
            const cards  = slidesList.querySelectorAll(".slide-card")
            const newSlide = cards[cards.length - 1]
            if (!newSlide) return
            const descText = Array.isArray(slide.description) ? slide.description.join("\n\n") : (slide.description ?? "")
            newSlide.querySelector('[name="slideTitle"]').value       = slide.title ?? ""
            newSlide.querySelector('[name="slideDescription"]').value = descText
            if (slide.image) {
              const hint = newSlide.querySelector(".edit-img-hint")
              if (hint) hint.classList.remove("hidden")
            }
          })
        }
        if (row) customList.appendChild(row)
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
