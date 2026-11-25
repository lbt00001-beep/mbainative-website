import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, reauthenticateWithPopup, sendSignInLinkToEmail,
  isSignInWithEmailLink, signInWithEmailLink, signOut, deleteUser } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs,
  increment, serverTimestamp, deleteField } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';

const COURSE = /*__DATA__*/null;
const FIREBASE = /*__FIREBASE__*/null;
const VERSION = '2.0';
const fb = initializeApp(FIREBASE);
const auth = getAuth(fb); auth.languageCode = 'es';
const db = getFirestore(fb);
const LS = { settings:'cia_settings', pending:'cia_pending', email:'cia_email_link', name:'cia_name_link', run:'cia_run' };
const LONG_AWAY = 30 * 60 * 1000;      // más de 30 min fuera: se pregunta
const MAX_CLAIM_MIN = 180;             // como mucho se pueden añadir 3 h de una vez
const ACTIVE_DAY_SEC = 600;            // día activo: 10 min o una ficha terminada
const ASSISTANTS = {
  claude:  { name:'Claude',  url:'https://claude.ai/new', q:'q' },
  chatgpt: { name:'ChatGPT', url:'https://chatgpt.com/', q:'q' },
  gemini:  { name:'Gemini',  url:'https://gemini.google.com/app', q:null },
  otro:    { name:'tu asistente', url:null, q:null },
};

/* ---------- utilidades ---------- */
const ICONS = {
 chat:'<path d="M8 12h30a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H22l-8 7v-7H8a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4z"/><path d="M46 22h10a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-4v6l-7-6H32a4 4 0 0 1-4-4v-2"/><path d="M13 21h20M13 26h13"/>',
 book:'<path d="M32 16c-6-4-14-5-24-4v36c10-1 18 0 24 4 6-4 14-5 24-4V12c-10-1-18 0-24 4z"/><path d="M32 16v36"/><path d="M14 22c5 0 9 1 12 2M14 30c5 0 9 1 12 2M38 24c3-1 7-2 12-2M38 32c3-1 7-2 12-2"/>',
 tools:'<path d="M40 8a12 12 0 0 0-11 16L9 44a5 5 0 0 0 7 7l20-20a12 12 0 0 0 16-11l-7 4-6-3-1-7 6-6z"/><path d="M44 40l12 12M50 34l8 8-6 6-8-8"/>',
 spark:'<path d="M28 6l4 14 14 4-14 4-4 14-4-14-14-4 14-4z"/><path d="M48 36l2.5 7.5L58 46l-7.5 2.5L48 56l-2.5-7.5L38 46l7.5-2.5z"/><path d="M12 44l1.5 4.5L18 50l-4.5 1.5L12 56l-1.5-4.5L6 50l4.5-1.5z"/>',
 pencil:'<path d="M44 8l12 12L22 54H10V42z"/><path d="M38 14l12 12"/>',
 bulb:'<path d="M24 46h16M26 54h12"/><path d="M32 6a16 16 0 0 0-9 29c2 2 3 4 3 7v4h12v-4c0-3 1-5 3-7A16 16 0 0 0 32 6z"/>',
 play:'<circle cx="32" cy="32" r="24"/><path d="M27 22l14 10-14 10z"/>',
 check:'<path d="M14 34l12 12 24-26"/>',
 reply:'<path d="M26 14L8 30l18 16V36c14 0 24 4 30 14 0-18-10-30-30-30z"/>',
 quiz:'<circle cx="32" cy="32" r="24"/><path d="M25 25a7 7 0 1 1 10 6c-2 1-3 3-3 5v2M32 45v1"/>',
 back:'<path d="M40 12L20 32l20 20"/>',
 info:'<circle cx="32" cy="32" r="24"/><path d="M32 29v14M32 21v1"/>'
};
const icon = (n, s, sw=3.2) => `<svg class="i" aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 64 64" stroke-width="${sw}">${ICONS[n]}</svg>`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rich = s => esc(s).replace(/«([^»]*)»/g, '<em class="p">«$1»</em>');
const prompts = s => [...String(s).matchAll(/«([^»]*)»/g)].map(m => m[1]);
const $ = id => document.getElementById(id);
const W = n => COURSE.weeks[n-1];
const L = n => COURSE.lessons[n-1];
const pick = a => a[Math.floor(Math.random()*a.length)];
const localDay = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const fmtMin = s => { const m = Math.floor(s/60); return m < 60 ? `${m} min` : `${Math.floor(m/60)} h ${m%60} min`; };
const toast = (t, ms=3600) => { const e=$('toast'); e.textContent=t; e.classList.remove('hidden'); clearTimeout(toast._t); toast._t=setTimeout(()=>e.classList.add('hidden'),ms); };
function setSync(ok){ const s=$('sync'); s.classList.toggle('off', !ok); s.textContent = ok ? 'Guardado' : 'Sin conexión'; s.title = ok ? 'Tu progreso está guardado' : 'Se guardará cuando vuelva la conexión'; }
const errText = e => {
  const c = e?.code || '';
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'Has cerrado la ventana de Google antes de terminar.';
  if (c.includes('popup-blocked')) return 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes para esta web.';
  if (c.includes('quota-exceeded')) return 'Hoy ya se han enviado todos los enlaces disponibles. Entra con Google o inténtalo mañana.';
  if (c.includes('invalid-email')) return 'Revisa el email.';
  if (c.includes('invalid-action-code') || c.includes('expired-action-code')) return 'Ese enlace ya no vale. Pide otro.';
  if (c.includes('network') || c.includes('unavailable')) return 'Sin conexión. Revisa internet y vuelve a intentarlo.';
  if (c.includes('permission-denied')) return 'No tienes permiso para esta acción.';
  if (c.includes('requires-recent-login')) return 'Por seguridad, vuelve a entrar y repite la acción.';
  return e?.message || 'Algo ha fallado';
};

/* ---------- estado ---------- */
let user = null, uref = null, progress = {}, daily = {}, steps = {}, prefs = {};
let view = 'login', current = 1;
let settings = Object.assign({ sound:true, scale:1 }, JSON.parse(localStorage.getItem(LS.settings) || '{}'));
const saveSettings = () => { localStorage.setItem(LS.settings, JSON.stringify(settings)); document.documentElement.style.setProperty('--scale', settings.scale); };
saveSettings();
const duration = () => (prefs.duration || 20);
const minSeconds = () => Math.round(duration() * 60 / 2);
const P = n => progress[n] || (progress[n] = { seconds:0, done_at:null, notes:'', ai:'', quiz:null, forced:false });

/* días activos: ≥10 min o una ficha terminada ese día */
function activeDays(){
  const set = new Set(Object.entries(daily).filter(([,s]) => s >= ACTIVE_DAY_SEC).map(([d]) => d));
  Object.values(progress).forEach(p => { if (p.done_at) set.add(localDay(new Date(p.done_at))); });
  return set;
}

