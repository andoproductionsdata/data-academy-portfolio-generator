import { setState } from "./state.js?v=3"

const MAX_CERTS = 10

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
  setState({ certifications })
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
    renumberCards()
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
  updateAddButton()
}

function renumberCards() {
  document.querySelectorAll("#certs-list .cert-card").forEach((card, i) => {
    card.querySelector(".cert-number").textContent = String(i + 1)
  })
  updateAddButton()
}

function updateAddButton() {
  const count = document.querySelectorAll("#certs-list .cert-card").length
  const btn   = document.getElementById("btn-add-cert")
  btn.disabled    = count >= MAX_CERTS
  btn.textContent = count >= MAX_CERTS ? `Maximum ${MAX_CERTS} reached` : "+ Add Certification"
}

export function initCertificationsStep(certs = []) {
  if (certs.length > 0) {
    certs.forEach(c => addCertCard(c))
  } else if (document.querySelectorAll("#certs-list .cert-card").length === 0) {
    addCertCard()
  }
}
