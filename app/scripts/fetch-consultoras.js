/**
 * Fetch articles from McKinsey and other consultoras about AI and work
 * Uses RSS feeds
 * Runs daily via GitHub Actions
 */

const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MBAI-Native-Bot/1.0)'
    }
});

// Consultoras RSS feeds
const CONSULTORA_FEEDS = [
    {
        id: 'mckinsey',
        name: 'McKinsey & Company',
        logo: '/images/consultoras/mckinsey.png',
        feeds: [
            'https://www.mckinsey.com/insights/rss',
            'https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/rss',
            'https://www.mckinsey.com/featured-insights/future-of-work/rss'
        ],
        website: 'https://www.mckinsey.com/'
    },
    {
        id: 'bcg',
        name: 'Boston Consulting Group',
        logo: '/images/consultoras/bcg.png',
        feeds: [
            'https://www.bcg.com/rss.xml'
        ],
        website: 'https://www.bcg.com/'
    },
    {
        id: 'deloitte',
        name: 'Deloitte',
        logo: '/images/consultoras/deloitte.png',
        feeds: [
            'https://www2.deloitte.com/us/en/insights/rss-feeds/all-insights.rss'
        ],
        website: 'https://www2.deloitte.com/'
    }
];

// Keywords to filter AI and work-related content
const AI_WORK_KEYWORDS = [
    'artificial intelligence', 'ai', 'machine learning', 'generative ai',
    'automation', 'workforce', 'future of work', 'jobs', 'employment',
    'labor', 'skills', 'talent', 'productivity', 'digital transformation',
    'agents', 'chatgpt', 'copilot', 'enterprise ai', 'business transformation'
];

/**
 * Check if article is relevant to AI and work
 */
function isRelevant(item) {
    const text = `${item.title || ''} ${item.contentSnippet || ''} ${item.content || ''}`.toLowerCase();
    return AI_WORK_KEYWORDS.some(kw => text.includes(kw));
}

/**
 * Calculate relevance score
 */
function calculateScore(item) {
    const text = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
    let score = 0;

    // High priority keywords
    if (text.includes('future of work')) score += 5;
    if (text.includes('workforce')) score += 4;
    if (text.includes('jobs') || text.includes('employment')) score += 4;
    if (text.includes('generative ai')) score += 4;
    if (text.includes('automation')) score += 3;
    if (text.includes('productivity')) score += 3;
    if (text.includes('agents')) score += 4;
    if (text.includes('talent')) score += 3;

    // Recency boost
    const pubDate = new Date(item.pubDate || item.isoDate);
    const daysAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 7) score += 5;
    else if (daysAgo < 14) score += 3;
    else if (daysAgo < 30) score += 1;

    return score;
}

/**
 * Fetch articles from a consultora
 */
async function fetchConsultoraArticles(consultora) {
    const articles = [];

    for (const feedUrl of consultora.feeds) {
        try {
            console.log(`   Fetching ${feedUrl}...`);
            const feed = await parser.parseURL(feedUrl);

            for (const item of feed.items || []) {
                if (isRelevant(item)) {
                    articles.push({
                        title: item.title,
                        link: item.link,
                        description: (item.contentSnippet || item.content || '').slice(0, 200) + '...',
                        pubDate: item.pubDate || item.isoDate,
                        source: consultora.name,
                        sourceId: consultora.id,
                        score: calculateScore(item)
                    });
                }
            }
        } catch (error) {
            console.error(`   Error fetching ${feedUrl}:`, error.message);
        }
    }

    return articles;
}

/**
 * Main function
 */
async function main() {
    console.log('📊 Starting Consultoras Fetch...');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('');

    const allArticles = [];
    const consultorasSummary = [];

    for (const consultora of CONSULTORA_FEEDS) {
        console.log(`Fetching from ${consultora.name}...`);
        const articles = await fetchConsultoraArticles(consultora);

        allArticles.push(...articles);
        consultorasSummary.push({
            id: consultora.id,
            name: consultora.name,
            logo: consultora.logo,
            website: consultora.website,
            articleCount: articles.length
        });

        console.log(`   Found ${articles.length} relevant articles`);
    }

    // Sort by score and take top articles
    allArticles.sort((a, b) => b.score - a.score);
    const topArticles = allArticles.slice(0, 20);

    // Generate output
    const output = {
        lastUpdated: new Date().toISOString(),
        totalArticles: topArticles.length,
        consultoras: consultorasSummary,
        articles: topArticles
    };

    // Write to public/data/consultoras.json
    const outputDir = path.join(__dirname, '..', 'public', 'data');
    const outputPath = path.join(outputDir, 'consultoras.json');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log('');
    console.log('✅ Consultoras Fetch Complete!');
    console.log(`   Total articles: ${topArticles.length}`);
    console.log(`   Output: ${outputPath}`);
}

main().catch(console.error);