/* ---------- vistas ---------- */
function show(v){
  view = v;
  for (const id of ['login','panel','ficha','cuaderno']) $(id).classList.toggle('hidden', id !== v);
  refreshMenus();
  $('whoName').innerHTML = user ? `${esc(user.name)} <span class="em">· ${esc(user.email)}</span>` : '';
  $('sync').classList.toggle('hidden', !user);
  window.scrollTo(0,0);
}
function refreshMenus(){
  document.querySelectorAll('[data-need]').forEach(b => {
    const n = b.dataset.need; b.disabled = (n === 'auth' && !user) || (n === 'ficha' && view !== 'ficha');
  });
  document.querySelectorAll('[data-pip]').forEach(b => b.classList.toggle('hidden', !('documentPictureInPicture' in window)));
}

function renderLogin(mode){
  $('loginTiles').innerHTML = COURSE.weeks.map(w => `<div class="tile" style="background:${w.color}">${icon(w.icon,52,3)}<div><small>Semana ${w.n}</small><b>${esc(w.title)}</b></div></div>`).join('');
  const confirm = mode === 'confirmEmail';
  $('lfTitle').textContent = confirm ? 'Confirma tu email' : 'Empieza o continúa';
  $('lfIntro').textContent = confirm ? 'Has abierto el enlace en otro navegador o dispositivo. Escribe el email al que te lo enviamos para entrar.' :
    'Sin contraseñas. Entra con tu cuenta de Google y tu progreso te esperará en cualquier dispositivo.';
  $('lfBtn').textContent = confirm ? 'Entrar' : 'Enviarme el enlace de acceso';
  for (const id of ['lfGoogle','lfOr','lfNote','lfNameL']) $(id).classList.toggle('hidden', confirm);
  $('loginForm').dataset.mode = confirm ? 'confirm' : 'send';
  show('login');
}

function stats(){
  const done = COURSE.lessons.filter(l => progress[l.n]?.done_at).length;
  const total = Object.values(progress).reduce((a,p)=>a+(+p.seconds||0),0);
  const act = activeDays();
  let streak = 0; const d = new Date();
  if (!act.has(localDay(d))) d.setDate(d.getDate()-1);
  while (act.has(localDay(d))) { streak++; d.setDate(d.getDate()-1); }
  const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay()+6)%7));
  let week = 0; for (let i=0;i<7;i++){ const x=new Date(mon); x.setDate(mon.getDate()+i); if (act.has(localDay(x))) week++; }
  const next = COURSE.lessons.find(l => !progress[l.n]?.done_at) || null;
  return { done, total, streak, week, next, act };
}

function renderPanel(){
  const s = stats();
  const h = new Date().getHours();
  $('pDate').textContent = new Date().toLocaleDateString('es-ES',{weekday:'long', day:'numeric', month:'long'});
  $('pHello').textContent = `${h<14?'Buenos días':h<21?'Buenas tardes':'Buenas noches'}, ${user.name.split(' ')[0]}`;
  $('pMsg').textContent = s.done===20 ? '¡Curso completado! Ahora los 20 minutos diarios son para usar la IA en algo real.' :
     !s.total && !s.done ? 'Tu primera sesión dura 20 minutos. Ten a mano tu asistente de IA: los botones de cada ficha lo abren por ti.' :
     s.act.has(localDay()) ? pick(['Hoy ya has cumplido. Si te apetece, adelanta la siguiente ficha.','Día activo conseguido. ¡Buen trabajo!']) :
     s.streak > 1 ? `Llevas ${s.streak} días seguidos. Hoy toca la sesión de 20 minutos para no romper la racha.` : 'Te toca la sesión de hoy: 20 minutos y listo.';
  $('sDone').textContent = `${s.done}/20`; $('sDoneBar').style.width = (s.done*5)+'%';
  $('sTime').textContent = fmtMin(s.total);
  $('sStreak').textContent = s.streak; $('sWeek').textContent = `${Math.min(s.week,5)}/5`;
  const n = s.next;
  if (n){ const w=W(n.w); const started = progress[n.n]?.seconds > 0;
    $('pCont').style.background = w.color;
    $('pCont').innerHTML = `<span class="n">${String(n.n).padStart(2,'0')}</span><div><div class="eyebrow" style="color:#fff">${started?'Continuar':'Siguiente'} · Semana ${w.n}</div><h2>${esc(n.title)}</h2></div><button class="btn" type="button" data-open="${n.n}">${started?'Continuar':'Empezar'} ficha →</button>`;
  } else { $('pCont').style.background = 'var(--ink)'; $('pCont').innerHTML = `<div>${icon('check',64,4)}</div><div><h2>Has terminado las 20 fichas</h2><p style="margin:4px 0 0">Descarga tu diploma y repite cualquier ficha con un tema nuevo cuando quieras.</p></div><button class="btn" type="button" data-cmd="diploma">Mi diploma</button>`; }
  $('pWeeks').innerHTML = COURSE.weeks.map(w => `<div class="week"><div class="week-h"><span class="sq" style="background:${w.color}">${icon(w.icon,24,4)}</span><div><div class="eyebrow">Semana ${w.n}</div><h3>${esc(w.title)}</h3></div></div><div class="grid5">${
    COURSE.lessons.filter(l=>l.w===w.n).map(l => { const p=progress[l.n]; const d=p?.done_at;
      return `<button type="button" class="card ${d?'done':''}" data-open="${l.n}" style="${d?`background:${w.color}`:''}" aria-label="Ficha ${l.n}: ${esc(l.title)}. ${d?'Terminada':p?.seconds?'Empezada':'Pendiente'}">${d?`<span class="ok">${icon('check',22,5)}</span>`:''}<span class="num" style="color:${d?'#fff':w.color}">${String(l.n).padStart(2,'0')}</span><span class="tt">${esc(l.title)}</span><span class="st"><span>${d?'Terminada':p?.seconds?'Empezada':'Pendiente'}</span><span>${p?.seconds?fmtMin(p.seconds):''}</span></span></button>`; }).join('')}</div></div>`).join('');
  const start = new Date(); start.setDate(start.getDate() - ((start.getDay()+6)%7) - 28);
  let cal = ['L','M','X','J','V','S','D'].map(x=>`<div class="dn" aria-hidden="true">${x}</div>`).join('');
  for (let i=0;i<35;i++){ const d=new Date(start); d.setDate(start.getDate()+i); const k=localDay(d); const sec=daily[k]||0;
    const lv = s.act.has(k) ? 'on' : sec>0 ? 'part' : '';
    cal += `<div class="d ${lv} ${k===localDay()?'today':''}" title="${d.toLocaleDateString('es-ES')}: ${sec?fmtMin(sec):'sin práctica'}${s.act.has(k)?' · día activo':''}"></div>`; }
  $('pCal').innerHTML = cal;
  $('pDots').innerHTML = Array.from({length:5},(_,i)=>`<i class="${i<s.week?'on':''}"></i>`).join('');
  history.replaceState(null,'',location.pathname);
  show('panel');
}

