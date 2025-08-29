let indice = 0;
let datos = [];
let solucionMostrada = [];
let audioGlobal = new Audio();
let modoJuego = "";            // 'solitario' | 'mesa'
let puntos = 0, racha = 0, rachaMax = 0;
let pistaVisible = false;

// Fallback de periodos con descripciones
let PERIODOS = [
  { hex: "#5ca8d6", label: "Edad Media y Renacimiento (-1500)", desc: "Canto llano, polifonías primitivas, ars antiqua, ars nova y escuela flamenca." },
  { hex: "#f9c623", label: "Renacimiento y Barroco temprano (1500-1640)", desc: "Edad de Oro de la polifonía. Desde Josquin hasta la escuela policoral de Venecia" },
  { hex: "#e06464", label: "Barroco tardío (1640-1750)", desc: "La era del bajo continuo y de los primeros desarrollos de la música orquestal." },
  { hex: "#26b98f", label: "Periodo clásico-romántico (1750-1920)", desc: "Desde Mozart hasta Lili Boulanger. Edad de Oro de la música orquestal. La música sacra como música de concierto." },
  { hex: "#c87ab0", label: "Siglos XX y XXI (1920-)", desc: "Desde Francis Poulenc hasta nuestros días. Amplio rango estilístico, desde la inspiración popular a la vanguardia." },
];

// Si en el futuro publicas CSV de periodos, pon aquí su URL y se cargará automáticamente.
// const PERIODOS_CSV_URL = "https://.../pub?gid=XXX&single=true&output=csv";

window.onload = async () => {
  // Carga obras
  const csvObras = await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQrioQKwGSHMHsy9dQr37uk1xCFZC8vhIKDXepOtNEM_efmPwpe5ROmksO0fu_ZmHlxPUskuXu4rmCw/pub?gid=0&single=true&output=csv").then(r=>r.text());
  const parsed = Papa.parse(csvObras, { header: true, skipEmptyLines: true, delimiter: ",", quoteChar: '"' });
  datos = parsed.data.map(f => ({
    año: f["año"], autor: f["autor"], obra: f["obra"],
    audio: f["audio"], color: (f["color"] || "").toLowerCase().trim(),
    imagen: f["imagen"], texto: f["texto"]
  })).sort(() => Math.random() - 0.5);
  solucionMostrada = new Array(datos.length).fill(false);

  // (Opcional) Carga periodos desde CSV si activas PERIODOS_CSV_URL
  /*
  if (typeof PERIODOS_CSV_URL === "string") {
    try {
      const csvP = await fetch(PERIODOS_CSV_URL).then(r=>r.text());
      const p = Papa.parse(csvP, { header:true, skipEmptyLines:true });
      PERIODOS = p.data
        .map(x => ({ hex: (x.color||"").trim(), label:x.label, desc:x.descripcion, orden:+(x.orden||0) }))
        .filter(x => x.hex && x.label)
        .sort((a,b) => (a.orden||0) - (b.orden||0));
    } catch(_) { /* fallback a PERIODOS por defecto */ }
  }
  */

  // Pintar textos/aria en los 5 botones de la leyenda
  inicializarLeyendaDesdePeriodos();

  document.getElementById("cargando").classList.add("hidden");
  document.getElementById("menuModos").classList.remove("hidden");

  // Atajos
  window.focus();
  document.addEventListener("keydown", onKey);
};

function onKey(e) {
  if (document.activeElement && ["INPUT","TEXTAREA","BUTTON"].includes(document.activeElement.tagName)) return;
  const key = e.key;
  if (key === "ArrowRight") {
    const btnNext = document.getElementById("btnSiguiente");
    if (btnNext && btnNext.offsetParent !== null) siguiente();
  } else if (key === "ArrowLeft") {
    const btnPrev = document.getElementById("btnAnterior");
    if (btnPrev && btnPrev.offsetParent !== null) anterior();
  } else if (key === "Enter" && modoJuego === "mesa") {
    const btnSol = document.getElementById("btnSolucion");
    if (btnSol && btnSol.offsetParent !== null) mostrarSolucion();
  } else if (key === " ") {
    e.preventDefault();
    if (!audioGlobal) return;
    if (audioGlobal.paused) audioGlobal.play(); else audioGlobal.pause();
  } else if (modoJuego === "solitario" && ["1","2","3","4","5"].includes(key)) {
    const idx = parseInt(key) - 1;
    const opciones = getLeyendaBotones();
    if (opciones[idx] && opciones[idx].disabled === false) opciones[idx].click();
  }
}

