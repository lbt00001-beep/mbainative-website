export const journey = [
  { href: '/empresa-nativa-ia', label: 'Entender el cambio', short: 'Entender' },
  { href: '/empresa-nativa-ia/procesos', label: 'Ver un proceso', short: 'Procesos' },
  { href: '/arquitectura-solucion', label: 'Explorar la arquitectura', short: 'Arquitectura' },
  { href: '/empresa-nativa-ia/empezar', label: 'Diseñar tu primer piloto', short: 'Empezar' },
];

export const references = {
  agents: { title: 'Anthropic · Building effective agents', url: 'https://www.anthropic.com/engineering/building-effective-agents' },
  work: { title: 'Microsoft · Work Trend Index 2025', url: 'https://www.microsoft.com/en-us/worklab/work-trend-index/2025-the-year-the-frontier-firm-is-born' },
  pair: { title: 'NVIDIA · Personal AI Router (PAIR)', url: 'https://build.nvidia.com/spark/pair' },
  spark: { title: 'NVIDIA · DGX Spark', url: 'https://www.nvidia.com/en-us/products/workstations/dgx-spark/' },
  cluster: { title: 'NVIDIA · Conectar dos DGX Spark', url: 'https://build.nvidia.com/spark/connect-two-sparks' },
  mcp: { title: 'MCP · Arquitectura del protocolo', url: 'https://modelcontextprotocol.io/docs/learn/architecture' },
  orchestration: { title: 'LangGraph · Ejecución y supervisión', url: 'https://docs.langchain.com/oss/python/langgraph/overview' },
};

