let indice = 0;
let datos = [];
let solucionMostrada = [];
let audioGlobal = new Audio();
let modoJuego = ""; // 'solitario' | 'mesa'

// Marcadores (solo solitario)
let puntos = 0, racha = 0, rachaMax = 0;

// Mapa de periodos (hex normalizados en minúsculas)
const PERIODOS = [
  { hex: "#5ca8d6", label: "Edad Media y Renacimiento (hasta 1500)" },
  { hex: "#f9c623", label: "Renacimiento y Barroco temprano (hasta 1640)" },
  { hex: "#e06464", label: "Barroco tardío (hasta 1750)" },
  { hex: "#26b98f", label: "Periodo clásico-romántico (hasta 1920)" },
  { hex: "#c87ab0", label: "Siglos XX y XXI" },
];

window.onload = () => {
  fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQrioQKwGSHMHsy9dQr37uk1xCFZC8vhIKDXepOtNEM_efmPwpe5ROmksO0fu_ZmHlxPUskuXu4rmCw/pub?gid=0&single=true&output=csv")
    .then(r => r.text())
    .then(csv => {
      const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true, delimiter: ",", quoteChar: '"' });
      datos = parsed.data.map(f => ({
        año: f["año"], autor: f["autor"], obra: f["obra"],
        audio: f["audio"], color: (f["color"] || "").toLowerCase().trim(),
        imagen: f["imagen"], texto: f["texto"]
      })).sort(() => Math.random() - 0.5);

      solucionMostrada = new Array(datos.length).fill(false);
      document.getElementById("cargando").classList.add("hidden");
      document.getElementById("menuModos").classList.remove("hidden");
    });

  window.focus();

  // Atajos teclado
  document.addEventListener("keydown", (e) => {
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
    const key = e.key;
    if (key === "ArrowRight") {
      const btnNext = document.getElementById("btnSiguiente");
      if (btnNext && btnNext.offsetParent !== null) siguiente();
    } else if (key === "ArrowLeft") {
      const btnPrev = document.getElementById("btnAnterior");
      if (btnPrev && btnPrev.offsetParent !== null) anterior();
    } else if (key === "Enter") {
      if (modoJuego === "mesa") {
        const btnSol = document.getElementById("btnSolucion");
        if (btnSol && btnSol.offsetParent !== null) mostrarSolucion();
      }
    } else if (key === " ") {
      e.preventDefault();
      if (!audioGlobal) return;
      if (audioGlobal.paused) audioGlobal.play(); else audioGlobal.pause();
    } else if (modoJuego === "solitario" && ["1","2","3","4","5"].includes(key)) {
      // Atajos 1–5 para elegir color en solitario
      const idx = parseInt(key) - 1;
      const opciones = getLeyendaBotones();
      if (opciones[idx] && opciones[idx].disabled === false) {
        opciones[idx].click();
      }
    }
  });
};

function abrirReglas() {
  const URL_REGLAS = "https://view.genially.com/6834d0143c53b6064031a058?idSlide=7099ad60-bc41-4a7a-83be-0fe6381c3869";
  window.open(URL_REGLAS, "_blank");
}

function seleccionarModo(modo) {
  modoJuego = modo; // 'solitario' | 'mesa'
  document.getElementById("menuModos").classList.add("hidden");
  document.getElementById("contenido").classList.remove("hidden");
  // Reset marcadores para solitario
  if (modoJuego === "solitario") {
    puntos = 0; racha = 0; rachaMax = 0; pintarMarcadores();
    document.getElementById("botonSolucion").classList.add("hidden"); // no se usa en solitario
  } else {
    document.getElementById("botonSolucion").classList.remove("hidden");
  }
  indice = 0;
  mostrar();
}

// --------- Render por obra ----------
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

  // Reset UI
  titulo.textContent = `Obra ${indice + 1}`;
  feedback.textContent = "";
  feedback.style.color = "";
  botones.style.display = "none";
  document.body.style.backgroundColor = "#dcdcdc";

  // Leyenda visible por defecto; ficha oculta
  leyenda.style.display = "flex";
  detalles.style.display = "none";
  detalles.classList.add("invisible");

  // Estado leyenda según modo
  prepararLeyendaParaModo();

  // Limpiar ficha
  document.getElementById("anio").textContent = "";
  document.getElementById("descripcion").textContent = "";
  img.classList.add("hidden"); img.removeAttribute("src"); img.alt = "";
  textoExtra.textContent = ""; textoExtra.classList.add("hidden");

  // Audio
  prepararAudio(item.audio);

  // Si ya estaba mostrada la solución (volver atrás o repetir)
  if (solucionMostrada[indice]) {
    rellenarFicha(item);
    leyenda.style.display = "none";
    detalles.style.display = "flex";
    detalles.classList.remove("invisible");
    if (item.color) document.body.style.backgroundColor = item.color;
    botones.style.display = "flex";
  }
}

function mostrarSolucion() {
  // Solo mesa usa este botón; en solitario se llama internamente al responder
  if (!datos.length) return;
  const item = datos[indice];
  solucionMostrada[indice] = true;

  const leyenda = document.getElementById("leyenda");
  const detalles = document.getElementById("detalles");

  rellenarFicha(item);

  leyenda.style.display = "none";
  detalles.style.display = "flex";
  detalles.classList.remove("invisible");

  if (item.color) document.body.style.backgroundColor = item.color;
  document.getElementById("botones").style.display = "flex";
  if (modoJuego === "mesa") document.getElementById("botonSolucion").classList.add("hidden");
}

