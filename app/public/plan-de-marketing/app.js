const STORAGE_KEY = "planpro_marketing_plans_v1";
const APP_NAME = "PlanPro Marketing";
const APP_VERSION = "v1.0.0";

const sections = [
  { id: "context", title: "Diagnóstico", summary: "Empresa, mercado, competencia, FODA y propuesta de valor." },
  { id: "alignment", title: "Alineación", summary: "Madurez interna de marketing, ventas, atención al cliente y operaciones." },
  { id: "personas", title: "Buyer Personas", summary: "Segmentos, necesidades, objeciones, canales y valor potencial." },
  { id: "data", title: "Datos y CRM", summary: "Fuentes de datos, CRM, calidad de información y personalización." },
  { id: "journey", title: "Journey Omnicanal", summary: "Etapas, puntos de contacto, fricciones y continuidad entre canales." },
  { id: "strategy", title: "Estrategia", summary: "Marketing mix, campañas, acciones y automatizaciones." },
  { id: "flows", title: "Flujos de Venta", summary: "Rutas de conversión, pipeline y experiencia comercial." },
  { id: "objectives", title: "Objetivos y KPI", summary: "Objetivos SMART, indicadores, metas y fuentes de medición." },
  { id: "budget", title: "Presupuesto", summary: "Inversión, recursos, responsables, calendario y retorno esperado." },
  { id: "report", title: "Plan Final", summary: "Documento profesional listo para presentar e imprimir." },
  { id: "simulation", title: "Simulación", summary: "Escenarios comerciales para estimar ventas, margen, ROI y sensibilidad." },
  { id: "settings", title: "Ajustes", summary: "Configuración local de API y preferencias de asistencia." },
  { id: "help", title: "Ayuda", summary: "Guía sencilla para entender cómo usar la app y para qué sirve cada bloque." },
];

const channels = ["Web", "Email", "Redes", "Ads", "Tienda", "Ventas", "Soporte", "WhatsApp/SMS"];
const journeyStages = ["Descubrimiento", "Consideración", "Conversión", "Onboarding", "Fidelización"];

const alignmentQuestions = {
  marketing: [
    "Marketing comparte objetivos, ideas y plan estratégico con ventas.",
    "El equipo entiende claramente la diferenciación frente a la competencia.",
    "Marketing se reúne al menos dos horas por semana con otros departamentos.",
    "Marketing puede explicar cada etapa del pipeline de ventas.",
    "Utiliza información de clientes procedente de ventas y atención al cliente.",
    "Existe un proceso para entregar contenido útil al equipo de ventas.",
    "Marketing conoce cuántos SQL hay en el pipeline.",
    "Puede medir el impacto en cada etapa del embudo.",
    "Crea contenido a partir de problemas reales de clientes.",
    "Accede a datos de ventas y casos de éxito sin depender siempre de analistas.",
  ],
  sales: [
    "Ventas revisa con frecuencia feedback de clientes compartido por atención al cliente.",
    "Los materiales de formación comercial se revisan y optimizan cada año.",
    "Ventas mantiene el mismo mensaje y posicionamiento que marketing.",
    "Ventas conoce los buyer personas prioritarios.",
    "Ventas sigue la cantidad de MQL que llegan al pipeline.",
    "Existe un espacio claro para materiales de capacitación de ventas.",
    "El equipo conoce sus objetivos y avance.",
    "Puede acceder de inmediato a los datos necesarios.",
    "El equipo puede trabajar correctamente desde cualquier ubicación.",
    "Ventas coordina campañas y promociones con marketing antes de ejecutarlas.",
  ],
  service: [
    "Atención al cliente se reúne con otros departamentos al menos dos horas por semana.",
    "Asiste a reuniones sobre nuevos productos o cambios relevantes.",
    "Existe un proceso para proporcionar casos prácticos a ventas y marketing.",
    "Brinda asistencia en canales de marketing, como redes sociales.",
    "Envía ideas de contenido al departamento de marketing.",
    "Se reúne con ventas para revisar pipelines de alta prioridad.",
    "Recoge y comparte feedback de clientes de forma sistemática.",
    "Comparte información sobre buyer personas con marketing.",
    "Usa al menos una herramienta compartida con otros departamentos.",
    "Tiene objetivos alineados con los objetivos trimestrales o anuales de la empresa.",
  ],
  operations: [
    "Operaciones dedica más del 50% de su tiempo a proyectos estratégicos.",
    "Usa herramientas que conectan datos de clientes con marketing, ventas y servicio.",
    "Avisa a otros departamentos cuando audita datos.",
    "Hace seguimiento de carencias de procesos en toda la empresa.",
    "Busca formas constantes de mejorar operaciones comerciales.",
    "Genera informes útiles para marketing, ventas y atención al cliente.",
    "Los procesos y tecnología están diseñados para ofrecer buen servicio.",
    "Gestiona una fuente única de información de clientes.",
    "Informa sobre todas las fuentes de generación de ingresos.",
    "Puede conectar aplicaciones centrales sin importaciones manuales.",
  ],
};

const app = document.getElementById("app");
let state = {
  plans: [],
  activePlanId: null,
  activeSection: "context",
  activeAlignmentDept: "marketing",
  aiStatus: "",
  finalDocStatus: "",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultPlan() {
  const id = uid();
  return {
    id,
    name: "Plan de marketing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    context: {
      company: "",
      sector: "",
      period: "",
      market: "",
      competitors: "",
      strengths: "",
      weaknesses: "",
      opportunities: "",
      threats: "",
      valueProposition: "",
      positioning: "",
    },
    alignment: Object.fromEntries(Object.keys(alignmentQuestions).map((dept) => [dept, Array(10).fill(3)])),
    personas: [blankPersona()],
    data: {
      crm: "",
      anonymousData: "",
      personalData: "",
      sources: "",
      quality: "Media",
      integrations: "",
      privacy: "",
      personalization: "",
    },
    journey: Object.fromEntries(journeyStages.map((stage) => [stage, Object.fromEntries(channels.map((channel) => [channel, ""]))])),
    strategy: [blankAction()],
    flows: [blankFlow()],
    objectives: [blankObjective()],
    budget: [blankBudget()],
    simulation: {
      notes: "",
      aiBrief: {
        company: "",
        sector: "",
        offer: "",
        geography: "",
        audience: "",
        goals: "",
        budget: "",
        channels: "",
        constraints: "",
        tone: "",
      },
      scenarios: [blankScenario("Conservador"), blankScenario("Base"), blankScenario("Optimista")],
    },
    settings: {
      apiProvider: "OpenRouter",
      apiModel: "google/gemini-3.1-flash-lite",
      apiKey: "",
      apiNotes: "",
    },
    finalDocument: "",
    conclusions: "",
  };
}

function blankPersona() {
  return {
    id: uid(),
    name: "",
    segment: "",
    goals: "",
    pains: "",
    objections: "",
    channels: "",
    value: "",
    content: "",
  };
}

function blankAction() {
  return {
    id: uid(),
    name: "",
    persona: "",
    stage: "Descubrimiento",
    channel: "Web",
    description: "",
    offer: "",
    automation: "",
    owner: "",
  };
}

function blankFlow() {
  return {
    id: uid(),
    name: "",
    trigger: "",
    steps: "",
    handoff: "",
    friction: "",
    improvement: "",
  };
}

function blankObjective() {
  return {
    id: uid(),
    objective: "",
    specific: "",
    metric: "",
    baseline: "",
    target: "",
    deadline: "",
    source: "",
  };
}

function blankBudget() {
  return {
    id: uid(),
    item: "",
    channel: "",
    amount: "",
    owner: "",
    start: "",
    end: "",
    expectedReturn: "",
  };
}

function blankScenario(name = "") {
  return {
    id: uid(),
    name,
    visitors: "",
    conversionRate: "",
    averageOrder: "",
    marginRate: "",
    investment: "",
    repeatRate: "",
  };
}

