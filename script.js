let indice = 0;
let datos = [];
let solucionMostrada = [];
let audioGlobal = new Audio();
let URL_REGLAS = "https://view.genially.com/6834d0143c53b6064031a058?idSlide=7099ad60-bc41-4a7a-83be-0fe6381c3869";
let modoJuego = "";

window.onload = () => {
  fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQrioQKwGSHMHsy9dQr37uk1xCFZC8vhIKDXepOtNEM_efmPwpe5ROmksO0fu_ZmHlxPUskuXu4rmCw/pub?gid=0&single=true&output=csv")
    .then(response => response.text())
    .then(csv => {
      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
        quoteChar: '"'
      });

      datos = parsed.data.map(fila => ({
        año: fila["año"],
        autor: fila["autor"],
        obra: fila["obra"],
        audio: fila["audio"],
        color: fila["color"],
        imagen: fila["imagen"],
        texto: fila["texto"]
      }))
      .sort(() => Math.random() - 0.5);

      solucionMostrada = new Array(datos.length).fill(false);

      document.getElementById("cargando").classList.add("hidden");
      document.getElementById("menuModos").classList.remove("hidden");
    });

  window.focus();

  document.addEventListener("keydown", function(event) {
    if (document.activeElement.tagName === "INPUT") return;

    const key = event.key;
    switch (key) {
      case "ArrowRight":
        const btnNext = document.getElementById("btnSiguiente");
        if (btnNext && !btnNext.disabled && btnNext.offsetParent !== null) siguiente();
        break;
      case "ArrowLeft":
        const btnPrev = document.getElementById("btnAnterior");
        if (btnPrev && !btnPrev.disabled && btnPrev.offsetParent !== null) anterior();
        break;
      case "Enter":
        const btnSol = document.getElementById("btnSolucion");
        if (btnSol && btnSol.offsetParent !== null) mostrarSolucion();
        break;
      case " ":
        event.preventDefault();
        if (audioGlobal) {
          if (audioGlobal.paused) {
            audioGlobal.play();
          } else {
            audioGlobal.pause();
          }
        }
        break;
    }
  });
};

function abrirReglas() {
  if (URL_REGLAS) window.open(URL_REGLAS, "_blank");
}

function seleccionarModo(modo) {
  modoJuego = modo; // 'solitario' o 'mesa'
  document.getElementById("menuModos").classList.add("hidden");
  document.getElementById("contenido").classList.remove("hidden");
  indice = 0;
  mostrar();
}

