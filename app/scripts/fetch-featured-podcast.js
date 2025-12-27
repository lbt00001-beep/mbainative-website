/**
 * Fetch the latest video from a YouTube playlist
 * Extracts key points from video description
 * Uses YouTube Data API v3
 * Runs daily via GitHub Actions
 */

const fs = require('fs');
const path = require('path');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = 'PL9WNEV0osabYA5YR5EBu3Lu_xYwAYPWoH';

/**
 * Get the latest video from the playlist
 */
async function getLatestPlaylistVideo() {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?` +
        `part=snippet&maxResults=1&playlistId=${PLAYLIST_ID}` +
        `&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item) {
        throw new Error('No videos found in playlist');
    }

    return {
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description || '',
        thumbnail: item.snippet.thumbnails?.maxres?.url ||
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: 'Podcast IA | Jon Hernández'
    };
}

/**
 * Extract key points from video description
 * Looks for bullet points, numbered lists, or lines starting with emoji/symbols
 */
function extractKeyPointsFromDescription(description) {
    if (!description) return [];

    const lines = description.split('\n');
    const keyPoints = [];

    // Common emojis used for bullet points
    const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check for bullet points: -, *, •, numbered lists (1., 2.), or emoji starts
        const isBullet = /^[-*•►▶→✓✔☑️]/.test(trimmed);
        const isNumbered = /^\d+[.)]\s/.test(trimmed);
        const isEmoji = emojiPattern.test(trimmed);
        const isTimestamp = /^\d{1,2}:\d{2}/.test(trimmed); // Skip timestamps like "0:00"

        if ((isBullet || isNumbered || isEmoji) && !isTimestamp) {
            // Clean up the line
            let cleanedLine = trimmed
                .replace(/^[-*•►▶→✓✔☑️]\s*/, '')  // Remove bullet
                .replace(/^\d+[.)]\s*/, '')         // Remove number
                .trim();

            if (cleanedLine.length > 10 && cleanedLine.length < 300) {
                // Extract emoji if present at start
                let icon = '💡';
                const emojiMatch = trimmed.match(emojiPattern);
                if (emojiMatch) {
                    icon = emojiMatch[0];
                    cleanedLine = cleanedLine.replace(emojiPattern, '').trim();
                }

                // Split into title and description if there's a colon or dash
                let title = cleanedLine;
                let desc = '';

                const separatorMatch = cleanedLine.match(/^([^:–—-]{5,50})[:\–—-]\s*(.+)/);
                if (separatorMatch) {
                    title = separatorMatch[1].trim();
                    desc = separatorMatch[2].trim();
                }

                keyPoints.push({
                    icon,
                    title: title.slice(0, 60),
                    description: desc || title
                });
            }
        }
    }

    // Return first 5-7 key points
    return keyPoints.slice(0, 7);
}

/**
 * Main function
 */
async function main() {
    console.log('🎙️ Starting Featured Podcast Fetch...');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log(`   Playlist: ${PLAYLIST_ID}`);

    if (!YOUTUBE_API_KEY) {
        console.error('❌ YOUTUBE_API_KEY not set!');
        console.log('   Skipping update...');
        return;
    }

    console.log('');

    try {
        // 1. Get latest video
        const latestVideo = await getLatestPlaylistVideo();
        console.log(`   Found: ${latestVideo.title}`);

        // 2. Extract key points from description
        const keyPoints = extractKeyPointsFromDescription(latestVideo.description);
        console.log(`   Extracted ${keyPoints.length} key points from description`);

        // 3. Save output
        const outputPath = path.join(__dirname, '..', 'public', 'data', 'featured-podcast.json');

        const output = {
            lastUpdated: new Date().toISOString(),
            playlistId: PLAYLIST_ID,
            playlistTitle: 'Podcast IA | Jon Hernández',
            latestVideo,
            keyPoints
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

        console.log('');
        console.log('✅ Featured Podcast Fetch Complete!');
        console.log(`   Video: ${latestVideo.title}`);
        console.log(`   Key Points: ${keyPoints.length}`);
        console.log(`   Output: ${outputPath}`);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main().catch(console.error);
