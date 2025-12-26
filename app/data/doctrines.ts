// Data: 10 AI Doctrines with thesis, proponents, and objections

export interface Doctrine {
    id: number;
    title: string;
    shortTitle: string;
    thesis: string;
    proponents: string[]; // Guru IDs
    objection: string;
    sources: { title: string; url: string }[];
    icon: string;
}

export const DOCTRINES: Doctrine[] = [
    {
        id: 1,
        title: "El escalado funciona… hasta que deje de hacerlo",
        shortTitle: "Scaling Laws",
        thesis: "Más datos + más cómputo + mejores recetas ⇒ saltos de capacidad. El camino a AGI es escalar modelos cada vez más grandes.",
        proponents: ["sam-altman", "demis-hassabis", "jensen-huang", "andrej-karpathy"],
        objection: "Los límites del 'solo escalar' están siendo cuestionados. ¿Hay un techo? El debate sigue abierto en 2025.",
        sources: [
            { title: "OpenAI Scaling Laws", url: "https://openai.com/" },
            { title: "DeepMind Research", url: "https://deepmind.google/" }
        ],
        icon: "📈"
    },
    {
        id: 2,
        title: "La IA es infraestructura: 'AI Factories'",
        shortTitle: "AI Factories",
        thesis: "El cuello de botella decisivo es energía, centros de datos, GPUs/redes. La ventaja competitiva es industrial, no algorítmica.",
        proponents: ["jensen-huang", "mustafa-suleyman"],
        objection: "Concentración de poder, dependencia de supply chain, riesgos sistémicos y barreras de entrada para nuevos actores.",
        sources: [
            { title: "NVIDIA AI Factories", url: "https://www.nvidia.com/" }
        ],
        icon: "🏭"
    },
    {
        id: 3,
        title: "La próxima frontera: modelar el mundo (JEPA)",
        shortTitle: "World Models",
        thesis: "Para razonamiento robusto hace falta aprender modelos internos predictivos (JEPA / world models), no solo correlaciones lingüísticas.",
        proponents: ["yann-lecun"],
        objection: "Aún falta demostrar que estos enfoques superen al LLM+herramientas en tareas generales.",
        sources: [
            { title: "JEPA Paper", url: "https://openreview.net/" }
        ],
        icon: "🌍"
    },
    {
        id: 4,
        title: "El problema central es el control",
        shortTitle: "Control Problem",
        thesis: "El esquema clásico 'maximiza un objetivo fijo' es peligroso. Hay que diseñar agentes que no impongan objetivos mal especificados.",
        proponents: [], // Stuart Russell no está en la lista de gurús
        objection: "Traducir esto a ingeniería concreta a escala (producto + economía) no es trivial.",
        sources: [
            { title: "Stuart Russell - Human Compatible", url: "https://people.eecs.berkeley.edu/~russell/" }
        ],
        icon: "🎛️"
    },
    {
        id: 5,
        title: "Alineamiento por principios: Constitutional AI",
        shortTitle: "Constitutional AI",
        thesis: "En vez de etiquetar cada caso con humanos, entrenas con una 'constitución' de principios para auto-criticar y corregir.",
        proponents: ["dario-amodei"],
        objection: "¿Quién escribe la 'constitución'? ¿Cómo se audita? ¿Y qué pasa con valores en conflicto?",
        sources: [
            { title: "Constitutional AI Paper", url: "https://arxiv.org/abs/2212.08073" }
        ],
        icon: "📜"
    },
    {
        id: 6,
        title: "Safety-first como misión única",
        shortTitle: "Safety-First Labs",
        thesis: "Separar el incentivo comercial: construir superinteligencia solo si es segura. Laboratorios monotemáticos en safety.",
        proponents: ["ilya-sutskever"],
        objection: "Difícil sostenerlo si el ecosistema premia velocidad/mercado. Además 'seguro' es un criterio disputado.",
        sources: [
            { title: "Safe Superintelligence Inc.", url: "https://ssi.inc/" }
        ],
        icon: "🛡️"
    },
    {
        id: 7,
        title: "La doctrina de la alerta (desde dentro)",
        shortTitle: "Inside Warning",
        thesis: "La propia comunidad 'fundacional' legitima públicamente riesgos serios: misinfo, usos maliciosos, pérdida de control.",
        proponents: ["geoffrey-hinton", "yoshua-bengio"],
        objection: "Riesgo de sobrerreacción regulatoria o de 'captura' del discurso por actores con agenda propia.",
        sources: [
            { title: "Hinton en The Guardian", url: "https://www.theguardian.com/" },
            { title: "Bengio AI Safety", url: "https://yoshuabengio.org/" }
        ],
        icon: "⚠️"
    },
    {
        id: 8,
        title: "IA centrada en la condición humana",
        shortTitle: "Human-Centered AI",
        thesis: "El norte es impacto humano: educación, política, ética, transparencia. Diseño para complementar capacidades humanas, no reemplazarlas.",
        proponents: ["fei-fei-li", "andrew-ng"],
        objection: "Puede quedarse en 'principios' si no aterriza en métricas y mecanismos de enforcement.",
        sources: [
            { title: "Stanford HAI", url: "https://hai.stanford.edu/" }
        ],
        icon: "🤝"
    },
    {
        id: 9,
        title: "IA para ciencia",
        shortTitle: "AI for Science",
        thesis: "El valor más transformador es acelerar descubrimiento científico: proteínas, fármacos, materiales.",
        proponents: ["demis-hassabis"],
        objection: "Resultados espectaculares pero no generalizan automáticamente. Exige validación experimental y gobernanza de acceso.",
        sources: [
            { title: "AlphaFold en Nature", url: "https://www.nature.com/" }
        ],
        icon: "🔬"
    },
    {
        id: 10,
        title: "IA como sistema extractivo",
        shortTitle: "Extractive System",
        thesis: "La IA depende de extracción de datos, trabajo, energía. Genera sesgos, opacidad y asimetrías de poder.",
        proponents: ["karen-hao"],
        objection: "Si se formula solo como crítica puede aportar poco a la ingeniería. Su fuerza está en auditoría y accountability.",
        sources: [
            { title: "Stochastic Parrots Paper", url: "https://dl.acm.org/doi/10.1145/3442188.3445922" }
        ],
        icon: "⚖️"
    }
];

// Get doctrine by ID
export const getDoctrineById = (id: number): Doctrine | undefined => {
    return DOCTRINES.find(d => d.id === id);
};
