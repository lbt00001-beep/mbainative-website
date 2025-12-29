const fs = require('fs');
const path = require('path');

// Content types
const CONTENT_TYPES = [
    'news',           // 1. Noticia IA destacada
    'podcast',        // 2. Nuevo podcast Jon/Lex
    'guru_quote',     // 3. Declaración de gurú
    'company_data',   // 4. Datos empresas IA
    'doctrine',       // 5. Doctrina del día
    'question',       // 6. Pregunta provocadora
    'statistic',      // 7. Estadística destacada
    'consultora'      // 8. Artículo consultoras
];

// Social questions
const SOCIAL_QUESTIONS = [
    { question: "¿Tu empresa tiene Director de IA?", context: "El 78% de las Fortune 500 ya tiene este rol", hashtags: ["DirectorIA", "TransformacionDigital"] },
    { question: "¿Cuántos agentes de IA trabajan en tu equipo?", context: "En 2025, los agentes pasarán de asistentes a empleados", hashtags: ["AgentesIA", "EmpleadosSilicio"] },
    { question: "¿Sigues organizando por puestos o ya lo haces por tareas?", context: "La empresa AI-nativa organiza tareas, no puestos", hashtags: ["OrganizacionEmpresarial", "FuturoDelTrabajo"] },
    { question: "¿Cuánto pagas al mes en tokens de IA?", context: "La inteligencia se compra. El coste marginal tiende a cero", hashtags: ["TokensIA", "InteligenciaComprable"] },
    { question: "¿Tus agentes consultan antes de actuar o supervisas después?", context: "La autonomía configurable es clave en la empresa AI-nativa", hashtags: ["AutonomiaIA", "SupervisionAgentes"] },
    { question: "¿Tu empresa tiene compliance automatizado?", context: "Los agentes de cumplimiento trabajan 24/7 sin descanso", hashtags: ["Compliance", "AutomatizacionLegal"] },
    { question: "¿Estás formando a tu equipo para supervisar agentes?", context: "La competencia clave del futuro: gestionar empleados de silicio", hashtags: ["FormacionIA", "HabilidadesFuturo"] },
    { question: "¿Tu departamento de TI ya es un departamento de RRHH... para empleados digitales?", context: "Jensen Huang, CEO de NVIDIA", hashtags: ["NVIDIA", "EmpleadosDigitales"] }
];

// AI Statistics
const AI_STATS = [
    { stat: "El 75% de los CEOs creen que la IA transformará su industria en 3 años", source: "McKinsey 2024", hashtags: ["IA", "TransformacionDigital"] },
    { stat: "OpenAI vale $150B, más que Goldman Sachs", source: "The Information 2024", hashtags: ["OpenAI", "Valoracion"] },
    { stat: "NVIDIA ha multiplicado x10 su valor en 2 años", source: "Mercados 2024", hashtags: ["NVIDIA", "Bolsa"] },
    { stat: "El 40% de las horas de trabajo podrían automatizarse con IA generativa", source: "McKinsey 2024", hashtags: ["Automatizacion", "FuturoDelTrabajo"] },
    { stat: "Google invierte $30B al año en infraestructura IA", source: "Alphabet Earnings 2024", hashtags: ["Google", "InversionIA"] },
    { stat: "Microsoft ha integrado Copilot en 150M+ de licencias Office", source: "Microsoft 2024", hashtags: ["Microsoft", "Copilot"] },
    { stat: "China tiene 50% más papers de IA que EEUU", source: "Stanford AI Index 2024", hashtags: ["ChinaIA", "InvestigacionIA"] },
    { stat: "El mercado de agentes de IA crecerá a $100B en 2028", source: "Gartner 2024", hashtags: ["AgentesIA", "Mercado"] }
];