function siguiente() {
  if (indice < datos.length - 1) {
    indice++;
    // re-habilitar botón solución en mesa
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

// --------- Solitario: respuesta con leyenda ----------
function onElegirColorSolitario(e) {
  const btn = e.currentTarget;
  if (btn.disabled) return;
  if (solucionMostrada[indice]) return; // ya respondido

  const elegido = (btn.dataset.hex || "").toLowerCase().trim();
  const correcto = (datos[indice].color || "").toLowerCase().trim();

  const ok = (elegido === correcto);
  // Marcadores
  if (ok) { puntos++; racha++; if (racha > rachaMax) rachaMax = racha; }
  else { racha = 0; }
  pintarMarcadores();

  // Feedback visual en leyenda
  marcarLeyendaTrasRespuesta(correcto, elegido, ok);

  // Feedback textual
  const fb = document.getElementById("feedback");
  if (ok) { fb.textContent = "✔ ¡Correcto!"; fb.style.color = "#1a7f37"; }
  else    { fb.textContent = "✖ Incorrecto"; fb.style.color = "#b4232d"; }

  // Mostrar ficha y avanzar UI
  solucionMostrada[indice] = true;
  mostrarSolucion(); // reutilizamos la función: oculta leyenda, muestra ficha, activa navegación
}

// --------- Utilidades UI ----------
function prepararLeyendaParaModo() {
  const botones = getLeyendaBotones();
  // reset estilos/estado
  botones.forEach((b) => {
    b.disabled = false;
    b.style.opacity = "1";
    b.style.outline = "none";
    b.style.boxShadow = "none";
    b.classList.remove("is-correct","is-wrong");
  });

  if (modoJuego === "solitario") {
    // activar como botones de respuesta
    botones.forEach((b) => {
      b.onclick = onElegirColorSolitario;
      b.setAttribute("title", b.querySelector(".leyenda-txt")?.textContent || "");
    });
    document.getElementById("botonSolucion").classList.add("hidden");
  } else {
    // mesa: desactivar clics (solo informativa)
    botones.forEach((b) => { b.onclick = null; b.disabled = true; b.style.opacity = "0.9"; });
    document.getElementById("botonSolucion").classList.remove("hidden");
  }
}

function marcarLeyendaTrasRespuesta(hexCorrecto, hexElegido, acierto) {
  const botones = getLeyendaBotones();
  // desactivar todo
  botones.forEach(b => b.disabled = true);

  // marcar elegido
  const elegidoBtn = botones.find(b => (b.dataset.hex || "").toLowerCase().trim() === hexElegido);
  if (elegidoBtn) {
    elegidoBtn.classList.add(acierto ? "is-correct" : "is-wrong");
    elegidoBtn.style.boxShadow = acierto ? "0 0 0 3px rgba(26,127,55,.4)" : "0 0 0 3px rgba(180,35,45,.4)";
  }

  // marcar correcto (si falló)
  if (!acierto) {
    const correctoBtn = botones.find(b => (b.dataset.hex || "").toLowerCase().trim() === hexCorrecto);
    if (correctoBtn) {
      correctoBtn.classList.add("is-correct");
      correctoBtn.style.boxShadow = "0 0 0 3px rgba(26,127,55,.4)";
    }
  }
}

function getLeyendaBotones() {
  return Array.from(document.querySelectorAll("#leyenda .leyenda-btn"));
}

function prepararAudio(url) {
  // limpiar contenedor
  const contc = document.getElementById("audio-container");
  contc.innerHTML = "";

  audioGlobal.src = url || "";
  audioGlobal.currentTime = 0;
  // Autoplay (algunas plataformas requieren interacción previa)
  audioGlobal.play().catch(() => { /* ignorar si el navegador bloquea autoplay */ });

  // Controles
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

function rellenarFicha(item) {
  document.getElementById("anio").textContent = item.año || "";
  document.getElementById("descripcion").innerHTML = `<strong>${item.autor || ""}</strong><br>${item.obra || ""}`;

  const img = document.getElementById("imagen");
  img.classList.add("hidden");
  img.removeAttribute("src"); img.alt = "";
  img.onload = () => img.classList.remove("hidden");
  if (item.imagen && item.imagen.trim() !== "") {
    img.src = item.imagen; img.alt = item.obra || "";
  }

  const textoExtra = document.getElementById("texto-extra");
  if (item.texto && item.texto.trim() !== "") {
    textoExtra.textContent = item.texto;
    textoExtra.classList.remove("hidden");
  } else {
    textoExtra.textContent = "";
    textoExtra.classList.add("hidden");
  }

  // Mostrar navegación
  document.getElementById("botones").style.display = "flex";
}

function pintarMarcadores() {
  const elP = document.getElementById("puntos");
  const elR = document.getElementById("racha");
  const elM = document.getElementById("rachaMax");
  if (elP) elP.textContent = puntos;
  if (elR) elR.textContent = racha;
  if (elM) elM.textContent = rachaMax;
}
