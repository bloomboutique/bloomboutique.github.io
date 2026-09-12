// Búsqueda y filtro por categoría del catálogo público -- todo en el
// cliente porque el catálogo completo ya vino renderizado en el HTML
// (son a lo sumo unos cientos de tarjetas, no hace falta ida y vuelta al
// servidor por cada letra que se escribe).
document.addEventListener("DOMContentLoaded", () => {
  const buscarInput = document.getElementById("catalogo-buscar");
  const chips = document.querySelectorAll(".catalogo-chip");
  const secciones = document.querySelectorAll(".categoria-seccion");
  const vacioEl = document.getElementById("catalogo-vacio");
  let categoriaActiva = "todas";

  const aplicarFiltro = () => {
    const texto = (buscarInput.value || "").trim().toLowerCase();
    let visibles = 0;
    secciones.forEach((seccion) => {
      const categoriaSeccion = seccion.dataset.categoria || "";
      const coincideCategoriaSeccion =
        categoriaActiva === "todas" || categoriaSeccion === categoriaActiva;
      let visiblesEnSeccion = 0;
      seccion.querySelectorAll(".card-producto").forEach((tarjeta) => {
        const nombre = (tarjeta.dataset.nombre || "").toLowerCase();
        const coincideTexto = !texto || nombre.includes(texto);
        const mostrar = coincideTexto && coincideCategoriaSeccion;
        tarjeta.hidden = !mostrar;
        if (mostrar) visiblesEnSeccion += 1;
      });
      seccion.hidden = visiblesEnSeccion === 0;
      visibles += visiblesEnSeccion;
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

  // Zoom de foto de producto (Bigger Picture, vendorizado en
  // static/vendor/bigger-picture/ -- MIT, https://github.com/henrygd/bigger-picture).
  // Deja ver el detalle de la tela/acabado sin salir del catálogo.
  const fotosZoom = document.querySelectorAll(".foto-zoom");
  if (fotosZoom.length && window.BiggerPicture) {
    const bp = window.BiggerPicture({ target: document.body });
    fotosZoom.forEach((enlace) => {
      enlace.addEventListener("click", (e) => {
        e.preventDefault();
        bp.open({ items: [enlace], el: enlace });
      });
    });
  }
});
