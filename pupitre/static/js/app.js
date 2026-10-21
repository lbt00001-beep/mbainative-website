/* Pupitre · aplicación web (sin dependencias) */
"use strict";

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = () => $("#app");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function md(text) {
  // Markdown mínimo y seguro: **negrita**, listas con guion y saltos de línea.
  const lines = esc(text).split("\n");
  let out = "", inList = false;
  for (const l of lines) {
    const m = l.match(/^\s*[-•*]\s+(.*)/);
    if (m) { if (!inList) { out += "<ul style='margin:4px 0;padding-left:20px'>"; inList = true; } out += `<li>${m[1]}</li>`; continue; }
    if (inList) { out += "</ul>"; inList = false; }
    out += l + "\n";
  }
  if (inList) out += "</ul>";
  return out.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n+$/, "");
}

function toast(msg, bad = false) {
  const t = $("#toast");
  t.textContent = msg;
  t.className = bad ? "bad" : "";
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), bad ? 5000 : 2800);
}

const state = { me: null, ctx: { view: "auth" }, subjects: {} };

async function api(path, opts = {}) {
  const o = { method: "GET", credentials: "same-origin", ...opts, headers: { ...(opts.headers || {}) } };
  if (o.body && !(o.body instanceof FormData)) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(o.body); }
  let r;
  try { r = await fetch(path, o); } catch { throw new Error("Sin conexión. Revisa internet e inténtalo de nuevo."); }
  if (r.status === 401) { state.me = null; location.hash = "#/acceso"; throw new Error("Inicia sesión para continuar."); }
  if (r.status === 403 && !opts._retried) {
    const d = await r.json().catch(() => ({}));
    if ((d.detail || "").includes("PIN")) {
      const ok = await pinModal();
      if (ok) return api(path, { ...opts, _retried: true });
      throw new Error("cancelado");
    }
    throw new Error(d.detail || "No autorizado");
  }
  const ct = r.headers.get("content-type") || "";
  const data = ct.includes("json") ? await r.json() : await r.text();
  if (!r.ok) {
    let msg = typeof data === "object" ? data.detail : "";
    if (Array.isArray(msg)) msg = "Revisa los datos del formulario.";
    throw new Error(msg || `Error ${r.status}`);
  }
  return data;
}

function fail(e) { if (e && e.message !== "cancelado") toast(e.message || "Algo ha fallado", true); }