/* ---------- datos ---------- */
// users/{uid}: { name, email, createdAt, lastSeen, consentAt, totalSeconds,
//   fichas: { fN: { seconds, doneAt, forced, quiz:{score, answers} } }, daily: { 'AAAA-MM-DD': s },
//   steps: { fN: [bool] }, prefs: { assistant, duration, onboarded, reminder } }
// users/{uid}/notes/fN: { text, aiAnswer, updatedAt }  — solo las lee el alumno
async function loadUser(fbUser, nameHint){
  uref = doc(db, 'users', fbUser.uid);
  let snap = await getDoc(uref);
  if (!snap.exists()){
    let name = (nameHint || fbUser.displayName || fbUser.email.split('@')[0]).trim().slice(0,60);
    if (name.length < 2) name = (name + ' ·').slice(0,2);
    await setDoc(uref, { name, email: fbUser.email, createdAt: serverTimestamp(), lastSeen: serverTimestamp(), consentAt: new Date().toISOString(),
      totalSeconds: 0, fichas: {}, daily: {}, steps: {}, prefs: {} });
    snap = await getDoc(uref);
  } else updateDoc(uref, { lastSeen: serverTimestamp() }).catch(()=>{});
  const d = snap.data();
  user = { name: d.name, email: d.email, uid: fbUser.uid };
  prefs = Object.assign({}, d.prefs || {});
  steps = Object.assign({}, d.steps || {});
  progress = {}; daily = Object.assign({}, d.daily || {});
  for (const [k, v] of Object.entries(d.fichas || {})) progress[+k.slice(1)] = { seconds: v.seconds || 0, done_at: v.doneAt || null, forced: !!v.forced, quiz: v.quiz || null, notes:'', ai:'' };
  const notes = await getDocs(collection(uref, 'notes'));
  notes.forEach(n => { const p = P(+n.id.slice(1)); p.notes = n.data().text || ''; p.ai = n.data().aiAnswer || ''; });
  setSync(true); sendQueue();
  await resumeRun();
  const m = location.hash.match(/^#ficha-(\d+)$/);
  if (m && +m[1]>=1 && +m[1]<=20) openFicha(+m[1]);
  else if (location.hash === '#cuaderno') renderCuaderno();
  else renderPanel();
  if (!prefs.onboarded) welcome();
}
const savePrefs = (patch) => { Object.assign(prefs, patch); return updateDoc(uref, Object.fromEntries(Object.entries(patch).map(([k,v]) => [`prefs.${k}`, v]))).catch(e => { setSync(false); throw e; }); };

/* ---------- cronómetro por reloj ----------
   run = { uid, ficha, lastCommit, hiddenAt?, cues:{} } en localStorage.
   El tiempo se calcula siempre como (ahora − última anotación), esté la pestaña visible o no. */
let run = null, tick = null, pip = null;
const loadRun = () => { try { const r = JSON.parse(localStorage.getItem(LS.run) || 'null'); return r && r.uid === user?.uid ? r : null; } catch { return null; } };
const saveRun = () => run ? localStorage.setItem(LS.run, JSON.stringify(run)) : localStorage.removeItem(LS.run);
const pendingSec = () => run ? Math.max(0, Math.floor((Date.now() - run.lastCommit) / 1000)) : 0;
const fichaSec = (n=current) => (+P(n).seconds || 0) + (run && run.ficha === n ? pendingSec() : 0);
const totalSec = () => Object.values(progress).reduce((a,x)=>a+(+x.seconds||0),0) + pendingSec();

function addSeconds(f, sec, day=localDay()){
  if (sec <= 0) return;
  P(f).seconds = (+P(f).seconds || 0) + sec; daily[day] = (daily[day] || 0) + sec;
  const q = JSON.parse(localStorage.getItem(LS.pending)||'[]'); q.push({ uid: user.uid, ficha:f, seconds:sec, day }); localStorage.setItem(LS.pending, JSON.stringify(q));
  sendQueue();
}
function commit(upTo = Date.now()){
  if (!run) return;
  const sec = Math.max(0, Math.floor((upTo - run.lastCommit) / 1000));
  if (sec > 0){ addSeconds(run.ficha, sec); run.lastCommit += sec * 1000; }
  saveRun();
}
function startRun(){
  if (!user) return;
  if (run && run.ficha === current) return;
  if (run) commit();
  run = { uid: user.uid, ficha: current, lastCommit: Date.now(), cues: {} };
  saveRun(); startTick(); drawTimer();
}
function stopRun(){ if (!run) return; commit(); run = null; saveRun(); stopTick(); drawTimer(); }
function startTick(){ stopTick(); tick = setInterval(onTick, 1000); }
function stopTick(){ clearInterval(tick); tick = null; }
function onTick(){
  if (!run) return stopTick();
  if (!document.hidden && Date.now() - run.lastCommit >= 60000) commit();
  cues(); drawTimer();
}
function cues(){
  if (!run || run.ficha !== current) return;
  const s = fichaSec(), d = duration()*60, c = run.cues;
  if (!c.ej && s >= d*0.2 && s < d*0.9){ c.ej = 1; saveRun(); notify('Pasa al ejercicio: abre tu asistente con el botón del paso 1.'); }
  if (!c.as && s >= d*0.9 && s < d){ c.as = 1; saveRun(); notify('Últimos minutos: escribe tu nota en «Para asentar».'); }
  if (!c.end && s >= d){ c.end = 1; saveRun(); if (settings.sound) beep(); notify('¡Tiempo cumplido! Responde la comprobación y termina la ficha.'); }
}
function notify(t){ toast(t, 6000); if (pip) { const e = pip.document.getElementById('pMsg'); if (e) e.textContent = t; } }
function phaseOf(s){ const d = duration()*60; return s < d*0.2 ? 'Idea' : s < d*0.9 ? 'Ejercicio' : s < d ? 'Para asentar' : 'Tiempo extra'; }
function clockText(s){ const left = duration()*60 - s, a = Math.abs(left); return (left<0?'+':'') + `${String(Math.floor(a/60)).padStart(2,'0')}:${String(a%60).padStart(2,'0')}`; }
function drawTimer(){
  if (view !== 'ficha') return drawPip();
  const s = fichaSec(), running = run && run.ficha === current;
  $('tClock').textContent = clockText(s);
  $('tArc').style.strokeDashoffset = 552.9 * (1 - Math.min(1, s/(duration()*60)));
  $('tPhase').textContent = phaseOf(s);
  $('tState').textContent = `${running ? 'en marcha' : 'en pausa'} · ${Math.floor(s/60)}/${duration()} min`;
  $('tBtn').textContent = running ? 'Pausar' : (s ? 'Seguir' : 'Empezar sesión');
  $('tFicha').textContent = fmtMin(s); $('tTotal').textContent = fmtMin(totalSec());
  $('mClock').textContent = clockText(s); $('mPhase').textContent = `${phaseOf(s)} · ${running?'en marcha':'en pausa'}`;
  $('mFicha').textContent = `${Math.floor(s/60)} de ${duration()} min en esta ficha`;
  $('mBtn').textContent = running ? 'Pausar' : (s ? 'Seguir' : 'Empezar');
  drawPip(); drawReq();
}
async function resumeRun(){
  const r = loadRun(); if (!r) return;
  run = r;
  const away = Date.now() - (run.hiddenAt || run.lastCommit);
  if (run.hiddenAt) { commit(run.hiddenAt); delete run.hiddenAt; }
  if (away <= LONG_AWAY){ commit(); startTick(); return; }
  run.lastCommit = Date.now(); saveRun();
  await askAway(away, run.ficha);
  stopRun();
}
function askAway(ms, f){
  const min = Math.min(Math.round(ms/60000), MAX_CLAIM_MIN);
  return new Promise(res => dialog('¿Seguiste trabajando con la IA?', `<p>Has estado <b>${fmtMin(ms/1000)}</b> fuera de la ficha ${f} con el reloj en marcha.</p><p>¿Cuántos minutos estuviste practicando de verdad?</p><div class="opt"><label for="awMin">Minutos a contar</label><input type="number" id="awMin" min="0" max="${MAX_CLAIM_MIN}" value="${Math.min(min, duration())}"></div>`,
    [['No contar nada', () => res()], ['Contar estos minutos', () => { const m = Math.max(0, Math.min(MAX_CLAIM_MIN, +$('awMin').value || 0)); addSeconds(f, m*60); toast(`${m} min añadidos a la ficha ${f}`); drawTimer(); res(); }, true]]));
}
document.addEventListener('visibilitychange', async () => {
  if (!run) return;
  if (document.hidden){ commit(); run.hiddenAt = Date.now(); saveRun(); }
  else if (run.hiddenAt){
    const away = Date.now() - run.hiddenAt;
    if (away > LONG_AWAY && !pip){
      const f = run.ficha; commit(run.hiddenAt); run.lastCommit = Date.now(); delete run.hiddenAt; saveRun();
      await askAway(away, f);
    } else { delete run.hiddenAt; commit(); }
    drawTimer();
  }
});
window.addEventListener('pagehide', () => { if (run) commit(); });

/* reloj flotante (Document Picture-in-Picture, Chrome y Edge de escritorio) */
async function openPip(){
  if (!('documentPictureInPicture' in window)) return toast('Tu navegador no admite el reloj flotante. El reloj sigue contando igualmente.');
  if (pip) return;
  startRun();
  try { pip = await documentPictureInPicture.requestWindow({ width: 320, height: 210 }); } catch(e){ return toast('No se ha podido abrir el reloj flotante.'); }
  const w = W(L(current).w);
  pip.document.body.innerHTML = `<style>body{margin:0;font-family:system-ui,sans-serif;background:${w.color};color:#fff;display:flex;flex-direction:column;gap:6px;padding:14px;box-sizing:border-box;height:100vh}
    b{font-size:44px;font-variant-numeric:tabular-nums;line-height:1} small{opacity:.9;font-size:13px} .row{display:flex;gap:8px;margin-top:auto}
    button{flex:1;font:inherit;font-weight:700;border:0;border-radius:999px;padding:9px;cursor:pointer;background:#fff;color:#1E2430} #pMsg{font-size:13px;min-height:1.2em}</style>
    <small id="pT"></small><b id="pC"></b><small id="pP"></small><div id="pMsg"></div>
    <div class="row"><button id="pB" type="button"></button><button id="pX" type="button">Terminar</button></div>`;
  pip.document.getElementById('pB').onclick = () => { run && run.ficha === current ? stopRun() : startRun(); };
  pip.document.getElementById('pX').onclick = () => { stopRun(); pip.close(); };
  pip.addEventListener('pagehide', () => { pip = null; });
  pip.setInterval(() => { if (run) { cues(); if (Date.now() - run.lastCommit >= 60000) commit(); } drawPip(); }, 1000);
  drawPip();
}
function drawPip(){
  if (!pip) return;
  const d = pip.document, s = fichaSec(), running = run && run.ficha === current;
  d.getElementById('pT').textContent = `Ficha ${current} · ${L(current).title}`;
  d.getElementById('pC').textContent = clockText(s);
  d.getElementById('pP').textContent = `${phaseOf(s)} · ${Math.floor(s/60)} de ${duration()} min`;
  d.getElementById('pB').textContent = running ? 'Pausar' : 'Seguir';
}

/* ---------- cola de guardado del tiempo ---------- */
let sending = false;
async function sendQueue(){
  if (sending || !uref) return; sending = true;
  try {
    let q = JSON.parse(localStorage.getItem(LS.pending)||'[]').filter(it => it.uid === user?.uid);
    while (q.length){
      const it = q[0];
      await updateDoc(uref, { [`fichas.f${it.ficha}.seconds`]: increment(it.seconds), [`daily.${it.day}`]: increment(it.seconds),
        totalSeconds: increment(it.seconds), lastSeen: serverTimestamp() });
      q.shift(); localStorage.setItem(LS.pending, JSON.stringify(q));
    }
    setSync(true);
  } catch(e){ setSync(false); }
  sending = false;
}
window.addEventListener('online', sendQueue);
function beep(){ try{ const c = new (window.AudioContext||window.webkitAudioContext)(); [0,0.25,0.5].forEach((t,i)=>{ const o=c.createOscillator(), g=c.createGain(); o.frequency.value=[660,880,990][i]; g.gain.setValueAtTime(0.18,c.currentTime+t); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+t+0.35); o.connect(g); g.connect(c.destination); o.start(c.currentTime+t); o.stop(c.currentTime+t+0.4); }); }catch{} }