export type ProcessExample = {
  id: string; department: string; title: string; trigger: string; owner: string; supervisor: string;
  inputs: string; agents: string[]; tools: string; output: string; exception: string;
  approval: string; metric: string; baseline: string; steps: [string, string][];
};
export const processes: ProcessExample[] = [
  {
    id: 'compras', department: 'Compras', title: 'De una necesidad a una propuesta de compra',
    trigger: 'Un equipo registra una necesidad de material.', owner: 'Responsable de Compras', supervisor: 'Técnico de compras asignado al expediente',
    inputs: 'Solicitud, catálogo aprobado, existencias y condiciones de proveedores.',
    agents: ['Preparador del expediente', 'Comparador de ofertas'], tools: 'Lectura del ERP y catálogo; creación de un borrador de solicitud.',
    output: 'Comparativa con fuentes, incidencias y propuesta de pedido.',
    exception: 'Proveedor nuevo, discrepancia de precios o documentación incompleta: detener y escalar.',
    approval: 'La persona autorizada revisa la selección y aprueba el pedido antes de enviarlo.',
    metric: 'Tiempo por expediente aceptado, comparativas corregidas y pedidos duplicados.',
    baseline: 'Cronometrar expedientes actuales y registrar sus correcciones antes del piloto.',
    steps: [['Entrada', 'El agente identifica material, cantidad y fecha. Si falta un dato, solicita aclaración.'], ['Contexto', 'Consulta las existencias y las condiciones vigentes con permisos de lectura. Conserva las referencias.'], ['Propuesta', 'Compara opciones con reglas de compra y prepara un borrador. No inventa ofertas ausentes.'], ['Revisión humana', 'El supervisor contrasta las fuentes y devuelve, corrige o eleva la propuesta para aprobación.'], ['Registro', 'Tras la aprobación, una integración registra el pedido una sola vez y guarda la evidencia.']],
  },
  {
    id: 'ventas', department: 'Ventas', title: 'De una consulta a un borrador de oferta',
    trigger: 'Llega una petición comercial registrada en el CRM.', owner: 'Dirección Comercial', supervisor: 'Responsable de la cuenta',
    inputs: 'Petición, ficha del cliente, catálogo, tarifas y reglas de descuento vigentes.',
    agents: ['Preparador de oferta'], tools: 'CRM y catálogo en lectura; editor de borradores.',
    output: 'Oferta preliminar con requisitos, precio trazable y cuestiones pendientes.',
    exception: 'Descuento fuera de política, requisito no cubierto o compromiso contractual: revisión especializada.',
    approval: 'El responsable de la cuenta valida condiciones y envío al cliente.',
    metric: 'Tiempo hasta oferta revisada, errores de precio y proporción de borradores utilizables.',
    baseline: 'Medir ofertas comparables y anotar cuánto tiempo exige su revisión.',
    steps: [['Entrada', 'Separa requisitos expresos de supuestos y detecta datos que faltan.'], ['Contexto', 'Recupera productos y tarifas autorizadas para esa cuenta.'], ['Propuesta', 'Redacta una oferta y señala las condiciones aún no confirmadas.'], ['Revisión humana', 'La persona responsable valida precio, alcance y compromisos.'], ['Registro', 'El envío autorizado queda asociado a su versión y a la oportunidad comercial.']],
  },
  {
    id: 'finanzas', department: 'Finanzas', title: 'De una factura a un expediente conciliado',
    trigger: 'Se recibe una factura en el canal autorizado.', owner: 'Responsable Financiero', supervisor: 'Persona asignada a cuentas por pagar',
    inputs: 'Factura, pedido, recepción del material y datos maestros autorizados.',
    agents: ['Extractor de datos', 'Asistente de conciliación'], tools: 'Repositorio documental y ERP en lectura; bandeja de incidencias.',
    output: 'Expediente con coincidencias, diferencias y propuesta de contabilización.',
    exception: 'Cambio de cuenta bancaria, posible duplicado o importe discordante: bloquear y verificar por otro canal.',
    approval: 'Contabilización y pago siguen su circuito de autorización y separación de funciones.',
    metric: 'Expedientes correctos, discrepancias detectadas y tiempo de revisión; pagos duplicados como condición de parada.',
    baseline: 'Revisar una muestra histórica y etiquetar manualmente las discrepancias conocidas.',
    steps: [['Entrada', 'Extrae los campos y marca lo ilegible sin completar cifras por intuición.'], ['Contexto', 'Vincula factura, pedido y recepción usando identificadores verificados.'], ['Propuesta', 'Aplica reglas de conciliación y explica las diferencias.'], ['Revisión humana', 'El supervisor comprueba incidencias; el aprobador del pago conserva su función.'], ['Registro', 'La integración guarda el expediente aprobado; un reintento no debe duplicar el asiento.']],
  },
  {
    id: 'operaciones', department: 'Operaciones', title: 'De una incidencia a una intervención preparada',
    trigger: 'Se registra una incidencia en el sistema de mantenimiento.', owner: 'Responsable de Operaciones', supervisor: 'Coordinador de mantenimiento',
    inputs: 'Parte, historial del equipo y procedimientos técnicos aprobados.',
    agents: ['Asistente de preparación técnica'], tools: 'Sistema de mantenimiento y manuales en lectura; borrador de orden.',
    output: 'Resumen de antecedentes, referencias del manual y propuesta de intervención.',
    exception: 'Riesgo para personas, procedimiento contradictorio o equipo no identificado: detener y escalar.',
    approval: 'Personal cualificado valida la intervención; el agente no controla maquinaria.',
    metric: 'Preparaciones aceptadas, omisiones relevantes y tiempo hasta asignación.',
    baseline: 'Comparar partes de dificultad similar y registrar revisiones y omisiones.',
    steps: [['Entrada', 'Identifica el equipo y la incidencia; solicita los datos imprescindibles.'], ['Contexto', 'Busca historial y documentación aplicable a la versión exacta del equipo.'], ['Propuesta', 'Prepara un expediente con referencias y dudas abiertas.'], ['Revisión humana', 'El coordinador valida el procedimiento y asigna personal cualificado.'], ['Registro', 'La orden aprobada se registra y el resultado real se incorpora al historial.']],
  },
];

