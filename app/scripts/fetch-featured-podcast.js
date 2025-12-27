/**
 * Fetch the latest video from a YouTube playlist
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
        description: item.snippet.description?.slice(0, 300) + '...',
        thumbnail: item.snippet.thumbnails?.maxres?.url ||
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelOwnerChannelId ? 'Podcast IA | Jon Hernández' : item.snippet.videoOwnerChannelTitle
    };
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
        console.log('   Using existing data...');
        return;
    }

    console.log('');

    try {
        const latestVideo = await getLatestPlaylistVideo();
        console.log(`   Found: ${latestVideo.title}`);

        // Read existing file to preserve keyInsights
        const outputPath = path.join(__dirname, '..', 'public', 'data', 'featured-podcast.json');
        let existingData = { keyInsights: [] };

        if (fs.existsSync(outputPath)) {
            try {
                existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            } catch (e) {
                console.log('   Could not read existing file, creating new...');
            }
        }

        // Generate output, preserving keyInsights
        const output = {
            lastUpdated: new Date().toISOString(),
            playlistId: PLAYLIST_ID,
            playlistTitle: 'Podcast IA | Jon Hernández',
            latestVideo,
            keyInsights: existingData.keyInsights || []
        };

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

        console.log('');
        console.log('✅ Featured Podcast Fetch Complete!');
        console.log(`   Video: ${latestVideo.title}`);
        console.log(`   Output: ${outputPath}`);
    } catch (error) {
        console.error('❌ Error fetching podcast:', error.message);
    }
}

main().catch(console.error);