// Doctrines (simplified)
const DOCTRINES = [
    { id: 1, title: "El talento artificial se compra", thesis: "Google, OpenAI, Anthropic venden la inteligencia de sus modelos en tokens. El coste marginal de la inteligencia tiende a cero." },
    { id: 2, title: "Empleados de Silicio", thesis: "Agentes de IA que ejecutan tareas con creciente autonomía. No son herramientas: son empleados digitales." },
    { id: 3, title: "Organización por Tareas", thesis: "No hay puestos de trabajo: hay tareas que ejecutan agentes y supervisan personas." },
    { id: 4, title: "El nuevo organigrama es una ciencia", thesis: "Emergen nuevos roles: Director de IA, Arquitectos de Tareas, Diseñadores de Flujos Agénticos." },
    { id: 5, title: "La información fluye horizontalmente", thesis: "Desaparecen los silos. Personas y agentes acceden a bases de conocimiento unificadas." },
    { id: 6, title: "Autonomía Configurable", thesis: "Los supervisores deciden: ¿consulta previa o supervisión posterior?" },
    { id: 7, title: "Relaciones Externas Agénticas", thesis: "Agentes que negocian con otros agentes. Comercio B2B sin intervención humana." },
    { id: 8, title: "Compliance Automatizado", thesis: "Agentes de cumplimiento que verifican normativas 24/7." }
];

// AI Companies
const AI_COMPANIES = {
    bigTech: [
        { name: "Microsoft", ticker: "MSFT", focus: "Copilot, Azure AI, OpenAI" },
        { name: "Google", ticker: "GOOGL", focus: "Gemini, DeepMind, TPUs" },
        { name: "Meta", ticker: "META", focus: "Llama, Reality Labs" },
        { name: "NVIDIA", ticker: "NVDA", focus: "GPUs, CUDA, infraestructura IA" },
        { name: "Amazon", ticker: "AMZN", focus: "AWS AI, Alexa, Anthropic" },
        { name: "Apple", ticker: "AAPL", focus: "Apple Intelligence, on-device AI" },
        { name: "Tesla", ticker: "TSLA", focus: "FSD, Optimus, Dojo" }
    ],
    startups: [
        { name: "OpenAI", valuation: "$150B", focus: "GPT, ChatGPT, Sora" },
        { name: "Anthropic", valuation: "$18B", focus: "Claude" },
        { name: "Mistral AI", valuation: "$6B", focus: "Modelos abiertos" },
        { name: "Perplexity", valuation: "$9B", focus: "Búsqueda IA" }
    ]
};

// Load existing data files
function loadJsonFile(filename) {
    const filePath = path.join(__dirname, '../public/data', filename);
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.log(`Could not load ${filename}:`, e.message);
    }
    return null;
}

// Get a random item from array
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Get today's doctrine (rotates daily)
function getTodaysDoctrine() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return DOCTRINES[dayOfYear % DOCTRINES.length];
}