/* ---------- ficha ---------- */
function openFicha(n){
  if (run && run.ficha !== n) stopRun();
  current = n; const l = L(n), w = W(l.w), p = P(n), x = l.extra;
  document.documentElement.style.setProperty('--wc', w.color);
  document.documentElement.style.setProperty('--wt', w.tint);
  $('fDeco').innerHTML = icon(w.icon, 320, 2.2);
  $('fWeek').textContent = `Semana ${w.n} · ${w.title}`;
  $('fAxis').textContent = l.axis;
  $('fNum').textContent = String(n).padStart(2,'0'); $('fTitle').textContent = l.title;
  const h = (ic, t) => `${icon(ic,28,4)}<b>${t}</b>`;
  $('hIdea').innerHTML = h('bulb','La idea');
  $('hEj').innerHTML = h('play','Ejercicio');
  $('hAi').innerHTML = h('reply','Lo que me respondió la IA');
  $('hAs').innerHTML = h('pencil','Para asentar');
  $('hQ').innerHTML = h('quiz','Comprueba lo aprendido');
  $('fRepaso').classList.toggle('hidden', !x.repaso);
  $('fRepaso').innerHTML = x.repaso ? `${icon('back',22,4)}<span><b>Recuerda.</b> ${rich(x.repaso)}</span>` : '';
  $('fPlanB').classList.toggle('hidden', !x.plan_b);
  $('fPlanB').innerHTML = x.plan_b ? `${icon('info',22,4)}<span><b>Si tu asistente no lo tiene:</b> ${rich(x.plan_b)}</span>` : '';
  $('fConcept').innerHTML = rich(l.concept);
  const a = ASSISTANTS[prefs.assistant || 'claude'];
  const checks = steps[`f${n}`] || [];
  $('fSteps').innerHTML = l.steps.map((s,i) => { const pr = prompts(s)[0];
    return `<li class="step"><label><input type="checkbox" data-step="${i}" ${checks[i]?'checked':''}><span class="nb">${i+1}</span><span class="tx">${rich(s)}</span></label>${pr ? `<div class="acts"><button class="btn small" type="button" data-ask="${i}">${a.url ? `Abrir en ${a.name}` : 'Copiar y abrir mi asistente'}</button><button class="btn small ghost" type="button" data-copy="${i}">Copiar la frase</button></div>` : ''}</li>`; }).join('');
  $('fExP').textContent = `«${x.ejemplo[0]}»`; $('fExW').textContent = x.ejemplo[1]; $('fEx').open = false;
  $('fAiText').value = p.ai || ''; $('fAiSaved').textContent = p.ai ? 'Guardado' : '';
  $('fSettleQ').innerHTML = rich(l.settle);
  $('fNotes').value = p.notes || ''; $('fSaved').textContent = p.notes ? 'Guardado' : '';
  renderQuiz();
  $('fPrev').disabled = n===1; $('fNext').disabled = n===20;
  $('tPip').classList.toggle('hidden', !('documentPictureInPicture' in window));
  show('ficha');
  history.replaceState(null,'',`#ficha-${n}`);
  if (run && run.ficha === n) startTick();
  drawTimer();
}
function renderQuiz(){
  const l = L(current), q = P(current).quiz;
  $('fQuiz').innerHTML = l.extra.quiz.map((it, qi) => {
    const ans = q?.answers?.[qi];
    return `<fieldset data-q="${qi}"><legend>${qi+1}. ${esc(it[0])}</legend>${it[1].map((o,oi) => `<label><input type="radio" name="q${qi}" value="${oi}" ${ans===oi?'checked':''} ${ans!=null?'disabled':''}> <span>${esc(o)}</span></label>`).join('')}
      <div class="fb" id="fb${qi}">${ans!=null ? (ans===it[2] ? `<span class="okmsg">✓ Correcto.</span> ${esc(it[3])}` : `<span style="color:#B42318;font-weight:600">✗ No es esa.</span> La buena es «${esc(it[1][it[2]])}». ${esc(it[3])}`) : ''}</div></fieldset>`; }).join('');
}
$('fQuiz').addEventListener('change', async e => {
  const fs = e.target.closest('fieldset'); if (!fs) return;
  const qi = +fs.dataset.q, oi = +e.target.value, l = L(current), p = P(current);
  p.quiz = p.quiz || { answers:[null,null], score:0 };
  p.quiz.answers[qi] = oi;
  p.quiz.score = l.extra.quiz.reduce((a,it,i) => a + (p.quiz.answers[i] === it[2] ? 1 : 0), 0);
  renderQuiz(); drawReq();
  try { await updateDoc(uref, { [`fichas.f${current}.quiz`]: p.quiz }); setSync(true); } catch { setSync(false); }
});
function requirements(n=current){
  const p = P(n), s = fichaSec(n);
  return [
    { ok: s >= minSeconds(), t: `Al menos ${Math.round(minSeconds()/60)} min de práctica (llevas ${Math.floor(s/60)})` },
    { ok: (p.notes || '').trim().length >= 15, t: 'Tu nota en «Para asentar»' },
    { ok: p.quiz?.answers?.every(a => a != null) || false, t: 'Las 2 preguntas de comprobación' },
  ];
}
function drawReq(){
  if (view !== 'ficha') return;
  const done = P(current).done_at;
  $('fReq').innerHTML = done ? `<li class="ok"><span class="m">✓</span> Ficha terminada el ${new Date(done).toLocaleDateString('es-ES')}${P(current).forced ? ' (sin completar todos los pasos)' : ''}</li>` :
    '<li style="font-weight:700">Para terminar la ficha:</li>' + requirements().map(r => `<li class="${r.ok?'ok':''}"><span class="m">${r.ok?'✓':''}</span>${esc(r.t)}</li>`).join('');
  $('fDone').textContent = done ? 'Volver a abrirla' : 'Terminar la ficha';
  $('fDone').classList.toggle('ghost', !!done);
}
async function setDone(d, forced=false){
  const f = current, p = P(f);
  if (d) commit();
  p.done_at = d ? new Date().toISOString() : null; p.forced = d && forced;
  drawReq();
  try {
    await updateDoc(uref, { [`fichas.f${f}.doneAt`]: d ? p.done_at : deleteField(), [`fichas.f${f}.forced`]: d && forced ? true : deleteField(), lastSeen: serverTimestamp() });
    setSync(true);
  } catch(e){ setSync(false); toast('No se ha podido guardar: '+errText(e)); return; }
  if (!d) return;
  stopRun();
  const s = stats(), weekDone = COURSE.lessons.filter(l => l.w === L(f).w).every(l => progress[l.n]?.done_at);
  const extra = weekDone ? `<p><b>¡Semana ${L(f).w} completada!</b> ${f===20?'Y con ella, el curso entero.':''}</p>` : '';
  dialog(f===20 && s.done===20 ? '¡Curso terminado!' : pick(['¡Ficha terminada!','¡Bien hecho!','Una más']), `<p>Ficha ${f}: <b>${Math.floor(p.seconds/60)} min</b> de práctica${p.quiz?`, ${p.quiz.score} de 2 en la comprobación`:''}, nota guardada.</p>${extra}
    <p>Llevas <b>${s.done} de 20</b> fichas${s.streak>1?` y <b>${s.streak} días seguidos</b>`:''}.</p>${s.next ? `<p>Mañana: <b>Ficha ${s.next.n} · ${esc(s.next.title)}</b>.</p>` : ''}${!prefs.reminder ? '<p style="color:var(--muted)">¿Quieres que tu calendario te lo recuerde cada día? Archivo › Recordatorio diario.</p>' : ''}`,
    f===20 && s.done===20 ? [['Volver al panel', () => CMDS.panel()], ['Descargar mi diploma', () => diploma(), true]] :
    [['Volver al panel', () => CMDS.panel()], ...(s.next ? [['Abrir la siguiente', () => openFicha(s.next.n), true]] : [])]);
}
$('fDone').onclick = () => {
  if (P(current).done_at) return setDone(false);
  const miss = requirements().filter(r => !r.ok);
  if (!miss.length) return setDone(true);
  dialog('Aún te falta algo', `<p>Para dar la ficha por terminada te falta:</p><ul>${miss.map(r=>`<li>${esc(r.t)}</li>`).join('')}</ul><p style="color:var(--muted)">Puedes terminarla igualmente; quedará anotado que no completaste todos los pasos.</p>`,
    [['Terminarla igualmente', () => setDone(true, true)], ['Seguir con la ficha', null, true]]);
};

