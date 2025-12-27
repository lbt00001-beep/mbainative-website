// Data: Doctrinas de la Empresa AI-Nativa
// Mezcla los 8 principios del usuario + principios adicionales + doctrinas técnicas reformuladas

export interface Doctrine {
    id: number;
    title: string;
    shortTitle: string;
    thesis: string;
    implications: string;
    challenges: string;
    proponents: string[]; // Guru IDs
    sources: { title: string; url: string }[];
    icon: string;
    category: 'organizacion' | 'tecnologia' | 'estrategia' | 'etica';
}

export const DOCTRINES: Doctrine[] = [
    // ═══════════════════════════════════════════════════════════════════
    // PRINCIPIOS DE ORGANIZACIÓN EMPRESARIAL (del usuario + míos)
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 1,
        title: "El talento artificial se compra",
        shortTitle: "Talento Artificial",
        thesis: "El talento personal se contrata, el talento artificial se compra. Google, OpenAI, Anthropic venden la inteligencia de sus modelos en tokens. El coste marginal de la inteligencia tiende a cero.",
        implications: "Las empresas pueden escalar su capacidad cognitiva comprando más tokens. El presupuesto de IA se convierte en una línea estratégica similar a la nómina.",
        challenges: "Dependencia de proveedores de modelos, volatilidad de precios, y necesidad de evaluar qué tareas justifican el coste.",
        proponents: ["sam-altman", "satya-nadella", "jensen-huang"],
        sources: [
            { title: "OpenAI API Pricing", url: "https://openai.com/pricing" },
            { title: "The Economics of AI", url: "https://www.mckinsey.com/" }
        ],
        icon: "🪙",
        category: "organizacion"
    },
    {
        id: 2,
        title: "Los empleados de silicio",
        shortTitle: "Agentes de IA",
        thesis: "Se pueden comprar 'empleados de silicio': agentes de IA que usan tokens para realizar tareas. Inicialmente especializados, estos agentes son cada vez más versátiles y capaces de manejar tareas variadas.",
        implications: "Los departamentos de TI se convierten en departamentos de RRHH para empleados digitales. La contratación incluye 'onboarding' de agentes.",
        challenges: "Definir SLAs para agentes, gestionar fallos, y establecer responsabilidades cuando un agente comete errores.",
        proponents: ["jensen-huang", "mustafa-suleyman", "andrej-karpathy"],
        sources: [
            { title: "NVIDIA AI Agents", url: "https://www.nvidia.com/" },
            { title: "Microsoft Copilot", url: "https://www.microsoft.com/copilot" }
        ],
        icon: "🤖",
        category: "organizacion"
    },
    {
        id: 3,
        title: "Organización por tareas, no por puestos",
        shortTitle: "Task-Based Organization",
        thesis: "Las empresas no se organizan en posiciones o puestos de trabajo, sino en tareas. Las tareas las realizan agentes de IA y las supervisan personas: los trabajadores-supervisores.",
        implications: "Desaparecen las descripciones de puesto tradicionales. Se definen catálogos de tareas con sus inputs, outputs, y criterios de éxito.",
        challenges: "Rediseñar toda la estructura organizativa, reskilling masivo, y resistencia cultural al cambio.",
        proponents: ["satya-nadella", "sundar-pichai"],
        sources: [
            { title: "Future of Work - WEF", url: "https://www.weforum.org/" },
            { title: "Task-Based Automation", url: "https://www.mckinsey.com/" }
        ],
        icon: "📋",
        category: "organizacion"
    },
    {
        id: 4,
        title: "El nuevo organigrama es una ciencia",
        shortTitle: "Ciencia Organizativa",
        thesis: "La forma de generar el nuevo organigrama de la empresa, dividido en tareas y flujos de trabajo, pasa a ser una nueva ciencia directamente relacionada con la eficiencia empresarial.",
        implications: "Emergen nuevos roles: Arquitectos de Tareas, Diseñadores de Flujos Agénticos, Optimizadores de Procesos AI.",
        challenges: "No existen metodologías maduras. Las empresas deben experimentar y desarrollar sus propios frameworks.",
        proponents: ["andrew-ng", "fei-fei-li"],
        sources: [
            { title: "AI Transformation Playbook", url: "https://www.deeplearning.ai/" }
        ],
        icon: "🏗️",
        category: "organizacion"
    },
    {
        id: 5,
        title: "La información fluye horizontalmente",
        shortTitle: "Información Horizontal",
        thesis: "La información en la empresa ya no circula jerárquicamente, sino horizontalmente. Está disponible para todos en todos los niveles: para trabajadores-personas y para agentes de tareas.",
        implications: "Desaparecen los silos de información. Los agentes acceden a bases de conocimiento unificadas. La transparencia es el default.",
        challenges: "Gestión de permisos y confidencialidad, sobrecarga informativa, y riesgo de filtraciones.",
        proponents: ["sundar-pichai", "satya-nadella"],
        sources: [
            { title: "Knowledge Management in AI Era", url: "https://hbr.org/" }
        ],
        icon: "↔️",
        category: "organizacion"
    },
    {
        id: 6,
        title: "Decisiones con autonomía configurable",
        shortTitle: "Autonomía Configurable",
        thesis: "Las decisiones ya no se toman jerárquicamente. Los trabajadores-supervisores configuran la autonomía de los agentes: mucha o poca. Definen qué tareas requieren consulta previa y cuáles se supervisan a posteriori en el dashboard.",
        implications: "El control granular de la autonomía se convierte en una competencia directiva clave. Los dashboards de supervisión son el centro de mando.",
        challenges: "Calibrar el nivel correcto de autonomía, evitar la microgestión de agentes, y gestionar la responsabilidad en decisiones autónomas.",
        proponents: ["dario-amodei", "demis-hassabis"],
        sources: [
            { title: "Human-AI Collaboration", url: "https://hai.stanford.edu/" }
        ],
        icon: "🎚️",
        category: "organizacion"
    },
    {
        id: 7,
        title: "Relaciones externas agénticas",
        shortTitle: "B2B Agéntico",
        thesis: "La empresa gestiona relaciones externas (proveedores, bancos, administración) con agentes supervisados. En fase 1: agentes interactúan con humanos externos. En fase 2: agentes interactúan con agentes de otras organizaciones.",
        implications: "Los contratos incluirán cláusulas sobre interacción agente-agente. Emergen protocolos estándar de comunicación entre agentes empresariales.",
        challenges: "Confianza inter-organizacional, responsabilidad legal en transacciones agénticas, y estándares de interoperabilidad.",
        proponents: ["mustafa-suleyman", "sam-altman"],
        sources: [
            { title: "AI in Enterprise", url: "https://www.gartner.com/" }
        ],
        icon: "🤝",
        category: "organizacion"
    },
    {
        id: 8,
        title: "Cumplimiento normativo automatizado",
        shortTitle: "Compliance Agéntico",
        thesis: "La gestión normativa (cumplimiento legal, regulatorio, fiscal) la llevan agentes supervisados que monitorizan cambios legislativos, verifican cumplimiento y generan reportes automáticos.",
        implications: "Los departamentos legales se transforman en supervisores de agentes de compliance. La auditoría se vuelve continua en lugar de periódica.",
        challenges: "Responsabilidad legal cuando el agente falla, interpretación de normas ambiguas, y jurisdicciones múltiples.",
        proponents: [],
        sources: [
            { title: "RegTech and AI", url: "https://www.finextra.com/" }
        ],
        icon: "⚖️",
        category: "organizacion"
    },

    // ═══════════════════════════════════════════════════════════════════
    // PRINCIPIOS ADICIONALES (propuestos por la IA)
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 9,
        title: "El capital humano se transforma",
        shortTitle: "Trabajadores-Supervisores",
        thesis: "Los empleados evolucionan de ejecutores de tareas a supervisores, diseñadores de procesos y entrenadores de agentes. El valor humano se concentra en el juicio, la creatividad y la supervisión estratégica.",
        implications: "La formación se centra en supervisión, prompt engineering, y diseño de workflows. Los KPIs miden calidad de supervisión, no volumen de ejecución.",
        challenges: "Reskilling masivo de la fuerza laboral, resistencia psicológica al cambio de rol, y redefinición de carreras profesionales.",
        proponents: ["satya-nadella", "fei-fei-li", "andrew-ng"],
        sources: [
            { title: "Future of Jobs Report - WEF", url: "https://www.weforum.org/" }
        ],
        icon: "👔",
        category: "organizacion"
    },
    {
        id: 10,
        title: "Memoria institucional digital",
        shortTitle: "Conocimiento Persistente",
        thesis: "Los agentes retienen y transfieren conocimiento institucional, eliminando la pérdida de know-how cuando empleados dejan la empresa. La memoria de la organización es digital, estructurada y accesible.",
        implications: "El conocimiento tácito se explicita y codifica. Los agentes 'heredan' el contexto de sus predecesores. La rotación de personal tiene menos impacto.",
        challenges: "Capturar conocimiento tácito, mantener la base de conocimiento actualizada, y evitar la obsolescencia informativa.",
        proponents: ["demis-hassabis", "andrej-karpathy"],
        sources: [
            { title: "Knowledge Graphs and AI", url: "https://www.google.com/" }
        ],
        icon: "🧠",
        category: "organizacion"
    },
    {
        id: 11,
        title: "Escalabilidad instantánea",
        shortTitle: "Escala a Demanda",
        thesis: "La capacidad de trabajo se escala comprando más tokens y desplegando más agentes, sin las limitaciones de la contratación tradicional. El crecimiento puede ser instantáneo y reversible.",
        implications: "Las empresas pueden crecer o decrecer su capacidad operativa en horas, no meses. Los picos de demanda se absorben con agentes temporales.",
        challenges: "Gestión de costes variables, calidad en escalado rápido, y dependencia de infraestructura cloud.",
        proponents: ["jensen-huang", "sam-altman"],
        sources: [
            { title: "AI Infrastructure", url: "https://www.nvidia.com/" }
        ],
        icon: "📈",
        category: "organizacion"
    },
    {
        id: 12,
        title: "El dashboard como centro de mando",
        shortTitle: "Supervisión Visual",
        thesis: "La supervisión visual en dashboards en tiempo real reemplaza la gestión tradicional por reuniones y emails. Los trabajadores-supervisores monitorizan métricas, alertas y resultados de tareas agénticas.",
        implications: "Las reuniones de seguimiento se reducen drásticamente. La toma de decisiones se basa en datos en tiempo real, no en reportes periódicos.",
        challenges: "Diseño de dashboards efectivos, evitar la parálisis por análisis, y mantener el contexto humano en los datos.",
        proponents: ["sundar-pichai"],
        sources: [
            { title: "Data-Driven Management", url: "https://hbr.org/" }
        ],
        icon: "📊",
        category: "organizacion"
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOCTRINAS TECNOLÓGICAS (reformuladas para contexto empresarial)
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 13,
        title: "La IA como infraestructura crítica",
        shortTitle: "AI Factories",
        thesis: "La IA es infraestructura industrial. El cuello de botella es energía, centros de datos y GPUs. La ventaja competitiva es acceso a capacidad de cómputo, no solo algoritmos.",
        implications: "Las empresas deben asegurar acceso a infraestructura AI como aseguran acceso a electricidad o internet. Emergen contratos a largo plazo con proveedores de cómputo.",
        challenges: "Concentración de poder en pocos proveedores, dependencia de supply chain, y costes energéticos crecientes.",
        proponents: ["jensen-huang", "mustafa-suleyman"],
        sources: [
            { title: "NVIDIA AI Factories", url: "https://www.nvidia.com/" }
        ],
        icon: "🏭",
        category: "tecnologia"
    },
    {
        id: 14,
        title: "Escalar funciona... con límites",
        shortTitle: "Scaling Laws",
        thesis: "Más datos + más cómputo = modelos más capaces. Pero el escalado tiene rendimientos decrecientes y costes crecientes. Las empresas deben elegir el punto óptimo coste-capacidad.",
        implications: "No siempre se necesita el modelo más grande. Los modelos especializados y fine-tuned pueden ser más eficientes para tareas específicas.",
        challenges: "Evaluar qué modelo usar para cada tarea, gestionar múltiples modelos, y anticipar la evolución del mercado de modelos.",
        proponents: ["sam-altman", "demis-hassabis", "andrej-karpathy"],
        sources: [
            { title: "OpenAI Scaling Laws", url: "https://openai.com/" }
        ],
        icon: "📐",
        category: "tecnologia"
    },
    {
        id: 15,
        title: "Alineamiento y control de agentes",
        shortTitle: "AI Alignment",
        thesis: "Los agentes deben estar alineados con los objetivos de la empresa y bajo control humano. El diseño 'maximiza un objetivo fijo' es peligroso; hay que diseñar agentes que consulten ante la incertidumbre.",
        implications: "Las empresas definen 'constituciones' internas para sus agentes. Los agentes preguntan cuando no están seguros en lugar de actuar.",
        challenges: "Definir objetivos empresariales de forma que los agentes los interpreten correctamente. Evitar gaming de métricas.",
        proponents: ["dario-amodei", "ilya-sutskever", "geoffrey-hinton"],
        sources: [
            { title: "Constitutional AI", url: "https://arxiv.org/" }
        ],
        icon: "🎯",
        category: "tecnologia"
    },
    {
        id: 16,
        title: "La seguridad como requisito no negociable",
        shortTitle: "Safety-First",
        thesis: "La seguridad de los sistemas AI no es opcional. Los agentes deben ser robustos, predecibles y auditables. Los fallos de seguridad pueden ser catastróficos para la empresa.",
        implications: "Inversión obligatoria en testing, red-teaming y auditoría de agentes. Los agentes en producción pasan por validación rigurosa.",
        challenges: "Equilibrar velocidad de despliegue con rigor de seguridad. Definir qué significa 'suficientemente seguro'.",
        proponents: ["ilya-sutskever", "geoffrey-hinton", "yoshua-bengio"],
        sources: [
            { title: "AI Safety Research", url: "https://www.safe.ai/" }
        ],
        icon: "🛡️",
        category: "tecnologia"
    },

    // ═══════════════════════════════════════════════════════════════════
    // DOCTRINAS ESTRATÉGICAS Y ÉTICAS
    // ═══════════════════════════════════════════════════════════════════
    {
        id: 17,
        title: "IA centrada en el humano",
        shortTitle: "Human-Centered AI",
        thesis: "El diseño de sistemas AI debe complementar capacidades humanas, no reemplazarlas. El objetivo es aumentar el valor del trabajo humano, no eliminarlo.",
        implications: "Los agentes se diseñan como asistentes, no como sustitutos. Se preservan roles para juicio humano, creatividad y empatía.",
        challenges: "Equilibrar eficiencia con preservación del empleo. Definir qué tareas son 'inherentemente humanas'.",
        proponents: ["fei-fei-li", "andrew-ng", "yoshua-bengio"],
        sources: [
            { title: "Stanford HAI", url: "https://hai.stanford.edu/" }
        ],
        icon: "🤲",
        category: "etica"
    },
    {
        id: 18,
        title: "Transparencia y explicabilidad",
        shortTitle: "Explainable AI",
        thesis: "Las decisiones de los agentes deben ser explicables a supervisores humanos. La caja negra no es aceptable para decisiones empresariales críticas.",
        implications: "Los agentes generan logs explicativos de sus decisiones. Los supervisores pueden auditar el razonamiento post-hoc.",
        challenges: "Los modelos más capaces son menos explicables. Trade-off entre capacidad y transparencia.",
        proponents: ["fei-fei-li", "yann-lecun"],
        sources: [
            { title: "XAI Research", url: "https://www.darpa.mil/" }
        ],
        icon: "🔍",
        category: "etica"
    },
    {
        id: 19,
        title: "Responsabilidad y accountability",
        shortTitle: "AI Accountability",
        thesis: "Siempre debe haber un humano responsable de las acciones de un agente. La cadena de responsabilidad debe estar clara incluso cuando el agente actúa autónomamente.",
        implications: "Los supervisores firman off en configuraciones de autonomía. Los logs permiten trazar decisiones hasta el responsable humano.",
        challenges: "Definir responsabilidad en decisiones emergentes. Seguros y marcos legales para actuaciones agénticas.",
        proponents: ["dario-amodei", "geoffrey-hinton"],
        sources: [
            { title: "AI Governance", url: "https://www.weforum.org/" }
        ],
        icon: "📝",
        category: "etica"
    },
    {
        id: 20,
        title: "Sostenibilidad y eficiencia energética",
        shortTitle: "Green AI",
        thesis: "El consumo energético de la IA es significativo y creciente. Las empresas responsables optimizan el uso de recursos computacionales y miden su huella de carbono AI.",
        implications: "Se eligen modelos más eficientes cuando es posible. Se mide y reporta el consumo energético de los agentes.",
        challenges: "Los modelos más eficientes pueden ser menos capaces. Equilibrar performance con sostenibilidad.",
        proponents: ["sundar-pichai", "yoshua-bengio"],
        sources: [
            { title: "Green AI Initiative", url: "https://www.google.com/sustainability" }
        ],
        icon: "🌱",
        category: "etica"
    }
];

// Get doctrine by ID
export const getDoctrineById = (id: number): Doctrine | undefined => {
    return DOCTRINES.find(d => d.id === id);
};

// Get doctrines by category
export const getDoctrinesByCategory = (category: Doctrine['category']): Doctrine[] => {
    return DOCTRINES.filter(d => d.category === category);
};

// Categories for display
export const DOCTRINE_CATEGORIES = [
    { id: 'organizacion', name: 'Organización Empresarial', icon: '🏢', description: 'Cómo estructurar la empresa AI-Nativa' },
    { id: 'tecnologia', name: 'Fundamentos Tecnológicos', icon: '⚙️', description: 'La infraestructura y arquitectura de la IA' },
    { id: 'etica', name: 'Ética y Responsabilidad', icon: '⚖️', description: 'Principios para una IA responsable' }
] as const;