// Truncate text to fit Twitter's 280 character limit
function truncateForTwitter(text, maxLength = 250) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Generate content based on type
function generateContent(type) {
    const baseHashtags = ['IA', 'InteligenciaArtificial', 'MBAINative', 'EmpresaAINativa'];

    switch (type) {
        case 'news': {
            const news = loadJsonFile('ai-news.json');
            if (news && news.items && news.items.length > 0) {
                const item = news.items[0]; // Most recent
                return {
                    type: 'news',
                    title: `📰 ${item.title}`,
                    content: truncateForTwitter(`📰 ${item.title}\n\n${item.source}`),
                    contentLong: `📰 Noticia destacada de IA\n\n${item.title}\n\nFuente: ${item.source}\n\n🔗 Más noticias en mbainative.com/mejores-practicas/noticias`,
                    hashtags: [...baseHashtags, 'NoticiasIA', item.source.replace(/\s/g, '')],
                    url: item.link || 'https://mbainative.com/mejores-practicas/noticias',
                    imageUrl: null
                };
            }
            break;
        }

        case 'podcast': {
            const youtubers = loadJsonFile('youtubers.json');
            if (youtubers && youtubers.youtubers) {
                const youtuberKeys = Object.keys(youtubers.youtubers);
                const key = randomItem(youtuberKeys);
                const youtuber = youtubers.youtubers[key];
                if (youtuber.videos && youtuber.videos.length > 0) {
                    const video = youtuber.videos[0]; // Most recent
                    return {
                        type: 'podcast',
                        title: `🎙️ ${youtuber.name}: ${video.title}`,
                        content: truncateForTwitter(`🎙️ Nuevo de ${youtuber.name}\n\n${video.title}`),
                        contentLong: `🎙️ Nuevo contenido de ${youtuber.name}\n\n${video.title}\n\n▶️ https://youtube.com/watch?v=${video.videoId}`,
                        hashtags: [...baseHashtags, 'Podcast', youtuber.name.replace(/\s/g, '')],
                        url: `https://youtube.com/watch?v=${video.videoId}`,
                        imageUrl: video.thumbnail
                    };
                }
            }
            break;
        }

        case 'guru_quote': {
            const quotes = [
                { author: "Jensen Huang", company: "NVIDIA", quote: "Los departamentos de TI se convertirán en departamentos de RRHH... para empleados digitales." },
                { author: "Satya Nadella", company: "Microsoft", quote: "Todos podrán ser expertos en cualquier cosa porque tendrán un asistente de IA." },
                { author: "Sam Altman", company: "OpenAI", quote: "La IA eliminará categorías enteras de trabajos... pero abrirá oportunidades que hoy parecen imposibles." },
                { author: "Mustafa Suleyman", company: "Microsoft AI", quote: "En el futuro solo habrá trabajadores de cuello nuevo: humanos que trabajan con agentes." },
                { author: "Sundar Pichai", company: "Google", quote: "La IA es probablemente lo más importante en lo que la humanidad haya trabajado jamás." },
                { author: "Demis Hassabis", company: "DeepMind", quote: "Estamos en el umbral de la era de la inteligencia artificial general." }
            ];
            const quote = randomItem(quotes);
            return {
                type: 'guru_quote',
                title: `💬 ${quote.author}`,
                content: truncateForTwitter(`💬 "${quote.quote}"\n\n— ${quote.author}, ${quote.company}`),
                contentLong: `💬 Palabras de los líderes de la IA\n\n"${quote.quote}"\n\n— ${quote.author}, CEO de ${quote.company}\n\n🔗 Conoce a los 14 gurús en mbainative.com/mejores-practicas/gurus`,
                hashtags: [...baseHashtags, 'GurusIA', quote.author.replace(/\s/g, ''), quote.company],
                url: 'https://mbainative.com/mejores-practicas/gurus',
                imageUrl: null
            };
        }

        case 'company_data': {
            const isBigTech = Math.random() > 0.5;
            if (isBigTech) {
                const company = randomItem(AI_COMPANIES.bigTech);
                return {
                    type: 'company_data',
                    title: `📊 ${company.name} (${company.ticker})`,
                    content: truncateForTwitter(`📊 ${company.name} ($${company.ticker})\n\nFoco en IA: ${company.focus}`),
                    contentLong: `📊 Las 7 grandes tecnológicas en IA\n\n${company.name} ($${company.ticker})\n\n🎯 Foco: ${company.focus}\n\n🔗 Sigue las tendencias en mbainative.com`,
                    hashtags: [...baseHashtags, company.ticker, 'BigTech'],
                    url: 'https://mbainative.com',
                    imageUrl: null
                };
            } else {
                const startup = randomItem(AI_COMPANIES.startups);
                return {
                    type: 'company_data',
                    title: `🚀 ${startup.name}`,
                    content: truncateForTwitter(`🚀 ${startup.name}\n\nValoración: ${startup.valuation}\nFoco: ${startup.focus}`),
                    contentLong: `🚀 Startups de IA a seguir\n\n${startup.name}\n\n💰 Valoración: ${startup.valuation}\n🎯 Foco: ${startup.focus}\n\n🔗 mbainative.com`,
                    hashtags: [...baseHashtags, startup.name.replace(/\s/g, ''), 'Startups'],
                    url: 'https://mbainative.com',
                    imageUrl: null
                };
            }
        }

        case 'doctrine': {
            const doctrine = getTodaysDoctrine();
            return {
                type: 'doctrine',
                title: `📜 Doctrina #${doctrine.id}: ${doctrine.title}`,
                content: truncateForTwitter(`📜 Doctrina #${doctrine.id}: ${doctrine.title}\n\n${doctrine.thesis}`),
                contentLong: `📜 Doctrina de la Empresa AI-Nativa\n\n#${doctrine.id} ${doctrine.title}\n\n${doctrine.thesis}\n\n🔗 Las 20 doctrinas en mbainative.com/mejores-practicas/doctrinas`,
                hashtags: [...baseHashtags, 'Doctrinas', 'EmpresaAINativa'],
                url: 'https://mbainative.com/mejores-practicas/doctrinas',
                imageUrl: null
            };
        }

        case 'question': {
            const q = randomItem(SOCIAL_QUESTIONS);
            return {
                type: 'question',
                title: `❓ ${q.question}`,
                content: truncateForTwitter(`❓ ${q.question}\n\n${q.context}`),
                contentLong: `❓ Pregunta del día\n\n${q.question}\n\n💡 ${q.context}\n\n¿Qué opinas? 👇\n\n🔗 mbainative.com`,
                hashtags: [...baseHashtags, ...q.hashtags],
                url: 'https://mbainative.com',
                imageUrl: null
            };
        }

        case 'statistic': {
            const stat = randomItem(AI_STATS);
            return {
                type: 'statistic',
                title: `📈 ${stat.stat}`,
                content: truncateForTwitter(`📈 ${stat.stat}\n\nFuente: ${stat.source}`),
                contentLong: `📈 Dato del día sobre IA\n\n${stat.stat}\n\n📊 Fuente: ${stat.source}\n\n🔗 Más insights en mbainative.com`,
                hashtags: [...baseHashtags, ...stat.hashtags],
                url: 'https://mbainative.com',
                imageUrl: null
            };
        }

        case 'consultora': {
            const consultoras = loadJsonFile('consultoras.json');
            if (consultoras && consultoras.articles && consultoras.articles.length > 0) {
                const article = consultoras.articles[0]; // Most recent
                return {
                    type: 'consultora',
                    title: `📊 ${article.consultora}: ${article.title}`,
                    content: truncateForTwitter(`📊 ${article.consultora}\n\n${article.title}`),
                    contentLong: `📊 Análisis de las grandes consultoras\n\n${article.consultora}: ${article.title}\n\n🔗 ${article.link}\n\nMás en mbainative.com/mejores-practicas/consultoras`,
                    hashtags: [...baseHashtags, article.consultora, 'Consultoria'],
                    url: article.link || 'https://mbainative.com/mejores-practicas/consultoras',
                    imageUrl: null
                };
            }
            break;
        }
    }

    // Fallback to doctrine if nothing else works
    return generateContent('doctrine');
}