/* pasos, botones de la IA y notas */
$('fSteps').addEventListener('change', e => {
  if (!e.target.matches('input[data-step]')) return;
  const arr = [...$('fSteps').querySelectorAll('input[data-step]')].map(b => b.checked);
  steps[`f${current}`] = arr;
  updateDoc(uref, { [`steps.f${current}`]: arr }).then(()=>setSync(true)).catch(()=>setSync(false));
});
async function copy(t){ try { await navigator.clipboard.writeText(t); return true; } catch { return false; } }
$('fSteps').addEventListener('click', async e => {
  const ask = e.target.closest('[data-ask]'), cp = e.target.closest('[data-copy]');
  if (!ask && !cp) return;
  const i = +(ask || cp).dataset[ask ? 'ask' : 'copy'], text = prompts(L(current).steps[i])[0];
  const ok = await copy(text);
  if (cp) return toast(ok ? 'Frase copiada: pégala en tu asistente y cambia lo que va entre corchetes.' : 'No se ha podido copiar.');
  const a = ASSISTANTS[prefs.assistant || 'claude'];
  startRun();
  if (!a.url){ return toast(ok ? 'Frase copiada. Abre tu asistente y pégala. El reloj sigue en marcha.' : 'Copia la frase y pégala en tu asistente.'); }
  const url = a.q ? `${a.url}?${a.q}=${encodeURIComponent(text)}` : a.url;
  window.open(url, '_blank', 'noopener');
  toast(`${a.name} abierto${a.q ? ' con la frase escrita' : ''}. ${ok ? 'También está copiada por si hace falta pegarla.' : ''} El reloj sigue contando.`, 6000);
});
function autosave(el, savedEl, field){
  let t;
  el.addEventListener('input', () => {
    savedEl.textContent = 'Guardando…'; clearTimeout(t);
    const f = current, v = el.value.slice(0, field === 'text' ? 5000 : 10000);
    if (field === 'text') P(f).notes = v; else P(f).ai = v;
    drawReq();
    t = setTimeout(async () => {
      try { await setDoc(doc(uref, 'notes', `f${f}`), { text: P(f).notes || '', aiAnswer: P(f).ai || '', updatedAt: serverTimestamp() }); savedEl.textContent = 'Guardado'; setSync(true); }
      catch(e){ savedEl.textContent = 'No se ha podido guardar: ' + errText(e); setSync(false); }
    }, 900);
  });
}
autosave($('fNotes'), $('fSaved'), 'text');
autosave($('fAiText'), $('fAiSaved'), 'ai');
const toggleRun = () => run && run.ficha === current ? (stopRun(), toast('Reloj en pausa.')) : (startRun(), toast('Reloj en marcha. Sigue contando aunque cambies de pestaña o de app.'));
$('tBtn').onclick = toggleRun; $('mBtn').onclick = toggleRun;
$('tPip').onclick = openPip;
$('fPrev').onclick = () => current>1 && openFicha(current-1);
$('fNext').onclick = () => current<20 && openFicha(current+1);

