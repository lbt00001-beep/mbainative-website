const fs = require('fs');
const path = require('path');

// Configuration for YouTubers
const YOUTUBERS = [
    {
        id: 'jon-hernandez',
        name: 'Jon Hernández',
        channelId: 'UCRvxAKBwiBurmJXjBTDpAlA',
        description: 'Podcast sobre IA, tecnología y emprendimiento desde España.',
        photo: '/images/gurus/jon-hernandez.jpg'
    },
    {
        id: 'lex-fridman',
        name: 'Lex Fridman',
        channelId: 'UCSHZKyawb77ixDdsGog4iWA',
        description: 'Investigador de MIT. Entrevistas profundas sobre IA, ciencia y filosofía.',
        photo: '/images/gurus/lex-fridman.jpg'
    }
];

async function fetchYoutuberVideos() {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.log('⚠️ YOUTUBE_API_KEY not set. Using placeholder data.');
        // Generate placeholder data
        const placeholderData = {
            lastUpdated: new Date().toISOString(),
            youtubers: {}
        };

        for (const youtuber of YOUTUBERS) {
            placeholderData.youtubers[youtuber.id] = {
                name: youtuber.name,
                description: youtuber.description,
                photo: youtuber.photo,
                videos: []
            };
        }

        return placeholderData;
    }

    console.log('🎬 Fetching YouTuber videos...');

    const result = {
        lastUpdated: new Date().toISOString(),
        youtubers: {}
    };

    for (const youtuber of YOUTUBERS) {
        console.log(`  → Fetching videos for ${youtuber.name}...`);

        try {
            // Get channel's uploads playlist
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${youtuber.channelId}&key=${apiKey}`;
            const channelRes = await fetch(channelUrl);
            const channelData = await channelRes.json();

            if (!channelData.items || channelData.items.length === 0) {
                console.log(`    ⚠️ Could not find channel for ${youtuber.name}`);
                continue;
            }

            const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

            // Get latest videos from uploads playlist
            const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`;
            const videosRes = await fetch(videosUrl);
            const videosData = await videosRes.json();

            if (!videosData.items) {
                console.log(`    ⚠️ No videos found for ${youtuber.name}`);
                continue;
            }

            const videos = videosData.items.map(item => ({
                videoId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                description: item.snippet.description.substring(0, 200) + '...',
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
                publishedAt: item.snippet.publishedAt
            }));

            result.youtubers[youtuber.id] = {
                name: youtuber.name,
                description: youtuber.description,
                photo: youtuber.photo,
                videos: videos
            };

            console.log(`    ✅ Found ${videos.length} videos`);

        } catch (error) {
            console.error(`    ❌ Error fetching ${youtuber.name}:`, error.message);
        }
    }

    return result;
}

async function main() {
    try {
        const data = await fetchYoutuberVideos();

        const outputPath = path.join(__dirname, '../public/data/youtubers.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

        console.log(`\n✅ Saved youtubers data to ${outputPath}`);
        console.log(`   Total YouTubers: ${Object.keys(data.youtubers).length}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
