const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Twitter OAuth 1.0a implementation with image support
class TwitterClient {
    constructor(apiKey, apiSecret, accessToken, accessTokenSecret) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.accessToken = accessToken;
        this.accessTokenSecret = accessTokenSecret;
    }

    // Generate OAuth 1.0a signature
    generateSignature(method, url, params) {
        const signatureBaseString = [
            method.toUpperCase(),
            encodeURIComponent(url),
            encodeURIComponent(
                Object.keys(params)
                    .sort()
                    .map(key => `${key}=${encodeURIComponent(params[key])}`)
                    .join('&')
            )
        ].join('&');

        const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(this.accessTokenSecret)}`;

        return crypto
            .createHmac('sha1', signingKey)
            .update(signatureBaseString)
            .digest('base64');
    }

    // Generate OAuth header
    getAuthHeader(method, url, additionalParams = {}) {
        const oauthParams = {
            oauth_consumer_key: this.apiKey,
            oauth_nonce: crypto.randomBytes(16).toString('hex'),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_token: this.accessToken,
            oauth_version: '1.0'
        };

        // Include additional params in signature calculation
        const allParams = { ...oauthParams, ...additionalParams };
        oauthParams.oauth_signature = this.generateSignature(method, url, allParams);

        const authHeader = 'OAuth ' + Object.keys(oauthParams)
            .sort()
            .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
            .join(', ');

        return authHeader;
    }

    // Upload image to Twitter and return media_id
    async uploadImage(imageUrl) {
        try {
            console.log(`📷 Downloading image from: ${imageUrl}`);

            // Download image
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                console.log(`⚠️ Failed to download image: ${imageResponse.status}`);
                return null;
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');

            console.log(`📷 Image size: ${Math.round(base64Image.length / 1024)}KB`);

            // Check if image is too large (Twitter limit is 5MB for images)
            if (base64Image.length > 5 * 1024 * 1024 * 1.37) { // base64 is ~37% larger
                console.log('⚠️ Image too large, skipping...');
                return null;
            }

            // Upload to Twitter media endpoint
            const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
            const formData = new URLSearchParams();
            formData.append('media_data', base64Image);

            const authHeader = this.getAuthHeader('POST', uploadUrl);

            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            });

            const data = await response.json();

            if (!response.ok) {
                console.log(`⚠️ Failed to upload image: ${JSON.stringify(data)}`);
                return null;
            }

            console.log(`✅ Image uploaded, media_id: ${data.media_id_string}`);
            return data.media_id_string;

        } catch (error) {
            console.log(`⚠️ Error uploading image: ${error.message}`);
            return null;
        }
    }

    // Post tweet with optional image
    async postTweet(text, mediaId = null) {
        const url = 'https://api.twitter.com/2/tweets';
        const authHeader = this.getAuthHeader('POST', url);

        const body = { text };

        // Add media if we have it
        if (mediaId) {
            body.media = { media_ids: [mediaId] };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Twitter API error: ${JSON.stringify(data)}`);
        }

        return data;
    }
}

// Get image URL from content if available
function getImageUrl(content) {
    // Check for imageUrl field first (highest priority)
    if (content.imageUrl) {
        return content.imageUrl;
    }

    // Check for YouTube thumbnail (from guru videos or podcasts)
    if (content.url && content.url.includes('youtube.com/watch')) {
        const videoId = content.url.split('v=')[1]?.split('&')[0];
        if (videoId) {
            return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        }
    }

    // Fallback to brand logo (hosted on website)
    // Note: This needs to be a publicly accessible URL
    return 'https://mbainative.com/images/logo-mbainative.png';
}

async function main() {
    // Get credentials from environment
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
        console.error('❌ Missing Twitter credentials. Required:');
        console.error('   TWITTER_API_KEY');
        console.error('   TWITTER_API_SECRET');
        console.error('   TWITTER_ACCESS_TOKEN');
        console.error('   TWITTER_ACCESS_TOKEN_SECRET');
        process.exit(1);
    }

    // Load social content
    const contentPath = path.join(__dirname, '../public/data/social-content.json');

    if (!fs.existsSync(contentPath)) {
        console.error('❌ social-content.json not found. Run generate-social-content.js first.');
        process.exit(1);
    }

    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

    // Build tweet text
    const hashtags = content.post.hashtags.slice(0, 5).map(h => `#${h}`).join(' ');
    const tweetText = `${content.post.content}\n\n${hashtags}`;

    // Check character limit
    if (tweetText.length > 280) {
        console.log('⚠️ Tweet too long, truncating...');
    }

    const finalTweet = tweetText.substring(0, 280);

    console.log('📝 Tweet to post:');
    console.log('---');
    console.log(finalTweet);
    console.log('---');
    console.log(`Length: ${finalTweet.length}/280`);

    // Create client
    const client = new TwitterClient(apiKey, apiSecret, accessToken, accessTokenSecret);

    // Try to upload image if available
    const imageUrl = getImageUrl(content.post);
    let mediaId = null;

    if (imageUrl) {
        console.log(`🖼️ Found image URL: ${imageUrl}`);
        mediaId = await client.uploadImage(imageUrl);
    } else {
        console.log('ℹ️ No image available for this post');
    }

    // Post tweet
    try {
        const result = await client.postTweet(finalTweet, mediaId);
        console.log('✅ Tweet posted successfully!');
        console.log(`   Tweet ID: ${result.data.id}`);
        console.log(`   URL: https://twitter.com/i/web/status/${result.data.id}`);
        if (mediaId) {
            console.log('   📷 Posted with image!');
        }
    } catch (error) {
        console.error('❌ Failed to post tweet:', error.message);
        process.exit(1);
    }
}

main();