function abrirReglas() {
  const URL_REGLAS = "https://view.genially.com/6834d0143c53b6064031a058?idSlide=7099ad60-bc41-4a7a-83be-0fe6381c3869";
  window.open(URL_REGLAS, "_blank");
}

function seleccionarModo(modo) {
  modoJuego = modo;
  document.getElementById("menuModos").classList.add("hidden");
  document.getElementById("contenido").classList.remove("hidden");

  indice = 0;
  if (modoJuego === "solitario") {
    puntos = 0; racha = 0; rachaMax = 0; pintarMarcadores();
    document.getElementById("marcadores").style.display = "block";
    document.getElementById("botonSolucion").classList.add("hidden");
    document.getElementById("titulo").style.textAlign = "left";
    document.getElementById("pista-wrap").classList.remove("hidden");
  } else {
    document.getElementById("marcadores").style.display = "none";
    document.getElementById("botonSolucion").classList.remove("hidden");
    document.getElementById("titulo").style.textAlign = "center";
    document.getElementById("pista-wrap").classList.add("hidden");
  }

  mostrar();
}

function inicializarLeyendaDesdePeriodos() {
  const filas = getLeyendaBotones();
  filas.forEach((btn, i) => {
    const p = PERIODOS[i];
    if (!p) return;
    btn.dataset.hex = p.hex;
    const punto = btn.querySelector(".punto");
    const txt   = btn.querySelector(".leyenda-txt");
    if (punto) punto.style.background = p.hex;
    if (txt)   txt.textContent = p.label;

    // info button
    const info = btn.querySelector(".info-btn");
    if (info) {
      info.onclick = (ev) => {
        ev.stopPropagation(); // no disparar respuesta
        abrirModalPeriodo(p);
      };
    }
  });

  // modal cerrar
  document.getElementById("modalClose").onclick = cerrarModalPeriodo;
  document.getElementById("modalPeriodos").addEventListener("click", (e) => {
    if (e.target.id === "modalPeriodos") cerrarModalPeriodo();
  });

  // pista
  const btnPista = document.getElementById("btnPista");
  if (btnPista) btnPista.onclick = togglePista;
}

function abrirModalPeriodo(p) {
  const m = document.getElementById("modalPeriodos");
  m.querySelector("#modalTitulo").textContent = p.label;
  m.querySelector(".modal-color").style.background = p.hex;
  m.querySelector(".modal-texto").textContent = p.desc || "";
  m.classList.remove("hidden");
}
function cerrarModalPeriodo() {
  document.getElementById("modalPeriodos").classList.add("hidden");
}

function togglePista() {
  const box = document.getElementById("pistaBox");
  if (!datos.length) return;
  if (box.classList.contains("hidden")) {
    box.textContent = datos[indice].texto || "—";
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
    box.textContent = "";
  }
}

/* ---------- Render por obra ---------- */
function mostrar() {
  if (!datos.length) return;
  const item = datos[indice];
  const titulo = document.getElementById("titulo");
  const detalles = document.getElementById("detalles");
  const leyenda = document.getElementById("leyenda");
  const botones = document.getElementById("botones");
  const feedback = document.getElementById("feedback");
  const img = document.getElementById("imagen");
  const textoExtra = document.getElementById("texto-extra");

  titulo.textContent = `Obra ${indice + 1}`;
  feedback.textContent = "";
  botones.style.display = "none";
  document.body.style.backgroundColor = "#dcdcdc";
  pistaVisible = false;
  const pistaBox = document.getElementById("pistaBox");
  if (pistaBox) { pistaBox.classList.add("hidden"); pistaBox.textContent = ""; }

  // Mostrar leyenda; ocultar ficha
  leyenda.style.display = "flex";
  if (modoJuego === "mesa") leyenda.classList.add("modo-mesa"); else leyenda.classList.remove("modo-mesa");
  detalles.style.display = "none";
  detalles.classList.add("invisible");

  // Preparar leyenda según modo
  prepararLeyendaParaModo();

  // Limpiar ficha
  document.getElementById("anio").textContent = "";
  document.getElementById("descripcion").textContent = "";
  img.classList.add("hidden"); img.removeAttribute("src"); img.alt = "";
  textoExtra.textContent = ""; textoExtra.classList.add("hidden");

  // Audio
  prepararAudio(item.audio);

  // Si ya estaba mostrada la solución (volver atrás)
  if (solucionMostrada[indice]) {
    rellenarFicha(item);
    if (modoJuego === "solitario") leyenda.style.display = "none";
    detalles.style.display = "flex";
    detalles.classList.remove("invisible");
    if (item.color) document.body.style.backgroundColor = item.color;
    botones.style.display = "flex";
  }
}