export const autonomy = [
  { title: 'Asiste', description: 'Prepara información y borradores. La persona decide y ejecuta cada acción externa.', execution: 'Borrador → persona → ejecución manual' },
  { title: 'Ejecuta tras aprobación', description: 'La persona aprueba una acción concreta. La integración comprueba permisos y ejecuta solo esa versión.', execution: 'Borrador → aprobación → integración autorizada' },
  { title: 'Opera con límites', description: 'Solo los casos probados y autorizados pueden ejecutarse sin revisión previa. Las excepciones vuelven a una persona.', execution: 'Caso elegible → política y límites → ejecución; excepción → persona' },
];

export type Topology = 'central' | 'distributed' | 'hybrid';
export const topologies: Record<Topology, { label: string; title: string; text: string; fit: string; tradeoff: string }> = {
  central: { label: 'IA centralizada', title: 'Un servicio compartido para los departamentos.', text: 'La red de la sede conecta los puestos con un servicio de agentes y un servidor de inferencia local. Las sucursales acceden mediante una conexión privada controlada.', fit: 'Cuando importa concentrar mantenimiento, capacidad y control de acceso.', tradeoff: 'Hay que dimensionar la concurrencia y el servicio de respaldo: una avería central puede afectar a varios procesos.' },
  distributed: { label: 'IA distribuida', title: 'Capacidad cercana al trabajo, con reglas comunes.', text: 'Los equipos compatibles de una LAN pueden atender peticiones independientes mediante PAIR instalado en el equipo de la aplicación. Otras sedes mantienen su propia LAN y su servicio local.', fit: 'Cuando hay cargas locales, equipos aprovechables o necesidades de continuidad por sede.', tradeoff: 'Aumenta el trabajo de mantener modelos, parches y disponibilidad. Entre sedes se usan servicios autenticados; no se presupone un único clúster PAIR sobre la WAN.' },
  hybrid: { label: 'IA híbrida', title: 'Datos locales y modelos externos cuando procede.', text: 'Una pasarela decide qué solicitudes pueden salir hacia un proveedor. Los procesos que requieren permanencia local siguen usando inferencia interna.', fit: 'Cuando conviene combinar control local con capacidades externas y capacidad variable.', tradeoff: 'Definir qué datos salen, a qué proveedor y con qué condiciones. Si falla la nube, el proceso debe degradarse o pasar a revisión humana.' },
};

export type Pilot = { department: string; process: string; owner: string; supervisor: string; trigger: string; inputs: string; agents: string; tools: string; approval: string; metric: string; stop: string };
export function initialPilot(example: ProcessExample): Pilot {
  return { department: example.department, process: example.title, owner: '', supervisor: '', trigger: example.trigger, inputs: example.inputs, agents: example.agents.join('; '), tools: example.tools, approval: example.approval, metric: example.metric, stop: example.exception };
}
export function pilotMarkdown(p: Pilot) {
  const fields: [string, string][] = [['Departamento',p.department],['Proceso',p.process],['Responsable del proceso',p.owner],['Supervisor de los expedientes',p.supervisor],['Disparador',p.trigger],['Datos y fuentes autorizadas',p.inputs],['Agentes propuestos',p.agents],['Herramientas y permisos',p.tools],['Aprobación y autonomía inicial',p.approval],['Medición y comparación',p.metric],['Condiciones de parada',p.stop]];
  return '# Mi primer piloto de empresa nativa en IA\n\nBorrador de trabajo generado en MBAI Native. Validar con el departamento y TI antes de conectar sistemas.\n\n' + fields.map(([k,v]) => `## ${k}\n${v.trim() || 'Pendiente de definir'}\n`).join('\n') + '\n## Puertas de avance\n1. Medir el proceso actual y preparar casos representativos.\n2. Probar con datos autorizados, sin ejecutar acciones externas.\n3. Revisar errores, coste total y carga de supervisión.\n4. Aprobar un alcance limitado, con responsable, respaldo y parada.\n\nTiempo de partida: pendiente. Muestra de prueba: pendiente. Umbral de aceptación: pendiente. Presupuesto máximo: pendiente. Fecha de revisión: pendiente.\n';
}
