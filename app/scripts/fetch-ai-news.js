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

// RSS Feed sources
const SOURCES = [
    {
        name: 'Google Cloud',
        url: 'https://cloud.google.com/blog/rss/',
        logo: '🔵',
        category: 'cloud'
    },
    {
        name: 'OpenAI',
        url: 'https://openai.com/blog/rss/',
        logo: '🟢',
        category: 'ai'
    },
    {
        name: 'Microsoft AI',
        url: 'https://blogs.microsoft.com/ai/feed/',
        logo: '🔷',
        category: 'enterprise'
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
    'transform', 'future', 'innovation'
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
 */
function calculateRelevance(item) {
    const text = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
    let score = 0;

    // Boost for leadership/business focus
    if (text.includes('ceo') || text.includes('leader')) score += 3;
    if (text.includes('enterprise') || text.includes('business')) score += 2;
    if (text.includes('strategy') || text.includes('transform')) score += 2;

    // Boost for cutting-edge AI
    if (text.includes('agent')) score += 3;
    if (text.includes('gemini') || text.includes('gpt')) score += 2;
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