/* ---------- cuaderno ---------- */
function renderCuaderno(){
  const items = COURSE.lessons.filter(l => { const p = progress[l.n]; return p && (p.notes || p.ai || p.done_at || p.quiz); });
  $('nbList').innerHTML = items.length ? items.map(l => { const p = progress[l.n], w = W(l.w);
    return `<article class="nb-item" style="border-left-color:${w.color}"><div class="eyebrow">Ficha ${l.n} · ${p.done_at ? 'terminada' : 'en curso'} · ${fmtMin(p.seconds||0)}${p.quiz ? ` · comprobación ${p.quiz.score}/2` : ''}</div><h3>${esc(l.title)}</h3>
      ${p.notes ? `<p><b>${esc(l.settle.replace(/«|»/g,''))}</b><br>${esc(p.notes)}</p>` : ''}${p.ai ? `<p><b>Lo que me respondió la IA:</b><br>${esc(p.ai)}</p>` : ''}
      <button class="btn small ghost" type="button" data-open="${l.n}">Abrir la ficha</button></article>`; }).join('')
    : '<p>Todavía no hay nada en tu cuaderno. Las notas y respuestas que escribas en cada ficha aparecerán aquí.</p>';
  history.replaceState(null,'','#cuaderno');
  show('cuaderno');
}

