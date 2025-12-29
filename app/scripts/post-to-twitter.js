const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Twitter OAuth 1.0a implementation
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
    getAuthHeader(method, url) {
        const oauthParams = {
            oauth_consumer_key: this.apiKey,
            oauth_nonce: crypto.randomBytes(16).toString('hex'),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
            oauth_token: this.accessToken,
            oauth_version: '1.0'
        };

        oauthParams.oauth_signature = this.generateSignature(method, url, oauthParams);

        const authHeader = 'OAuth ' + Object.keys(oauthParams)
            .sort()
            .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
            .join(', ');

        return authHeader;
    }

    async postTweet(text) {
        const url = 'https://api.twitter.com/2/tweets';
        const authHeader = this.getAuthHeader('POST', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Twitter API error: ${JSON.stringify(data)}`);
        }

        return data;
    }
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

    // Post tweet
    const client = new TwitterClient(apiKey, apiSecret, accessToken, accessTokenSecret);

    try {
        const result = await client.postTweet(finalTweet);
        console.log('✅ Tweet posted successfully!');
        console.log(`   Tweet ID: ${result.data.id}`);
        console.log(`   URL: https://twitter.com/i/web/status/${result.data.id}`);
    } catch (error) {
        console.error('❌ Failed to post tweet:', error.message);
        process.exit(1);
    }
}

main();