// Select content type based on time of day and randomness
function selectContentType() {
    const hour = new Date().getHours();

    // Morning (06:00): Prioritize news and podcasts
    if (hour < 10) {
        const morningTypes = ['news', 'podcast', 'consultora', 'statistic'];
        return randomItem(morningTypes);
    }
    // Noon (12:00): Prioritize questions and doctrines
    else if (hour < 15) {
        const noonTypes = ['doctrine', 'question', 'guru_quote'];
        return randomItem(noonTypes);
    }
    // Evening (18:00): Prioritize company data and stats
    else {
        const eveningTypes = ['company_data', 'statistic', 'guru_quote'];
        return randomItem(eveningTypes);
    }
}

// Main function
async function main() {
    console.log('🚀 Generating social media content...');

    const contentType = selectContentType();
    console.log(`  → Selected content type: ${contentType}`);

    const content = generateContent(contentType);

    const output = {
        generatedAt: new Date().toISOString(),
        scheduleSlot: new Date().getHours() < 10 ? 'morning' : (new Date().getHours() < 15 ? 'noon' : 'evening'),
        post: content
    };

    const outputPath = path.join(__dirname, '../public/data/social-content.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Generated content saved to social-content.json`);
    console.log(`   Type: ${content.type}`);
    console.log(`   Title: ${content.title}`);
    console.log(`   Hashtags: ${content.hashtags.map(h => '#' + h).join(' ')}`);
}

main().catch(console.error);
