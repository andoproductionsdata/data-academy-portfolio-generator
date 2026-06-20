export function goToStep(stepNumber) {
  document.querySelectorAll(".step").forEach(el => el.classList.add("hidden"))

  if (stepNumber === 0) {
    document.getElementById("screen-success").classList.remove("hidden")
    document.querySelectorAll(".progress-step").forEach(el => {
      el.classList.remove("active")
      el.classList.add("completed")
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
    return
  }

  const target = document.getElementById(`step-${stepNumber}`)
  if (!target) throw new Error(`Step ${stepNumber} not found in DOM`)
  target.classList.remove("hidden")

  document.querySelectorAll(".progress-step").forEach(el => {
    const n = Number(el.dataset.step)
    el.classList.remove("active", "completed")
    if (n < stepNumber) el.classList.add("completed")
    else if (n === stepNumber) el.classList.add("active")
  })

  window.scrollTo({ top: 0, behavior: "smooth" })
}
