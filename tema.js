export function toggleTema(){

  document.body.classList.toggle("dark")

  const dark =
    document.body.classList.contains("dark")

  localStorage.setItem("tema", dark ? "dark" : "light")
}

export function carregarTema(){

  const tema = localStorage.getItem("tema")

  if(tema === "light"){
    document.body.classList.remove("dark")
  }

}