function mostrar() {
  if (datos.length === 0) return;

  const item = datos[indice];
  const titulo = document.getElementById("titulo");
  const detalles = document.getElementById("detalles");
  const leyenda = document.getElementById("leyenda");
  const botones = document.getElementById("botones");
  const solucion = document.getElementById("botonSolucion");
  const img = document.getElementById("imagen");
  const textoExtra = document.getElementById("texto-extra");

  document.getElementById("audio-container").innerHTML = "";
  document.body.style.backgroundColor = "#dcdcdc";
  botones.style.display = "none";
  solucion.classList.add("hidden");

  // Por defecto: leyenda visible, ficha oculta
  leyenda.style.display = "flex";
  detalles.style.display = "none";
  detalles.classList.add("invisible");

  // Título
  titulo.innerHTML = `Obra ${indice + 1}`;

  // Audio
  audioGlobal.src = item.audio;
  audioGlobal.currentTime = 0;
  audioGlobal.play();

  // Controles
  const cont = document.createElement("div");
  cont.className = "custom-audio-controls";
  cont.innerHTML = `
    <button id="btnRew" class="audio-btn"><i data-lucide="rewind"></i></button>
    <button id="btnPlayPause" class="audio-btn"><i data-lucide="pause"></i></button>
    <button id="btnFf" class="audio-btn"><i data-lucide="fast-forward"></i></button>
  `;
  document.getElementById("audio-container").appendChild(cont);
  lucide.createIcons();

  document.getElementById("btnRew").onclick = () => { audioGlobal.currentTime = Math.max(0, audioGlobal.currentTime - 5); };
  document.getElementById("btnFf").onclick = () => { audioGlobal.currentTime = Math.min(audioGlobal.duration, audioGlobal.currentTime + 5); };
  document.getElementById("btnPlayPause").onclick = () => {
    const boton = document.getElementById("btnPlayPause");
    if (audioGlobal.paused) {
      audioGlobal.play().then(() => { boton.innerHTML = '<i data-lucide="pause"></i>'; lucide.createIcons(); });
    } else {
      audioGlobal.pause();
      boton.innerHTML = '<i data-lucide="play"></i>';
      lucide.createIcons();
    }
  };
  audioGlobal.onpause = () => { document.getElementById("btnPlayPause").innerHTML = '<i data-lucide="play"></i>'; lucide.createIcons(); };
  audioGlobal.onplay  = () => { document.getElementById("btnPlayPause").innerHTML = '<i data-lucide="pause"></i>'; lucide.createIcons(); };

  // Si ya estaba revelada la solución, muestra ficha y oculta leyenda
  if (solucionMostrada[indice]) {
    document.getElementById("anio").textContent = item.año || "";
    document.getElementById("descripcion").innerHTML = `<strong>${item.autor || ""}</strong><br>${item.obra || ""}`;

    img.classList.add("hidden");
    img.removeAttribute("src");
    img.alt = "";
    img.onload = () => img.classList.remove("hidden");
    if (item.imagen) { img.src = item.imagen; img.alt = item.obra || ""; }

    if (item.texto && item.texto.trim()) { textoExtra.textContent = item.texto; textoExtra.classList.remove("hidden"); }
    else { textoExtra.textContent = ""; textoExtra.classList.add("hidden"); }

    leyenda.style.display = "none";
    detalles.style.display = "flex";
    detalles.classList.remove("invisible");

    if (item.color && item.color.trim()) document.body.style.backgroundColor = item.color;
    botones.style.display = "flex";
  } else {
    // si NO hay solución, enseña el botón para revelarla
    solucion.classList.remove("hidden");
  }
}

function mostrarSolucion() {
  if (!datos.length) return;

  const item = datos[indice];
  solucionMostrada[indice] = true;

  const leyenda = document.getElementById("leyenda");
  const detalles = document.getElementById("detalles");
  const img = document.getElementById("imagen");
  const textoExtra = document.getElementById("texto-extra");

  // Textos
  document.getElementById("anio").textContent = item.año || "";
  document.getElementById("descripcion").innerHTML = `<strong>${item.autor || ""}</strong><br>${item.obra || ""}`;

  // Imagen (precarga)
  img.classList.add("hidden");
  img.removeAttribute("src");
  img.alt = "";
  img.onload = () => img.classList.remove("hidden");
  if (item.imagen && item.imagen.trim()) { img.src = item.imagen; img.alt = item.obra || ""; }

  // Texto extra
  if (item.texto && item.texto.trim()) { textoExtra.textContent = item.texto; textoExtra.classList.remove("hidden"); }
  else { textoExtra.textContent = ""; textoExtra.classList.add("hidden"); }

  // Conmutar visibilidad (leyenda fuera, ficha dentro y centrada)
  leyenda.style.display = "none";
  detalles.style.display = "flex";
  detalles.classList.remove("invisible");

  // Fondo y UI
  if (item.color && item.color.trim()) document.body.style.backgroundColor = item.color;
  document.getElementById("botonSolucion").classList.add("hidden");
  document.getElementById("botones").style.display = "flex";
}

function siguiente() {
  if (indice < datos.length - 1) {
    indice++;
    mostrar();
  } else {
    document.getElementById("botones").style.display = "none";
    document.getElementById("reinicio").classList.remove("hidden");
  }
}

function anterior() {
  if (indice > 0) {
    indice--;
    mostrar();
  }
}
