import { setState } from "./state.js?v=11"

const MAX_CERTS      = 10
const MAX_EDUCATION  = 10

export function collectCertifications() {
  const cards = document.querySelectorAll("#certs-list .cert-card")
  const certifications = Array.from(cards).map(card => {
    const form = card.querySelector(".cert-form")
    const get  = name => form.querySelector(`[name="${name}"]`)?.value?.trim() ?? ""
    return {
      name:          get("name"),
      organisation:  get("organisation"),
      date:          get("date"),
      credentialUrl: get("credentialUrl") || "#",
    }
  }).filter(c => c.name || c.organisation)

  const eduCards = document.querySelectorAll("#education-list .cert-card")
  const education = Array.from(eduCards).map(card => {
    const form = card.querySelector(".education-form")
    const get  = name => form.querySelector(`[name="${name}"]`)?.value?.trim() ?? ""
    return {
      qualification: get("qualification"),
      institution:   get("institution"),
      status:        get("status"),
      year:          get("year"),
    }
  }).filter(e => e.qualification || e.institution)

  setState({ certifications, education })
}

export function addEducationCard(data = null) {
  const list = document.getElementById("education-list")
  const currentCount = list.querySelectorAll(".cert-card").length

  if (currentCount >= MAX_EDUCATION) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_EDUCATION} education entries allowed`, "info")
    )
    return
  }

  const template = document.getElementById("education-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".cert-card")

  card.querySelector(".education-number").textContent = String(currentCount + 1)
  card.querySelector(".btn-remove-education").addEventListener("click", () => {
    card.remove()
    renumberEducation()
  })

  if (data) {
    const form = card.querySelector(".education-form")
    const set  = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`)
      if (el) el.value = value ?? ""
    }
    set("qualification", data.qualification)
    set("institution",   data.institution)
    set("status",        data.status || "In Progress")
    set("year",          data.year)
  }

  list.appendChild(card)
  updateEducationButton()
}

function renumberEducation() {
  document.querySelectorAll("#education-list .cert-card").forEach((card, i) => {
    card.querySelector(".education-number").textContent = String(i + 1)
  })
  updateEducationButton()
}

function updateEducationButton() {
  const count = document.querySelectorAll("#education-list .cert-card").length
  const btn   = document.getElementById("btn-add-education")
  btn.disabled    = count >= MAX_EDUCATION
  btn.textContent = count >= MAX_EDUCATION ? `Maximum ${MAX_EDUCATION} reached` : "+ Add Education"
}

export function addCertCard(data = null) {
  const list = document.getElementById("certs-list")
  const currentCount = list.querySelectorAll(".cert-card").length

  if (currentCount >= MAX_CERTS) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_CERTS} certifications allowed`, "info")
    )
    return
  }

  const template = document.getElementById("cert-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".cert-card")

  card.querySelector(".cert-number").textContent = String(currentCount + 1)
  card.querySelector(".btn-remove-cert").addEventListener("click", () => {
    card.remove()
    renumberCerts()
  })

  if (data) {
    const form = card.querySelector(".cert-form")
    const set  = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`)
      if (el) el.value = value ?? ""
    }
    set("name",          data.name)
    set("organisation",  data.organisation)
    set("date",          data.date)
    set("credentialUrl", data.credentialUrl === "#" ? "" : (data.credentialUrl ?? ""))
  }

  list.appendChild(card)
  updateCertButton()
}

function renumberCerts() {
  document.querySelectorAll("#certs-list .cert-card").forEach((card, i) => {
    card.querySelector(".cert-number").textContent = String(i + 1)
  })
  updateCertButton()
}

function updateCertButton() {
  const count = document.querySelectorAll("#certs-list .cert-card").length
  const btn   = document.getElementById("btn-add-cert")
  btn.disabled    = count >= MAX_CERTS
  btn.textContent = count >= MAX_CERTS ? `Maximum ${MAX_CERTS} reached` : "+ Add Certification"
}

export function initCertificationsStep(certs = [], education = []) {
  if (education.length > 0) {
    education.forEach(e => addEducationCard(e))
  }
  if (certs.length > 0) {
    certs.forEach(c => addCertCard(c))
  } else if (document.querySelectorAll("#certs-list .cert-card").length === 0) {
    addCertCard()
  }
}