function normalizePlan(plan) {
  if (!plan.simulation) {
    plan.simulation = {
      notes: "",
      scenarios: [blankScenario("Conservador"), blankScenario("Base"), blankScenario("Optimista")],
    };
  }
  if (!Array.isArray(plan.simulation.scenarios) || !plan.simulation.scenarios.length) {
    plan.simulation.scenarios = [blankScenario("Base")];
  }
  if (!plan.simulation.aiBrief) {
    plan.simulation.aiBrief = { company: "", sector: "", offer: "", geography: "", audience: "", goals: "", budget: "", channels: "", constraints: "", tone: "" };
  }
  if (!plan.settings) {
    plan.settings = { apiProvider: "OpenRouter", apiModel: "google/gemini-3.1-flash-lite", apiKey: "", apiNotes: "" };
  }
  if (!("apiProvider" in plan.settings)) plan.settings.apiProvider = "OpenRouter";
  if (!("apiModel" in plan.settings) || !plan.settings.apiModel) plan.settings.apiModel = "google/gemini-3.1-flash-lite";
  if (!("apiKey" in plan.settings)) plan.settings.apiKey = "";
  if (!("apiNotes" in plan.settings)) plan.settings.apiNotes = "";
  if (!("finalDocument" in plan)) plan.finalDocument = "";
  return plan;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...state, ...JSON.parse(raw) };
  } catch {
    state.plans = [];
  }
  if (!state.plans.length) {
    const plan = defaultPlan();
    state.plans = [plan];
    state.activePlanId = plan.id;
    save();
  }
  if (!state.activePlanId || !state.plans.some((plan) => plan.id === state.activePlanId)) {
    state.activePlanId = state.plans[0].id;
  }
  state.plans = state.plans.map(normalizePlan);
  save();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activePlan() {
  return state.plans.find((plan) => plan.id === state.activePlanId);
}

function updatePlan(mutator) {
  const plan = activePlan();
  mutator(plan);
  plan.updatedAt = new Date().toISOString();
  save();
  render();
}

