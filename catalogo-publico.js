// Búsqueda y filtro por categoría del catálogo público -- todo en el
// cliente porque el catálogo completo ya vino renderizado en el HTML
// (son a lo sumo unos cientos de tarjetas, no hace falta ida y vuelta al
// servidor por cada letra que se escribe).
document.addEventListener("DOMContentLoaded", () => {
  const buscarInput = document.getElementById("catalogo-buscar");
  const tallaSelect = document.getElementById("catalogo-talla");
  const chips = document.querySelectorAll(".catalogo-chip");
  const secciones = document.querySelectorAll(".categoria-seccion");
  const vacioEl = document.getElementById("catalogo-vacio");
  let categoriaActiva = "todas";

  const aplicarFiltro = () => {
    const texto = (buscarInput.value || "").trim().toLowerCase();
    const tallaActiva = tallaSelect ? tallaSelect.value : "todas";
    let visibles = 0;
    secciones.forEach((seccion) => {
      const categoriaSeccion = seccion.dataset.categoria || "";
      const coincideCategoriaSeccion =
        categoriaActiva === "todas" || categoriaSeccion === categoriaActiva;
      let visiblesEnSeccion = 0;
      seccion.querySelectorAll(".card-producto").forEach((tarjeta) => {
        const nombre = (tarjeta.dataset.nombre || "").toLowerCase();
        const tallas = (tarjeta.dataset.tallas || "").split(",");
        const coincideTexto = !texto || nombre.includes(texto);
        const coincideTalla =
          tallaActiva === "todas" || tallas.includes(tallaActiva);
        const mostrar =
          coincideTexto && coincideCategoriaSeccion && coincideTalla;
        tarjeta.hidden = !mostrar;
        if (mostrar) visiblesEnSeccion += 1;
      });
      seccion.hidden = visiblesEnSeccion === 0;
      visibles += visiblesEnSeccion;
    });
    if (vacioEl) vacioEl.hidden = visibles > 0;
  };

  if (buscarInput) buscarInput.addEventListener("input", aplicarFiltro);
  if (tallaSelect) tallaSelect.addEventListener("change", aplicarFiltro);
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
  // Deja ver el detalle de la tela/acabado sin salir del catálogo. Las
  // fotos de un mismo producto llevan el mismo data-grupo -- así, al
  // hacer zoom, Bigger Picture las trata como una sola galería y permite
  // seguir deslizando/usar flechas entre ellas en pantalla completa (el
  // mismo gesto que ya funciona en la tarjeta chica).
  const fotosZoom = document.querySelectorAll(".foto-zoom");
  if (fotosZoom.length && window.BiggerPicture) {
    const bp = window.BiggerPicture({ target: document.body });
    fotosZoom.forEach((enlace) => {
      enlace.addEventListener("click", (e) => {
        e.preventDefault();
        const grupo = enlace.dataset.grupo;
        const items = grupo
          ? Array.from(
              document.querySelectorAll(`.foto-zoom[data-grupo="${grupo}"]`),
            )
          : [enlace];
        const position = items.indexOf(enlace);
        bp.open({ items, position: position < 0 ? 0 : position, el: enlace });
      });
    });
  }

  // Carrusel de fotos en la tarjeta: desliza entre fotos (touch/mouse
  // nativos vía scroll-snap) y el punto de abajo se actualiza para
  // mostrar en cuál foto está -- IntersectionObserver en vez de medir el
  // scroll a mano, para que siga funcionando bien si la tarjeta cambia de
  // tamaño (responsive) sin recalcular nada.
  document.querySelectorAll("[data-carrusel-fotos]").forEach((carrusel) => {
    const dotsWrap = carrusel.parentElement.querySelector("[data-dots-fotos]");
    if (!dotsWrap) return;
    const dots = Array.from(dotsWrap.children);
    const slides = Array.from(carrusel.children);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const indice = slides.indexOf(entry.target);
            dots.forEach((d, i) => {
              d.classList.toggle("activo", i === indice);
            });
          }
        });
      },
      { root: carrusel, threshold: 0.6 },
    );
    slides.forEach((slide) => {
      observer.observe(slide);
    });
  });

  // "Me encanta" por foto: el contador vive en el servidor (para que el
  // dueño del negocio vea qué modelo/color engancha más), pero qué fotos
  // YA le dio like este visitante se recuerda en su propio navegador
  // (localStorage) -- sin cuentas ni cookies de sesión, como cualquier
  // catálogo público sin login.
  const CLAVE_LIKES = "nexanova_fotos_me_encanta";
  const leerLikesGuardados = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(CLAVE_LIKES) || "[]"));
    } catch {
      return new Set();
    }
  };
  const guardarLikes = (set) => {
    try {
      localStorage.setItem(CLAVE_LIKES, JSON.stringify([...set]));
    } catch {
      // Almacenamiento bloqueado (navegación privada, etc.) -- el botón
      // sigue funcionando esta sesión, solo no recuerda entre visitas.
    }
  };
  const likesGuardados = leerLikesGuardados();

  // El catálogo estático publicado a GitHub Pages no tiene servidor
  // propio detrás -- ver comentario en catalogo_publico.html sobre la
  // etiqueta <meta name="likes-endpoint">. Si existe, es la URL de un
  // Cloudflare Worker (u otro servicio externo) que guarda el like
  // hasta que NexaNova se sincroniza; si no existe (catálogo en vivo),
  // se usa la ruta relativa normal del propio NexaNova.
  const likesEndpointExterno =
    document.querySelector('meta[name="likes-endpoint"]')?.content || "";
  const urlMeEncanta = (photoId) =>
    likesEndpointExterno
      ? `${likesEndpointExterno}/like`
      : `/api/catalogo/foto/${photoId}/me-encanta`;
  const cuerpoMeEncanta = (photoId, dar) =>
    likesEndpointExterno ? { photo_id: photoId, dar } : { dar };

  document.querySelectorAll(".card-producto-foto-like").forEach((boton) => {
    const photoId = boton.dataset.photoId;
    boton.classList.toggle("activo", likesGuardados.has(photoId));

    boton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const yaLeGusta = boton.classList.contains("activo");
      const dar = !yaLeGusta;
      boton.classList.toggle("activo", dar);
      if (dar) likesGuardados.add(photoId);
      else likesGuardados.delete(photoId);
      guardarLikes(likesGuardados);

      fetch(urlMeEncanta(photoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpoMeEncanta(photoId, dar)),
      }).catch(() => {
        // Sin internet momentáneo: el corazón ya cambió visualmente y
        // quedó guardado localmente -- no vale la pena molestar a la
        // clienta con un error por esto, es un "me gusta", no una compra.
      });
    });
  });

  // "Compartir": el celular de la clienta se vuelve un canal de difusión
  // gratis -- puede reenviarle un producto puntual a una amiga por
  // WhatsApp en vez de tener que mandarle el catálogo entero. El enlace
  // apunta al mismo catálogo con un ancla al producto (#producto-N), así
  // que al abrirlo el navegador salta directo a esa tarjeta.
  document.querySelectorAll(".btn-compartir").forEach((boton) => {
    boton.addEventListener("click", async () => {
      const nombre = boton.dataset.compartirNombre || "";
      const precio = boton.dataset.compartirPrecio || "";
      const ancla = boton.dataset.compartirAnchor || "";
      const url = `${window.location.origin}${window.location.pathname}#${ancla}`;
      const texto = `${nombre} (${precio}) -- catálogo de ${document.title.replace("Catálogo — ", "")}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: nombre, text: texto, url });
          return;
        } catch (_err) {
          return; // el usuario canceló el cuadro de compartir -- no hacer nada más
        }
      }
      // Sin Web Share API (la mayoría de navegadores de escritorio): abre
      // WhatsApp sin un número fijo, para que la clienta elija a quién
      // mandárselo.
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`,
        "_blank",
        "noopener",
      );
    });
  });

  // Aviso silencioso a NexaNova de que alguien preguntó por un producto --
  // "mejor esfuerzo": la ruta es relativa a propósito, así que en el
  // catálogo servido en vivo (/catalogo) apunta a NexaNova mismo, y en el
  // catálogo estático publicado en GitHub Pages simplemente no existe esa
  // ruta ahí -- el fetch falla en silencio y no pasa nada más. Nunca
  // bloquea ni retrasa que se abra WhatsApp.
  document
    .querySelectorAll(".btn-whatsapp[data-producto-id]")
    .forEach((enlace) => {
      enlace.addEventListener("click", () => {
        try {
          fetch("/api/catalogo/interes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_id: enlace.dataset.productoId }),
            keepalive: true,
          }).catch(() => {});
        } catch (_err) {
          /* silencioso a propósito -- esto nunca debe interrumpir al cliente */
        }
      });
    });
});
