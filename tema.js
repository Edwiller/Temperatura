export function toggleTema() {
  const html = document.documentElement
  const isDark = html.classList.toggle("dark")
  localStorage.setItem("tema", isDark ? "dark" : "light")
}

export function carregarTema() {
  const tema = localStorage.getItem("tema")
  // Se nada salvo, respeita preferência do sistema
  if (tema === "dark") {
    document.documentElement.classList.add("dark")
  } else if (tema === "light") {
    document.documentElement.classList.remove("dark")
  } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    document.documentElement.classList.add("dark")
  }
}