/* ---------- recordatorio en el calendario (.ics) ---------- */
function reminderDialog(){
  dialog('Recordatorio diario', `<p>Descarga un aviso para tu calendario (Google, Outlook o el del móvil). Se repite de lunes a viernes durante 4 semanas.</p>
    <div class="opt"><label for="remT">Hora de la sesión</label><input type="time" id="remT" value="${prefs.reminder || '19:00'}"></div>
    <p style="color:var(--muted);font-size:14px;margin-top:10px">Al abrir el archivo, tu calendario te preguntará si quieres añadir el evento.</p>`,
    [['Ahora no'], ['Descargar el aviso', () => { const t = $('remT').value || '19:00'; downloadIcs(t); savePrefs({ reminder: t }).catch(()=>{}); }, true]]);
}
function downloadIcs(time){
  const [hh, mm] = time.split(':').map(Number), d = new Date(); d.setDate(d.getDate()+1);
  while (d.getDay()===0 || d.getDay()===6) d.setDate(d.getDate()+1);
  const p2 = x => String(x).padStart(2,'0'), ymd = `${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}`;
  const end = new Date(d); end.setHours(hh, mm + 20);
  const url = location.origin + location.pathname;
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//MBAI Native//Curso IA//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT',
    `UID:curso-ia-${user.uid}-${Date.now()}@mbainative.com`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}Z`,
    `DTSTART:${ymd}T${p2(hh)}${p2(mm)}00`, `DTEND:${ymd}T${p2(end.getHours())}${p2(end.getMinutes())}00`,
    'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;COUNT=20', 'SUMMARY:Aprende IA · sesión de 20 minutos',
    `DESCRIPTION:Tu ficha del día te espera en ${url}`, `URL:${url}`,
    'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:Sesión de IA en 5 minutos','TRIGGER:-PT5M','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], {type:'text/calendar'})); a.download = 'recordatorio-curso-ia.ics'; a.click();
  toast('Aviso descargado: ábrelo para añadirlo a tu calendario.');
}

/* ---------- diploma ---------- */
function diploma(){
  const s = stats(); if (s.done < 20) return toast('El diploma se desbloquea al terminar las 20 fichas.');
  const w = window.open('', '_blank'); if (!w) return toast('Permite las ventanas emergentes para ver el diploma.');
  w.document.write(`<!doctype html><html lang="es"><meta charset="utf-8"><title>Diploma · ${esc(user.name)}</title><style>
    @page{size:A4 landscape;margin:0} body{margin:0;font-family:Georgia,serif;color:#1E2430;background:#FBF8F1}
    .d{box-sizing:border-box;width:297mm;height:210mm;padding:22mm;border:10mm solid;border-image:linear-gradient(90deg,#2B59A6,#1D7466,#A84C17,#5A409C) 1;display:flex;flex-direction:column;justify-content:center;text-align:center;gap:8mm}
    h1{font-size:40pt;margin:0} .n{font-size:30pt;font-style:italic} p{font-size:14pt;margin:0}</style>
    <div class="d"><p>MBAI Native certifica que</p><div class="n">${esc(user.name)}</div><p>ha completado el curso</p><h1>Aprende IA en sesiones de 20 minutos</h1>
    <p>20 fichas · ${fmtMin(s.total)} de práctica · ${new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</p></div>
    <script>setTimeout(()=>print(),400)<\/script>`);
  w.document.close();
}

/* ---------- bienvenida (primer uso) ---------- */
function welcome(){
  const opts = Object.entries(ASSISTANTS).map(([k,a]) => `<label><input type="radio" name="wAs" value="${k}" ${k==='claude'?'checked':''}> ${k==='otro'?'Otro':a.name}</label>`).join('');
  dialog(`Bienvenido, ${esc(user.name.split(' ')[0])}`, `<p>Así funciona cada sesión de 20 minutos:</p>
    <ol><li><b>Lee la idea</b> (4 min).</li><li><b>Haz el ejercicio con tu asistente de IA</b> (14 min). Los botones de cada paso lo abren con la frase escrita, y el reloj sigue contando mientras trabajas allí.</li><li><b>Escribe tu nota y responde 2 preguntas</b> (2 min).</li></ol>
    <p><b>¿Qué asistente vas a usar?</b> Sirve la versión gratuita de cualquiera.</p><div class="choices">${opts}</div>
    <p style="color:var(--muted);font-size:14px">Antes de la ficha 1, comprueba que puedes entrar en tu asistente con tu cuenta. Puedes cambiarlo luego en Ajustes.</p>`,
    [['Empezar', async () => { const v = document.querySelector('input[name=wAs]:checked')?.value || 'claude';
      try { await savePrefs({ assistant: v, onboarded: true }); } catch { toast('No se han podido guardar tus preferencias.'); }
      if (view === 'ficha') openFicha(current);
      setTimeout(reminderDialog, 300); }, true]], true);
}

/* ---------- acceso ---------- */
$('lfGoogle').onclick = async () => {
  $('lfErr').textContent = '';
  try { const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt:'select_account' }); await signInWithPopup(auth, p); }
  catch(e){ $('lfErr').textContent = errText(e); }
};
let confirmMode = false;
$('loginForm').addEventListener('submit', async e => {
  e.preventDefault(); $('lfErr').textContent = '';
  const name = $('lfName').value.trim(), email = $('lfEmail').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return $('lfErr').textContent = 'Revisa el email.';
  if ($('loginForm').dataset.mode === 'confirm'){
    try { await signInWithEmailLink(auth, email, location.href); confirmMode = false; localStorage.removeItem(LS.email); history.replaceState(null,'',location.pathname); }
    catch(err){ $('lfErr').textContent = errText(err); }
    return;
  }
  if (name.length < 2) return $('lfErr').textContent = 'Escribe tu nombre.';
  $('lfBtn').disabled = true;
  try {
    await sendSignInLinkToEmail(auth, email, { url: location.origin + location.pathname, handleCodeInApp: true });
    localStorage.setItem(LS.email, email); localStorage.setItem(LS.name, name);
    $('lfErr').innerHTML = `<span class="okmsg">Te hemos enviado un enlace a ${esc(email)}. Ábrelo desde este mismo dispositivo (mira también en spam).</span>`;
  } catch(err){ $('lfErr').textContent = errText(err); }
  $('lfBtn').disabled = false;
});
function logoutLocal(){ if (run) commit(); run = null; stopTick(); if (pip) pip.close(); user=null; uref=null; progress={}; daily={}; steps={}; prefs={};
  if (!confirmMode) history.replaceState(null,'',location.pathname); renderLogin(confirmMode ? 'confirmEmail' : undefined); }

/* ---------- diálogos ---------- */
function dialog(title, html, actions=[['Cerrar',null,true]], modal=false){
  $('dlgT').textContent = title; $('dlgB').innerHTML = html; $('dlgA').innerHTML = '';
  actions.forEach(([t,fn,primary]) => { const b=document.createElement('button'); b.type='button'; b.className='btn'+(primary?'':' ghost'); b.textContent=t;
    b.onclick=async()=>{ if(fn && (await fn())===false) return; $('dlg').close(); }; $('dlgA').appendChild(b); });
  $('dlg').oncancel = modal ? (e => e.preventDefault()) : null;
  $('dlg').showModal();
}
const HELP = {
  como: ['Cómo funciona el curso', `<p>Son <b>20 fichas</b> en <b>4 semanas</b>, una al día de lunes a viernes. Cada sesión dura unos 20 minutos: <b>idea</b> (4 min), <b>ejercicio con la IA</b> (14 min) y <b>nota y comprobación</b> (2 min).</p>
    <p>Pulsa <b>Empezar sesión</b> o cualquier botón «Abrir en…»: el reloj sigue contando aunque cambies de pestaña o de app. Si estás fuera más de 30 minutos, al volver te preguntará cuánto tiempo practicaste.</p>
    <p>En Chrome y Edge de ordenador puedes abrir un <b>reloj flotante</b> que se queda encima de la ventana de la IA.</p>
    <p>Para terminar una ficha necesitas la mitad del tiempo de la sesión, tu nota y las 2 preguntas. Un <b>día activo</b> es un día con 10 minutos de práctica o una ficha terminada.</p>`],
  asistente: ['Qué asistente de IA usar', `<p>Sirve la versión gratuita de <b>Claude</b> (claude.ai), <b>ChatGPT</b> (chatgpt.com) o <b>Gemini</b> (gemini.google.com). Usa siempre el mismo durante el curso; puedes cambiarlo en Ajustes › Preferencias.</p>
    <p>Los botones «Abrir en…» abren tu asistente con la frase del paso ya escrita (Claude y ChatGPT) o copiada para pegarla (Gemini y otros). Cambia lo que va entre corchetes por tus datos.</p>`],
  privacidad: ['Privacidad', `<p>MBAI Native guarda tu nombre, tu email, tu tiempo, tus fichas y tus respuestas para que puedas seguir el curso, en servidores de Google Firebase en la Unión Europea. Tus notas y lo que pegues de la IA solo los ves tú.</p>
    <p>Puedes descargar tu cuaderno o borrar tu cuenta y todos tus datos desde los menús. <a href="privacidad.html" target="_blank" rel="noopener">Información completa de privacidad</a>.</p>`],
  acerca: ['Acerca de', `<p><b>Aprende IA en sesiones de 20 minutos</b><br>Curso práctico y gratuito de MBAI Native.</p><p style="color:var(--muted)">Versión ${VERSION} · <a href="https://mbainative.com" target="_blank" rel="noopener">mbainative.com</a></p>`]
};
const CMDS = {
  panel: () => { if (!user) return; if (run && !pip) stopRun(); renderPanel(); },
  indice: () => { CMDS.panel(); setTimeout(()=>$('pWeeks').scrollIntoView({behavior:'smooth'}),50); },
  cuaderno: () => { if (!user) return; if (run && !pip) stopRun(); renderCuaderno(); },
  recordatorio: () => user && reminderDialog(),
  diploma: () => diploma(),
  imprimir: () => window.print(),
  imprimirCuaderno: () => window.print(),
  exportar: () => {
    let t = `Mi cuaderno · Aprende IA en sesiones de 20 minutos\n${user.name} <${user.email}>\n${new Date().toLocaleDateString('es-ES')}\n\n`;
    COURSE.lessons.forEach(l => { const p=progress[l.n]; if (p && (p.notes || p.ai)) t += `Ficha ${l.n} · ${l.title}\n${p.notes ? `${l.settle}\n${p.notes}\n` : ''}${p.ai ? `Lo que me respondió la IA:\n${p.ai}\n` : ''}\n`; });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t],{type:'text/plain;charset=utf-8'})); a.download = 'mi-cuaderno-curso-ia.txt'; a.click();
  },
  salir: async () => { if (run) commit(); await sendQueue(); await signOut(auth); },
  copiarEjercicio: async () => { const l=L(current); const t=`Ficha ${l.n}: ${l.title}\n\n`+l.steps.map((s,i)=>`${i+1}. ${s}`).join('\n'); toast(await copy(t) ? 'Ejercicio copiado: pégalo en tu asistente de IA' : 'No se ha podido copiar'); },
  borrarNotas: () => dialog('¿Borrar tus notas de esta ficha?', '<p>Se borrará lo que escribiste en «Para asentar» y lo que pegaste de la IA.</p>', [['Cancelar'],['Borrar', async()=>{
    for (const el of [$('fNotes'), $('fAiText')]) { el.value=''; el.dispatchEvent(new Event('input')); } }, true]]),
  ajustes: () => dialog('Preferencias', `
    <div class="opt"><label for="stAs">Mi asistente de IA</label><select id="stAs">${Object.entries(ASSISTANTS).map(([k,a])=>`<option value="${k}" ${ (prefs.assistant||'claude')===k?'selected':''}>${k==='otro'?'Otro':a.name}</option>`).join('')}</select></div>
    <div class="opt"><label for="stDur">Duración de cada sesión</label><select id="stDur">${[15,20,25,30].map(m=>`<option value="${m}" ${duration()===m?'selected':''}>${m} minutos</option>`).join('')}</select></div>
    <div class="opt"><label for="stNm">Mi nombre</label><input id="stNm" maxlength="60" value="${esc(user.name)}" style="height:40px;border-radius:10px;border:1px solid #CFC8BA;padding:0 10px"></div>
    <div class="opt"><label for="stSnd">Sonido al cumplir el tiempo</label><input type="checkbox" id="stSnd" ${settings.sound?'checked':''}></div>`,
    [['Cancelar'],['Guardar', async ()=>{
      const n = $('stNm').value.trim(); if (n.length < 2){ toast('Escribe tu nombre'); return false; }
      settings.sound = $('stSnd').checked; saveSettings();
      try {
        await savePrefs({ assistant: $('stAs').value, duration: +$('stDur').value });
        if (n !== user.name){ await updateDoc(uref, { name: n }); user.name = n; }
      } catch(e){ toast(errText(e)); return false; }
      if (view==='ficha') openFicha(current); else if (view==='panel') renderPanel(); else show(view);
      toast('Preferencias guardadas'); }, true]]),
  borrarCuenta: () => dialog('¿Borrar tu cuenta?', '<p>Se borrarán tu nombre, tu email, tu tiempo, tus fichas, tus notas y tu acceso. No se puede deshacer.</p><p style="color:var(--muted)">Si quieres conservar tus notas, descarga antes tu cuaderno (Archivo › Mi cuaderno).</p>', [['Cancelar'],['Borrar todo', deleteAccount, true]]),
  anterior: () => current>1 && openFicha(current-1),
  siguiente: () => current<20 && openFicha(current+1),
  flotante: () => openPip(),
  letraMas: () => { settings.scale = Math.min(1.4, +(settings.scale+0.1).toFixed(1)); saveSettings(); },
  letraMenos: () => { settings.scale = Math.max(0.8, +(settings.scale-0.1).toFixed(1)); saveSettings(); },
};
['como','asistente','privacidad','acerca'].forEach(k => CMDS[k] = () => dialog(...HELP[k]));

async function deleteAccount(){
  const u = auth.currentUser; if (!u) return;
  const google = u.providerData.some(p => p.providerId === 'google.com');
  const recent = Date.now() - new Date(u.metadata.lastSignInTime).getTime() < 4*60*1000;
  try {
    if (google && !recent) await reauthenticateWithPopup(u, new GoogleAuthProvider());
    else if (!google && !recent){ toast('Por seguridad, cierra sesión, vuelve a entrar con tu enlace y repite el borrado.', 7000); return; }
    run = null; saveRun(); stopTick();
    for (let i = 1; i <= 20; i++) await deleteDoc(doc(uref, 'notes', `f${i}`));
    await deleteDoc(uref);
    await deleteUser(u);
    localStorage.removeItem(LS.pending);
    toast('Tu cuenta y todos tus datos se han borrado.', 6000);
  } catch(e){ toast(errText(e), 6000); return false; }
}

/* ---------- menús (escritorio y móvil) ---------- */
$('mobDrop').innerHTML = [...document.querySelectorAll('#menus .drop')].map(d => d.innerHTML).join('<hr>');
$('mobDrop').setAttribute('role','menu');
const menus = [...document.querySelectorAll('.menu')];
const closeMenus = () => menus.forEach(m => { m.classList.remove('open'); m.firstElementChild.setAttribute('aria-expanded','false'); });
menus.forEach(m => {
  const b = m.firstElementChild;
  b.addEventListener('click', () => { const o = m.classList.contains('open'); closeMenus(); if (!o){ refreshMenus(); m.classList.add('open'); b.setAttribute('aria-expanded','true'); m.querySelector('.drop button:not(:disabled):not(.hidden)')?.focus(); } });
  b.addEventListener('mouseenter', () => { if (menus.some(x=>x.classList.contains('open')) && !m.classList.contains('open')){ closeMenus(); m.classList.add('open'); b.setAttribute('aria-expanded','true'); } });
  m.addEventListener('keydown', e => {
    const items = [...m.querySelectorAll('.drop button:not(:disabled):not(.hidden)')], i = items.indexOf(document.activeElement);
    if (e.key==='ArrowDown'){ e.preventDefault(); items[(i+1)%items.length]?.focus(); }
    if (e.key==='ArrowUp'){ e.preventDefault(); items[(i-1+items.length)%items.length]?.focus(); }
    if (e.key==='Escape'){ closeMenus(); b.focus(); }
  });
});
document.addEventListener('click', e => {
  const c = e.target.closest('[data-cmd]');
  if (c){ e.preventDefault(); if (c.disabled) return; closeMenus(); CMDS[c.dataset.cmd]?.(); return; }
  const o = e.target.closest('[data-open]'); if (o){ closeMenus(); if ($('dlg').open) $('dlg').close(); openFicha(+o.dataset.open); return; }
  if (!e.target.closest('.menu')) closeMenus();
});

/* ---------- arranque ---------- */
renderLogin();
if (isSignInWithEmailLink(auth, location.href)){
  const email = localStorage.getItem(LS.email);
  if (email){
    signInWithEmailLink(auth, email, location.href)
      .then(() => { localStorage.removeItem(LS.email); history.replaceState(null,'',location.pathname); })
      .catch(e => { renderLogin(); $('lfErr').textContent = errText(e); });
  } else { confirmMode = true; renderLogin('confirmEmail'); }
}
onAuthStateChanged(auth, async fbUser => {
  if (!fbUser){ logoutLocal(); return; }
  try { const name = localStorage.getItem(LS.name) || ''; await loadUser(fbUser, name); localStorage.removeItem(LS.name); }
  catch(e){ toast('No se ha podido cargar tu progreso: ' + errText(e), 6000); }
});
