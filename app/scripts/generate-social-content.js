const fs = require('fs');
const path = require('path');

// Load JSON data files (dynamic sources)
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
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
}

// Truncate text for Twitter's 280 character limit
function truncateForTwitter(text, maxLength = 250) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Format date in Spanish
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
}

// ========== CONTENT GENERATORS (ALL FROM DYNAMIC SOURCES) ==========

// 1. NOTICIA IA - from ai-news.json
function generateNewsContent() {
    const news = loadJsonFile('ai-news.json');
    if (!news || !news.featured || news.featured.length === 0) return null;

    const item = randomItem(news.featured);
    const summary = item.summary ? item.summary.substring(0, 150) : '';

    return {
        type: 'news',
        content: truncateForTwitter(`📰 ${item.title}\n\n${summary}...\n\n🔗 ${item.source}`),
        hashtags: ['IA', 'NoticiasIA', 'MBAINative', item.source.replace(/\s/g, '')],
        url: item.link
    };
}

// 2. PODCAST/VIDEO - from youtubers.json
function generatePodcastContent() {
    const youtubers = loadJsonFile('youtubers.json');
    if (!youtubers || !youtubers.youtubers) return null;

    const keys = Object.keys(youtubers.youtubers);
    const key = randomItem(keys);
    const youtuber = youtubers.youtubers[key];

    if (!youtuber.videos || youtuber.videos.length === 0) return null;

    const video = youtuber.videos[0]; // Most recent

    return {
        type: 'podcast',
        content: truncateForTwitter(`🎙️ Nuevo de ${youtuber.name}\n\n"${video.title}"\n\n▶️ youtube.com/watch?v=${video.videoId}`),
        hashtags: ['IA', 'Podcast', 'MBAINative', youtuber.name.replace(/\s/g, '')],
        url: `https://youtube.com/watch?v=${video.videoId}`
    };
}

// 3. DECLARACIÓN DE GURÚ - from gurus-videos.json (video titles as insights)
function generateGuruContent() {
    const gurus = loadJsonFile('gurus-videos.json');
    if (!gurus || !gurus.gurus) return null;

    const guruNames = {
        'demis-hassabis': 'Demis Hassabis (DeepMind)',
        'geoffrey-hinton': 'Geoffrey Hinton (Godfather of AI)',
        'sam-altman': 'Sam Altman (OpenAI)',
        'jensen-huang': 'Jensen Huang (NVIDIA)',
        'andrew-ng': 'Andrew Ng (Landing AI)',
        'yann-lecun': 'Yann LeCun (Meta)',
        'yoshua-bengio': 'Yoshua Bengio',
        'ilya-sutskever': 'Ilya Sutskever (SSI)',
        'dario-amodei': 'Dario Amodei (Anthropic)',
        'mustafa-suleyman': 'Mustafa Suleyman (Microsoft AI)',
        'fei-fei-li': 'Fei-Fei Li (Stanford)',
        'andrej-karpathy': 'Andrej Karpathy'
    };

    const keys = Object.keys(gurus.gurus);
    const key = randomItem(keys);
    const videos = gurus.gurus[key];

    if (!videos || videos.length === 0) return null;

    const video = randomItem(videos);
    const guruName = guruNames[key] || key;

    return {
        type: 'guru_quote',
        content: truncateForTwitter(`🧠 ${guruName}\n\n"${video.title}"\n\n▶️ youtube.com/watch?v=${video.videoId}`),
        hashtags: ['IA', 'GurusIA', 'MBAINative', key.replace(/-/g, '')],
        url: `https://youtube.com/watch?v=${video.videoId}`
    };
}

// 4. ARTÍCULO DE CONSULTORAS - from consultoras.json
function generateConsultoraContent() {
    const consultoras = loadJsonFile('consultoras.json');
    if (!consultoras || !consultoras.articles || consultoras.articles.length === 0) return null;

    const article = randomItem(consultoras.articles);

    return {
        type: 'consultora',
        content: truncateForTwitter(`📊 ${article.consultora}\n\n"${article.title}"\n\n🔗 ${article.link}`),
        hashtags: ['IA', 'Consultoria', 'MBAINative', article.consultora.replace(/\s/g, '')],
        url: article.link
    };
}