// ---------------------------------------------------------------------------
// Iconos y avatares
// ---------------------------------------------------------------------------
const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICONS = {
  calc: P('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
  book: P('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 7h6"/>'),
  leaf: P('<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15"/><path d="M5 19c3-4 6-7 10-9"/>'),
  castle: P('<path d="M4 21V8l2 1V6l2 1V4l2 1v16M20 21V8l-2 1V6l-2 1V4l-2 1v16"/><path d="M3 21h18M10 21v-4a2 2 0 0 1 4 0v4"/>'),
  globe: P('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  flask: P('<path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>'),
  music: P('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  palette: P('<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/>'),
  lang: P('<path d="M4 5h8M8 3v2M6 5c0 4 2 7 6 8M10 5c0 3-2 7-6 9"/><path d="M13 21l4-9 4 9M14.5 18h5"/>'),
  star: P('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
  back: P('<path d="M15 18l-6-6 6-6"/>'),
  close: P('<path d="M18 6L6 18M6 6l12 12"/>'),
  lesson: P('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M10 8.5v5l4-2.5z"/>'),
  test: P('<path d="M9 11l2 2 4-4"/><rect x="4" y="3" width="16" height="18" rx="3"/>'),
  cards: P('<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 2h12a2 2 0 0 1 2 2v12"/>'),
  bolt: P('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  pairs: P('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><path d="M10 6.5h4a3 3 0 0 1 3 3V14"/>'),
  chat: P('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>'),
  folder: P('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  upload: P('<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'),
  camera: P('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  send: P('<path d="M4 12l16-8-6 16-2.5-6.5z"/>'),
  user: P('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  lock: P('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  info: P('<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>'),
  speaker: P('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
  plus: P('<path d="M12 5v14M5 12h14"/>'),
  trash: P('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'),
  edit: P('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
  mail: P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  chart: P('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  logout: P('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/>'),
  home: P('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
};
const ico = (k) => ICONS[k] || ICONS.book;
const AVATARS = { fox: "🦊", owl: "🦉", cat: "🐱", panda: "🐼", lion: "🦁", frog: "🐸", unicorn: "🦄", rocket: "🚀", dino: "🦖", octo: "🐙", penguin: "🐧", bear: "🐻" };
const av = (k) => AVATARS[k] || "🦊";
const BADGE_EMOJI = { explorador: "🧭", constante: "🔥", imparable: "🚀", lector: "📖", memoria: "🐘", rayo: "⚡", perfecto: "💯", maestro: "🎓", curioso: "💬", cien: "⭐" };
const KIND = {
  diagnostico: { label: "Prueba de nivel", icon: "test" }, leccion: { label: "Lección", icon: "lesson" },
  test: { label: "Práctica", icon: "test" }, contrarreloj: { label: "Contrarreloj", icon: "bolt" },
  repaso: { label: "Repaso", icon: "cards" }, tarjetas: { label: "Tarjetas", icon: "cards" },
  parejas: { label: "Parejas", icon: "pairs" }, tutor: { label: "Tutor", icon: "chat" }, deberes: { label: "Deberes", icon: "camera" },
};
const BRAND = `<a class="brand" href="#/"><span class="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h18M6 14l1.5-7h9L18 14M8 20v-6M16 20v-6"/></svg></span>Pupitre</a>`;

function aiBanner() {
  if (!state.me || state.me.ai_ready !== false) return "";
  return `<div class="ai-banner" role="alert">${ico("info")}<span>${esc(state.me.ai_message)}</span><button class="btn sm" data-keymodal>Añadir clave</button><button class="btn sm ghost-light" data-help="ia">Cómo conseguirla</button></div>`;
}

function statusPill(t) {
  const cls = { dominado: "ok", en_progreso: "warn", reforzar: "bad", sin_evaluar: "" }[t.status];
  return `<span class="pill ${cls}">${esc(t.status_label)}</span>`;
}

// ---------------------------------------------------------------------------
// Diálogos
// ---------------------------------------------------------------------------
function modal(html, { onMount, wide } = {}) {
  return new Promise((resolve) => {
    const bg = document.createElement("div");
    bg.className = "modal-bg";
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" style="${wide ? "max-width:640px" : ""}">${html}</div>`;
    document.body.appendChild(bg);
    const close = (v) => { bg.remove(); resolve(v); };
    bg.addEventListener("click", (e) => { if (e.target === bg) close(null); });
    $$("[data-close]", bg).forEach((b) => b.addEventListener("click", () => close(null)));
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { document.removeEventListener("keydown", k); close(null); } });
    onMount && onMount(bg, close);
  });
}

function confirmModal(title, text, okLabel = "Confirmar", danger = false) {
  return modal(`<h3>${esc(title)}</h3><p class="muted">${esc(text)}</p>
    <div class="actions"><button class="btn ghost" data-close>Cancelar</button><button class="btn ${danger ? "danger" : ""}" id="ok">${esc(okLabel)}</button></div>`,
    { onMount: (m, close) => $("#ok", m).addEventListener("click", () => close(true)) });
}

function pinModal() {
  return modal(`<div class="center"><div style="font-size:2.4rem">🔒</div><h3>Zona de la familia</h3>
    <p class="muted small">Introduce el PIN de 4 cifras de la familia.</p></div>
    <div class="pin-pad">${[0, 1, 2, 3].map((i) => `<input inputmode="numeric" maxlength="1" aria-label="Cifra ${i + 1}" data-i="${i}">`).join("")}</div>
    <p class="error-msg center" id="pinerr"></p>
    <div class="actions" style="justify-content:center"><button class="btn ghost" data-close>Cancelar</button></div>`, {
    onMount: (m, close) => {
      const ins = $$("input", m);
      ins[0].focus();
      const submit = async () => {
        const pin = ins.map((i) => i.value).join("");
        if (pin.length < 4) return;
        try { await api("/api/parent/unlock", { method: "POST", body: { pin }, _retried: true }); if (state.me) state.me.parent = true; refreshMenubar(); close(true); }
        catch (e) { $("#pinerr", m).textContent = e.message; ins.forEach((i) => (i.value = "")); ins[0].focus(); }
      };
      ins.forEach((inp, i) => {
        inp.addEventListener("input", () => { inp.value = inp.value.replace(/\D/g, "").slice(-1); if (inp.value && i < 3) ins[i + 1].focus(); submit(); });
        inp.addEventListener("keydown", (e) => { if (e.key === "Backspace" && !inp.value && i > 0) ins[i - 1].focus(); });
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Enrutado
// ---------------------------------------------------------------------------
async function loadMe() { state.me = await api("/api/me"); return state.me; }

async function route() {
  closePlayer(true);
  const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
  try {
    if (!state.me) await loadMe();
    if (!state.me.family) return viewAuth(parts[0] === "registro" ? "register" : "login");
    if (parts[0] === "acceso" || parts[0] === "registro") { location.hash = "#/"; return; }
    if (parts[0] === "alumno") {
      const sid = +parts[1];
      if (parts[2] === "asignatura") return viewSubject(sid, +parts[3], parts[4] || "temas");
      return viewStudentHome(sid);
    }
    if (parts[0] === "familia") return viewFamily(parts[1] || null, parts[2] || "resumen");
    return viewProfiles();
  } catch (e) { fail(e); }
}
window.addEventListener("hashchange", route);
window.addEventListener("DOMContentLoaded", route);

// ---------------------------------------------------------------------------
// Acceso
// ---------------------------------------------------------------------------
function viewAuth(mode) {
  const reg = mode === "register";
  document.title = "Pupitre · Los deberes, de otra manera";
  state.ctx = { view: "auth" };
  setTimeout(refreshMenubar, 0);
  app().innerHTML = `${aiBanner()}<header class="topbar auth-bar">${BRAND}${MENUBAR_SLOT}</header><div class="auth">
    <section class="auth-hero"><div class="deco"></div>
      ${BRAND.replace('class="brand"', 'class="brand" style="color:#fff;margin-bottom:34px"')}
      <h1>Los deberes, <em>de otra manera</em>.</h1>
      <p class="lead">Sube el libro de tu hijo o hija y Pupitre lo convierte en un tutor personal: mide su nivel, le enseña, le pone a prueba y avisa al profesor de cómo va.</p>
      <ul>
        <li><span class="b">📚</span>Trabaja con su propio libro y sus apuntes, tema a tema.</li>
        <li><span class="b">🎯</span>Prueba de nivel inicial y práctica que se adapta a cada alumno.</li>
        <li><span class="b">🎮</span>Lecciones interactivas, tarjetas, retos contrarreloj y juegos.</li>
        <li><span class="b">💬</span>Un tutor que guía con preguntas, sin dar la solución.</li>
        <li><span class="b">📨</span>Informe semanal automático para el profesor o tutor.</li>
      </ul>
    </section>
    <section class="auth-form"><div class="card">
      <div class="tabs-auth"><button class="${reg ? "" : "on"}" data-m="login">Entrar</button><button class="${reg ? "on" : ""}" data-m="registro">Crear cuenta</button></div>
      <form id="f" class="stack" novalidate>
        ${reg ? `<div class="field"><label for="name">Nombre de la familia</label><input class="input" id="name" required placeholder="Familia García" autocomplete="name"></div>` : ""}
        <div class="field"><label for="email">Email</label><input class="input" id="email" type="email" required autocomplete="email"></div>
        <div class="field"><label for="password">Contraseña</label><input class="input" id="password" type="password" required minlength="8" autocomplete="${reg ? "new-password" : "current-password"}">${reg ? `<span class="hint">Mínimo 8 caracteres.</span>` : ""}</div>
        ${reg ? `<div class="field"><label for="password2">Repite la contraseña</label><input class="input" id="password2" type="password" required minlength="8" autocomplete="new-password"><span class="hint match" id="pwmatch"></span></div>
        <div class="grid2"><div class="field"><label for="pin">PIN familiar (4 cifras)</label><input class="input" id="pin" type="password" inputmode="numeric" maxlength="4" pattern="\\d{4}" required autocomplete="off"></div>
          <div class="field"><label for="pin2">Repite el PIN</label><input class="input" id="pin2" type="password" inputmode="numeric" maxlength="4" pattern="\\d{4}" required autocomplete="off"></div></div>
        <span class="hint match" id="pinmatch" style="margin-top:-6px">El PIN protege la zona de la familia para que el alumno no cambie la configuración ni los informes.</span>` : ""}
        ${reg ? `<label class="check small" style="align-items:flex-start;font-weight:600"><input type="checkbox" id="privacy" style="margin-top:3px"><span>Soy el padre, la madre o el tutor legal del alumno y acepto el <a href="#" data-help="privacidad">aviso de privacidad</a>.</span></label>` : ""}
        ${reg && state.me.signup_code ? `<div class="field"><label for="code">Código de invitación</label><input class="input" id="code" required></div>` : ""}
        <p class="error-msg" id="err"></p>
        <button class="btn lg block" type="submit">${reg ? "Crear cuenta" : "Entrar"}</button>
      </form>
      <p class="tiny muted center" style="margin-top:16px">${esc(state.me.credit || "")}</p>
    </div></section></div>`;
  $$(".tabs-auth button").forEach((b) => b.addEventListener("click", () => (location.hash = b.dataset.m === "login" ? "#/acceso" : "#/registro")));
  const live = (x, y, out, okMsg, badMsg, idle) => {
    const A = $(x), Bq = $(y), O = $(out);
    if (!A || !Bq || !O) return;
    const upd = () => {
      if (!Bq.value) { O.textContent = idle || ""; O.className = "hint match"; return; }
      const ok = A.value === Bq.value;
      O.textContent = ok ? okMsg : badMsg;
      O.className = "hint match " + (ok ? "ok" : "bad");
    };
    A.addEventListener("input", upd); Bq.addEventListener("input", upd);
  };
  live("#password", "#password2", "#pwmatch", "✓ Las contraseñas coinciden", "✗ Las contraseñas no coinciden");
  live("#pin", "#pin2", "#pinmatch", "✓ Los PIN coinciden", "✗ Los PIN no coinciden", "El PIN protege la zona de la familia para que el alumno no cambie la configuración ni los informes.");
  $("#f").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#f button[type=submit]");
    btn.disabled = true;
    $("#err").textContent = "";
    try {
      if (reg) {
        const pin = $("#pin").value.trim();
        if ($("#password").value.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres.");
        if ($("#password").value !== $("#password2").value) throw new Error("Las dos contraseñas no coinciden. Vuelve a escribirlas.");
        if (pin !== $("#pin2").value.trim()) throw new Error("Los dos PIN no coinciden. Vuelve a escribirlos.");
        if (!$("#privacy").checked) throw new Error("Para crear la cuenta hay que aceptar el aviso de privacidad.");
        if (!/^\d{4}$/.test(pin)) throw new Error("El PIN debe tener 4 cifras.");
        await api("/api/auth/register", { method: "POST", body: { name: $("#name").value, email: $("#email").value, password: $("#password").value, password2: $("#password2").value, pin, pin2: $("#pin2").value.trim(), privacy: $("#privacy").checked, code: $("#code") ? $("#code").value : "" } });
      } else {
        await api("/api/auth/login", { method: "POST", body: { email: $("#email").value, password: $("#password").value } });
      }
      await loadMe();
      location.hash = "#/";
      await route();
      if (reg && state.me.ai_ready === false) keyModal(true);
    } catch (er) { $("#err").textContent = er.message; btn.disabled = false; }
  });
}

// ---------------------------------------------------------------------------
// Selector de perfil
// ---------------------------------------------------------------------------
function topbar(extra = "") {
  setTimeout(refreshMenubar, 0);
  return `${aiBanner()}<header class="topbar">${BRAND}${MENUBAR_SLOT}<div class="spacer"></div>${extra}</header>`;
}

async function viewProfiles() {
  await loadMe();
  const st = state.me.students;
  state.ctx = { view: "profiles" };
  document.title = "Pupitre";
  app().innerHTML = `${topbar(`<button class="btn ghost sm" id="fam">${ico("lock")} Zona familia</button><button class="iconbtn" id="out" title="Cerrar sesión">${ico("logout")}</button>`)}
  <main class="page narrow">
    <div class="center" style="margin-top:28px">
      <h1>${st.length ? "¿Quién va a estudiar?" : `¡Bienvenidos, ${esc(state.me.family.name)}!`}</h1>
      <p class="muted" style="margin-top:8px">${st.length ? "Elige tu perfil para empezar." : "Empieza creando el perfil del alumno. Luego subiréis sus libros, asignatura por asignatura."}</p>
    </div>
    <div class="profiles">
      ${st.map((s) => `<button class="profile" data-sid="${s.id}"><div class="avatar">${av(s.avatar)}</div><div class="name">${esc(s.name)}</div><div class="muted small">${esc(s.course)}</div>
        ${s.streak ? `<div class="streak small" style="margin-top:6px">🔥 ${s.streak} ${s.streak === 1 ? "día" : "días"}</div>` : ""}</button>`).join("")}
      <button class="profile add" id="add"><div class="avatar">＋</div><div class="name">Añadir alumno</div><div class="muted small">Requiere el PIN</div></button>
    </div>
  </main>`;
  $$(".profile[data-sid]").forEach((b) => b.addEventListener("click", () => (location.hash = `#/alumno/${b.dataset.sid}`)));
  $("#add").addEventListener("click", () => studentForm().then((s) => s && (location.hash = `#/familia/${s.id}/asignaturas`)).catch(fail));
  $("#fam").addEventListener("click", () => (location.hash = "#/familia"));
  $("#out").addEventListener("click", async () => { await api("/api/auth/logout", { method: "POST" }); state.me = null; location.hash = "#/acceso"; route(); });
}

// ---------------------------------------------------------------------------
// Inicio del alumno
// ---------------------------------------------------------------------------
async function viewStudentHome(sid) {
  app().innerHTML = `${topbar()}<div class="loading"><div class="spinner"></div></div>`;
  const d = await api(`/api/students/${sid}/home`);
  const s = d.student;
  state.ctx = { view: "student", sid };
  state.subjects[sid] = d.subjects;
  document.title = `${s.name} · Pupitre`;
  const hour = new Date().getHours();
  const greet = hour < 14 ? "¡Buenos días" : hour < 21 ? "¡Buenas tardes" : "¡Buenas noches";
  const lv = s.level;
  const dayNames = ["D", "L", "M", "X", "J", "V", "S"];
  const maxMin = Math.max(20, ...d.week.map((w) => w.minutes));
  const today = new Date().toISOString().slice(0, 10);
  const noMaterial = d.subjects.every((x) => x.topics === 0);

  app().innerHTML = `${topbar(`<div class="avatar sm">${av(s.avatar)}</div><button class="btn ghost sm" id="switch">Cambiar</button>`)}
  <main class="page">
    <section class="hello">
      <div><h1>${greet}, <span>${esc(s.name)}</span>!</h1>
        <p class="muted" style="margin-top:6px">${d.mission.length ? "Esto es lo que te toca hoy. ¡Vamos paso a paso!" : noMaterial ? "Para empezar, sube tu libro en cualquier asignatura." : "¡Lo tienes todo al día! Elige una asignatura para seguir aprendiendo."}</p></div>
      <div class="levelbox"><div class="row">
        <div class="lvl"><small>NIVEL</small>${lv.level}</div>
        <div class="grow"><div class="row between small"><b>${s.xp} puntos</b>${s.streak ? `<span class="streak">🔥 ${s.streak}</span>` : ""}</div>
          <div class="bar" style="margin-top:6px"><i style="width:${Math.round((100 * lv.progress) / lv.needed)}%"></i></div>
          <div class="tiny muted" style="margin-top:4px">${lv.needed - lv.progress} puntos para el nivel ${lv.level + 1}</div></div>
      </div></div>
    </section>

    <div class="section-title"><h2>🎯 Tu misión de hoy</h2>${d.due_cards ? `<span class="pill violet">${d.due_cards} tarjetas para repasar</span>` : ""}</div>
    ${d.mission.length ? `<div class="mission">${d.mission.map((m, i) => `<button class="mtask ${m.done ? "done" : ""}" style="--c:${m.color}" data-i="${i}">
        <span class="kind">${esc(KIND[m.kind]?.label || "")} · ${esc(m.subject)}</span><h4>${esc(m.title)}</h4>
        <span class="small muted">${esc(m.why)}</span><span class="meta"><span>⏱ ${m.minutes} min</span><span>${m.done ? "Hecho" : "Empezar →"}</span></span></button>`).join("")}</div>`
      : `<div class="empty"><div class="big">${noMaterial ? "📚" : "🌟"}</div><p style="margin-top:6px;font-weight:700">${noMaterial ? "Todavía no hay libros. Entra en una asignatura y sube tu libro o unas fotos del tema." : "No hay tareas pendientes. ¡Buen trabajo!"}</p></div>`}

    <div class="section-title"><h2>📚 Mis asignaturas</h2></div>
    <div class="subjects">${d.subjects.map((x) => `<button class="subj" style="--c:${x.color}" data-sub="${x.id}">
        <div class="ico">${ico(x.icon)}</div><h3>${esc(x.name)}</h3>
        <div class="foot">${x.topics === 0 ? `<span class="small muted">${x.processing ? "⏳ Leyendo tu libro…" : "Sube tu libro para empezar"}</span>`
          : !x.diagnosed ? `<span class="pill warn" style="align-self:flex-start">Prueba de nivel pendiente</span><span class="small muted">${x.topics} temas</span>`
          : `<div class="row between small"><span class="muted">${x.mastered} de ${x.topics} temas dominados</span><b>${x.mastery ?? 0}%</b></div><div class="bar"><i style="width:${x.mastery ?? 0}%"></i></div>`}</div></button>`).join("")}</div>

    <div class="two" style="margin-top:32px">
      <section class="card"><h3>Esta semana</h3><p class="muted small">Minutos de estudio por día</p>
        <div class="week">${d.week.map((w) => `<div class="d ${w.day === today ? "today" : ""}" title="${w.minutes} min"><i style="height:${Math.max(4, (100 * w.minutes) / maxMin)}%"></i><span>${dayNames[new Date(w.day + "T12:00").getDay()]}</span></div>`).join("")}</div></section>
      <section class="card"><h3>Mis logros</h3><p class="muted small">${d.badges.filter((b) => b.earned).length} de ${d.badges.length} conseguidos</p>
        <div class="badges" style="margin-top:12px">${d.badges.map((b) => `<div class="badge ${b.earned ? "on" : ""}" title="${esc(b.desc)}"><div class="b">${BADGE_EMOJI[b.id] || "🏅"}</div><div class="n">${esc(b.name)}</div><div class="t">${esc(b.desc)}</div></div>`).join("")}</div></section>
    </div>
  </main>`;

  $("#switch").addEventListener("click", () => (location.hash = "#/"));
  $$(".subj").forEach((b) => b.addEventListener("click", () => (location.hash = `#/alumno/${sid}/asignatura/${b.dataset.sub}`)));
  $$(".mtask").forEach((b) => b.addEventListener("click", () => startMission(sid, d.mission[+b.dataset.i])));
}

function startMission(sid, m) {
  const sub = { id: m.subject_id, name: m.subject, color: m.color };
  if (m.kind === "diagnostico") return startDiagnostic(sid, sub);
  if (m.kind === "repaso") return startCards(sid, sub, null);
  const t = { id: m.topic_id, title: m.topic };
  if (m.kind === "leccion") return startLesson(sid, sub, t);
  if (m.kind === "test") return startQuiz(sid, sub, t, "test");
  if (m.kind === "contrarreloj") return startQuiz(sid, sub, t, "contrarreloj");
}

// ---------------------------------------------------------------------------
// Asignatura
// ---------------------------------------------------------------------------
let pollTimer = null;

async function viewSubject(sid, subId, tab) {
  clearTimeout(pollTimer);
  if (!$("#subj-root")) app().innerHTML = `${topbar()}<div class="loading"><div class="spinner"></div></div>`;
  const d = await api(`/api/subjects/${subId}`);
  const me = state.me.students.find((s) => s.id === sid) || { avatar: "fox", name: "" };
  state.ctx = { view: "subject", sid, subId, tab, sub: { id: d.id, name: d.name, color: d.color }, dueCards: d.due_cards, hasTopics: d.topics_list.length > 0 };
  if (!state.subjects[sid]) api(`/api/students/${sid}/home`).then((h) => { state.subjects[sid] = h.subjects; refreshMenubar(); }).catch(() => {});
  document.title = `${d.name} · Pupitre`;
  const sub = { id: d.id, name: d.name, color: d.color };
  const tabBtn = (k, label, icon) => `<button class="${tab === k ? "on" : ""}" data-tab="${k}">${ico(icon)} ${label}</button>`;
  app().innerHTML = `${topbar(`<div class="avatar sm">${av(me.avatar)}</div>`)}
  <main class="page" id="subj-root" style="--c:${d.color}">
    <button class="btn soft sm" id="back" style="margin-bottom:14px">${ico("back")} Inicio</button>
    <section class="subj-head" style="--c:${d.color}">
      <div class="row"><div class="ico">${ico(d.icon)}</div><div><h1>${esc(d.name)}</h1><p style="opacity:.9;font-weight:600">${d.topics} ${d.topics === 1 ? "tema" : "temas"} · ${d.documents} ${d.documents === 1 ? "documento" : "documentos"}</p></div></div>
      <div class="stats"><div><b>${d.mastery ?? "—"}${d.mastery != null ? "%" : ""}</b><span>Dominio medio</span></div>
        <div><b>${d.mastered}</b><span>Temas dominados</span></div><div><b>${d.cards}</b><span>Tarjetas</span></div><div><b>${d.due_cards}</b><span>Para repasar hoy</span></div></div>
    </section>
    <nav class="tabs">${tabBtn("temas", "Temas", "book")}${tabBtn("tutor", "Tutor y deberes", "chat")}${tabBtn("material", "Libros y material", "folder")}</nav>
    <section id="tab"></section>
  </main>`;
  $("#back").addEventListener("click", () => (location.hash = `#/alumno/${sid}`));
  $$(".tabs button").forEach((b) => b.addEventListener("click", () => (location.hash = `#/alumno/${sid}/asignatura/${subId}/${b.dataset.tab}`)));
  const box = $("#tab");
  if (tab === "tutor") return renderTutor(box, sid, sub);
  if (tab === "material") return renderMaterial(box, sid, d);
  return renderTopics(box, sid, d);
}

function renderTopics(box, sid, d) {
  const sub = { id: d.id, name: d.name, color: d.color };
  if (!d.topics_list.length) {
    box.innerHTML = `<div class="empty"><div class="big">📚</div><h3 style="margin-top:6px">Aún no hay temas</h3>
      <p class="muted" style="margin:6px 0 16px">${d.processing ? "Estamos leyendo tu libro. En un momento aparecerán aquí los temas." : "Sube tu libro, unos apuntes o fotos de las páginas y Pupitre preparará los temas."}</p>
      ${d.processing ? `<div class="spinner" style="margin:0 auto"></div>` : `<button class="btn" id="go-mat">${ico("upload")} Subir material</button>`}</div>`;
    $("#go-mat") && $("#go-mat").addEventListener("click", () => (location.hash = `#/alumno/${sid}/asignatura/${d.id}/material`));
    if (d.processing) pollTimer = setTimeout(() => location.hash.endsWith(`/${d.id}/temas`) || location.hash.endsWith(`/${d.id}`) ? viewSubject(sid, d.id, "temas") : null, 3000);
    return;
  }
  box.innerHTML = `
    ${!d.diagnosed ? `<div class="cta-diag"><div class="big">🧭</div><div><h3>Empieza con la prueba de nivel</h3><p class="muted small">Unas preguntas rápidas de todos los temas para saber qué dominas y por dónde seguir. Tranquilo: no es un examen.</p></div>
      <button class="btn sun lg" id="diag">Hacer la prueba</button></div>` : ""}
    <div class="row between wrap" style="margin-bottom:12px"><p class="muted small">Elige un tema y una forma de estudiarlo.</p>
      ${d.due_cards ? `<button class="btn sm" id="review">${ico("cards")} Repasar ${d.due_cards} tarjetas</button>` : ""}</div>
    ${d.topics_list.map((t) => `<article class="topic status-${t.status}">
      <div><div class="row wrap" style="gap:8px"><h4>${esc(t.title)}</h4>${statusPill(t)}${t.focus ? `<span class="pill violet">En clase ahora</span>` : ""}</div>
        <p class="sum">${esc(t.summary)}</p>
        ${t.evaluated ? `<div class="mbar"><div class="bar"><i style="width:${t.mastery}%"></i></div><b>${t.mastery}</b><span class="tiny muted">${t.correct}/${t.answered} aciertos</span></div>` : ""}</div>
      <div class="acts">
        <button class="act-btn ${t.mastery < 40 ? "primary" : ""}" data-a="leccion" data-t="${t.id}">${ico("lesson")}Aprender</button>
        <button class="act-btn ${t.mastery >= 40 && t.mastery < 75 ? "primary" : ""}" data-a="test" data-t="${t.id}">${ico("test")}Practicar</button>
        <button class="act-btn" data-a="tarjetas" data-t="${t.id}">${ico("cards")}Tarjetas</button>
        <button class="act-btn ${t.mastery >= 75 ? "primary" : ""}" data-a="contrarreloj" data-t="${t.id}">${ico("bolt")}Reto</button>
        <button class="act-btn" data-a="parejas" data-t="${t.id}">${ico("pairs")}Parejas</button>
      </div></article>`).join("")}`;
  $("#diag") && $("#diag").addEventListener("click", () => startDiagnostic(sid, sub));
  $("#review") && $("#review").addEventListener("click", () => startCards(sid, sub, null));
  $$(".act-btn").forEach((b) => b.addEventListener("click", () => {
    const t = d.topics_list.find((x) => x.id === +b.dataset.t);
    const a = b.dataset.a;
    if (a === "leccion") startLesson(sid, sub, t);
    else if (a === "test" || a === "contrarreloj") startQuiz(sid, sub, t, a);
    else if (a === "tarjetas") startCards(sid, sub, t);
    else if (a === "parejas") startPairs(sid, sub, t);
  }));
}

function renderMaterial(box, sid, d) {
  const kinds = { libro: "📕", apuntes: "📝", ejercicios: "✏️", examen: "📄", otro: "📎" };
  box.innerHTML = `<div class="two" style="align-items:start">
    <div class="stack">
      <div class="dropzone" id="dz"><div class="big">📤</div><h3 style="margin:6px 0 4px">Sube el libro o el material</h3>
        <p class="muted small">PDF (aunque sea escaneado), Word, texto o fotos de las páginas. Pupitre lo lee y prepara los temas.</p>
        <div class="row wrap" style="justify-content:center;margin-top:14px">
          <select class="input" id="kind" style="width:auto"><option value="libro">Libro de texto</option><option value="apuntes">Apuntes</option><option value="ejercicios">Ejercicios</option><option value="examen">Examen o control</option><option value="otro">Otro</option></select>
          <label class="btn">${ico("upload")} Elegir archivos<input type="file" id="file" class="sr" multiple accept=".pdf,.docx,.txt,.md,.csv,image/*"></label>
          <label class="btn ghost">${ico("camera")} Hacer foto<input type="file" id="cam" class="sr" accept="image/*" capture="environment"></label>
        </div><p class="tiny muted" style="margin-top:10px">Consejo: si es un libro muy grande, sube solo los temas de este trimestre.</p></div>
      <div id="docs">${d.documents_list.length ? d.documents_list.map((x) => `<div class="doc"><div class="ic">${kinds[x.kind] || "📎"}</div>
          <div class="grow"><b class="small" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.filename)}</b>
          ${x.status === "procesando" ? `<span class="tiny muted">Leyendo… ${x.progress}%</span><div class="bar"><i style="width:${Math.max(5, x.progress)}%"></i></div>`
            : x.status === "error" ? `<span class="tiny" style="color:var(--bad);font-weight:700">${esc(x.error)}</span>` : `<span class="tiny muted">${x.pages ? x.pages + " páginas · " : ""}listo</span>`}</div>
          <button class="iconbtn" data-del="${x.id}" title="Eliminar">${ico("trash")}</button></div>`).join("") : `<p class="muted small center">Todavía no hay documentos.</p>`}</div>
    </div>
    <div class="card"><div class="row between"><h3>Temas</h3><button class="btn sm soft" id="addt">${ico("plus")} Añadir tema</button></div>
      <p class="muted small" style="margin:4px 0 12px">Marca los temas que estáis dando ahora en clase: Pupitre los prioriza en la misión del día.</p>
      ${d.topics_list.length ? d.topics_list.map((t) => `<div class="row" style="padding:9px 0;border-bottom:1px solid var(--paper-2)">
        <label class="check grow small" title="En clase ahora"><input type="checkbox" data-focus="${t.id}" ${t.focus ? "checked" : ""}><span>${esc(t.title)}</span></label>
        <button class="iconbtn" data-edit="${t.id}" title="Editar">${ico("edit")}</button></div>`).join("") : `<p class="muted small">Aparecerán al subir material, o añádelos a mano.</p>`}
    </div></div>`;

  const upload = async (files) => {
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      fd.append("kind", $("#kind").value);
      try { await api(`/api/subjects/${d.id}/documents`, { method: "POST", body: fd }); toast(`Subido: ${f.name}`); }
      catch (e) { fail(e); }
    }
    viewSubject(sid, d.id, "material");
  };
  $("#file").addEventListener("change", (e) => upload(Array.from(e.target.files)));
  $("#cam").addEventListener("change", (e) => upload(Array.from(e.target.files)));
  const dz = $("#dz");
  ["dragenter", "dragover"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add("drag"); }));
  ["dragleave", "drop"].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove("drag"); }));
  dz.addEventListener("drop", (e) => upload(Array.from(e.dataTransfer.files)));
  $$("[data-del]").forEach((b) => b.addEventListener("click", async () => {
    if (!(await confirmModal("Eliminar documento", "Se borrará el texto guardado de este documento. Los temas y el progreso se mantienen.", "Eliminar", true))) return;
    try { await api(`/api/documents/${b.dataset.del}`, { method: "DELETE" }); viewSubject(sid, d.id, "material"); } catch (e) { fail(e); }
  }));
  $$("[data-focus]").forEach((c) => c.addEventListener("change", async () => {
    const t = d.topics_list.find((x) => x.id === +c.dataset.focus);
    try { await api(`/api/topics/${t.id}`, { method: "PUT", body: { title: t.title, summary: t.summary, focus: c.checked } }); t.focus = c.checked; } catch (e) { fail(e); }
  }));
  $("#addt").addEventListener("click", () => topicForm(d.id, null).then((r) => r && viewSubject(sid, d.id, "material")));
  $$("[data-edit]").forEach((b) => b.addEventListener("click", () => topicForm(d.id, d.topics_list.find((x) => x.id === +b.dataset.edit)).then((r) => r && viewSubject(sid, d.id, "material"))));
  if (d.documents_list.some((x) => x.status === "procesando")) pollTimer = setTimeout(() => location.hash.endsWith("/material") && viewSubject(sid, d.id, "material"), 2500);
}

function topicForm(subId, t) {
  return modal(`<h3>${t ? "Editar tema" : "Añadir tema"}</h3><p class="muted small">Útil para lo que están dando en clase y no viene en el libro.</p>
    <div class="stack" style="margin-top:14px"><div class="field"><label>Título</label><input class="input" id="tt" value="${esc(t?.title || "")}" maxlength="200"></div>
    <div class="field"><label>¿Qué tiene que aprender?</label><textarea class="input" id="ts" maxlength="800" placeholder="Ej.: sumar fracciones con distinto denominador y resolver problemas.">${esc(t?.summary || "")}</textarea></div>
    <label class="check"><input type="checkbox" id="tf" ${t?.focus ? "checked" : ""}> Lo estamos dando ahora en clase</label><p class="error-msg" id="te"></p></div>
    <div class="actions">${t ? `<button class="btn danger" id="tdel" style="margin-right:auto">${ico("trash")}</button>` : ""}<button class="btn ghost" data-close>Cancelar</button><button class="btn" id="ok">Guardar</button></div>`, {
    onMount: (m, close) => {
      $("#ok", m).addEventListener("click", async () => {
        const body = { title: $("#tt", m).value.trim(), summary: $("#ts", m).value.trim(), focus: $("#tf", m).checked };
        if (body.title.length < 2) return ($("#te", m).textContent = "Escribe un título.");
        try { await api(t ? `/api/topics/${t.id}` : `/api/subjects/${subId}/topics`, { method: t ? "PUT" : "POST", body }); close(true); } catch (e) { $("#te", m).textContent = e.message; }
      });
      t && $("#tdel", m).addEventListener("click", async () => {
        try { await api(`/api/topics/${t.id}`, { method: "DELETE" }); close(true); } catch (e) { fail(e); }
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Tutor y deberes
// ---------------------------------------------------------------------------
async function renderTutor(box, sid, sub) {
  box.innerHTML = `<div class="chat"><div class="chat-modes"><button class="chip on" data-mode="tutor">💡 Tengo una duda</button><button class="chip" data-mode="deberes">✏️ Ayúdame con los deberes</button>
      <span class="grow"></span><button class="chip" id="clear">Empezar de nuevo</button></div>
    <div class="chat-log" id="log"></div><div id="att"></div>
    <form class="chat-form" id="cf"><label class="iconbtn" title="Foto del ejercicio">${ico("camera")}<input type="file" id="img" class="sr" accept="image/*"></label>
      <textarea class="input" id="msg" rows="1" placeholder="Escribe tu pregunta…" maxlength="2000"></textarea>
      <button class="btn" type="submit" title="Enviar">${ico("send")}</button></form></div>
    <p class="tiny muted center" style="margin-top:10px">El tutor te guía con pistas y preguntas para que llegues tú a la respuesta. Usa lo que pone en tu libro.</p>`;
  let mode = "tutor", file = null;
  const log = $("#log");
  const add = (role, content, hasImg) => {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.innerHTML = (hasImg ? `<span class="img-tag">📷 Foto adjunta</span><br>` : "") + (role === "assistant" ? md(content) : esc(content));
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  };
  try {
    const h = await api(`/api/subjects/${sub.id}/chat`);
    if (!h.messages.length) add("assistant", `¡Hola! Soy tu tutor de **${sub.name}**. Pregúntame lo que no entiendas, o haz una foto a un ejercicio de los deberes y lo resolvemos juntos, paso a paso.`);
    h.messages.forEach((m) => add(m.role, m.content, m.has_image));
  } catch (e) { fail(e); }
  $$(".chip[data-mode]").forEach((c) => c.addEventListener("click", () => {
    mode = c.dataset.mode;
    $$(".chip[data-mode]").forEach((x) => x.classList.toggle("on", x === c));
    $("#msg").placeholder = mode === "deberes" ? "Copia el enunciado o haz una foto del ejercicio…" : "Escribe tu pregunta…";
  }));
  $("#clear").addEventListener("click", async () => { await api(`/api/subjects/${sub.id}/chat`, { method: "DELETE" }).catch(fail); renderTutor(box, sid, sub); });
  $("#img").addEventListener("change", (e) => {
    file = e.target.files[0] || null;
    $("#att").innerHTML = file ? `<div class="attach-preview"><img src="${URL.createObjectURL(file)}" alt=""> Foto lista para enviar <button class="chip" id="rm">Quitar</button></div>` : "";
    $("#rm") && $("#rm").addEventListener("click", () => { file = null; $("#att").innerHTML = ""; $("#img").value = ""; });
    if (file) { mode = "deberes"; $$(".chip[data-mode]").forEach((x) => x.classList.toggle("on", x.dataset.mode === "deberes")); }
  });
  const ta = $("#msg");
  ta.addEventListener("input", () => { ta.style.height = "auto"; ta.style.height = Math.min(140, ta.scrollHeight) + "px"; });
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#cf").requestSubmit(); } });
  $("#cf").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = ta.value.trim();
    if (!text && !file) return;
    add("user", text || "Ayúdame con este ejercicio.", !!file);
    const fd = new FormData();
    fd.append("message", text);
    fd.append("mode", mode);
    if (file) fd.append("image", file);
    ta.value = ""; ta.style.height = "auto"; file = null; $("#att").innerHTML = ""; $("#img").value = "";
    const typing = add("assistant", "Pensando…");
    typing.classList.add("typing");
    const btn = $("#cf button[type=submit]");
    btn.disabled = true;
    try { const r = await api(`/api/subjects/${sub.id}/chat`, { method: "POST", body: fd }); typing.classList.remove("typing"); typing.innerHTML = md(r.reply); }
    catch (er) { typing.remove(); fail(er); }
    btn.disabled = false;
    log.scrollTop = log.scrollHeight;
    ta.focus();
  });
}

// ---------------------------------------------------------------------------
// Reproductor de actividades
// ---------------------------------------------------------------------------
let playerCleanup = null;
function openPlayer(color, title, label) {
  const o = $("#overlay");
  o.hidden = false;
  o.style.setProperty("--c", color);
  document.body.style.overflow = "hidden";
  o.innerHTML = `<div class="player"><div class="player-top"><button class="iconbtn" id="pclose" title="Salir">${ico("close")}</button>
    <div class="grow"><div class="tiny muted" style="font-weight:800">${esc(label)}</div><div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(title)}</div></div>
    <div id="pextra" class="row"></div></div><div style="padding:0 16px"><div class="bar" style="height:8px;margin-top:-1px;border-radius:0 0 8px 8px" id="pbar"><i style="width:0"></i></div></div>
    <div class="player-body"><div class="pcard" id="pbody"><div class="loading"><div class="spinner"></div><p class="muted" id="ploadmsg">Preparando…</p></div></div></div></div>`;
  $("#pclose").addEventListener("click", async () => {
    if (o.dataset.dirty === "1" && !(await confirmModal("¿Salir de la actividad?", "Perderás el progreso de esta actividad.", "Salir"))) return;
    closePlayer();
  });
  o.dataset.dirty = "0";
}
function closePlayer(silent) {
  const o = $("#overlay");
  if (o.hidden) return;
  if (playerCleanup) { playerCleanup(); playerCleanup = null; }
  window.speechSynthesis && speechSynthesis.cancel();
  o.hidden = true;
  o.innerHTML = "";
  document.body.style.overflow = "";
  if (!silent) route();
}
const pbody = () => $("#pbody");
const setProgress = (p) => { const b = $("#pbar > i"); if (b) b.style.width = `${Math.round(p * 100)}%`; };
const loadingMessages = ["Leyendo tu libro…", "Preparando las preguntas…", "Buscando buenos ejemplos…", "Casi listo…"];
async function withLoading(promise) {
  let i = 0;
  const t = setInterval(() => { const el = $("#ploadmsg"); if (el) el.textContent = loadingMessages[++i % loadingMessages.length]; }, 2200);
  try { return await promise; } finally { clearInterval(t); }
}
function playerError(e) {
  if (e && e.message === "cancelado") return closePlayer(true);
  pbody().innerHTML = `<div class="empty"><div class="big">😕</div><p style="font-weight:700;margin:8px 0 14px">${esc(e.message || "Algo ha fallado")}</p><button class="btn" id="perr">Volver</button></div>`;
  $("#perr").addEventListener("click", () => closePlayer());
}

function confetti() {
  if (pref("fx", "1") !== "1") return;
  const c = document.createElement("div");
  c.className = "confetti";
  const colors = ["#fbbf24", "#2563eb", "#db2777", "#16a34a", "#7c3aed", "#f97316"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.6 + Math.random() * 1.8 + "s";
    p.style.animationDelay = Math.random() * 0.4 + "s";
    c.appendChild(p);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 4200);
}

async function finish(aid, started, results = [], extra = {}) {
  return api(`/api/activities/${aid}/finish`, { method: "POST", body: { duration_s: Math.round((Date.now() - started) / 1000), results, extra } });
}

function showResult(r, { title, subtitle, again, review } = {}) {
  $("#overlay").dataset.dirty = "0";
  setProgress(1);
  const ratio = r.max_score ? r.score / r.max_score : 1;
  if (ratio >= 0.7) confetti();
  const trophy = ratio >= 0.9 ? "🏆" : ratio >= 0.7 ? "🌟" : ratio >= 0.4 ? "💪" : "🌱";
  const msg = title || (ratio >= 0.9 ? "¡Espectacular!" : ratio >= 0.7 ? "¡Muy bien!" : ratio >= 0.4 ? "¡Buen trabajo, sigue así!" : "Has empezado, y eso es lo importante");
  pbody().innerHTML = `<div class="result"><div class="trophy">${trophy}</div><h2>${esc(msg)}</h2>
    ${r.max_score ? `<div class="big-score">${Number.isInteger(r.score) ? r.score : r.score.toFixed(1)} <span class="muted" style="font-size:1.6rem">/ ${r.max_score}</span></div>` : ""}
    ${subtitle ? `<p class="muted">${esc(subtitle)}</p>` : ""}
    <div class="xp-gain">⭐ +${r.xp_gained} puntos ${r.streak > 1 ? ` · 🔥 ${r.streak} días seguidos` : ""}</div>
    ${r.topics && r.topics.length ? `<div style="margin-top:26px;text-align:left"><h3 style="margin-bottom:10px">Tu nivel por tema</h3>${r.topics.map((t) => `<div class="tchange"><div class="grow"><b class="small">${esc(t.title)}</b><div class="tiny muted">${esc(t.status_label)}</div></div>
      <div class="bar"><i style="width:${t.after}%"></i></div><b>${t.after}</b>${t.before != null && t.after !== t.before ? `<span class="tiny" style="font-weight:800;color:${t.after > t.before ? "var(--ok)" : "var(--bad)"}">${t.after > t.before ? "▲" : "▼"} ${Math.abs(t.after - t.before)}</span>` : ""}</div>`).join("")}</div>` : ""}
    ${review ? `<details style="margin-top:22px;text-align:left"><summary style="cursor:pointer;font-weight:800">Revisar las respuestas</summary><div style="margin-top:10px">${review}</div></details>` : ""}
    <div class="row" style="justify-content:center;margin-top:26px;gap:10px">${again ? `<button class="btn ghost" id="again">Otra vez</button>` : ""}<button class="btn sun lg" id="done">Continuar</button></div></div>`;
  $("#done").addEventListener("click", () => closePlayer());
  again && $("#again").addEventListener("click", again);
}

// ---------- Prueba de nivel y práctica ----------
async function startDiagnostic(sid, sub) {
  openPlayer(sub.color, `Prueba de nivel · ${sub.name}`, "PRUEBA DE NIVEL");
  try {
    const d = await withLoading(api(`/api/subjects/${sub.id}/diagnostic`, { method: "POST" }));
    pbody().innerHTML = `<div class="slide center"><div class="emoji">🧭</div><h2>Vamos a ver qué sabes</h2>
      <p class="text">Son ${d.questions.length} preguntas de todos los temas, de más fácil a más difícil. Si no sabes alguna, no pasa nada: elige "No lo sé" y seguimos. Así sabremos por dónde empezar.</p>
      <button class="btn sun lg" id="go" style="margin-top:22px">¡Empezar!</button></div>`;
    $("#go").addEventListener("click", () => runQuestions(sid, sub, d, { diagnostic: true }));
  } catch (e) { playerError(e); }
}

async function startQuiz(sid, sub, topic, mode) {
  openPlayer(sub.color, topic.title, mode === "contrarreloj" ? "RETO CONTRARRELOJ" : `PRÁCTICA · ${sub.name.toUpperCase()}`);
  try {
    const d = await withLoading(api(`/api/topics/${topic.id}/quiz?mode=${mode}`, { method: "POST" }));
    if (mode === "contrarreloj") return runTimed(sid, sub, topic, d);
    runQuestions(sid, sub, d, { again: () => startQuiz(sid, sub, topic, mode) });
  } catch (e) { playerError(e); }
}

function runQuestions(sid, sub, d, { diagnostic = false, again = null } = {}) {
  const qs = d.questions;
  const started = Date.now();
  let i = 0;
  $("#overlay").dataset.dirty = "1";
  const letters = "ABCDE";
  const show = () => {
    setProgress(i / qs.length);
    const q = qs[i];
    pbody().innerHTML = `<div class="qlabel">Pregunta ${i + 1} de ${qs.length}${"★".repeat(q.difficulty) ? ` · ${"★".repeat(q.difficulty)}` : ""}</div>
      <div class="qtext">${esc(q.question)}</div>
      ${q.type === "mc" ? `<div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${letters[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>`
        : `<form id="sf" class="stack"><input class="input" id="sa" autocomplete="off" placeholder="Escribe tu respuesta" style="font-size:1.15rem;padding:15px 18px"><div class="row"><button class="btn" type="submit">Comprobar</button></div></form>`}
      ${diagnostic ? `<div style="margin-top:14px"><button class="btn soft sm" id="idk">No lo sé</button></div>` : ""}
      <div id="fb"></div><div class="player-actions hidden" id="nextbox"><button class="btn sun lg" id="next">${i + 1 < qs.length ? "Siguiente →" : "Ver resultado"}</button></div>`;
    const submit = async (value) => {
      $$(".opt, #sf button, #sa, #idk").forEach((b) => (b.disabled = true));
      let r;
      try { r = await api(`/api/activities/${d.activity_id}/answer`, { method: "POST", body: { i: q.i, value: String(value) } }); }
      catch (e) { fail(e); $$(".opt, #sf button, #sa, #idk").forEach((b) => (b.disabled = false)); return; }
      if (q.type === "mc") {
        $$(".opt").forEach((b) => {
          const k = +b.dataset.k;
          if (diagnostic) { if (k === +value) b.classList.add("chosen"); }
          else { if (k === r.answer_index) b.classList.add("right"); else if (k === +value) b.classList.add("wrong"); }
        });
      }
      if (!diagnostic) {
        const cls = r.score >= 1 ? "ok" : r.score > 0 ? "half" : "bad";
        const em = r.score >= 1 ? "🎉" : r.score > 0 ? "👍" : "💡";
        const head = r.score >= 1 ? "¡Correcto!" : r.score > 0 ? "Casi…" : `La respuesta correcta es: ${r.correct_answer}`;
        $("#fb").innerHTML = `<div class="feedback ${cls}"><span class="em">${em}</span><div><b>${esc(head)}</b><div style="margin-top:4px;font-weight:500">${esc(r.feedback)}</div></div></div>`;
      } else {
        $("#fb").innerHTML = `<p class="muted small" style="margin-top:14px">Respuesta guardada.</p>`;
      }
      $("#nextbox").classList.remove("hidden");
      $("#next").focus();
    };
    $$(".opt").forEach((b) => b.addEventListener("click", () => submit(b.dataset.k)));
    $("#sf") && $("#sf").addEventListener("submit", (e) => { e.preventDefault(); submit($("#sa").value); });
    $("#sa") && $("#sa").focus();
    $("#idk") && $("#idk").addEventListener("click", () => submit(q.type === "mc" ? "-1" : ""));
    $("#next").addEventListener("click", async () => {
      i++;
      if (i < qs.length) return show();
      pbody().innerHTML = `<div class="loading"><div class="spinner"></div><p class="muted">Calculando tu nivel…</p></div>`;
      try {
        const r = await finish(d.activity_id, started);
        const review = (r.review || []).map((x) => `<div class="review-item ${x.your >= 1 ? "" : x.your > 0 ? "half" : "bad"}"><b>${esc(x.question)}</b><div class="small" style="margin-top:4px">✔ ${esc(x.correct_answer)}</div><div class="tiny muted">${esc(x.explanation)}</div></div>`).join("");
        showResult(r, diagnostic ? { title: "¡Prueba de nivel terminada!", subtitle: "Ya sabemos por dónde seguir. Tu misión de hoy se ha actualizado.", review } : { again, review });
      } catch (e) { playerError(e); }
    });
  };
  show();
}

// ---------- Contrarreloj ----------
function runTimed(sid, sub, topic, d) {
  const qs = d.questions;
  const started = Date.now();
  let i = 0, points = 0, combo = 0, left = 60, ended = false;
  const results = [];
  const pending = [];
  $("#overlay").dataset.dirty = "1";
  $("#pextra").innerHTML = `<span class="score-bubble" id="pts">0</span><span class="timer" id="tm">60</span>`;
  pbody().innerHTML = `<div class="slide center"><div class="emoji">⚡</div><h2>¡Reto contrarreloj!</h2><p class="text">Tienes 60 segundos. Cada acierto suma puntos y si encadenas aciertos, ¡ganas combo!</p>
    <button class="btn sun lg" id="go" style="margin-top:22px">¡Ya!</button></div>`;
  let timer;
  const end = async () => {
    if (ended) return;
    ended = true;
    clearInterval(timer);
    pbody().innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    try {
      await Promise.allSettled(pending);
      const r = await finish(d.activity_id, started);
      showResult(r, { title: `¡${points} puntos!`, subtitle: `${r.score} aciertos de ${results.length} respondidas`, again: () => startQuiz(sid, sub, topic, "contrarreloj") });
    } catch (e) { playerError(e); }
  };
  playerCleanup = () => clearInterval(timer);
  const show = () => {
    if (i >= qs.length) return end();
    const q = qs[i];
    pbody().innerHTML = `<div class="combo center" id="cb">${combo >= 2 ? `🔥 Combo x${combo}` : ""}</div><div class="qtext center">${esc(q.question)}</div>
      <div class="opts">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${"ABCDE"[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>`;
    $$(".opt").forEach((b) => b.addEventListener("click", () => {
      const k = +b.dataset.k;
      const ok = k === q.answer_index;
      $$(".opt").forEach((x) => { x.disabled = true; if (+x.dataset.k === q.answer_index) x.classList.add("right"); else if (x === b) x.classList.add("wrong"); });
      results.push(ok);
      pending.push(api(`/api/activities/${d.activity_id}/answer`, { method: "POST", body: { i: q.i, value: String(k) } }).catch(() => {}));
      if (ok) { combo++; points += 10 + Math.min(combo - 1, 5) * 5; } else combo = 0;
      $("#pts").textContent = points;
      setProgress((i + 1) / qs.length);
      i++;
      setTimeout(show, ok ? 450 : 1100);
    }));
  };
  $("#go").addEventListener("click", () => {
    timer = setInterval(() => {
      left--;
      const tm = $("#tm");
      if (tm) { tm.textContent = left; tm.classList.toggle("low", left <= 10); }
      if (left <= 0) end();
    }, 1000);
    show();
  });
}

// ---------- Lección interactiva ----------
async function startLesson(sid, sub, topic) {
  openPlayer(sub.color, topic.title, `LECCIÓN · ${sub.name.toUpperCase()}`);
  try {
    const d = await withLoading(api(`/api/topics/${topic.id}/lesson`, { method: "POST" }));
    runLesson(sid, sub, topic, d);
  } catch (e) { playerError(e); }
}

function speak(text) {
  if (!("speechSynthesis" in window)) return toast("Tu navegador no puede leer en voz alta.", true);
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
  u.lang = "es-ES";
  u.rate = +pref("rate", "0.95");
  const v = speechSynthesis.getVoices().find((x) => x.lang === "es-ES") || speechSynthesis.getVoices().find((x) => x.lang.startsWith("es"));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

function runLesson(sid, sub, topic, d) {
  const slides = d.slides;
  const started = Date.now();
  const answered = {};
  let i = 0;
  $("#overlay").dataset.dirty = "1";
  const show = () => {
    setProgress(i / slides.length);
    const s = slides[i];
    const last = i === slides.length - 1;
    const keys = last && s.text.includes("·") ? s.text.split("·").map((x) => x.trim()).filter(Boolean) : null;
    pbody().innerHTML = `<div class="slide">
      <div class="row between"><div class="emoji">${esc(s.emoji)}</div><button class="btn soft sm" id="spk">${ico("speaker")} Escuchar</button></div>
      <h2>${esc(s.title)}</h2>
      ${i === 0 && d.intro ? `<p class="muted" style="margin:-6px 0 12px;font-weight:700">${esc(d.intro)}</p>` : ""}
      ${keys ? `<div class="keys">${keys.map((k, n) => `<div><span>${n + 1}</span>${md(k)}</div>`).join("")}</div>` : `<div class="text">${md(s.text)}</div>`}
      ${s.example ? `<div class="example">${md(s.example)}</div>` : ""}
      ${s.check ? `<div class="check-box"><div class="qlabel">Comprueba</div><div class="q">${esc(s.check.question)}</div>
        <div class="opts">${s.check.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${"ABC"[k] || k + 1}</span><span>${esc(o)}</span></button>`).join("")}</div><div id="cfb"></div></div>` : ""}
      <div class="player-actions" style="justify-content:space-between">${i > 0 ? `<button class="btn ghost" id="prev">← Atrás</button>` : "<span></span>"}
        <button class="btn sun lg" id="nx" ${s.check && answered[i] === undefined ? "disabled" : ""}>${last ? "Terminar" : "Siguiente →"}</button></div>
      <div class="dots">${slides.map((_, n) => `<i class="${n === i ? "on" : ""}"></i>`).join("")}</div></div>`;
    $("#spk").addEventListener("click", () => speak(`${s.title}. ${s.text}. ${s.example ? "Por ejemplo: " + s.example : ""}`));
    $("#prev") && $("#prev").addEventListener("click", () => { i--; show(); });
    const markCheck = (k) => {
      const ok = k === s.check.answer_index;
      $$(".check-box .opt").forEach((b) => { b.disabled = true; if (+b.dataset.k === s.check.answer_index) b.classList.add("right"); else if (+b.dataset.k === k) b.classList.add("wrong"); });
      $("#cfb").innerHTML = `<div class="feedback ${ok ? "ok" : "bad"}"><span class="em">${ok ? "🎉" : "💡"}</span><div><b>${ok ? "¡Correcto!" : "No exactamente"}</b><div style="font-weight:500;margin-top:2px">${esc(s.check.explanation)}</div></div></div>`;
      $("#nx").disabled = false;
    };
    if (s.check) {
      if (answered[i] !== undefined) markCheck(answered[i].k);
      $$(".check-box .opt").forEach((b) => b.addEventListener("click", () => { const k = +b.dataset.k; answered[i] = { k, ok: k === s.check.answer_index }; markCheck(k); }));
    }
    $("#nx").addEventListener("click", async () => {
      speechSynthesis && speechSynthesis.cancel();
      if (!last) { i++; return show(); }
      pbody().innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
      try {
        const res = Object.values(answered).map((a) => (a.ok ? 1 : 0));
        const r = await finish(d.activity_id, started, res);
        showResult(r, { title: "¡Lección completada!", subtitle: res.length ? `Acertaste ${res.filter(Boolean).length} de ${res.length} comprobaciones` : "" });
      } catch (e) { playerError(e); }
    });
  };
  show();
}

// ---------- Tarjetas de memoria ----------
async function startCards(sid, sub, topic) {
  openPlayer(sub.color, topic ? topic.title : `Repaso de ${sub.name}`, "TARJETAS DE MEMORIA");
  try {
    const d = await withLoading(api(`/api/review/start`, { method: "POST", body: { subject_id: sub.id, topic_id: topic ? topic.id : null } }));
    runCards(sid, sub, topic, d);
  } catch (e) { playerError(e); }
}

function runCards(sid, sub, topic, d) {
  const cards = d.cards;
  const started = Date.now();
  const res = [];
  let i = 0;
  $("#overlay").dataset.dirty = "1";
  const show = () => {
    setProgress(i / cards.length);
    const c = cards[i];
    pbody().innerHTML = `<p class="center muted small" style="margin-bottom:12px">Tarjeta ${i + 1} de ${cards.length}${d.practice && i === 0 ? " · hoy no tocaba ninguna, así que practicamos igualmente" : ""}</p>
      <div class="flip" id="fl"><div class="flip-inner"><div class="face"><span class="tp">${esc(c.topic)}</span><div class="txt">${esc(c.front)}</div><span class="hint">Piensa la respuesta y toca para darle la vuelta</span></div>
      <div class="face back"><div class="txt">${md(c.back)}</div><span class="hint">¿La sabías?</span></div></div></div>
      <div class="grades hidden" id="gr"><button class="btn g-no" data-g="no"><span>😕</span>No la sabía</button><button class="btn g-casi" data-g="casi"><span>🤔</span>Casi</button><button class="btn g-si" data-g="si"><span>😎</span>¡La sabía!</button></div>
      <div class="center" style="margin-top:14px"><button class="btn soft sm" id="spk">${ico("speaker")} Escuchar</button></div>`;
    const fl = $("#fl");
    fl.addEventListener("click", () => { fl.classList.toggle("on"); $("#gr").classList.remove("hidden"); });
    $("#spk").addEventListener("click", () => speak(fl.classList.contains("on") ? c.back : c.front));
    $$("#gr .btn").forEach((b) => b.addEventListener("click", async () => {
      const g = b.dataset.g;
      res.push(g === "si" ? 1 : g === "casi" ? 0.5 : 0);
      api(`/api/flashcards/${c.id}/review`, { method: "POST", body: { grade: g } }).catch(() => {});
      i++;
      if (i < cards.length) return show();
      pbody().innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
      try {
        const r = await finish(d.activity_id, started, res);
        showResult(r, { title: "¡Repaso terminado!", subtitle: "Las que no sabías volverán pronto. Las que sabías, dentro de unos días.", again: topic ? () => startCards(sid, sub, topic) : null });
      } catch (e) { playerError(e); }
    }));
  };
  show();
}

// ---------- Parejas ----------
async function startPairs(sid, sub, topic) {
  openPlayer(sub.color, topic.title, "JUEGO DE PAREJAS");
  try {
    const d = await withLoading(api(`/api/topics/${topic.id}/pairs`, { method: "POST" }));
    runPairs(sid, sub, topic, d);
  } catch (e) { playerError(e); }
}

function runPairs(sid, sub, topic, d) {
  const started = Date.now();
  const pairs = d.pairs.map((p, n) => ({ ...p, n }));
  const left = [...pairs].sort(() => Math.random() - 0.5);
  const right = [...pairs].sort(() => Math.random() - 0.5);
  const misses = {};
  let sel = null, done = 0;
  $("#overlay").dataset.dirty = "1";
  pbody().innerHTML = `<p class="center" style="font-weight:700;margin-bottom:16px">Une cada elemento de la izquierda con su pareja de la derecha.</p>
    <div class="pairs"><div class="col">${left.map((p) => `<button class="tile" data-side="a" data-n="${p.n}">${esc(p.a)}</button>`).join("")}</div>
    <div class="col">${right.map((p) => `<button class="tile" data-side="b" data-n="${p.n}">${esc(p.b)}</button>`).join("")}</div></div>
    <p class="center muted small" style="margin-top:16px" id="pinfo">0 de ${pairs.length} parejas</p>`;
  $$(".tile").forEach((t) => t.addEventListener("click", async () => {
    if (t.classList.contains("done")) return;
    if (!sel || sel.dataset.side === t.dataset.side) {
      $$(".tile.sel").forEach((x) => x.classList.remove("sel"));
      sel = t; t.classList.add("sel");
      return;
    }
    if (sel.dataset.n === t.dataset.n) {
      [sel, t].forEach((x) => { x.classList.remove("sel"); x.classList.add("done"); x.disabled = true; });
      done++;
      setProgress(done / pairs.length);
      $("#pinfo").textContent = `${done} de ${pairs.length} parejas`;
      sel = null;
      if (done === pairs.length) {
        await sleep(500);
        pbody().innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
        const res = pairs.map((p) => (misses[p.n] ? (misses[p.n] === 1 ? 0.5 : 0) : 1));
        try {
          const r = await finish(d.activity_id, started, res);
          const errs = Object.values(misses).reduce((a, b) => a + b, 0);
          showResult(r, { title: errs === 0 ? "¡Todas a la primera!" : "¡Parejas completadas!", subtitle: `${errs} ${errs === 1 ? "fallo" : "fallos"} · ${Math.round((Date.now() - started) / 1000)} segundos`, again: () => startPairs(sid, sub, topic) });
        } catch (e) { playerError(e); }
      }
    } else {
      const a = sel.dataset.side === "a" ? sel : t;
      misses[a.dataset.n] = (misses[a.dataset.n] || 0) + 1;
      [sel, t].forEach((x) => { x.classList.remove("sel"); x.classList.add("miss"); setTimeout(() => x.classList.remove("miss"), 450); });
      sel = null;
    }
  }));
}

// ---------------------------------------------------------------------------
// Zona familia
// ---------------------------------------------------------------------------
async function viewFamily(sidStr, section) {
  if (!state.me.parent) {
    const ok = await pinModal();
    if (!ok) { location.hash = "#/"; return; }
  }
  await loadMe();
  const students = state.me.students;
  let sid = sidStr && sidStr !== "general" ? +sidStr : null;
  if (!sid && sidStr !== "general") {
    if (students.length) { location.hash = `#/familia/${students[0].id}/resumen`; return; }
    sidStr = "general"; section = "nuevo";
  }
  document.title = "Zona familia · Pupitre";
  state.ctx = { view: "family", sid, section };
  const s = students.find((x) => x.id === sid);
  const sideBtn = (href, label, on, extra = "") => `<button data-href="${href}" class="${on ? "on" : ""}">${extra}${label}</button>`;
  app().innerHTML = `${topbar(`<button class="btn ghost sm" id="lock">${ico("lock")} Salir de la zona familia</button>`)}
  <main class="page"><div class="parent-shell">
    <nav class="side">
      ${students.map((x) => `<div class="lbl">${esc(x.name)}</div>
        ${sideBtn(`#/familia/${x.id}/resumen`, "Progreso", x.id === sid && section === "resumen", `<span class="avatar sm">${av(x.avatar)}</span>`)}
        ${sideBtn(`#/familia/${x.id}/informes`, "Informes al profesor", x.id === sid && section === "informes", ico("mail"))}
        ${sideBtn(`#/familia/${x.id}/asignaturas`, "Asignaturas", x.id === sid && section === "asignaturas", ico("book"))}
        ${sideBtn(`#/familia/${x.id}/ficha`, "Ficha del alumno", x.id === sid && section === "ficha", ico("user"))}`).join("")}
      <div class="lbl">Familia</div>
      ${sideBtn("#/familia/general/nuevo", "Añadir alumno", section === "nuevo", ico("plus"))}
      ${sideBtn("#/familia/general/cuenta", "Cuenta y uso de la IA", section === "cuenta", ico("chart"))}
    </nav>
    <section id="pmain"><div class="loading"><div class="spinner"></div></div></section>
  </div></main>`;
  $$(".side button").forEach((b) => b.addEventListener("click", () => (location.hash = b.dataset.href)));
  $("#lock").addEventListener("click", async () => { await api("/api/parent/lock", { method: "POST" }); state.me.parent = false; location.hash = "#/"; });
  const main = $("#pmain");
  try {
    if (section === "nuevo") return familyNewStudent(main);
    if (section === "cuenta") return familyAccount(main);
    if (!s) { location.hash = "#/familia"; return; }
    if (section === "informes") return familyReports(main, s);
    if (section === "asignaturas") return familySubjects(main, s);
    if (section === "ficha") return familyStudentForm(main, s);
    return familyProgress(main, s);
  } catch (e) { fail(e); main.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

async function familyProgress(main, s) {
  const d = await api(`/api/students/${s.id}/progress?days=7`);
  const st = d.stats;
  const maxMin = Math.max(20, ...d.timeline.map((w) => w.minutes));
  const typeLabel = (t) => KIND[t]?.label || t;
  main.innerHTML = `<div class="row between wrap" style="margin-bottom:16px"><div><h1>${esc(s.name)}</h1><p class="muted">${esc(s.course)} · últimos 7 días</p></div>
      <button class="btn" id="asstudent">Entrar como ${esc(s.name)}</button></div>
    <div class="kpis"><div class="kpi"><b>${st.minutes}</b><span>minutos de estudio</span></div><div class="kpi"><b>${st.active_days}/7</b><span>días activos</span></div>
      <div class="kpi"><b>${st.answered}</b><span>preguntas respondidas</span></div><div class="kpi"><b>${st.accuracy ?? "—"}${st.accuracy != null ? "%" : ""}</b><span>acierto</span></div></div>
    <div class="two" style="margin-top:16px">
      <div class="card"><h3>Actividad (14 días)</h3><div class="week" style="height:120px">${d.timeline.map((w) => `<div class="d" title="${w.day}: ${w.minutes} min"><i style="height:${Math.max(3, (100 * w.minutes) / maxMin)}%"></i><span>${+w.day.slice(8)}</span></div>`).join("")}</div></div>
      <div class="card"><h3>Dificultades detectadas</h3>${st.difficulties.length ? st.difficulties.slice(0, 4).map((x) => `<div class="diff" style="margin-top:10px"><b class="small">${esc(x.subject)} · ${esc(x.topic)}</b><div class="small">${esc(x.skill)} — <b style="color:var(--bad)">${x.accuracy}% de acierto</b> en ${x.attempts} intentos</div>
        ${x.examples[0] ? `<div class="tiny muted" style="margin-top:3px">Ej.: «${esc(x.examples[0].question)}» → respondió «${esc(x.examples[0].given || "en blanco")}»</div>` : ""}</div>`).join("")
        : `<p class="muted small" style="margin-top:8px">No se han detectado dificultades claras esta semana.</p>`}</div>
    </div>
    <div class="card" style="margin-top:16px"><h3>Dominio por asignatura y tema</h3>
      <table class="table" style="margin-top:10px"><thead><tr><th>Tema</th><th>Dominio</th><th>Estado</th><th>Semana</th></tr></thead><tbody>
      ${st.subjects.map((x) => `<tr><td colspan="4" style="background:var(--paper);font-weight:800"><span class="subj-dot" style="--c:${x.color}"></span>${esc(x.name)} <span class="muted small" style="font-weight:600">· ${x.minutes} min${x.accuracy != null ? ` · ${x.accuracy}% acierto` : ""}${!x.diagnosed && x.topics.length ? " · prueba de nivel pendiente" : ""}</span></td></tr>
        ${x.topics.length ? x.topics.map((t) => `<tr class="status-${t.status}"><td>${esc(t.title)}${t.focus ? ` <span class="pill violet">en clase</span>` : ""}</td>
          <td>${t.status === "sin_evaluar" ? "—" : `<span class="bar"><i style="width:${t.mastery}%"></i></span><b>${t.mastery}</b>`}</td><td>${statusPill(t)}</td>
          <td>${t.change ? `<b style="color:${t.change > 0 ? "var(--ok)" : "var(--bad)"}">${t.change > 0 ? "▲" : "▼"} ${Math.abs(t.change)}</b>` : "—"}</td></tr>`).join("")
          : `<tr><td colspan="4" class="muted small">Sin material todavía.</td></tr>`}`).join("")}</tbody></table></div>
    <div class="card" style="margin-top:16px"><h3>Últimas actividades</h3>
      ${d.recent.length ? `<table class="table" style="margin-top:8px"><tbody>${d.recent.map((a) => `<tr><td><span class="subj-dot" style="--c:${a.color}"></span>${esc(a.subject)}</td><td>${esc(typeLabel(a.type))}${a.topic ? ` · <span class="muted">${esc(a.topic)}</span>` : ""}</td>
        <td>${a.max_score ? `${Math.round(a.score * 10) / 10}/${a.max_score}` : ""}</td><td class="muted small">${a.minutes} min</td><td class="muted small">${new Date(a.at + "Z").toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td></tr>`).join("")}</tbody></table>`
        : `<p class="muted small" style="margin-top:8px">Aún no hay actividad.</p>`}</div>`;
  $("#asstudent").addEventListener("click", async () => { await api("/api/parent/lock", { method: "POST" }); state.me.parent = false; location.hash = `#/alumno/${s.id}`; });
}

async function familyReports(main, s) {
  const d = await api(`/api/students/${s.id}/progress?days=7`);
  main.innerHTML = `<h1>Informes al profesor</h1><p class="muted" style="margin:4px 0 16px">${esc(s.name)} · ${esc(s.course)}</p>
    ${!s.teacher_email ? `<div class="notice warn">${ico("info")}<span>Falta el email del profesor o tutor. Añádelo en la <a href="#/familia/${s.id}/ficha">ficha del alumno</a> para activar el informe semanal.</span></div>`
      : `<div class="notice">${ico("mail")}<span>${s.reports_enabled ? `Cada semana se envía automáticamente un informe a <b>${esc(s.teacher_name || "")} &lt;${esc(s.teacher_email)}&gt;</b>. Si responde, el correo os llega a vosotros.` : "El envío automático está desactivado en la ficha del alumno."}</span></div>`}
    ${!state.me.smtp ? `<div class="notice warn" style="margin-top:10px">${ico("info")}<span>El servidor todavía no tiene configurado el envío de correo. Puedes generar el informe y reenviarlo a mano.</span></div>` : ""}
    <div class="row wrap" style="margin:18px 0"><select class="input" id="days" style="width:auto"><option value="7">Última semana</option><option value="14">Últimas 2 semanas</option><option value="30">Último mes</option></select>
      <button class="btn ghost" id="prev">${ico("info")} Generar vista previa</button><button class="btn" id="send" ${s.teacher_email ? "" : "disabled"}>${ico("send")} Enviar ahora</button></div>
    <div id="pv"></div>
    <div class="card" style="margin-top:16px"><h3>Historial de envíos</h3>${d.reports.length ? `<table class="table" style="margin-top:8px"><tbody>${d.reports.map((r) => `<tr><td>${new Date(r.at + "Z").toLocaleString("es-ES")}</td><td>${esc(r.to)}</td>
      <td><span class="pill ${r.status === "enviado" ? "ok" : "bad"}">${esc(r.status)}</span></td><td><button class="btn soft sm" data-r="${r.id}">Ver</button></td></tr>`).join("")}</tbody></table>` : `<p class="muted small" style="margin-top:6px">Todavía no se ha enviado ningún informe.</p>`}</div>`;
  const preview = (url) => {
    $("#pv").innerHTML = `<div class="loading"><div class="spinner"></div><p class="muted">Redactando el informe…</p></div>`;
    const f = document.createElement("iframe");
    f.className = "report-frame";
    f.title = "Vista previa del informe";
    f.onload = () => { const l = $("#pv .loading"); l && l.remove(); };
    f.src = url;
    $("#pv").appendChild(f);
  };
  $("#prev").addEventListener("click", () => preview(`/api/students/${s.id}/report/preview?days=${$("#days").value}`));
  $$("[data-r]").forEach((b) => b.addEventListener("click", () => preview(`/api/reports/${b.dataset.r}`)));
  $("#send").addEventListener("click", async () => {
    if (!(await confirmModal("Enviar informe", `Se enviará el informe a ${s.teacher_email}.`, "Enviar"))) return;
    const b = $("#send"); b.disabled = true;
    try { await api(`/api/students/${s.id}/report/send?days=${$("#days").value}`, { method: "POST" }); toast("Informe enviado"); familyReports(main, s); }
    catch (e) { fail(e); b.disabled = false; }
  });
}

async function familySubjects(main, s) {
  const h = await api(`/api/students/${s.id}/home`);
  main.innerHTML = `<div class="row between wrap"><div><h1>Asignaturas</h1><p class="muted">${esc(s.name)} · ${esc(s.course)}</p></div><button class="btn" id="adds">${ico("plus")} Añadir asignatura</button></div>
    <div class="notice" style="margin:16px 0">${ico("info")}<span>Para cada asignatura, sube el libro de texto (PDF o fotos de las páginas) y, si queréis, apuntes o ejercicios del colegio. Pupitre extrae los temas y prepara todo lo demás.</span></div>
    <div class="stack">${h.subjects.map((x) => `<div class="card flat row wrap" style="--c:${x.color}">
      <div class="sicon" style="background:${x.color}">${ico(x.icon)}</div>
      <div class="grow"><h3>${esc(x.name)}</h3><p class="small muted">${x.documents} documentos · ${x.topics} temas${x.processing ? " · leyendo material…" : ""}${x.topics && !x.diagnosed ? " · prueba de nivel pendiente" : ""}</p></div>
      <button class="btn soft sm" data-open="${x.id}">${ico("upload")} Material y temas</button><button class="iconbtn" data-edit="${x.id}" title="Editar">${ico("edit")}</button></div>`).join("")}</div>`;
  $("#adds").addEventListener("click", () => subjectForm(s.id, null).then((r) => r && familySubjects(main, s)));
  $$("[data-edit]").forEach((b) => b.addEventListener("click", () => subjectForm(s.id, h.subjects.find((x) => x.id === +b.dataset.edit)).then((r) => r && familySubjects(main, s))));
  $$("[data-open]").forEach((b) => b.addEventListener("click", () => (location.hash = `#/alumno/${s.id}/asignatura/${b.dataset.open}/material`)));
}

function subjectForm(sid, sub) {
  let icon = sub?.icon || "book", color = sub?.color || state.me.colors[0];
  return modal(`<h3>${sub ? "Editar asignatura" : "Nueva asignatura"}</h3><div class="stack" style="margin-top:14px">
    <div class="field"><label>Nombre</label><input class="input" id="sn" value="${esc(sub?.name || "")}" maxlength="80" placeholder="Inglés, Ciencias Naturales…"></div>
    <div class="field"><label>Icono</label><div class="icons-pick">${state.me.icons.map((k) => `<button type="button" data-ic="${k}" class="${k === icon ? "on" : ""}">${ico(k)}</button>`).join("")}</div></div>
    <div class="field"><label>Color</label><div class="swatches">${state.me.colors.map((c) => `<button type="button" data-co="${c}" style="background:${c}" class="${c === color ? "on" : ""}" aria-label="${c}"></button>`).join("")}</div></div>
    <p class="error-msg" id="se"></p></div>
    <div class="actions">${sub ? `<button class="btn danger" id="sdel" style="margin-right:auto">${ico("trash")} Eliminar</button>` : ""}<button class="btn ghost" data-close>Cancelar</button><button class="btn" id="ok">Guardar</button></div>`, {
    onMount: (m, close) => {
      $$("[data-ic]", m).forEach((b) => b.addEventListener("click", () => { icon = b.dataset.ic; $$("[data-ic]", m).forEach((x) => x.classList.toggle("on", x === b)); }));
      $$("[data-co]", m).forEach((b) => b.addEventListener("click", () => { color = b.dataset.co; $$("[data-co]", m).forEach((x) => x.classList.toggle("on", x === b)); }));
      $("#ok", m).addEventListener("click", async () => {
        const name = $("#sn", m).value.trim();
        if (!name) return ($("#se", m).textContent = "Escribe un nombre.");
        try { await api(sub ? `/api/subjects/${sub.id}` : `/api/students/${sid}/subjects`, { method: sub ? "PUT" : "POST", body: { name, icon, color } }); close(true); } catch (e) { $("#se", m).textContent = e.message; }
      });
      sub && $("#sdel", m).addEventListener("click", async () => {
        if (!(await confirmModal("Eliminar asignatura", `Se borrarán ${sub.name}, su material, temas y progreso. No se puede deshacer.`, "Eliminar", true))) return;
        try { await api(`/api/subjects/${sub.id}`, { method: "DELETE" }); close(true); } catch (e) { fail(e); }
      });
    },
  });
}

function studentFields(s = {}) {
  const courses = state.me.courses;
  return `<div class="stack">
    <div class="grid2"><div class="field"><label>Nombre</label><input class="input" id="f-name" value="${esc(s.name || "")}" maxlength="80" required></div>
      <div class="field"><label>Curso</label><select class="input" id="f-course">${courses.map((c) => `<option ${c === (s.course || "4º Primaria") ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div></div>
    <div class="field"><label>Avatar</label><div class="avatars">${Object.keys(AVATARS).map((k) => `<button type="button" data-av="${k}" class="${k === (s.avatar || "fox") ? "on" : ""}">${AVATARS[k]}</button>`).join("")}</div></div>
    <div class="field"><label>Cosas que conviene saber (opcional)</label><textarea class="input" id="f-notes" maxlength="1500" placeholder="Ej.: le cuesta concentrarse más de 15 minutos; le encantan los dinosaurios y el fútbol; tiene dislexia y prefiere frases cortas.">${esc(s.notes || "")}</textarea>
      <span class="hint">La IA lo tiene en cuenta para adaptar explicaciones y ejemplos.</span></div>
    <div class="grid2"><div class="field"><label>Profesor/a o tutor/a</label><input class="input" id="f-tname" value="${esc(s.teacher_name || "")}" maxlength="120" placeholder="Sra. Martínez"></div>
      <div class="field"><label>Email del profesor/a</label><input class="input" id="f-temail" type="email" value="${esc(s.teacher_email || "")}" maxlength="200" placeholder="tutora@colegio.es"></div></div>
    <label class="check"><input type="checkbox" id="f-rep" ${s.reports_enabled !== false ? "checked" : ""}> Enviar un informe semanal automático al profesor/a</label>
    <p class="error-msg" id="f-err"></p></div>`;
}
function readStudentFields(root) {
  return {
    name: $("#f-name", root).value.trim(), course: $("#f-course", root).value, avatar: $("[data-av].on", root)?.dataset.av || "fox",
    notes: $("#f-notes", root).value.trim(), teacher_name: $("#f-tname", root).value.trim(), teacher_email: $("#f-temail", root).value.trim(),
    reports_enabled: $("#f-rep", root).checked,
  };
}
function bindAvatars(root) { $$("[data-av]", root).forEach((b) => b.addEventListener("click", () => $$("[data-av]", root).forEach((x) => x.classList.toggle("on", x === b)))); }

async function studentForm() {
  if (!state.me.parent && !(await pinModal())) return null;
  return modal(`<h3>Nuevo alumno</h3><p class="muted small" style="margin-bottom:14px">Se crean Matemáticas, Lengua, Conocimiento del medio e Historia. Podrás añadir o cambiar asignaturas después.</p>
    ${studentFields()}<div class="actions"><button class="btn ghost" data-close>Cancelar</button><button class="btn" id="ok">Crear</button></div>`, {
    wide: true,
    onMount: (m, close) => {
      bindAvatars(m);
      $("#ok", m).addEventListener("click", async () => {
        const body = readStudentFields(m);
        if (!body.name) return ($("#f-err", m).textContent = "Escribe el nombre.");
        try { const s = await api("/api/students", { method: "POST", body }); await loadMe(); close(s); } catch (e) { $("#f-err", m).textContent = e.message; }
      });
    },
  });
}

function familyNewStudent(main) {
  main.innerHTML = `<h1>Añadir alumno</h1><p class="muted" style="margin:4px 0 18px">Se crean Matemáticas, Lengua, Conocimiento del medio e Historia. Podrás añadir más.</p>
    <div class="card">${studentFields()}<div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn" id="ok">Crear alumno</button></div></div>`;
  bindAvatars(main);
  $("#ok").addEventListener("click", async () => {
    const body = readStudentFields(main);
    if (!body.name) return ($("#f-err").textContent = "Escribe el nombre.");
    try { const s = await api("/api/students", { method: "POST", body }); await loadMe(); toast("Alumno creado"); location.hash = `#/familia/${s.id}/asignaturas`; } catch (e) { $("#f-err").textContent = e.message; }
  });
}

function familyStudentForm(main, s) {
  main.innerHTML = `<h1>Ficha de ${esc(s.name)}</h1><p class="muted" style="margin:4px 0 18px">El curso define el nivel de las explicaciones y las preguntas.</p>
    <div class="card">${studentFields(s)}<div class="row" style="justify-content:space-between;margin-top:14px"><button class="btn danger" id="del">${ico("trash")} Eliminar alumno</button><button class="btn" id="ok">Guardar cambios</button></div></div>`;
  bindAvatars(main);
  $("#ok").addEventListener("click", async () => {
    const body = readStudentFields(main);
    if (!body.name) return ($("#f-err").textContent = "Escribe el nombre.");
    try { await api(`/api/students/${s.id}`, { method: "PUT", body }); await loadMe(); toast("Cambios guardados"); viewFamily(String(s.id), "ficha"); } catch (e) { $("#f-err").textContent = e.message; }
  });
  $("#del").addEventListener("click", async () => {
    if (!(await confirmModal("Eliminar alumno", `Se borrarán ${s.name}, sus asignaturas, material y todo su progreso. No se puede deshacer.`, "Eliminar", true))) return;
    try { await api(`/api/students/${s.id}`, { method: "DELETE" }); await loadMe(); location.hash = "#/familia"; } catch (e) { fail(e); }
  });
}

async function familyAccount(main) {
  const u = await api("/api/usage");
  main.innerHTML = `<h1>Cuenta y uso de la IA</h1><p class="muted" style="margin:4px 0 18px">${esc(state.me.family.name)} · ${esc(state.me.family.email)}</p>
    <div class="kpis"><div class="kpi"><b>${u.calls}</b><span>consultas a la IA (30 días)</span></div><div class="kpi"><b>${u.cost.toFixed(2)} $</b><span>coste estimado (30 días)</span></div>
      <div class="kpi"><b>${u.today}/${u.daily_limit}</b><span>consultas hoy / límite</span></div><div class="kpi"><b>${(u.tokens / 1000).toFixed(0)}k</b><span>tokens procesados</span></div></div>
    <div class="card" style="margin-top:16px"><div class="row between wrap"><h3>Clave de OpenRouter</h3><button class="btn sm" id="keybtn">${state.me.key.masked ? "Cambiar clave" : "Añadir clave"}</button></div>
      <p class="small" style="margin-top:6px">${state.me.key.source === "familia" ? `Tu familia usa su propia clave: <code>${esc(state.me.key.masked)}</code>. El uso de la IA se cobra en tu cuenta de OpenRouter.`
        : state.me.key.source === "servidor" ? "Ahora se usa la clave del servidor (archivo .env). Puedes poner la de tu familia para que el uso se cobre en tu cuenta."
        : `<b style="color:var(--bad)">${esc(keysMissing())}</b>`}</p></div>
    <div class="card" style="margin-top:16px"><div class="row between wrap"><h3>Estado de la IA</h3><button class="btn soft sm" id="chk">Comprobar conexión</button></div>
      <p class="small muted" style="margin-top:4px">${!u.ai_ready ? `<b style="color:var(--bad)">${esc(state.me.ai_message)}</b>` : `Principal: <b>${esc(u.models.main)}</b> · Respaldo: <b>${esc(u.models.fallback)}</b> · Lectura de imágenes: <b>${esc(u.models.vision)}</b>`}</p>
      <div id="chkout"></div></div>
    <div class="card" style="margin-top:16px"><h3>Cambiar contraseña o PIN</h3><div class="stack" style="margin-top:12px">
      <div class="field"><label>Contraseña actual</label><input class="input" type="password" id="cur" autocomplete="current-password"></div>
      <div class="grid2"><div class="field"><label for="np">Nueva contraseña</label><input class="input" type="password" id="np" autocomplete="new-password" placeholder="Déjalo vacío para no cambiarla"></div>
        <div class="field"><label for="np2">Repite la nueva contraseña</label><input class="input" type="password" id="np2" autocomplete="new-password"></div></div>
      <div class="grid2"><div class="field"><label for="npin">Nuevo PIN</label><input class="input" type="password" id="npin" inputmode="numeric" maxlength="4" placeholder="Déjalo vacío para no cambiarlo" autocomplete="off"></div>
        <div class="field"><label for="npin2">Repite el nuevo PIN</label><input class="input" type="password" id="npin2" inputmode="numeric" maxlength="4" autocomplete="off"></div></div>
      <p class="error-msg" id="cerr"></p><div class="row" style="justify-content:flex-end"><button class="btn" id="cs">Guardar</button></div></div></div>
    <div class="card danger-zone" style="margin-top:16px"><h3>Eliminar la cuenta de familia</h3>
      <p class="small muted" style="margin:4px 0 12px">Borra para siempre la cuenta, todos los alumnos, su material, progreso, conversaciones e informes. No se puede deshacer.</p>
      <button class="btn danger" id="delacc">${ico("trash")} Eliminar cuenta…</button></div>
    <div class="card" style="margin-top:16px"><h3>Sesión</h3><p class="small muted" style="margin:4px 0 12px">Cierra la sesión en este dispositivo.</p><button class="btn ghost" id="out">${ico("logout")} Cerrar sesión</button></div>`;
  $("#chk") && $("#chk").addEventListener("click", async () => {
    const out = $("#chkout");
    out.innerHTML = `<div class="row" style="margin-top:12px"><div class="spinner sm"></div><span class="small muted">Comprobando clave, modelos y una llamada real…</span></div>`;
    try {
      const c = await api("/api/ai/check", { method: "POST" });
      const okp = (ok, t) => `<span class="pill ${ok ? "ok" : "bad"}">${ok ? "✓" : "✗"} ${esc(t)}</span>`;
      const rows = Object.entries(c.models || {}).map(([role, m]) => `<tr><td>${esc(role)}</td><td><code>${esc(m.id)}</code></td>
        <td>${okp(m.exists, m.exists ? "existe" : "no encontrado")}${m.exists && role === "visión" && !m.vision ? " " + okp(false, "sin imágenes") : ""}</td>
        <td class="small">${m.exists ? `${m.input_per_m} $ / ${m.output_per_m} $ por M tokens` : (m.similar.length ? "Parecidos: " + m.similar.map(esc).join(", ") : "")}</td></tr>`).join("");
      out.innerHTML = `<div class="stack" style="margin-top:12px">
        <div>${okp(c.key && c.key.ok, c.key && c.key.ok ? "Clave válida" : "Clave: " + ((c.key && c.key.error) || "error"))}
          ${c.key && c.key.ok && c.key.limit_remaining != null ? `<span class="small muted"> · saldo restante del límite: ${Number(c.key.limit_remaining).toFixed(2)} $</span>` : ""}</div>
        ${rows ? `<table class="table"><tbody>${rows}</tbody></table>` : `<p class="small" style="color:var(--bad)">${esc(c.models_error || "No se pudo leer el catálogo de modelos")}</p>`}
        <div>${okp(c.test && c.test.ok, c.test && c.test.ok ? `Llamada de prueba correcta (${c.test.seconds} s)` : "Llamada de prueba: " + ((c.test && c.test.error) || "falló"))}</div></div>`;
    } catch (e) { out.innerHTML = `<p class="error-msg">${esc(e.message)}</p>`; }
  });
  $("#cs").addEventListener("click", async () => {
    if ($("#np").value !== $("#np2").value) return ($("#cerr").textContent = "Las dos contraseñas nuevas no coinciden.");
    if ($("#npin").value.trim() !== $("#npin2").value.trim()) return ($("#cerr").textContent = "Los dos PIN nuevos no coinciden.");
    try { await api("/api/family/credentials", { method: "POST", body: { current: $("#cur").value, password: $("#np").value, password2: $("#np2").value, pin: $("#npin").value.trim(), pin2: $("#npin2").value.trim() } }); toast("Datos actualizados"); familyAccount(main); }
    catch (e) { $("#cerr").textContent = e.message; }
  });
  $("#out").addEventListener("click", async () => { await api("/api/auth/logout", { method: "POST" }); state.me = null; location.hash = "#/acceso"; route(); });
  $("#delacc").addEventListener("click", deleteFamilyModal);
  $("#keybtn").addEventListener("click", () => keyModal(false));
  if (state.autoCheck) { state.autoCheck = false; $("#chk").click(); $("#chk").scrollIntoView({ block: "center" }); }
}

// ---------------------------------------------------------------------------
// Preferencias del dispositivo (solo comodidad: tamaño de texto, voz, efectos)
// ---------------------------------------------------------------------------
function pref(k, def) { try { return localStorage.getItem("pupitre." + k) ?? def; } catch { return def; } }
function setPref(k, v) { try { localStorage.setItem("pupitre." + k, v); } catch { /* sin almacenamiento */ } }
function applyPrefs() { document.documentElement.style.setProperty("--fs", pref("fs", "100") + "%"); }
applyPrefs();

// ---------------------------------------------------------------------------
// Barra de menús (Archivo, Edición, Ver, Estudiar, Ajustes, Ayuda)
// ---------------------------------------------------------------------------
const MENUBAR_SLOT = `<nav class="menubar" id="menubar" aria-label="Menú principal"></nav>`;
let menuItems = [];   // acciones del menú abierto, indexadas por data-i
let openMenuId = null;

async function ensureParent() {
  if (state.me && state.me.parent) return true;
  return !!(await pinModal());
}

function buildMenus() {
  const c = state.ctx || {};
  const logged = !!(state.me && state.me.family);
  const sid = c.sid || null;
  const inSubject = c.view === "subject";
  const sub = c.sub;
  const lockNote = state.me && state.me.parent ? "" : "lock";
  const needSid = sid ? null : "Elige primero un alumno";
  const needSub = inSubject ? null : "Abre primero una asignatura";
  const go = (h) => () => { location.hash = h; };
  const goFamily = (section) => async () => { if (await ensureParent()) location.hash = `#/familia/${sid || "general"}/${section}`; };

  if (!logged) {
    return [
      { id: "archivo", label: "Archivo", items: [
        { label: "Entrar…", run: go("#/acceso") },
        { label: "Crear cuenta de familia…", run: go("#/registro") },
      ] },
      { id: "ayuda", label: "Ayuda", items: helpItems(false) },
    ];
  }
  const subjects = sid ? state.subjects[sid] || [] : [];
  const fs = pref("fs", "100"), rate = pref("rate", "0.95"), fx = pref("fx", "1");
  return [
    { id: "archivo", label: "Archivo", items: [
      { label: "Nuevo alumno…", lock: lockNote, run: () => studentForm().then((s) => s && (location.hash = `#/familia/${s.id}/asignaturas`)).catch(fail) },
      { label: "Subir material…", disabled: needSub, run: () => { location.hash = `#/alumno/${sid}/asignatura/${c.subId}/material`; setTimeout(() => { const f = $("#file"); f && f.click(); }, 400); } },
      { label: "Cambiar de alumno", run: go("#/") },
      { sep: true },
      { label: "Exportar progreso a Excel (CSV)", lock: lockNote, disabled: needSid, run: async () => {
        if (!(await ensureParent())) return;
        location.href = `/api/students/${sid}/export.csv`;
      } },
      { label: "Imprimir informe del profesor…", lock: lockNote, disabled: needSid, run: async () => {
        if (!(await ensureParent())) return;
        const w = window.open(`/api/students/${sid}/report/preview`, "_blank");
        if (!w) return toast("El navegador ha bloqueado la ventana emergente.", true);
        w.addEventListener("load", () => setTimeout(() => w.print(), 300));
      } },
      { sep: true },
      { label: "Eliminar cuenta de familia…", lock: lockNote, run: deleteFamilyModal },
      { label: "Cerrar sesión", run: async () => { await api("/api/auth/logout", { method: "POST" }).catch(() => {}); state.me = null; location.hash = "#/acceso"; route(); } },
    ] },
    { id: "edicion", label: "Edición", items: [
      { label: "Ficha del alumno…", lock: lockNote, disabled: needSid, run: goFamily("ficha") },
      { label: "Asignaturas…", lock: lockNote, disabled: needSid, run: goFamily("asignaturas") },
      { sep: true },
      { label: "Añadir tema…", disabled: needSub, run: () => topicForm(c.subId, null).then((r) => r && route()) },
      { label: "Temas que se dan en clase…", disabled: needSub, run: go(`#/alumno/${sid}/asignatura/${c.subId}/material`) },
      { sep: true },
      { label: "Borrar conversación del tutor", disabled: needSub, run: async () => {
        if (!(await confirmModal("Borrar conversación", `Se borrará la conversación con el tutor de ${sub.name}.`, "Borrar", true))) return;
        try { await api(`/api/subjects/${c.subId}/chat`, { method: "DELETE" }); toast("Conversación borrada"); route(); } catch (e) { fail(e); }
      } },
    ] },
    { id: "ver", label: "Ver", items: [
      { label: "Inicio del alumno", disabled: needSid, run: go(`#/alumno/${sid}`) },
      ...subjects.map((x) => ({ label: x.name, dot: x.color, checked: inSubject && c.subId === x.id, run: go(`#/alumno/${sid}/asignatura/${x.id}`) })),
      { sep: true },
      { label: "Progreso del alumno", lock: lockNote, disabled: needSid, run: goFamily("resumen") },
      { label: "Informes al profesor", lock: lockNote, disabled: needSid, run: goFamily("informes") },
      { sep: true },
      { label: "Texto normal", radio: true, checked: fs === "100", run: () => { setPref("fs", "100"); applyPrefs(); } },
      { label: "Texto grande", radio: true, checked: fs === "112", run: () => { setPref("fs", "112"); applyPrefs(); } },
      { label: "Texto muy grande", radio: true, checked: fs === "125", run: () => { setPref("fs", "125"); applyPrefs(); } },
      { sep: true },
      { label: document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa (modo concentración)", run: () => {
        if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => toast("El navegador no permite la pantalla completa.", true));
      } },
    ] },
    { id: "estudiar", label: "Estudiar", items: [
      { label: "Misión de hoy", disabled: needSid, run: go(`#/alumno/${sid}`) },
      { sep: true },
      { label: "Prueba de nivel", disabled: needSub || (c.hasTopics ? null : "Sube primero material de la asignatura"), run: () => startDiagnostic(sid, sub) },
      { label: "Repasar tarjetas pendientes", disabled: needSub || (c.dueCards ? null : "No hay tarjetas pendientes hoy"), run: () => startCards(sid, sub, null) },
      { label: "Preguntar al tutor", disabled: needSub, run: go(`#/alumno/${sid}/asignatura/${c.subId}/tutor`) },
      { label: "Ayuda con los deberes (foto)", disabled: needSub, run: () => { location.hash = `#/alumno/${sid}/asignatura/${c.subId}/tutor`; setTimeout(() => { const b = $('.chip[data-mode="deberes"]'); b && b.click(); }, 500); } },
    ] },
    { id: "ajustes", label: "Ajustes", items: [
      { label: "Voz de lectura lenta", radio: true, checked: rate === "0.8", run: () => setPref("rate", "0.8") },
      { label: "Voz de lectura normal", radio: true, checked: rate !== "0.8", run: () => setPref("rate", "0.95") },
      { label: "Efectos de celebración", check: true, checked: fx === "1", run: () => setPref("fx", fx === "1" ? "0" : "1") },
      { sep: true },
      { label: "Informe semanal al profesor…", lock: lockNote, disabled: needSid, run: goFamily("informes") },
      { label: "Clave de OpenRouter…", lock: lockNote, run: () => keyModal(false) },
      { label: "Cuenta, contraseña y PIN…", lock: lockNote, run: async () => { if (await ensureParent()) location.hash = "#/familia/general/cuenta"; } },
      { label: "Estado de la IA…", lock: lockNote, run: openAiCheck },
      { sep: true },
      { label: "Bloquear zona familia", disabled: state.me.parent ? null : "La zona familia ya está bloqueada", run: async () => {
        await api("/api/parent/lock", { method: "POST" }); state.me.parent = false; toast("Zona familia bloqueada");
        if (location.hash.startsWith("#/familia")) location.hash = "#/"; else refreshMenubar();
      } },
    ] },
    { id: "ayuda", label: "Ayuda", items: helpItems(true) },
  ];
}

function helpItems(logged) {
  return [
    { label: "Guía rápida", shortcut: "F1", run: () => helpModal("guia") },
    { label: "Cómo se mide el progreso", run: () => helpModal("progreso") },
    { label: "Atajos de teclado", run: () => helpModal("atajos") },
    { sep: true },
    ...(logged ? [{ label: "Comprobar conexión con la IA", lock: state.me && state.me.parent ? "" : "lock", run: openAiCheck }] : []),
    { label: "Cómo conseguir la clave de OpenRouter", run: () => helpModal("ia") },
    { label: "Privacidad y datos", run: () => helpModal("privacidad") },
    { sep: true },
    { label: "Acerca de Pupitre", run: () => helpModal("acerca") },
  ];
}

async function openAiCheck() {
  if (!(await ensureParent())) return;
  state.autoCheck = true;
  if (location.hash === "#/familia/general/cuenta") route(); else location.hash = "#/familia/general/cuenta";
}

function refreshMenubar() {
  const nav = $("#menubar");
  if (!nav) return;
  const menus = buildMenus();
  nav.innerHTML = `<div class="mb-menus" role="menubar">${menus.map((m) => `<button class="mb-top" role="menuitem" aria-haspopup="true" aria-expanded="false" data-m="${m.id}">${esc(m.label)}</button>`).join("")}</div>
    <button class="mb-burger" aria-label="Abrir menú">${P('<path d="M4 6h16M4 12h16M4 18h16"/>')} Menú</button>`;
  $$(".mb-top", nav).forEach((b) => {
    b.addEventListener("click", (e) => { e.stopPropagation(); openMenuId === b.dataset.m ? closeMenus() : openMenu(b.dataset.m); });
    b.addEventListener("mouseenter", () => { if (openMenuId && openMenuId !== b.dataset.m) openMenu(b.dataset.m); });
    b.addEventListener("keydown", (e) => {
      const tops = $$(".mb-top", nav), i = tops.indexOf(b);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = tops[(i + (e.key === "ArrowRight" ? 1 : tops.length - 1)) % tops.length]; n.focus(); if (openMenuId) openMenu(n.dataset.m); }
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") { e.preventDefault(); openMenu(b.dataset.m, true); }
    });
  });
  $(".mb-burger", nav).addEventListener("click", openMobileMenu);
}

function itemHtml(it, i) {
  if (it.sep) return `<div class="mb-sep" role="separator"></div>`;
  const mark = it.radio ? (it.checked ? "●" : "") : it.check ? (it.checked ? "✓" : "") : it.checked ? "✓" : "";
  return `<button class="mb-item" role="${it.radio ? "menuitemradio" : it.check ? "menuitemcheckbox" : "menuitem"}" data-i="${i}" ${it.disabled ? `aria-disabled="true" title="${esc(it.disabled)}"` : ""} ${it.radio || it.check ? `aria-checked="${!!it.checked}"` : ""}>
    <span class="mb-mark">${mark}</span>${it.dot ? `<span class="subj-dot" style="--c:${it.dot}"></span>` : ""}<span class="mb-label">${esc(it.label)}</span>
    <span class="mb-right">${it.lock ? `<span class="mb-lock" title="Requiere el PIN de la familia">${ico("lock")}</span>` : ""}${it.shortcut ? `<kbd>${esc(it.shortcut)}</kbd>` : ""}</span></button>`;
}

function openMenu(id, focusFirst = false) {
  closeMenus(false);
  const menu = buildMenus().find((m) => m.id === id);
  const top = $(`.mb-top[data-m="${id}"]`);
  if (!menu || !top) return;
  openMenuId = id;
  menuItems = menu.items;
  top.classList.add("on");
  top.setAttribute("aria-expanded", "true");
  const dd = document.createElement("div");
  dd.className = "mb-dropdown";
  dd.setAttribute("role", "menu");
  dd.innerHTML = menu.items.map(itemHtml).join("");
  const r = top.getBoundingClientRect();
  dd.style.left = Math.min(r.left, window.innerWidth - 300) + "px";
  dd.style.top = r.bottom + 4 + "px";
  document.body.appendChild(dd);
  bindItems(dd, top);
  if (focusFirst) { const f = $(".mb-item:not([aria-disabled])", dd); f && f.focus(); }
}

function bindItems(root, top) {
  const items = $$(".mb-item", root);
  items.forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (el.getAttribute("aria-disabled")) return toast(el.title);
      const it = menuItems[+el.dataset.i];
      closeMenus();
      Promise.resolve(it.run()).catch(fail);
    });
    el.addEventListener("keydown", (e) => {
      const live = items.filter((x) => !x.getAttribute("aria-disabled"));
      const i = live.indexOf(el);
      if (e.key === "ArrowDown") { e.preventDefault(); live[(i + 1) % live.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); live[(i - 1 + live.length) % live.length].focus(); }
      if (e.key === "Escape") { e.preventDefault(); closeMenus(); top && top.focus(); }
      if (top && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        e.preventDefault();
        const tops = $$(".mb-top"), j = tops.indexOf(top);
        const n = tops[(j + (e.key === "ArrowRight" ? 1 : tops.length - 1)) % tops.length];
        openMenu(n.dataset.m, true); n.classList.add("on");
      }
    });
  });
}

function closeMenus(resetId = true) {
  $$(".mb-dropdown").forEach((d) => d.remove());
  $$(".mb-top").forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-expanded", "false"); });
  if (resetId) openMenuId = null;
}

function openMobileMenu() {
  const menus = buildMenus();
  const all = [];
  const html = menus.map((m) => `<div class="mm-group"><div class="mm-title">${esc(m.label)}</div>${m.items.map((it) => { if (it.sep) return ""; all.push(it); return itemHtml(it, all.length - 1); }).join("")}</div>`).join("");
  modal(`<div class="row between"><h3>Menú</h3><button class="iconbtn" data-close aria-label="Cerrar">${ico("close")}</button></div><div class="mm-list">${html}</div>`, {
    onMount: (m, close) => {
      menuItems = all;
      $$(".mb-item", m).forEach((el) => el.addEventListener("click", () => {
        if (el.getAttribute("aria-disabled")) return toast(el.title);
        close(); Promise.resolve(all[+el.dataset.i].run()).catch(fail);
      }));
    },
  });
}

document.addEventListener("click", (e) => {
  if (openMenuId && !e.target.closest(".mb-dropdown")) closeMenus();
  const h = e.target.closest("[data-help]");
  if (h) { e.preventDefault(); helpModal(h.dataset.help); }
  if (e.target.closest("[data-keymodal]")) keyModal(false);
});
window.addEventListener("resize", () => closeMenus());
window.addEventListener("hashchange", () => closeMenus());
document.addEventListener("keydown", (e) => {
  if (e.key === "F1") { e.preventDefault(); helpModal("guia"); }
  if (e.altKey && !e.ctrlKey && (e.key === "m" || e.key === "M")) {
    e.preventDefault();
    if (window.innerWidth <= 760) return openMobileMenu();
    const first = $(".mb-top");
    if (first) { first.focus(); openMenu(first.dataset.m, true); }
  }
  if (e.key === "Escape" && openMenuId) closeMenus();
});

// ---------------------------------------------------------------------------
// Ayuda
// ---------------------------------------------------------------------------
function helpModal(topic) {
  const me = state.me || {};
  const T = {
    guia: ["Guía rápida", `
      <p><b>Pupitre</b> convierte el libro de cada asignatura en un tutor personal: mide el nivel del alumno, le enseña, le pone a prueba y avisa al profesor de cómo va.</p>
      <h4>Primeros pasos</h4><ol>
        <li><b>Crea el alumno</b> (Archivo › Nuevo alumno). Elige su curso: la IA adapta el lenguaje y la dificultad.</li>
        <li><b>Sube el material</b> de cada asignatura (Archivo › Subir material): el libro en PDF, aunque sea escaneado, Word o fotos de las páginas. Pupitre extrae los temas.</li>
        <li><b>Marca los temas que se dan en clase</b> (Edición › Temas que se dan en clase): tendrán prioridad.</li>
        <li><b>Haz la prueba de nivel</b> de cada asignatura (Estudiar › Prueba de nivel).</li>
        <li><b>Cada día</b>, el alumno sigue su <b>misión de hoy</b>: lecciones, prácticas, tarjetas y retos según su nivel.</li>
        <li><b>El profesor</b> recibe un informe semanal (Ajustes › Informe semanal al profesor).</li></ol>
      <h4>Actividades</h4><ul>
        <li><b>Aprender</b>: lección interactiva con ejemplos, lectura en voz alta y preguntas de comprobación.</li>
        <li><b>Practicar</b>: preguntas que se adaptan al nivel y a los fallos anteriores, con explicación.</li>
        <li><b>Tarjetas</b>: repaso espaciado; las que no sabe vuelven antes.</li>
        <li><b>Reto</b>: 60 segundos con puntos y combos. <b>Parejas</b>: unir conceptos.</li>
        <li><b>Tutor</b>: resuelve dudas y ayuda con los deberes (también con foto) guiando con preguntas, sin dar la solución.</li></ul>
      <h4>Zona familia</h4><p>Progreso, informes, asignaturas y ajustes están protegidos con el PIN de 4 cifras para que el alumno no los cambie. Las opciones con ${ico("lock")} lo piden.</p>`],
    progreso: ["Cómo se mide el progreso", `
      <p>Cada tema tiene un <b>dominio de 0 a 100</b> que se calcula con las respuestas del alumno, dando más peso a las preguntas difíciles.</p><ul>
      <li><b>Prueba de nivel</b>: fija el punto de partida de cada tema.</li>
      <li><b>Práctica</b> (35 %), <b>lección</b> (20 %), <b>reto</b> (20 %), <b>tarjetas</b> y <b>parejas</b> (15 %): cada sesión ajusta el dominio con ese peso, de forma que mejora poco a poco y no por un acierto aislado.</li></ul>
      <p><span class="pill ok">Dominado</span> 75 o más · <span class="pill warn">En progreso</span> 40 a 74 · <span class="pill bad">Por reforzar</span> menos de 40.</p>
      <p>Las <b>dificultades</b> que ve la familia y el profesor son destrezas concretas con varios fallos en la semana (menos del 60 % de acierto), con ejemplos de las respuestas.</p>
      <p>Las <b>tarjetas</b> siguen el sistema Leitner: si la sabe, vuelve en 1, 3, 7 o 16 días; si no, vuelve al día siguiente.</p>`],
    atajos: ["Atajos de teclado", `<table class="table"><tbody>
      <tr><td><kbd>F1</kbd></td><td>Guía rápida</td></tr>
      <tr><td><kbd>Alt</kbd> + <kbd>M</kbd></td><td>Abrir la barra de menús</td></tr>
      <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Cambiar de menú</td></tr>
      <tr><td><kbd>↑</kbd> <kbd>↓</kbd> <kbd>Intro</kbd></td><td>Moverse por las opciones y elegir</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>Cerrar menús y ventanas</td></tr>
      <tr><td><kbd>Intro</kbd></td><td>Enviar respuesta o mensaje al tutor (<kbd>Mayús</kbd> + <kbd>Intro</kbd>: nueva línea)</td></tr></tbody></table>`],
    ia: ["Cómo conseguir la clave de OpenRouter", `
      <p>${me.ai_ready === false ? `<b style="color:var(--bad)">Ahora mismo tu familia no tiene clave y la IA no está disponible.</b> ` : ""}Pupitre usa <b>OpenRouter</b> para leer los libros, preparar las actividades, corregir y conversar. Cada familia usa su propia clave, así que el uso se cobra en su cuenta de OpenRouter.</p>
      <h4>Pasos</h4><ol>
        <li>Entra en <b>openrouter.ai</b> y crea una cuenta (con Google es un clic).</li>
        <li>En <b>Credits</b>, añade saldo. Con 5 $ hay para muchas semanas de uso normal: una tarde de estudio cuesta en torno a 1-3 céntimos.</li>
        <li>En <b>Keys</b>, pulsa <b>Create key</b>, ponle un nombre (p. ej. «Pupitre») y, si quieres, un límite de gasto.</li>
        <li>Copia la clave (empieza por <code>sk-or-</code>) y pégala en Pupitre: <b>Ajustes › Clave de OpenRouter</b>.</li></ol>
      <p>Pupitre comprueba la clave con OpenRouter antes de guardarla y la guarda cifrada. Puedes cambiarla o quitarla cuando quieras.</p>`],
    privacidad: ["Privacidad y datos", `
      <p>Pupitre lo usan menores, por eso la cuenta la crea y la gestiona siempre un <b>adulto responsable</b> (padre, madre o tutor legal).</p>
      <h4>Qué se guarda</h4><ul>
        <li>La cuenta: nombre de la familia, email, contraseña y PIN (cifrados).</li>
        <li>Lo que la familia escribe del alumno: nombre, curso, notas y datos del profesor.</li>
        <li>El <b>texto</b> de los libros y documentos subidos (no los archivos) y las fotos de ejercicios no se guardan.</li>
        <li>Las respuestas, el progreso, las tarjetas y las conversaciones con el tutor.</li>
        <li>La clave de OpenRouter de la familia, cifrada.</li></ul>
      <h4>Con quién se comparte</h4><ul>
        <li>Para generar actividades, corregir y conversar, el texto necesario se envía a <b>OpenRouter</b> y al proveedor del modelo de IA (Google o DeepSeek), con la clave de la familia.</li>
        <li>El informe de seguimiento se envía por email solo al profesor o tutor que indique la familia.</li>
        <li>No se usan los datos para publicidad ni se venden.</li></ul>
      <h4>Recomendaciones</h4><p>No escribas datos de salud ni otra información sensible en las notas del alumno; basta con indicaciones prácticas («le cuesta concentrarse más de 15 minutos»).</p>
      <h4>Control y borrado</h4><p>Puedes exportar el progreso (Archivo › Exportar), borrar documentos, asignaturas o alumnos, y <b>eliminar la cuenta completa</b> con todos sus datos (Archivo › Eliminar cuenta de familia) en cualquier momento.</p>
      ${me.privacy_contact ? `<h4>Contacto</h4><p>Para cualquier consulta sobre tus datos: <b>${esc(me.privacy_contact)}</b>.</p>` : ""}`],
    acerca: ["Acerca de Pupitre", `
      <p><b>Pupitre ${esc(me.version || "")}</b> · Los deberes, de otra manera.</p>
      <p>Estudio en casa con IA a partir del libro del alumno, con seguimiento para la familia y el profesorado.</p>
      <table class="table"><tbody>
      <tr><td>IA</td><td>${me.ai_ready ? '<span class="pill ok">Configurada</span>' : '<span class="pill bad">Falta la clave de OpenRouter</span>'}</td></tr>
      <tr><td>Modelo principal</td><td><code>${esc(me.models?.main || "")}</code></td></tr>
      <tr><td>Modelo de respaldo</td><td><code>${esc(me.models?.fallback || "")}</code></td></tr>
      <tr><td>Lectura de imágenes</td><td><code>${esc(me.models?.vision || "")}</code></td></tr>
      <tr><td>Dirección</td><td><code>${esc(location.origin)}</code></td></tr></tbody></table>
      <p class="tiny muted" style="margin-top:12px">Los archivos subidos no se guardan: solo su texto. Las fotos enviadas al tutor tampoco se guardan.</p>
      <p class="tiny muted" style="margin-top:6px">${esc(me.credit || "")}</p>`],
  };
  const [title, body] = T[topic] || T.guia;
  return modal(`<div class="row between"><h3>${esc(title)}</h3><button class="iconbtn" data-close aria-label="Cerrar">${ico("close")}</button></div><div class="help-body">${body}</div>
    <div class="actions"><button class="btn" data-close>Entendido</button></div>`, { wide: true });
}

// ---------------------------------------------------------------------------
// Eliminar la cuenta de familia
// ---------------------------------------------------------------------------
async function deleteFamilyModal() {
  if (!(await ensureParent())) return;
  await loadMe();
  const st = state.me.students;
  return modal(`<h3 style="color:var(--bad)">Eliminar la cuenta de familia</h3>
    <p class="small" style="margin-top:6px">Se borrarán <b>para siempre</b> la cuenta <b>${esc(state.me.family.email)}</b> y todo lo que contiene:</p>
    <ul class="small" style="margin:8px 0;padding-left:20px;line-height:1.6">
      <li>${st.length ? `${st.length} ${st.length === 1 ? "alumno" : "alumnos"}: ${st.map((x) => esc(x.name)).join(", ")}` : "Ningún alumno"}</li>
      <li>Asignaturas, libros y material, temas y tarjetas</li>
      <li>Progreso, respuestas, conversaciones con el tutor e informes enviados</li></ul>
    ${st.length ? `<div class="notice" style="margin:10px 0">${ico("info")}<span>Si quieres conservar el progreso, descárgalo antes: ${st.map((x) => `<a href="/api/students/${x.id}/export.csv">${esc(x.name)} (CSV)</a>`).join(" · ")}</span></div>` : ""}
    <div class="stack" style="margin-top:12px">
      <div class="field"><label for="dpw">Contraseña de la cuenta</label><input class="input" type="password" id="dpw" autocomplete="current-password"></div>
      <div class="field"><label for="dcf">Escribe <b>ELIMINAR</b> para confirmar</label><input class="input" id="dcf" autocomplete="off"></div>
      <p class="error-msg" id="derr"></p></div>
    <div class="actions"><button class="btn ghost" data-close>Cancelar</button><button class="btn danger" id="dok" disabled>${ico("trash")} Eliminar definitivamente</button></div>`, {
    onMount: (m, close) => {
      const check = () => { $("#dok", m).disabled = !($("#dpw", m).value && $("#dcf", m).value.trim().toUpperCase() === "ELIMINAR"); };
      $("#dpw", m).addEventListener("input", check);
      $("#dcf", m).addEventListener("input", check);
      $("#dpw", m).focus();
      $("#dok", m).addEventListener("click", async () => {
        $("#dok", m).disabled = true;
        try {
          await api("/api/family/delete", { method: "POST", body: { password: $("#dpw", m).value, confirm: $("#dcf", m).value } });
          close(true);
          state.me = null;
          location.hash = "#/acceso";
          await route();
          toast("La cuenta y todos sus datos se han eliminado.");
        } catch (e) { $("#derr", m).textContent = e.message; check(); }
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Clave de OpenRouter de la familia
// ---------------------------------------------------------------------------
function keysMissing() {
  return "Tu familia todavía no tiene clave de OpenRouter y la IA no está disponible.";
}

async function keyModal(welcome) {
  if (!(await ensureParent())) return;
  const k = (state.me && state.me.key) || {};
  return modal(`<h3>${welcome ? "Último paso: la clave de OpenRouter" : "Clave de OpenRouter"}</h3>
    <p class="small muted" style="margin-top:4px">${welcome ? "Pupitre usa la IA de OpenRouter con la clave de cada familia: el uso se cobra en tu propia cuenta (una tarde de estudio cuesta en torno a 1-3 céntimos)." : "La IA de Pupitre funciona con la clave de OpenRouter de tu familia."}</p>
    ${k.masked ? `<p class="small" style="margin-top:8px">Clave actual: <code>${esc(k.masked)}</code></p>` : ""}
    <ol class="small" style="margin:12px 0;padding-left:20px;line-height:1.6">
      <li>Crea una cuenta en <a href="https://openrouter.ai" target="_blank" rel="noopener">openrouter.ai</a> y añade saldo en <b>Credits</b> (con 5 $ hay para semanas).</li>
      <li>En <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener"><b>Keys</b></a> pulsa <b>Create key</b> y cópiala.</li>
      <li>Pégala aquí:</li></ol>
    <div class="field"><label for="okey">Clave (empieza por sk-or-)</label><input class="input" id="okey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-or-v1-..."></div>
    <label class="check small" style="margin-top:8px"><input type="checkbox" id="oshow"> Mostrar la clave</label>
    <p class="error-msg" id="kerr"></p><p class="small" id="kok" style="color:var(--ok);font-weight:700"></p>
    <div class="actions">${k.masked ? `<button class="btn danger" id="kdel" style="margin-right:auto">${ico("trash")} Quitar</button>` : ""}
      <button class="btn ghost" data-close>${welcome ? "Más tarde" : "Cancelar"}</button><button class="btn" id="ksave">Comprobar y guardar</button></div>`, {
    onMount: (m, close) => {
      const inp = $("#okey", m);
      inp.focus();
      $("#oshow", m).addEventListener("change", (e) => (inp.type = e.target.checked ? "text" : "password"));
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") $("#ksave", m).click(); });
      const done = async (msg) => { await loadMe(); close(true); toast(msg); route(); };
      $("#ksave", m).addEventListener("click", async () => {
        const v = inp.value.trim();
        $("#kerr", m).textContent = ""; $("#kok", m).textContent = "";
        if (!v) return ($("#kerr", m).textContent = "Pega la clave de OpenRouter.");
        const b = $("#ksave", m); b.disabled = true; b.textContent = "Comprobando con OpenRouter…";
        try {
          const r = await api("/api/family/openrouter-key", { method: "POST", body: { key: v } });
          $("#kok", m).textContent = "✓ Clave válida" + (r.limit_remaining != null ? ` · saldo disponible del límite: ${Number(r.limit_remaining).toFixed(2)} $` : "");
          setTimeout(() => done("Clave de OpenRouter guardada"), 900);
        } catch (e) { $("#kerr", m).textContent = e.message; b.disabled = false; b.textContent = "Comprobar y guardar"; }
      });
      const del = $("#kdel", m);
      del && del.addEventListener("click", async () => {
        if (!(await confirmModal("Quitar la clave", "La IA dejará de funcionar para tu familia hasta que pongas otra clave.", "Quitar", true))) return;
        try { await api("/api/family/openrouter-key", { method: "POST", body: { key: "" } }); done("Clave quitada"); } catch (e) { fail(e); }
      });
    },
  });
}
