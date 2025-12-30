/**
 * AI News Fetcher - Scrapes RSS feeds from major AI companies
 * Runs daily via GitHub Actions at 06:00 AM Madrid time
 */

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
    timeout: 30000,
    headers: {
        'User-Agent': 'MBAINative News Aggregator/1.0'
    }
});

// RSS Feed sources - Major AI news sources
const SOURCES = [
    // TOP TIER: AI-focused news
    {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
        logo: '🟢',
        category: 'news'
    },
    {
        name: 'The Verge AI',
        url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
        logo: '🟣',
        category: 'news'
    },
    {
        name: 'MIT Technology Review AI',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
        logo: '🔴',
        category: 'research'
    },
    {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/category/ai/feed/',
        logo: '🟠',
        category: 'news'
    },
    // BIG TECH blogs
    {
        name: 'Google AI',
        url: 'https://blog.google/technology/ai/rss/',
        logo: '🔵',
        category: 'ai'
    },
    {
        name: 'OpenAI',
        url: 'https://openai.com/blog/rss/',
        logo: '⚪',
        category: 'ai'
    },
    {
        name: 'Anthropic',
        url: 'https://www.anthropic.com/news/rss',
        logo: '🟤',
        category: 'ai'
    },
    {
        name: 'Microsoft Research',
        url: 'https://www.microsoft.com/en-us/research/feed/',
        logo: '🔷',
        category: 'research'
    },
    {
        name: 'NVIDIA',
        url: 'https://blogs.nvidia.com/feed/',
        logo: '🟩',
        category: 'hardware'
    }
];

// Keywords to filter AI-relevant content
const AI_KEYWORDS = [
    'ai', 'artificial intelligence', 'machine learning', 'ml',
    'llm', 'gpt', 'gemini', 'claude', 'copilot',
    'generative', 'neural', 'deep learning',
    'agent', 'automation', 'enterprise ai',
    'ceo', 'leadership', 'business', 'strategy',
    'transform', 'future', 'innovation',
    // New: trabajo, agentes, empresas
    'job', 'worker', 'workforce', 'employment', 'labor', 'workplace',
    'agentic', 'assistant', 'copilot', 'automate',
    'enterprise', 'corporate', 'organization', 'productivity'
];

// Priority keywords for AI-native company doctrine
const PRIORITY_KEYWORDS = [
    // Agentes y automatización
    'agent', 'agentic', 'autonomous', 'copilot', 'assistant',
    // Mercado de trabajo
    'job', 'worker', 'workforce', 'employment', 'labor', 'workplace', 'hiring', 'layoff',
    // Empresas y productividad  
    'enterprise', 'business', 'corporate', 'productivity', 'efficiency', 'workflow',
    // Transformación
    'transform', 'future of work', 'automation', 'replace', 'augment'
];

/**
 * Check if article is AI-relevant based on title and content
 */
function isAIRelevant(item) {
    const text = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
    return AI_KEYWORDS.some(kw => text.includes(kw));
}

/**
 * Calculate relevance score for sorting
 * Prioritizes: agents, work/jobs, enterprise, automation
 */
function calculateRelevance(item) {
    const text = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
    let score = 0;

    // HIGH PRIORITY: Agentes de IA (+5 each)
    if (text.includes('agent')) score += 5;
    if (text.includes('agentic')) score += 5;
    if (text.includes('autonomous')) score += 4;
    if (text.includes('copilot')) score += 4;

    // HIGH PRIORITY: Mercado de trabajo (+4 each)
    if (text.includes('job') || text.includes('jobs')) score += 4;
    if (text.includes('worker') || text.includes('workforce')) score += 4;
    if (text.includes('employment') || text.includes('labor')) score += 4;
    if (text.includes('future of work')) score += 5;
    if (text.includes('layoff') || text.includes('hiring')) score += 3;

    // MEDIUM PRIORITY: Empresas y productividad (+3 each)
    if (text.includes('enterprise')) score += 3;
    if (text.includes('business')) score += 2;
    if (text.includes('productivity')) score += 3;
    if (text.includes('workflow')) score += 3;
    if (text.includes('automation')) score += 3;

    // MEDIUM PRIORITY: Liderazgo (+2 each)
    if (text.includes('ceo') || text.includes('leader')) score += 2;
    if (text.includes('strategy') || text.includes('transform')) score += 2;

    // LOW PRIORITY: Tecnología general (+1 each)
    if (text.includes('gemini') || text.includes('gpt')) score += 1;
    if (text.includes('generative')) score += 1;

    // Recency boost (articles from last 24h get extra points)
    const pubDate = new Date(item.pubDate || item.isoDate);
    const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 24) score += 5;
    else if (hoursAgo < 48) score += 3;
    else if (hoursAgo < 72) score += 1;

    return score;
}

/**
 * Fetch and parse a single RSS feed
 */
async function fetchFeed(source) {
    try {
        console.log(`Fetching ${source.name}...`);
        const feed = await parser.parseURL(source.url);

        const items = feed.items
            .filter(isAIRelevant)
            .slice(0, 10) // Max 10 per source
            .map(item => ({
                title: item.title || 'Untitled',
                link: item.link || '',
                summary: (item.contentSnippet || item.content || '').slice(0, 300) + '...',
                pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
                source: source.name,
                sourceLogo: source.logo,
                category: source.category,
                relevance: calculateRelevance(item)
            }));

        console.log(`  Found ${items.length} relevant articles from ${source.name}`);
        return items;
    } catch (error) {
        console.error(`  Error fetching ${source.name}:`, error.message);
        return [];
    }
}

/**
 * Main function - fetch all feeds and generate JSON
 */
async function main() {
    console.log('🚀 Starting AI News Fetch...');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('');

    // Fetch all feeds in parallel
    const results = await Promise.all(SOURCES.map(fetchFeed));

    // Flatten and sort by relevance
    const allNews = results
        .flat()
        .sort((a, b) => {
            // Primary: relevance score
            if (b.relevance !== a.relevance) return b.relevance - a.relevance;
            // Secondary: date
            return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        });

    // Generate output
    const output = {
        lastUpdated: new Date().toISOString(),
        totalArticles: allNews.length,
        featured: allNews.slice(0, 5), // Top 5 for home page
        all: allNews
    };

    // Write to public/data/ai-news.json
    const outputDir = path.join(__dirname, '..', 'public', 'data');
    const outputPath = path.join(outputDir, 'ai-news.json');

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log('');
    console.log('✅ AI News Fetch Complete!');
    console.log(`   Total articles: ${allNews.length}`);
    console.log(`   Featured: ${output.featured.length}`);
    console.log(`   Output: ${outputPath}`);
}

main().catch(console.error);
