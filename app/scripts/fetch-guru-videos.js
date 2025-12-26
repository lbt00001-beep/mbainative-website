/**
 * Fetch YouTube videos for AI Gurus
 * Uses YouTube Data API v3
 * Runs daily via GitHub Actions
 */

const fs = require('fs');
const path = require('path');

// Guru search queries
const GURUS = [
    { id: "demis-hassabis", query: "Demis Hassabis AI interview" },
    { id: "yann-lecun", query: "Yann LeCun AI lecture" },
    { id: "yoshua-bengio", query: "Yoshua Bengio AI safety" },
    { id: "geoffrey-hinton", query: "Geoffrey Hinton AI warning" },
    { id: "gary-marcus", query: "Gary Marcus AI criticism" },
    { id: "sam-altman", query: "Sam Altman AI interview" },
    { id: "ilya-sutskever", query: "Ilya Sutskever AI interview" },
    { id: "dario-amodei", query: "Dario Amodei Anthropic interview" },
    { id: "karen-hao", query: "Karen Hao AI journalism" },
    { id: "mustafa-suleyman", query: "Mustafa Suleyman AI interview" },
    { id: "fei-fei-li", query: "Fei-Fei Li AI interview" },
    { id: "jensen-huang", query: "Jensen Huang NVIDIA AI" },
    { id: "andrew-ng", query: "Andrew Ng AI course lecture" },
    { id: "andrej-karpathy", query: "Andrej Karpathy AI tutorial" }
];

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MAX_VIDEOS_PER_GURU = 5;

/**
 * Search YouTube for videos
 */
async function searchYouTube(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=video&maxResults=${MAX_VIDEOS_PER_GURU}` +
        `&order=date&q=${encodeURIComponent(query)}` +
        `&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }
        const data = await response.json();

        return data.items?.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description?.slice(0, 150) + '...',
            thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
            publishedAt: item.snippet.publishedAt,
            channelTitle: item.snippet.channelTitle
        })) || [];
    } catch (error) {
        console.error(`  Error searching "${query}":`, error.message);
        return [];
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🎬 Starting YouTube Guru Videos Fetch...');
    console.log(`   Time: ${new Date().toISOString()}`);

    if (!YOUTUBE_API_KEY) {
        console.error('❌ YOUTUBE_API_KEY not set!');
        process.exit(1);
    }

    console.log('');

    const results = {};

    for (const guru of GURUS) {
        console.log(`Fetching videos for ${guru.id}...`);
        const videos = await searchYouTube(guru.query);
        results[guru.id] = videos;
        console.log(`  Found ${videos.length} videos`);

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
    }

    // Generate output
    const output = {
        lastUpdated: new Date().toISOString(),
        totalVideos: Object.values(results).flat().length,
        gurus: results
    };

    // Write to public/data/gurus-videos.json
    const outputDir = path.join(__dirname, '..', 'public', 'data');
    const outputPath = path.join(outputDir, 'gurus-videos.json');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log('');
    console.log('✅ YouTube Guru Videos Fetch Complete!');
    console.log(`   Total videos: ${output.totalVideos}`);
    console.log(`   Output: ${outputPath}`);
}

main().catch(console.error);