function mostrarSolucion() { // usado en MESA
  if (!datos.length) return;
  const item = datos[indice];
  solucionMostrada[indice] = true;

  const detalles = document.getElementById("detalles");
  rellenarFicha(item);

  detalles.style.display = "flex";
  detalles.classList.remove("invisible");

  if (item.color) document.body.style.backgroundColor = item.color;
  document.getElementById("botones").style.display = "flex";

  if (modoJuego === "mesa") {
    document.getElementById("botonSolucion").classList.add("hidden");
    document.getElementById("leyenda").style.display = "none";
  }
}

function siguiente() {
  if (indice < datos.length - 1) {
    indice++;
    if (modoJuego === "mesa") document.getElementById("botonSolucion").classList.remove("hidden");
    mostrar();
  } else {
    document.getElementById("botones").style.display = "none";
    document.getElementById("reinicio").classList.remove("hidden");
  }
}

function anterior() {
  if (indice > 0) {
    indice--;
    if (modoJuego === "mesa") document.getElementById("botonSolucion").classList.add("hidden");
    mostrar();
  }
}

/* ---------- Solitario (respuesta) ---------- */
function onElegirColorSolitario(e) {
  const btn = e.currentTarget;
  if (btn.disabled) return;
  if (solucionMostrada[indice]) return;

  const elegido = (btn.dataset.hex || "").toLowerCase().trim();
  const correcto = (datos[indice].color || "").toLowerCase().trim();

  const ok = (elegido === correcto);

  // Puntuación (la pista NO penaliza)
  if (ok) { puntos++; racha++; if (racha > rachaMax) rachaMax = racha; }
  else { racha = 0; }
  pintarMarcadores();

  // Feedback visual
  marcarLeyendaTrasRespuesta(correcto, elegido, ok);

  // Feedback textual
  const fb = document.getElementById("feedback");
  fb.textContent = ok ? "✔ ¡Correcto!" : "✖ Incorrecto";
  fb.style.color = ok ? "#1a7f37" : "#b4232d";

  // Mostrar ficha
  solucionMostrada[indice] = true;
  rellenarFicha(datos[indice]);
  document.getElementById("leyenda").style.display = "none";
  const detalles = document.getElementById("detalles");
  detalles.style.display = "flex";
  detalles.classList.remove("invisible");
  if (datos[indice].color) document.body.style.backgroundColor = datos[indice].color;
  document.getElementById("botones").style.display = "flex";
}

function prepararLeyendaParaModo() {
  const leyendaBox = document.getElementById("leyenda");
  const botones = getLeyendaBotones();

  // reset
  botones.forEach((b) => {
    b.disabled = false;
    b.classList.remove("is-correct","is-wrong");
    b.style.boxShadow = "none";
    b.onclick = null;
    b.setAttribute("title", b.querySelector(".leyenda-txt")?.textContent || "");
  });

  if (modoJuego === "solitario") {
    leyendaBox.classList.remove("modo-mesa");
    botones.forEach((b) => { b.onclick = onElegirColorSolitario; });
    document.getElementById("marcadores").style.display = "block";
    document.getElementById("pista-wrap").classList.remove("hidden");
  } else {
    leyendaBox.classList.add("modo-mesa");
    botones.forEach((b) => { b.onclick = null; });
    document.getElementById("marcadores").style.display = "none";
    document.getElementById("pista-wrap").classList.add("hidden");
  }
}

