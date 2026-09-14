import { setState } from "./state.js"

const MAX_JOBS = 5

export function collectWorkExperience() {
  const cards = document.querySelectorAll("#jobs-list .job-card")
  const workExperience = Array.from(cards).map(card => {
    const form = card.querySelector(".job-form")
    const get  = name => form.querySelector(`[name="${name}"]`)?.value?.trim() ?? ""
    return {
      title:            get("title"),
      company:          get("company"),
      location:         get("location"),
      duration:         get("duration"),
      responsibilities: get("responsibilities"),
    }
  }).filter(job => job.title || job.company)
  setState({ workExperience })
}

export function addJobCard(data = null) {
  const list = document.getElementById("jobs-list")
  const currentCount = list.querySelectorAll(".job-card").length

  if (currentCount >= MAX_JOBS) {
    import("./ui.js").then(({ showToast }) =>
      showToast(`Maximum ${MAX_JOBS} jobs allowed`, "info")
    )
    return
  }

  const template = document.getElementById("job-card-template")
  const clone    = template.content.cloneNode(true)
  const card     = clone.querySelector(".job-card")

  card.querySelector(".job-number").textContent = String(currentCount + 1)

  card.querySelector(".btn-remove-job").addEventListener("click", () => {
    card.remove()
    renumberCards()
  })

  if (data) {
    const form = card.querySelector(".job-form")
    const set  = (name, value) => {
      const el = form.querySelector(`[name="${name}"]`)
      if (el) el.value = value ?? ""
    }
    set("title",    data.title)
    set("company",  data.company)
    set("location", data.location)
    set("duration", data.duration)
    set("responsibilities", Array.isArray(data.responsibilities)
      ? data.responsibilities.join("\n")
      : (data.responsibilities ?? ""))
  }

  list.appendChild(card)
  updateAddButton()
}

function renumberCards() {
  document.querySelectorAll("#jobs-list .job-card").forEach((card, i) => {
    card.querySelector(".job-number").textContent = String(i + 1)
  })
  updateAddButton()
}

function updateAddButton() {
  const count = document.querySelectorAll("#jobs-list .job-card").length
  const btn   = document.getElementById("btn-add-job")
  btn.disabled    = count >= MAX_JOBS
  btn.textContent = count >= MAX_JOBS ? `Maximum ${MAX_JOBS} jobs reached` : "+ Add Job"
}

export function initWorkExperienceStep(jobs = []) {
  if (jobs.length > 0) {
    jobs.forEach(job => addJobCard(job))
  } else if (document.querySelectorAll("#jobs-list .job-card").length === 0) {
    addJobCard()
  }
}
