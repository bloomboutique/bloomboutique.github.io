// Búsqueda y filtro por categoría del catálogo público -- todo en el
// cliente porque el catálogo completo ya vino renderizado en el HTML
// (son a lo sumo unos cientos de tarjetas, no hace falta ida y vuelta al
// servidor por cada letra que se escribe).
document.addEventListener("DOMContentLoaded", () => {
  const buscarInput = document.getElementById("catalogo-buscar");
  const chips = document.querySelectorAll(".catalogo-chip");
  const tarjetas = document.querySelectorAll(".card-producto");
  const vacioEl = document.getElementById("catalogo-vacio");
  let categoriaActiva = "todas";

  const aplicarFiltro = () => {
    const texto = (buscarInput.value || "").trim().toLowerCase();
    let visibles = 0;
    tarjetas.forEach((tarjeta) => {
      const nombre = (tarjeta.dataset.nombre || "").toLowerCase();
      const categoria = tarjeta.dataset.categoria || "";
      const coincideTexto = !texto || nombre.includes(texto);
      const coincideCategoria =
        categoriaActiva === "todas" || categoria === categoriaActiva;
      const mostrar = coincideTexto && coincideCategoria;
      tarjeta.hidden = !mostrar;
      if (mostrar) visibles += 1;
    });
    if (vacioEl) vacioEl.hidden = visibles > 0;
  };

  if (buscarInput) buscarInput.addEventListener("input", aplicarFiltro);
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      categoriaActiva = chip.dataset.categoria;
      chips.forEach((c) => {
        c.classList.toggle("activo", c === chip);
      });
      aplicarFiltro();
    });
  });
});