function marcarLeyendaTrasRespuesta(hexCorrecto, hexElegido, acierto) {
  const botones = getLeyendaBotones();
  botones.forEach(b => b.disabled = true);

  const elegidoBtn = botones.find(b => (b.dataset.hex || "").toLowerCase().trim() === hexElegido);
  if (elegidoBtn) {
    elegidoBtn.classList.add(acierto ? "is-correct" : "is-wrong");
    elegidoBtn.style.boxShadow = acierto ? "0 0 0 3px rgba(26,127,55,.4)" : "0 0 0 3px rgba(180,35,45,.4)";
  }
  if (!acierto) {
    const correctoBtn = botones.find(b => (b.dataset.hex || "").toLowerCase().trim() === hexCorrecto);
    if (correctoBtn) {
      correctoBtn.classList.add("is-correct");
      correctoBtn.style.boxShadow = "0 0 0 3px rgba(26,127,55,.4)";
    }
  }
}

function getLeyendaBotones() {
  return Array.from(document.querySelectorAll("#leyenda .leyenda-item"));
}

/* ---------- Audio ---------- */
function prepararAudio(url) {
  const contc = document.getElementById("audio-container");
  contc.innerHTML = "";
  audioGlobal.src = url || "";
  audioGlobal.currentTime = 0;
  audioGlobal.play().catch(() => {});

  const cont = document.createElement("div");
  cont.className = "custom-audio-controls";
  cont.innerHTML = `
    <button id="btnRew" class="audio-btn" title="⟲ -5s"><i data-lucide="rewind"></i></button>
    <button id="btnPlayPause" class="audio-btn" title="Play/Pause"><i data-lucide="pause"></i></button>
    <button id="btnFf" class="audio-btn" title="⟳ +5s"><i data-lucide="fast-forward"></i></button>
  `;
  contc.appendChild(cont);
  if (window.lucide) lucide.createIcons();

  document.getElementById("btnRew").onclick = () => { audioGlobal.currentTime = Math.max(0, audioGlobal.currentTime - 5); };
  document.getElementById("btnFf").onclick = () => { audioGlobal.currentTime = Math.min(audioGlobal.duration || 0, audioGlobal.currentTime + 5); };
  document.getElementById("btnPlayPause").onclick = () => {
    const boton = document.getElementById("btnPlayPause");
    if (audioGlobal.paused) {
      audioGlobal.play().then(() => { boton.innerHTML = '<i data-lucide="pause"></i>'; if (window.lucide) lucide.createIcons(); });
    } else {
      audioGlobal.pause();
      boton.innerHTML = '<i data-lucide="play"></i>'; if (window.lucide) lucide.createIcons();
    }
  };
  audioGlobal.onpause = () => { const b = document.getElementById("btnPlayPause"); if (b) { b.innerHTML = '<i data-lucide="play"></i>'; if (window.lucide) lucide.createIcons(); } };
  audioGlobal.onplay  = () => { const b = document.getElementById("btnPlayPause"); if (b) { b.innerHTML = '<i data-lucide="pause"></i>'; if (window.lucide) lucide.createIcons(); } };
}

/* ---------- Ficha ---------- */
function rellenarFicha(item) {
  document.getElementById("anio").textContent = item.año || "";
  document.getElementById("descripcion").innerHTML = `<strong>${item.autor || ""}</strong><br>${item.obra || ""}`;
  const img = document.getElementById("imagen");
  img.classList.add("hidden");
  img.removeAttribute("src"); img.alt = "";
  img.onload = () => img.classList.remove("hidden");
  if (item.imagen && item.imagen.trim() !== "") { img.src = item.imagen; img.alt = item.obra || ""; }
  const textoExtra = document.getElementById("texto-extra");
  if (item.texto && item.texto.trim() !== "") { textoExtra.textContent = item.texto; textoExtra.classList.remove("hidden"); }
  else { textoExtra.textContent = ""; textoExtra.classList.add("hidden"); }
  document.getElementById("botones").style.display = "flex";
}

function pintarMarcadores() {
  document.getElementById("puntos").textContent = puntos;
  document.getElementById("racha").textContent = racha;
  document.getElementById("rachaMax").textContent = rachaMax;
}