function patchPlan(mutator) {
  const plan = activePlan();
  mutator(plan);
  plan.updatedAt = new Date().toISOString();
  save();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function completion(plan) {
  const checks = [
    plan.context.company,
    plan.context.market,
    plan.context.competitors,
    plan.context.valueProposition,
    plan.personas.some((p) => p.name && p.pains),
    plan.data.crm || plan.data.sources,
    Object.values(plan.journey).some((row) => Object.values(row).some(Boolean)),
    plan.strategy.some((a) => a.name && a.description),
    plan.flows.some((f) => f.name && f.steps),
    plan.objectives.some((o) => o.objective && o.metric && o.target),
    plan.budget.some((b) => b.item && b.amount),
    plan.simulation?.scenarios?.some((scenario) => scenario.name && scenario.visitors && scenario.conversionRate),
    plan.conclusions,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function alignmentScore(plan, dept) {
  const values = plan.alignment[dept] || [];
  return Math.round((values.reduce((sum, value) => sum + Number(value || 0), 0) / 50) * 100);
}

function totalAlignmentScore(plan) {
  const scores = Object.keys(alignmentQuestions).map((dept) => alignmentScore(plan, dept));
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function scoreLabel(score) {
  if (score <= 40) return { text: "Sin alineación", className: "low" };
  if (score < 80) return { text: "Cierta alineación", className: "mid" };
  return { text: "Alineación total", className: "high" };
}

function budgetTotal(plan) {
  return plan.budget.reduce((sum, item) => sum + (Number(String(item.amount).replace(",", ".")) || 0), 0);
}

function input(path, label, options = {}) {
  const plan = activePlan();
  const value = getPath(plan, path);
  const id = path.replaceAll(".", "-");
  const type = options.type || "text";
  const field = type === "textarea"
    ? `<textarea id="${id}" data-path="${path}" placeholder="${escapeHtml(options.placeholder || "")}">${escapeHtml(value)}</textarea>`
    : `<input id="${id}" data-path="${path}" type="${type}" value="${escapeHtml(value)}" placeholder="${escapeHtml(options.placeholder || "")}" />`;
  return `<div class="field ${options.full ? "full" : ""}">
    <label for="${id}">${label}</label>
    ${field}
    ${options.hint ? `<span class="hint">${options.hint}</span>` : ""}
  </div>`;
}

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj) ?? "";
}

function setPath(obj, path, value) {
  const keys = path.split(".");
  let cursor = obj;
  keys.slice(0, -1).forEach((key) => {
    cursor = cursor[key];
  });
  cursor[keys.at(-1)] = value;
}

function render() {
  const plan = activePlan();
  const current = sections.find((section) => section.id === state.activeSection);
  const done = completion(plan);
  const alignment = totalAlignmentScore(plan);
  const label = scoreLabel(alignment);

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <h1>${APP_NAME}</h1>
          <span>Método profesional omnicanal · ${APP_VERSION}</span>
        </div>
        <div class="plan-actions">
          <select class="plan-select" id="plan-select" aria-label="Plan activo">
            ${state.plans.map((item) => `<option value="${item.id}" ${item.id === plan.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
          </select>
          <button class="primary" id="new-plan">+ Nuevo plan</button>
          <button class="ghost" id="duplicate-plan">Duplicar</button>
        </div>
        <nav class="nav-list">
          ${sections.map((section, index) => `
            <button class="nav-item ${section.id === state.activeSection ? "active" : ""}" data-section="${section.id}">
              <span class="nav-index">${index + 1}</span>
              <span>${section.title}</span>
            </button>
          `).join("")}
        </nav>
        <div class="progress-box">
          <strong>${done}% completado</strong>
          <div class="progress-line"><div class="progress-fill" style="width:${done}%"></div></div>
        </div>
        <div class="sidebar-credit">By Luis Benedicto Tuzón with GPT 5.5. medium</div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div>
            <h2>${current.title}</h2>
            <p>${current.summary}</p>
          </div>
          <div class="top-actions">
            <button class="secondary" id="save-json">Exportar JSON</button>
            <button class="secondary" id="print-plan">Imprimir/PDF</button>
            <button class="danger" id="delete-plan">Eliminar</button>
          </div>
        </div>
        <div class="summary-band">
          <div class="summary-card"><strong>${done}%</strong><span>Completitud</span></div>
          <div class="summary-card"><strong>${alignment}%</strong><span>${label.text}</span></div>
          <div class="summary-card"><strong>${plan.personas.length}</strong><span>Buyer personas</span></div>
          <div class="summary-card"><strong>${formatMoney(budgetTotal(plan))}</strong><span>Presupuesto</span></div>
        </div>
        <div class="method-strip">${renderInsights(plan)}</div>
        <div class="workspace">
          <section class="section">
            ${renderSection(plan)}
            ${renderStepControls()}
          </section>
        </div>
      </main>
    </div>
  `;
  bindEvents();
}

function renderSection(plan) {
  switch (state.activeSection) {
    case "context": return renderContext();
    case "alignment": return renderAlignment(plan);
    case "personas": return renderPersonas(plan);
    case "data": return renderData();
    case "journey": return renderJourney(plan);
    case "strategy": return renderStrategy(plan);
    case "flows": return renderFlows(plan);
    case "objectives": return renderObjectives(plan);
    case "budget": return renderBudget(plan);
    case "report": return renderReport(plan);
    case "simulation": return renderSimulation(plan);
    case "settings": return renderSettings(plan);
    case "help": return renderHelp();
    default: return "";
  }
}

function renderStepControls() {
  const index = sections.findIndex((section) => section.id === state.activeSection);
  const previous = sections[index - 1];
  const next = sections[index + 1];
  return `
    <div class="step-controls no-print">
      <button class="ghost" data-step-target="${previous?.id || ""}" ${previous ? "" : "disabled"}>Anterior</button>
      <span>${index + 1} de ${sections.length}</span>
      <button class="primary" data-step-target="${next?.id || ""}" ${next ? "" : "disabled"}>Siguiente</button>
    </div>
  `;
}

function renderContext() {
  return `
    <h3>Diagnóstico de negocio y mercado</h3>
    <p class="section-note">Esta fase traduce la situación competitiva en decisiones estratégicas. Combina análisis sectorial, FODA y posicionamiento.</p>
    <div class="form-grid">
      ${input("name", "Nombre del plan")}
      ${input("context.company", "Empresa o unidad de negocio")}
      ${input("context.sector", "Sector")}
      ${input("context.period", "Periodo del plan")}
      ${input("context.market", "Tendencias y situación del mercado", { type: "textarea", full: true })}
      ${input("context.competitors", "Competencia y alternativas del cliente", { type: "textarea", full: true })}
      ${input("context.strengths", "Fortalezas", { type: "textarea" })}
      ${input("context.weaknesses", "Debilidades", { type: "textarea" })}
      ${input("context.opportunities", "Oportunidades", { type: "textarea" })}
      ${input("context.threats", "Amenazas", { type: "textarea" })}
      ${input("context.valueProposition", "Propuesta de valor", { type: "textarea", full: true })}
      ${input("context.positioning", "Posicionamiento deseado", { type: "textarea", full: true })}
    </div>
  `;
}

function renderAlignment(plan) {
  const dept = state.activeAlignmentDept;
  const names = { marketing: "Marketing", sales: "Ventas", service: "Atención al cliente", operations: "Operaciones" };
  const score = alignmentScore(plan, dept);
  const label = scoreLabel(score);
  return `
    <h3>Diagnóstico de alineación transversal</h3>
    <p class="section-note">Puntúa de 1 a 5. La app calcula el nivel de preparación para ejecutar un plan omnicanal sin silos.</p>
    <div class="tabs">
      ${Object.keys(alignmentQuestions).map((key) => `<button class="tab ${key === dept ? "active" : ""}" data-dept="${key}">${names[key]}</button>`).join("")}
    </div>
    <p><span class="status ${label.className}">${names[dept]}: ${score}% · ${label.text}</span></p>
    <div class="score-grid">
      ${alignmentQuestions[dept].map((question, index) => `
        <div class="score-row">
          <div>${question}</div>
          <div class="scale">
            ${[1, 2, 3, 4, 5].map((value) => `<button class="${plan.alignment[dept][index] === value ? "active" : ""}" data-score="${value}" data-question="${index}" title="${value}">${value}</button>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderPersonas(plan) {
  return `
    <h3>Buyer personas prioritarios</h3>
    <p class="section-note">Define a quién sirve el plan, qué necesita, qué le frena y qué canales usa.</p>
    <button class="primary no-print" data-add="persona">+ Añadir buyer persona</button>
    <div class="repeat-list">
      ${plan.personas.map((persona, index) => `
        <div class="item-card">
          <div class="item-head">
            <span class="item-title">Buyer persona ${index + 1}</span>
            <button class="mini-btn" data-remove="persona" data-id="${persona.id}">Eliminar</button>
          </div>
          <div class="form-grid">
            ${itemInput("personas", persona.id, "name", "Nombre")}
            ${itemInput("personas", persona.id, "segment", "Segmento")}
            ${itemInput("personas", persona.id, "goals", "Objetivos", "textarea")}
            ${itemInput("personas", persona.id, "pains", "Retos y problemas", "textarea")}
            ${itemInput("personas", persona.id, "objections", "Objeciones", "textarea")}
            ${itemInput("personas", persona.id, "channels", "Canales y hábitos", "textarea")}
            ${itemInput("personas", persona.id, "value", "Valor potencial y rentabilidad", "textarea")}
            ${itemInput("personas", persona.id, "content", "Contenido útil para atraerlo", "textarea")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function itemInput(collection, id, key, label, type = "text") {
  const plan = activePlan();
  const item = plan[collection].find((entry) => entry.id === id);
  const value = item?.[key] ?? "";
  const inputHtml = type === "textarea"
    ? `<textarea data-collection="${collection}" data-id="${id}" data-key="${key}">${escapeHtml(value)}</textarea>`
    : `<input data-collection="${collection}" data-id="${id}" data-key="${key}" value="${escapeHtml(value)}" />`;
  return `<div class="field"><label>${label}</label>${inputHtml}</div>`;
}

function renderData() {
  return `
    <h3>Arquitectura de datos y personalización</h3>
    <p class="section-note">El método exige una fuente clara de información para segmentar, personalizar y medir.</p>
    <div class="form-grid">
      ${input("data.crm", "CRM o fuente única de información")}
      <div class="field"><label>Calidad de datos</label><select data-path="data.quality">
        ${["Baja", "Media", "Alta"].map((value) => `<option ${activePlan().data.quality === value ? "selected" : ""}>${value}</option>`).join("")}
      </select></div>
      ${input("data.anonymousData", "Datos anónimos disponibles", { type: "textarea", hint: "Canal, dispositivo, páginas visitadas, clics, ubicación aproximada." })}
      ${input("data.personalData", "Datos personales disponibles", { type: "textarea", hint: "Contacto, compras previas, LTV, satisfacción, fecha de compra." })}
      ${input("data.sources", "Fuentes de datos", { type: "textarea" })}
      ${input("data.integrations", "Integraciones y herramientas", { type: "textarea" })}
      ${input("data.privacy", "Consentimiento, privacidad y gobierno del dato", { type: "textarea" })}
      ${input("data.personalization", "Reglas de segmentación y personalización", { type: "textarea" })}
    </div>
  `;
}

function renderJourney(plan) {
  return `
    <h3>Mapa omnicanal del recorrido del comprador</h3>
    <p class="section-note">Completa los puntos de contacto por etapa y canal. Busca continuidad: el cliente no debería reiniciar su proceso al cambiar de canal.</p>
    <table class="matrix">
      <thead>
        <tr>
          <th>Canal / etapa</th>
          ${journeyStages.map((stage) => `<th>${stage}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${channels.map((channel) => `
          <tr>
            <th>${channel}</th>
            ${journeyStages.map((stage) => `<td><textarea data-journey-stage="${stage}" data-journey-channel="${channel}">${escapeHtml(plan.journey[stage][channel])}</textarea></td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderStrategy(plan) {
  return `
    <h3>Estrategia, marketing mix y acciones</h3>
    <p class="section-note">Cada acción debe conectar buyer persona, etapa, canal, oferta, automatización y responsable.</p>
    <button class="primary no-print" data-add="strategy">+ Añadir acción</button>
    <div class="repeat-list">
      ${plan.strategy.map((item, index) => `
        <div class="item-card">
          <div class="item-head">
            <span class="item-title">Acción ${index + 1}</span>
            <button class="mini-btn" data-remove="strategy" data-id="${item.id}">Eliminar</button>
          </div>
          <div class="form-grid">
            ${itemInput("strategy", item.id, "name", "Nombre de la acción")}
            ${itemInput("strategy", item.id, "persona", "Buyer persona")}
            ${selectItem("strategy", item.id, "stage", "Etapa", journeyStages)}
            ${selectItem("strategy", item.id, "channel", "Canal", channels)}
            ${itemInput("strategy", item.id, "description", "Descripción", "textarea")}
            ${itemInput("strategy", item.id, "offer", "Oferta, contenido o 4P implicada", "textarea")}
            ${itemInput("strategy", item.id, "automation", "Automatización o regla de personalización", "textarea")}
            ${itemInput("strategy", item.id, "owner", "Responsable")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function selectItem(collection, id, key, label, options) {
  const plan = activePlan();
  const item = plan[collection].find((entry) => entry.id === id);
  return `<div class="field"><label>${label}</label><select data-collection="${collection}" data-id="${id}" data-key="${key}">
    ${options.map((option) => `<option ${item?.[key] === option ? "selected" : ""}>${option}</option>`).join("")}
  </select></div>`;
}

function renderFlows(plan) {
  return `
    <h3>Flujos de venta y conversión</h3>
    <p class="section-note">Describe cómo compra el cliente, dónde se califica el lead y qué traspasos existen entre equipos.</p>
    <button class="primary no-print" data-add="flows">+ Añadir flujo</button>
    <div class="repeat-list">
      ${plan.flows.map((flow, index) => `
        <div class="item-card">
          <div class="item-head">
            <span class="item-title">Flujo ${index + 1}</span>
            <button class="mini-btn" data-remove="flows" data-id="${flow.id}">Eliminar</button>
          </div>
          <div class="form-grid">
            ${itemInput("flows", flow.id, "name", "Nombre del flujo")}
            ${itemInput("flows", flow.id, "trigger", "Disparador")}
            ${itemInput("flows", flow.id, "steps", "Pasos del cliente", "textarea")}
            ${itemInput("flows", flow.id, "handoff", "Traspasos entre marketing, ventas y servicio", "textarea")}
            ${itemInput("flows", flow.id, "friction", "Fricciones actuales", "textarea")}
            ${itemInput("flows", flow.id, "improvement", "Mejoras propuestas", "textarea")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderObjectives(plan) {
  return `
    <h3>Objetivos SMART e indicadores KPI</h3>
    <p class="section-note">Cada objetivo debe poder medirse con una fuente definida, una meta y una fecha.</p>
    <button class="primary no-print" data-add="objectives">+ Añadir objetivo</button>
    <div class="repeat-list">
      ${plan.objectives.map((objective, index) => `
        <div class="item-card">
          <div class="item-head">
            <span class="item-title">Objetivo ${index + 1}</span>
            <button class="mini-btn" data-remove="objectives" data-id="${objective.id}">Eliminar</button>
          </div>
          <div class="form-grid">
            ${itemInput("objectives", objective.id, "objective", "Objetivo")}
            ${itemInput("objectives", objective.id, "metric", "KPI principal")}
            ${itemInput("objectives", objective.id, "specific", "Definición SMART", "textarea")}
            ${itemInput("objectives", objective.id, "baseline", "Situación actual")}
            ${itemInput("objectives", objective.id, "target", "Meta")}
            ${itemInput("objectives", objective.id, "deadline", "Fecha límite")}
            ${itemInput("objectives", objective.id, "source", "Fuente de medición")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderBudget(plan) {
  return `
    <h3>Presupuesto, calendario y recursos</h3>
    <p class="section-note">Registra recursos económicos, propietarios, ventanas de ejecución y retorno esperado.</p>
    <button class="primary no-print" data-add="budget">+ Añadir partida</button>
    <div class="repeat-list">
      ${plan.budget.map((item, index) => `
        <div class="item-card">
          <div class="item-head">
            <span class="item-title">Partida ${index + 1}</span>
            <button class="mini-btn" data-remove="budget" data-id="${item.id}">Eliminar</button>
          </div>
          <div class="form-grid">
            ${itemInput("budget", item.id, "item", "Partida")}
            ${itemInput("budget", item.id, "channel", "Canal o acción")}
            ${itemInput("budget", item.id, "amount", "Importe")}
            ${itemInput("budget", item.id, "owner", "Responsable")}
            ${itemInput("budget", item.id, "start", "Inicio")}
            ${itemInput("budget", item.id, "end", "Fin")}
            ${itemInput("budget", item.id, "expectedReturn", "Retorno esperado", "textarea")}
          </div>
        </div>
      `).join("")}
    </div>
    <div class="field full" style="margin-top:14px">
      <label>Conclusiones, criterios de revisión y próximos pasos</label>
      <textarea data-path="conclusions">${escapeHtml(plan.conclusions)}</textarea>
    </div>
  `;
}

function renderSimulation(plan) {
  return `
    <h3>Simulación IA del plan</h3>
    <p class="section-note">Introduce los datos clave de la empresa. La IA usará esta información para rellenar, en modo borrador, los 10 apartados anteriores del plan.</p>
    <div class="item-card ai-panel">
      <div class="item-head">
        <span class="item-title">Borrador IA del plan</span>
        <button class="primary" id="ai-generate-plan">Generar borrador IA</button>
      </div>
      <div class="form-grid">
        ${aiBriefInput("company", "Empresa")}
        ${aiBriefInput("sector", "Sector")}
        ${aiBriefInput("offer", "Productos o servicios", "textarea")}
        ${aiBriefInput("geography", "Mercado geográfico")}
        ${aiBriefInput("audience", "Clientes actuales o público objetivo", "textarea")}
        ${aiBriefInput("goals", "Objetivos de negocio", "textarea")}
        ${aiBriefInput("budget", "Presupuesto aproximado")}
        ${aiBriefInput("channels", "Canales actuales o deseados")}
        ${aiBriefInput("constraints", "Restricciones, riesgos o recursos disponibles", "textarea")}
        ${aiBriefInput("tone", "Tono de marca o estilo comercial")}
      </div>
      <p class="hint">La generación usa la API key y el modelo configurados en Ajustes. El resultado sobrescribe los apartados 1-10 del plan activo como borrador editable.</p>
      ${state.aiStatus ? `<p><span class="status mid">${escapeHtml(state.aiStatus)}</span></p>` : ""}
    </div>
    <details class="scenario-details">
      <summary>Simular escenarios económicos opcionales</summary>
      <p class="hint">Los escenarios sirven para contrastar supuestos de tráfico/contactos, conversión, ticket, margen e inversión. No son obligatorios para generar el borrador IA.</p>
      <button class="secondary no-print" data-add="simulation">+ Añadir escenario económico</button>
    <div class="repeat-list">
      ${plan.simulation.scenarios.map((scenario, index) => {
        const result = scenarioResult(scenario);
        return `
          <div class="item-card">
            <div class="item-head">
              <span class="item-title">Escenario ${index + 1}</span>
              <button class="mini-btn" data-remove="simulation" data-id="${scenario.id}">Eliminar</button>
            </div>
            <div class="form-grid">
              ${scenarioInput(scenario.id, "name", "Nombre")}
              ${scenarioInput(scenario.id, "visitors", "Visitas o contactos estimados", "number")}
              ${scenarioInput(scenario.id, "conversionRate", "Tasa de conversión (%)", "number")}
              ${scenarioInput(scenario.id, "averageOrder", "Ticket medio / ingreso por venta", "number")}
              ${scenarioInput(scenario.id, "marginRate", "Margen bruto (%)", "number")}
              ${scenarioInput(scenario.id, "investment", "Inversión del escenario", "number")}
              ${scenarioInput(scenario.id, "repeatRate", "Recompra o expansión (%)", "number")}
            </div>
            <div class="simulation-result" data-scenario-result="${scenario.id}">
              <div><strong data-result-key="sales">${formatNumber(result.sales)}</strong><span>Ventas estimadas</span></div>
              <div><strong data-result-key="revenue">${formatMoney(result.revenue)}</strong><span>Ingresos</span></div>
              <div><strong data-result-key="grossProfit">${formatMoney(result.grossProfit)}</strong><span>Margen bruto</span></div>
              <div><strong data-result-key="roi">${formatPercent(result.roi)}</strong><span>ROI estimado</span></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
    </details>
    <div class="field full" style="margin-top:14px">
      <label>Supuestos, riesgos y lectura de la simulación</label>
      <textarea data-path="simulation.notes">${escapeHtml(plan.simulation.notes)}</textarea>
    </div>
    <div class="bottom-ai-action no-print">
      <button class="primary ai-generate-plan">Generar borrador IA</button>
    </div>
  `;
}

function aiBriefInput(key, label, type = "text") {
  const plan = activePlan();
  const value = plan.simulation.aiBrief[key] ?? "";
  const field = type === "textarea"
    ? `<textarea data-ai-brief="${key}">${escapeHtml(value)}</textarea>`
    : `<input data-ai-brief="${key}" value="${escapeHtml(value)}" />`;
  return `<div class="field ${type === "textarea" ? "full" : ""}"><label>${label}</label>${field}</div>`;
}

function renderSettings(plan) {
  const hasKey = Boolean(plan.settings.apiKey);
  const models = [
    ["google/gemini-3.1-flash-lite", "Gemini 3.1 Flash Lite"],
    ["google/gemini-2.5-flash-lite", "Gemini 2.5 Flash Lite"],
    ["google/gemini-2.5-flash", "Gemini 2.5 Flash"],
    ["openai/gpt-4.1-mini", "GPT-4.1 mini"],
    ["anthropic/claude-3.5-sonnet", "Claude 3.5 Sonnet"],
  ];
  return `
    <h3>Ajustes</h3>
    <p class="section-note">Configura OpenRouter para que el apartado Simulación pueda generar un borrador completo del plan. La clave se guarda solo en este navegador mediante localStorage.</p>
    <div class="form-grid">
      <div class="field">
        <label>Proveedor de API</label>
        <select data-path="settings.apiProvider">
          ${["OpenRouter"].map((value) => `<option ${plan.settings.apiProvider === value ? "selected" : ""}>${value}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>Modelo</label>
        <select data-path="settings.apiModel">
          ${models.map(([value, label]) => `<option value="${value}" ${plan.settings.apiModel === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
        <span class="hint">Modelo por defecto: Gemini 3.1 Flash Lite.</span>
      </div>
      ${input("settings.apiKey", "OpenRouter API key", { type: "password", full: true, placeholder: "Pega aquí tu clave de OpenRouter" })}
      ${input("settings.apiNotes", "Notas de uso de la API", { type: "textarea", full: true, placeholder: "Restricciones, organización, proyecto o recordatorios internos." })}
    </div>
    <p style="margin-top:16px"><span class="status ${hasKey ? "high" : "mid"}">${hasKey ? "API configurada localmente" : "API pendiente"}</span></p>
    <div class="danger-zone">
      <h4>Reiniciar aplicación</h4>
      <p>Esto borra todos los planes, simulaciones, documentos generados y ajustes guardados en este navegador.</p>
      <button class="danger" id="reset-app">Reiniciar y borrar todo</button>
    </div>
  `;
}

function renderHelp() {
  return `
    <h3>Ayuda</h3>
    <p class="section-note">Esta app te ayuda a crear un plan de marketing profesional paso a paso. No necesitas saber programar ni conocer términos complicados.</p>

    <div class="help-block">
      <h4>¿Qué hace la app?</h4>
      <p>La app organiza la información que necesita un responsable de marketing para decidir qué hacer, para quién hacerlo, en qué canales, con qué presupuesto y cómo medir si funciona.</p>
      <p>Primero puedes escribir tú la información. También puedes ir a <strong>Simulación</strong>, escribir unos datos básicos de la empresa y pedir a la IA que rellene un primer borrador de los 10 apartados principales.</p>
    </div>

    <div class="help-block">
      <h4>¿Qué pasa cuando genero un borrador IA?</h4>
      <p>La IA no crea un plan definitivo. Crea una primera versión para ahorrar tiempo. Después debes revisar cada punto con los botones <strong>Anterior</strong> y <strong>Siguiente</strong>.</p>
      <p>Piensa en la IA como un ayudante que propone ideas. La decisión final sigue siendo tuya.</p>
    </div>

    <div class="help-block">
      <h4>¿Qué es la simulación de escenarios?</h4>
      <p>Un escenario es una hipótesis. Es decir, una forma de preguntarse: “¿qué podría pasar si invertimos cierta cantidad y conseguimos ciertos resultados?”.</p>
      <p>Por ejemplo, imagina que haces una campaña y crees que llegarán 10.000 personas a la web. Si el 2% compra, serían unas 200 ventas. Si cada venta deja 50 euros de ingreso, puedes estimar cuánto dinero generaría la campaña.</p>
      <p>La simulación de escenarios sirve para comparar posibilidades antes de gastar dinero real.</p>
    </div>

    <div class="help-block">
      <h4>¿Por qué hay varios escenarios?</h4>
      <p>Porque casi nunca sabemos con seguridad qué va a pasar. Por eso se suelen comparar tres casos:</p>
      <ul>
        <li><strong>Conservador:</strong> lo que pasaría si la campaña funciona peor de lo esperado.</li>
        <li><strong>Base:</strong> lo que creemos que pasará de forma razonable.</li>
        <li><strong>Optimista:</strong> lo que pasaría si la campaña funciona mejor de lo esperado.</li>
      </ul>
      <p>Así puedes ver si una idea sigue siendo interesante incluso cuando los resultados no son perfectos.</p>
    </div>

    <div class="help-block">
      <h4>Campos de un escenario</h4>
      <ul>
        <li><strong>Visitas o contactos estimados:</strong> cuántas personas podrían ver la campaña, visitar la web o entrar en contacto con la empresa.</li>
        <li><strong>Tasa de conversión:</strong> qué porcentaje de esas personas acabaría comprando o haciendo la acción deseada.</li>
        <li><strong>Ticket medio:</strong> cuánto dinero deja de media cada venta.</li>
        <li><strong>Margen bruto:</strong> qué parte de los ingresos queda después de costes directos.</li>
        <li><strong>Inversión:</strong> cuánto dinero se gastará en esa campaña o acción.</li>
        <li><strong>Recompra o expansión:</strong> ventas adicionales que podrían llegar después de la primera compra.</li>
      </ul>
    </div>

    <div class="help-block">
      <h4>¿Qué significan los resultados?</h4>
      <ul>
        <li><strong>Ventas estimadas:</strong> número aproximado de ventas o conversiones.</li>
        <li><strong>Ingresos:</strong> dinero que podría entrar por esas ventas.</li>
        <li><strong>Margen bruto:</strong> dinero aproximado que queda antes de otros gastos generales.</li>
        <li><strong>ROI estimado:</strong> compara lo que ganas con lo que inviertes. Si el ROI es positivo, el escenario podría ser rentable. Si es negativo, conviene revisar la campaña.</li>
      </ul>
    </div>

    <div class="help-block">
      <h4>Cómo usarlo sin complicarte</h4>
      <p>Si no entiendes todavía los escenarios, puedes ignorarlos al principio. Para generar el plan con IA solo necesitas rellenar los datos clave de empresa en Simulación y pulsar <strong>Generar borrador IA</strong>.</p>
      <p>Más adelante, cuando tengas una campaña concreta, puedes volver a los escenarios para comprobar si el presupuesto tiene sentido.</p>
    </div>
  `;
}

function scenarioInput(id, key, label, type = "text") {
  const plan = activePlan();
  const scenario = plan.simulation.scenarios.find((entry) => entry.id === id);
  return `<div class="field">
    <label>${label}</label>
    <input data-scenario-id="${id}" data-scenario-key="${key}" type="${type}" step="any" value="${escapeHtml(scenario?.[key] ?? "")}" />
  </div>`;
}

function scenarioResult(scenario) {
  const visitors = toNumber(scenario.visitors);
  const conversionRate = toNumber(scenario.conversionRate) / 100;
  const averageOrder = toNumber(scenario.averageOrder);
  const marginRate = toNumber(scenario.marginRate || 100) / 100;
  const investment = toNumber(scenario.investment);
  const repeatRate = toNumber(scenario.repeatRate) / 100;
  const sales = visitors * conversionRate;
  const revenue = sales * averageOrder * (1 + repeatRate);
  const grossProfit = revenue * marginRate;
  const roi = investment > 0 ? ((grossProfit - investment) / investment) * 100 : 0;
  return { sales, revenue, grossProfit, roi };
}

function updateScenarioResult(id) {
  const plan = activePlan();
  const scenario = plan.simulation.scenarios.find((entry) => entry.id === id);
  const container = document.querySelector(`[data-scenario-result="${id}"]`);
  if (!scenario || !container) return;
  const result = scenarioResult(scenario);
  const sales = container.querySelector('[data-result-key="sales"]');
  const revenue = container.querySelector('[data-result-key="revenue"]');
  const grossProfit = container.querySelector('[data-result-key="grossProfit"]');
  const roi = container.querySelector('[data-result-key="roi"]');
  if (sales) sales.textContent = formatNumber(result.sales);
  if (revenue) revenue.textContent = formatMoney(result.revenue);
  if (grossProfit) grossProfit.textContent = formatMoney(result.grossProfit);
  if (roi) roi.textContent = formatPercent(result.roi);
}

function toNumber(value) {
  return Number(String(value || "").replace(",", ".")) || 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value || 0);
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(value || 0)}%`;
}

function renderReport(plan) {
  return `
    <div class="report">
      <div class="report-actions no-print">
        <div>
          <h3>Documento final redactado por IA</h3>
          <p class="section-note">Genera un documento ejecutivo, escrito como si lo redactara un responsable de marketing, a partir del plan ya rellenado.</p>
        </div>
        <div class="report-buttons">
          <button class="primary" id="generate-final-doc">Redactar documento IA</button>
          <button class="secondary" id="download-docx" ${plan.finalDocument ? "" : "disabled"}>Descargar DOCX</button>
          <button class="secondary" id="print-final-doc" ${plan.finalDocument ? "" : "disabled"}>Generar PDF</button>
        </div>
        ${state.finalDocStatus ? `<p><span class="status mid">${escapeHtml(state.finalDocStatus)}</span></p>` : ""}
      </div>
      ${plan.finalDocument ? `<div class="report-block final-document"><h3>Plan de Marketing redactado</h3>${renderFinalDocument(plan.finalDocument)}</div>` : ""}
      <div class="report-block">
        <h3>${escapeHtml(plan.name)}</h3>
        <p><strong>Empresa:</strong> ${show(plan.context.company)} · <strong>Periodo:</strong> ${show(plan.context.period)}</p>
        <p><strong>Sector:</strong> ${show(plan.context.sector)}</p>
      </div>
      ${reportBlock("1. Análisis de situación y competencia", [
        ["Mercado", plan.context.market],
        ["Competencia", plan.context.competitors],
        ["Fortalezas", plan.context.strengths],
        ["Debilidades", plan.context.weaknesses],
        ["Oportunidades", plan.context.opportunities],
        ["Amenazas", plan.context.threats],
        ["Propuesta de valor", plan.context.valueProposition],
        ["Posicionamiento", plan.context.positioning],
      ])}
      ${reportList("2. Buyer personas", plan.personas, (p) => `${p.name || "Sin nombre"}\nSegmento: ${p.segment}\nObjetivos: ${p.goals}\nRetos: ${p.pains}\nCanales: ${p.channels}\nContenido: ${p.content}`)}
      ${reportBlock("3. Datos, CRM y personalización", [
        ["CRM", plan.data.crm],
        ["Calidad", plan.data.quality],
        ["Datos anónimos", plan.data.anonymousData],
        ["Datos personales", plan.data.personalData],
        ["Fuentes", plan.data.sources],
        ["Personalización", plan.data.personalization],
      ])}
      ${reportList("4. Estrategia y acciones", plan.strategy, (a) => `${a.name || "Sin nombre"}\nPersona: ${a.persona}\nEtapa: ${a.stage}\nCanal: ${a.channel}\nDescripción: ${a.description}\nOferta: ${a.offer}\nAutomatización: ${a.automation}\nResponsable: ${a.owner}`)}
      ${reportList("5. Flujos de venta", plan.flows, (f) => `${f.name || "Sin nombre"}\nDisparador: ${f.trigger}\nPasos: ${f.steps}\nTraspasos: ${f.handoff}\nFricciones: ${f.friction}\nMejoras: ${f.improvement}`)}
      ${reportList("6. Objetivos SMART y KPI", plan.objectives, (o) => `${o.objective || "Sin objetivo"}\nKPI: ${o.metric}\nActual: ${o.baseline}\nMeta: ${o.target}\nFecha: ${o.deadline}\nFuente: ${o.source}\nSMART: ${o.specific}`)}
      ${reportList("7. Presupuesto", plan.budget, (b) => `${b.item || "Sin partida"}\nCanal: ${b.channel}\nImporte: ${b.amount}\nResponsable: ${b.owner}\nPeriodo: ${b.start} - ${b.end}\nRetorno esperado: ${b.expectedReturn}`)}
      ${reportBlock("8. Evaluación y conclusiones", [
        ["Alineación transversal", `${totalAlignmentScore(plan)}% · ${scoreLabel(totalAlignmentScore(plan)).text}`],
        ["Conclusiones", plan.conclusions],
      ])}
    </div>
  `;
}

function reportBlock(title, values) {
  return `<div class="report-block"><h3>${title}</h3><div class="report-grid">
    ${values.map(([label, value]) => `<div><strong>${label}</strong><div class="report-value">${show(value)}</div></div>`).join("")}
  </div></div>`;
}

function reportList(title, items, mapper) {
  return `<div class="report-block"><h3>${title}</h3><div class="report-grid">
    ${items.map((item) => `<div class="report-value">${show(mapper(item))}</div>`).join("") || `<p class="empty">Sin elementos.</p>`}
  </div></div>`;
}

function renderFinalDocument(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const clean = block.trim();
      if (!clean) return "";
      if (/^#{1,3}\s/.test(clean)) return `<h4>${escapeHtml(clean.replace(/^#{1,3}\s/, ""))}</h4>`;
      if (/^[-*]\s/m.test(clean)) {
        const items = clean.split(/\n/).map((line) => line.replace(/^[-*]\s/, "").trim()).filter(Boolean);
        return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
      }
      return `<p>${escapeHtml(clean)}</p>`;
    })
    .join("");
}

function show(value) {
  return value ? escapeHtml(value) : `<span class="empty">Pendiente</span>`;
}

function renderInsights(plan) {
  const alignment = totalAlignmentScore(plan);
  const missing = [];
  if (!plan.context.valueProposition) missing.push("Define la propuesta de valor antes de cerrar estrategia y mensajes.");
  if (!plan.personas.some((p) => p.name && p.pains)) missing.push("Completa al menos un buyer persona con retos y canales.");
  if (!plan.data.crm && !plan.data.sources) missing.push("Aclara la fuente única de datos para personalizar y medir.");
  if (!plan.objectives.some((o) => o.metric && o.target)) missing.push("Añade KPI con meta para evitar objetivos no medibles.");
  if (alignment < 80) missing.push("La alineación interna requiere acciones antes de desplegar un plan omnicanal complejo.");
  if (!missing.length) missing.push("El plan tiene una base completa. Revisa coherencia entre presupuesto, KPI y responsables.");
  const label = scoreLabel(alignment);
  return `
    <h3>Estado del plan</h3>
    <div class="metric">
      <div class="metric-row"><strong>Completitud</strong><span>${completion(plan)}%</span></div>
      <div class="meter"><span style="width:${completion(plan)}%"></span></div>
    </div>
    <div class="metric">
      <div class="metric-row"><strong>Alineación</strong><span>${alignment}%</span></div>
      <div class="meter"><span style="width:${alignment}%"></span></div>
      <span class="status ${label.className}">${label.text}</span>
    </div>
    <ul class="insights">${missing.slice(0, 2).map((item) => `<li>${item}</li>`).join("")}</ul>
  `;
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
}

function bindEvents() {
  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeSection = button.dataset.section;
      save();
      render();
    });
  });
  document.querySelectorAll("[data-step-target]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!button.dataset.stepTarget) return;
      state.activeSection = button.dataset.stepTarget;
      save();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll("[data-path]").forEach((field) => {
    field.addEventListener("input", () => patchPlan((plan) => setPath(plan, field.dataset.path, field.value)));
    field.addEventListener("change", () => {
      patchPlan((plan) => setPath(plan, field.dataset.path, field.value));
      if (field.tagName === "SELECT") render();
    });
  });
  document.querySelectorAll("[data-collection]").forEach((field) => {
    field.addEventListener("input", () => patchPlan((plan) => {
      const item = plan[field.dataset.collection].find((entry) => entry.id === field.dataset.id);
      item[field.dataset.key] = field.value;
    }));
    field.addEventListener("change", () => {
      patchPlan((plan) => {
        const item = plan[field.dataset.collection].find((entry) => entry.id === field.dataset.id);
        item[field.dataset.key] = field.value;
      });
      if (field.tagName === "SELECT") render();
    });
  });
  document.querySelectorAll("[data-journey-stage]").forEach((field) => {
    field.addEventListener("input", () => patchPlan((plan) => {
      plan.journey[field.dataset.journeyStage][field.dataset.journeyChannel] = field.value;
    }));
    field.addEventListener("change", () => {
      patchPlan((plan) => {
        plan.journey[field.dataset.journeyStage][field.dataset.journeyChannel] = field.value;
      });
    });
  });
  document.querySelectorAll("[data-ai-brief]").forEach((field) => {
    field.addEventListener("input", () => patchPlan((plan) => {
      plan.simulation.aiBrief[field.dataset.aiBrief] = field.value;
    }));
    field.addEventListener("change", () => {
      patchPlan((plan) => {
        plan.simulation.aiBrief[field.dataset.aiBrief] = field.value;
      });
    });
  });
  document.querySelectorAll("[data-scenario-id]").forEach((field) => {
    field.addEventListener("input", () => patchPlan((plan) => {
      const scenario = plan.simulation.scenarios.find((entry) => entry.id === field.dataset.scenarioId);
      scenario[field.dataset.scenarioKey] = field.value;
      updateScenarioResult(field.dataset.scenarioId);
    }));
    field.addEventListener("change", () => {
      patchPlan((plan) => {
        const scenario = plan.simulation.scenarios.find((entry) => entry.id === field.dataset.scenarioId);
        scenario[field.dataset.scenarioKey] = field.value;
      });
      updateScenarioResult(field.dataset.scenarioId);
    });
  });
  document.querySelectorAll("[data-dept]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeAlignmentDept = button.dataset.dept;
      save();
      render();
    });
  });
  document.querySelectorAll("[data-score]").forEach((button) => {
    button.addEventListener("click", () => updatePlan((plan) => {
      plan.alignment[state.activeAlignmentDept][Number(button.dataset.question)] = Number(button.dataset.score);
    }));
  });
  document.querySelectorAll("[data-add]").forEach((button) => {
    button.addEventListener("click", () => updatePlan((plan) => {
      const type = button.dataset.add;
      if (type === "persona") plan.personas.push(blankPersona());
      if (type === "strategy") plan.strategy.push(blankAction());
      if (type === "flows") plan.flows.push(blankFlow());
      if (type === "objectives") plan.objectives.push(blankObjective());
      if (type === "budget") plan.budget.push(blankBudget());
      if (type === "simulation") plan.simulation.scenarios.push(blankScenario(`Escenario ${plan.simulation.scenarios.length + 1}`));
    }));
  });
  document.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => updatePlan((plan) => {
      const type = button.dataset.remove;
      if (type === "simulation") {
        if (plan.simulation.scenarios.length > 1) plan.simulation.scenarios = plan.simulation.scenarios.filter((item) => item.id !== button.dataset.id);
        return;
      }
      if (plan[type].length > 1) plan[type] = plan[type].filter((item) => item.id !== button.dataset.id);
    }));
  });
  document.querySelectorAll("#ai-generate-plan, .ai-generate-plan").forEach((button) => {
    button.addEventListener("click", generatePlanWithAi);
  });
  const finalDocButton = document.getElementById("generate-final-doc");
  if (finalDocButton) finalDocButton.addEventListener("click", generateFinalDocumentWithAi);
  const docxButton = document.getElementById("download-docx");
  if (docxButton) docxButton.addEventListener("click", downloadFinalDocx);
  const printDocButton = document.getElementById("print-final-doc");
  if (printDocButton) printDocButton.addEventListener("click", printFinalDocument);
  const resetButton = document.getElementById("reset-app");
  if (resetButton) resetButton.addEventListener("click", resetApplication);
  document.getElementById("plan-select").addEventListener("change", (event) => {
    state.activePlanId = event.target.value;
    save();
    render();
  });
  document.getElementById("new-plan").addEventListener("click", () => {
    const plan = defaultPlan();
    plan.name = `Plan de marketing ${state.plans.length + 1}`;
    state.plans.push(plan);
    state.activePlanId = plan.id;
    state.activeSection = "context";
    save();
    render();
  });
  document.getElementById("duplicate-plan").addEventListener("click", () => {
    const copy = JSON.parse(JSON.stringify(activePlan()));
    copy.id = uid();
    copy.name = `${copy.name} copia`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;
    state.plans.push(copy);
    state.activePlanId = copy.id;
    save();
    render();
  });
  document.getElementById("delete-plan").addEventListener("click", () => {
    if (state.plans.length === 1) return;
    if (!window.confirm("¿Eliminar este plan?")) return;
    state.plans = state.plans.filter((plan) => plan.id !== state.activePlanId);
    state.activePlanId = state.plans[0].id;
    save();
    render();
  });
  document.getElementById("print-plan").addEventListener("click", () => {
    state.activeSection = "report";
    save();
    render();
    setTimeout(() => window.print(), 0);
  });
  document.getElementById("save-json").addEventListener("click", exportJson);
}

async function generatePlanWithAi() {
  const plan = activePlan();
  if (!plan.settings.apiKey) {
    state.aiStatus = "Configura primero tu OpenRouter API key en Ajustes.";
    save();
    render();
    return;
  }
  state.aiStatus = "Generando borrador con IA...";
  save();
  render();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${plan.settings.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
        "X-Title": "PlanPro Marketing",
      },
      body: JSON.stringify({
        model: plan.settings.apiModel || "google/gemini-3.1-flash-lite",
        messages: [
          {
            role: "system",
            content: "Eres un director de marketing senior. Devuelve solo JSON valido, sin markdown, sin comentarios y sin texto fuera del objeto JSON.",
          },
          {
            role: "user",
            content: buildAiPrompt(plan),
          },
        ],
        temperature: 0.4,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message || `OpenRouter respondió con estado ${response.status}`);
    }
    const content = payload?.choices?.[0]?.message?.content;
    if (!content) throw new Error("La respuesta de IA no contiene contenido utilizable.");
    const generated = parseJsonFromModel(content);
    patchPlan((current) => mergeGeneratedPlan(current, generated));
    state.activeSection = "context";
    state.aiStatus = "Borrador IA aplicado. Revisa y ajusta cada apartado antes de aprobar el plan.";
    save();
    render();
  } catch (error) {
    state.aiStatus = `No se pudo generar el borrador: ${error.message}`;
    save();
    render();
  }
}

async function generateFinalDocumentWithAi() {
  const plan = activePlan();
  if (!plan.settings.apiKey) {
    state.finalDocStatus = "Configura primero tu OpenRouter API key en Ajustes.";
    save();
    render();
    return;
  }
  state.finalDocStatus = "Redactando documento final con IA...";
  save();
  render();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${plan.settings.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
        "X-Title": "PlanPro Marketing",
      },
      body: JSON.stringify({
        model: plan.settings.apiModel || "google/gemini-3.1-flash-lite",
        messages: [
          {
            role: "system",
            content: "Eres un responsable de marketing senior. Redacta documentos profesionales en español claro. No devuelvas JSON.",
          },
          {
            role: "user",
            content: buildFinalDocumentPrompt(plan),
          },
        ],
        temperature: 0.45,
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || `OpenRouter respondió con estado ${response.status}`);
    const content = payload?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("La IA no devolvió un documento utilizable.");
    patchPlan((current) => {
      current.finalDocument = content;
    });
    state.finalDocStatus = "Documento final redactado. Ya puedes descargar DOCX o generar PDF.";
    save();
    render();
  } catch (error) {
    state.finalDocStatus = `No se pudo redactar el documento: ${error.message}`;
    save();
    render();
  }
}

function buildFinalDocumentPrompt(plan) {
  return `
Redacta un documento final titulado "Plan de Marketing" como si lo escribiera el responsable de marketing de la empresa.

Debe sonar profesional, claro y ejecutivo. No lo escribas como plantilla ni como lista de campos. Redáctalo como documento final para dirección.

Estructura recomendada:
1. Resumen ejecutivo
2. Contexto de negocio y situación competitiva
3. Público objetivo y buyer personas
4. Enfoque de datos, CRM y personalización
5. Recorrido omnicanal del comprador
6. Estrategia de marketing
7. Flujos de venta y coordinación con ventas/servicio
8. Objetivos SMART y KPI
9. Presupuesto y recursos
10. Riesgos, supuestos y próximos pasos
11. Conclusión

Datos del plan:
${JSON.stringify({
    nombre: plan.name,
    contexto: plan.context,
    alineacion: plan.alignment,
    personas: plan.personas,
    datos: plan.data,
    journey: plan.journey,
    estrategia: plan.strategy,
    flujos: plan.flows,
    objetivos: plan.objectives,
    presupuesto: plan.budget,
    simulacion: plan.simulation,
    conclusiones: plan.conclusions,
  }, null, 2)}

No inventes resultados reales. Si usas cifras, trátalas como estimaciones o supuestos. Escribe en primera persona plural cuando proceda: "planteamos", "proponemos", "mediremos".
`.trim();
}

function resetApplication() {
  if (!window.confirm("¿Seguro que quieres borrar todo el contenido de la app en este navegador?")) return;
  localStorage.removeItem(STORAGE_KEY);
  const plan = defaultPlan();
  state = {
    plans: [plan],
    activePlanId: plan.id,
    activeSection: "context",
    activeAlignmentDept: "marketing",
    aiStatus: "",
    finalDocStatus: "",
  };
  save();
  render();
}

function buildAiPrompt(plan) {
  const brief = plan.simulation.aiBrief;
  return `
Genera un borrador profesional de plan de marketing omnicanal para esta empresa.

Datos clave:
- Empresa: ${brief.company}
- Sector: ${brief.sector}
- Productos o servicios: ${brief.offer}
- Mercado geografico: ${brief.geography}
- Publico objetivo o clientes actuales: ${brief.audience}
- Objetivos de negocio: ${brief.goals}
- Presupuesto aproximado: ${brief.budget}
- Canales actuales o deseados: ${brief.channels}
- Restricciones, riesgos o recursos: ${brief.constraints}
- Tono de marca: ${brief.tone}

Rellena los apartados del metodo de la app:
1 diagnostico, 2 alineacion, 3 buyer personas, 4 datos/CRM, 5 journey omnicanal, 6 estrategia, 7 flujos de venta, 8 objetivos/KPI, 9 presupuesto, 10 conclusiones.

Devuelve exactamente este JSON:
{
  "context": {
    "company": "", "sector": "", "period": "", "market": "", "competitors": "",
    "strengths": "", "weaknesses": "", "opportunities": "", "threats": "",
    "valueProposition": "", "positioning": ""
  },
  "alignment": {
    "marketing": [3,3,3,3,3,3,3,3,3,3],
    "sales": [3,3,3,3,3,3,3,3,3,3],
    "service": [3,3,3,3,3,3,3,3,3,3],
    "operations": [3,3,3,3,3,3,3,3,3,3]
  },
  "personas": [
    {"name":"","segment":"","goals":"","pains":"","objections":"","channels":"","value":"","content":""}
  ],
  "data": {
    "crm":"", "anonymousData":"", "personalData":"", "sources":"", "quality":"Media",
    "integrations":"", "privacy":"", "personalization":""
  },
  "journey": {
    "Descubrimiento": {"Web":"","Email":"","Redes":"","Ads":"","Tienda":"","Ventas":"","Soporte":"","WhatsApp/SMS":""},
    "Consideracion": {"Web":"","Email":"","Redes":"","Ads":"","Tienda":"","Ventas":"","Soporte":"","WhatsApp/SMS":""},
    "Conversion": {"Web":"","Email":"","Redes":"","Ads":"","Tienda":"","Ventas":"","Soporte":"","WhatsApp/SMS":""},
    "Onboarding": {"Web":"","Email":"","Redes":"","Ads":"","Tienda":"","Ventas":"","Soporte":"","WhatsApp/SMS":""},
    "Fidelizacion": {"Web":"","Email":"","Redes":"","Ads":"","Tienda":"","Ventas":"","Soporte":"","WhatsApp/SMS":""}
  },
  "strategy": [
    {"name":"","persona":"","stage":"Descubrimiento","channel":"Web","description":"","offer":"","automation":"","owner":""}
  ],
  "flows": [
    {"name":"","trigger":"","steps":"","handoff":"","friction":"","improvement":""}
  ],
  "objectives": [
    {"objective":"","specific":"","metric":"","baseline":"","target":"","deadline":"","source":""}
  ],
  "budget": [
    {"item":"","channel":"","amount":"","owner":"","start":"","end":"","expectedReturn":""}
  ],
  "conclusions": ""
}

Usa texto en espanol profesional. No inventes cifras exactas como si fueran datos reales: marca supuestos donde corresponda.
`.trim();
}

function parseJsonFromModel(content) {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw new Error("La IA no devolvió JSON válido.");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function mergeGeneratedPlan(plan, generated) {
  if (generated.context) plan.context = { ...plan.context, ...generated.context };
  if (generated.alignment) {
    Object.keys(alignmentQuestions).forEach((dept) => {
      if (Array.isArray(generated.alignment[dept])) {
        plan.alignment[dept] = generated.alignment[dept].slice(0, 10).map((value) => Math.min(5, Math.max(1, Number(value) || 3)));
        while (plan.alignment[dept].length < 10) plan.alignment[dept].push(3);
      }
    });
  }
  if (Array.isArray(generated.personas)) plan.personas = generated.personas.map((item) => ({ ...blankPersona(), ...item, id: uid() }));
  if (generated.data) plan.data = { ...plan.data, ...generated.data };
  if (generated.journey) {
    journeyStages.forEach((stage) => {
      const source = generated.journey[stage] || generated.journey[removeAccents(stage)] || {};
      channels.forEach((channel) => {
        plan.journey[stage][channel] = source[channel] || "";
      });
    });
  }
  if (Array.isArray(generated.strategy)) plan.strategy = generated.strategy.map((item) => ({ ...blankAction(), ...item, id: uid() }));
  if (Array.isArray(generated.flows)) plan.flows = generated.flows.map((item) => ({ ...blankFlow(), ...item, id: uid() }));
  if (Array.isArray(generated.objectives)) plan.objectives = generated.objectives.map((item) => ({ ...blankObjective(), ...item, id: uid() }));
  if (Array.isArray(generated.budget)) plan.budget = generated.budget.map((item) => ({ ...blankBudget(), ...item, id: uid() }));
  if (typeof generated.conclusions === "string") plan.conclusions = generated.conclusions;
}

function removeAccents(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function exportJson() {
  const plan = activePlan();
  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${plan.name.replace(/[^\w-]+/g, "_")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadFinalDocx() {
  const plan = activePlan();
  if (!plan.finalDocument) return;
  const files = createDocxFiles(plan);
  const blob = new Blob([createZip(files)], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  downloadBlob(blob, `${safeFileName(plan.name)}_plan_marketing.docx`);
}

function printFinalDocument() {
  const plan = activePlan();
  if (!plan.finalDocument) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(plan.name)} - Plan de Marketing</title>
        <style>
          body { font-family: Arial, sans-serif; color: #172026; margin: 40px; line-height: 1.5; }
          h1 { font-size: 26px; margin-bottom: 8px; }
          h2, h3, h4 { margin-top: 24px; }
          p { margin: 10px 0; }
          li { margin: 6px 0; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(plan.name)}</h1>
        ${renderFinalDocument(plan.finalDocument)}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}

function createDocxFiles(plan) {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${docxParagraph(plan.name, "title")}
    ${textToDocxParagraphs(plan.finalDocument)}
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;
  return {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    "word/document.xml": documentXml,
  };
}

function textToDocxParagraphs(text) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (/^#{1,3}\s/.test(line)) return docxParagraph(line.replace(/^#{1,3}\s/, ""), "heading");
      if (/^[-*]\s/.test(line)) return docxParagraph(`• ${line.replace(/^[-*]\s/, "")}`);
      return docxParagraph(line);
    })
    .join("");
}

function docxParagraph(text, style = "normal") {
  const size = style === "title" ? "32" : style === "heading" ? "26" : "22";
  const bold = style === "normal" ? "" : "<w:b/>";
  return `<w:p><w:r><w:rPr>${bold}<w:sz w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function createZip(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), nameBytes, data,
    ]);
    localParts.push(local);
    const central = concatBytes([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]);
    centralParts.push(central);
    offset += local.length;
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = concatBytes([u32(0x06054b50), u16(0), u16(0), u16(centralParts.length), u16(centralParts.length), u32(centralSize), u32(offset), u16(0)]);
  return concatBytes([...localParts, ...centralParts, end]);
}

function crc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i += 1) {
    crc ^= data[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function u16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function u32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}

function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  parts.forEach((part) => {
    out.set(part, cursor);
    cursor += part.length;
  });
  return out;
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function safeFileName(value) {
  return String(value || "plan_marketing").replace(/[^\w-]+/g, "_");
}

load();
render();