// 5. VIDEO RECIENTE DE CUALQUIER GURÚ - from gurus-videos.json (most recent)
function generateRecentVideoContent() {
    const gurus = loadJsonFile('gurus-videos.json');
    if (!gurus || !gurus.gurus) return null;

    // Collect all videos with guru info
    const allVideos = [];
    const guruNames = {
        'demis-hassabis': 'Demis Hassabis',
        'geoffrey-hinton': 'Geoffrey Hinton',
        'sam-altman': 'Sam Altman',
        'jensen-huang': 'Jensen Huang',
        'andrew-ng': 'Andrew Ng'
    };

    for (const [guruId, videos] of Object.entries(gurus.gurus)) {
        if (videos && videos.length > 0) {
            videos.forEach(v => {
                allVideos.push({ ...v, guruId, guruName: guruNames[guruId] || guruId });
            });
        }
    }

    // Sort by date, get most recent
    allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    const video = allVideos[0];

    if (!video) return null;

    return {
        type: 'recent_video',
        content: truncateForTwitter(`🔥 Recién publicado sobre ${video.guruName}\n\n"${video.title}"\n\n▶️ youtube.com/watch?v=${video.videoId}`),
        hashtags: ['IA', 'MBAINative', 'UltimaHora', video.guruId.replace(/-/g, '')],
        url: `https://youtube.com/watch?v=${video.videoId}`
    };
}

// 6. NOTICIA CON ANÁLISIS - combinando ai-news con contexto
function generateAnalysisContent() {
    const news = loadJsonFile('ai-news.json');
    if (!news || !news.featured || news.featured.length === 0) return null;

    const item = randomItem(news.featured);

    // Add context based on source
    let context = '¿Qué significa esto para las empresas AI-nativas?';
    if (item.source.includes('Google')) context = 'Google sigue marcando el ritmo en la carrera de IA.';
    if (item.source.includes('Microsoft')) context = 'Microsoft refuerza su apuesta por Copilot y agentes.';
    if (item.source.includes('NVIDIA')) context = 'NVIDIA consolida su dominio en infraestructura IA.';

    return {
        type: 'analysis',
        content: truncateForTwitter(`📰 ${item.title}\n\n💡 ${context}\n\n🔗 mbainative.com/mejores-practicas/noticias`),
        hashtags: ['IA', 'Analisis', 'MBAINative', item.source.replace(/\s/g, '')],
        url: 'https://mbainative.com/mejores-practicas/noticias'
    };
}

// ========== MAIN GENERATOR ==========

function generateContent() {
    const baseHashtags = ['IA', 'InteligenciaArtificial', 'MBAINative'];

    // Content generators in order of preference
    const generators = [
        generateNewsContent,        // Noticias actuales
        generatePodcastContent,     // Videos de youtubers
        generateGuruContent,        // Videos de gurús
        generateConsultoraContent,  // Artículos de consultoras
        generateRecentVideoContent, // Video más reciente
        generateAnalysisContent     // Análisis de noticias
    ];

    // Select based on time of day
    const hour = new Date().getHours();
    let selectedGenerators;

    if (hour < 10) {
        // Morning: News and podcasts
        selectedGenerators = [generateNewsContent, generatePodcastContent, generateRecentVideoContent];
    } else if (hour < 15) {
        // Noon: Gurus and analysis
        selectedGenerators = [generateGuruContent, generateAnalysisContent, generateConsultoraContent];
    } else {
        // Evening: Mix of everything
        selectedGenerators = [generateRecentVideoContent, generateGuruContent, generateNewsContent];
    }

    // Try each generator until one works
    for (const generator of selectedGenerators) {
        const content = generator();
        if (content) {
            return {
                ...content,
                hashtags: [...new Set([...baseHashtags, ...content.hashtags])]
            };
        }
    }

    // Fallback if nothing works
    return {
        type: 'fallback',
        content: '🚀 La revolución de la IA está en marcha. ¿Tu empresa está preparada?\n\n🔗 mbainative.com',
        hashtags: baseHashtags,
        url: 'https://mbainative.com'
    };
}

// ========== MAIN ==========

async function main() {
    console.log('🚀 Generating social media content from DYNAMIC sources...');

    const content = generateContent();

    const output = {
        generatedAt: new Date().toISOString(),
        scheduleSlot: new Date().getHours() < 10 ? 'morning' : (new Date().getHours() < 15 ? 'noon' : 'evening'),
        post: content
    };

    const outputPath = path.join(__dirname, '../public/data/social-content.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✅ Generated content from LIVE data`);
    console.log(`   Type: ${content.type}`);
    console.log(`   Content: ${content.content.substring(0, 100)}...`);
    console.log(`   Hashtags: ${content.hashtags.map(h => '#' + h).join(' ')}`);
}

main().catch(console.error);
