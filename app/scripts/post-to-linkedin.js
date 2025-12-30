/**
 * LinkedIn Posting Script
 * Posts to LinkedIn Company Page using OAuth 2.0
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class LinkedInClient {
    constructor(accessToken, organizationId) {
        this.accessToken = accessToken;
        this.organizationId = organizationId;
        this.apiVersion = '202412'; // Use latest API version
    }

    // Upload image to LinkedIn
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
            const imageData = Buffer.from(imageBuffer);

            console.log(`📷 Image size: ${Math.round(imageData.length / 1024)}KB`);

            // Step 1: Initialize upload
            const initUrl = 'https://api.linkedin.com/rest/images?action=initializeUpload';
            const initBody = {
                initializeUploadRequest: {
                    owner: this.organizationId
                }
            };

            const initResponse = await fetch(initUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': this.apiVersion,
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(initBody)
            });

            if (!initResponse.ok) {
                const error = await initResponse.json();
                console.log(`⚠️ Failed to initialize image upload: ${JSON.stringify(error)}`);
                return null;
            }

            const initData = await initResponse.json();
            const uploadUrl = initData.value.uploadUrl;
            const imageUrn = initData.value.image;

            // Step 2: Upload the image binary
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/octet-stream'
                },
                body: imageData
            });

            if (!uploadResponse.ok) {
                console.log(`⚠️ Failed to upload image: ${uploadResponse.status}`);
                return null;
            }

            console.log(`✅ Image uploaded, URN: ${imageUrn}`);
            return imageUrn;

        } catch (error) {
            console.log(`⚠️ Error uploading image: ${error.message}`);
            return null;
        }
    }

    // Post to LinkedIn Company Page
    async post(text, imageUrl = null) {
        let imageUrn = null;

        // Upload image if provided
        if (imageUrl) {
            imageUrn = await this.uploadImage(imageUrl);
        }

        const url = 'https://api.linkedin.com/rest/posts';

        // Build post body
        const body = {
            author: this.organizationId,
            commentary: text,
            visibility: 'PUBLIC',
            distribution: {
                feedDistribution: 'MAIN_FEED',
                targetEntities: [],
                thirdPartyDistributionChannels: []
            },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false
        };

        // Add image if uploaded
        if (imageUrn) {
            body.content = {
                media: {
                    id: imageUrn
                }
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                'LinkedIn-Version': this.apiVersion,
                'X-Restli-Protocol-Version': '2.0.0'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`LinkedIn API error: ${JSON.stringify(error)}`);
        }

        // Get post ID from header
        const postId = response.headers.get('x-restli-id');
        return { id: postId };
    }
}

// Get image URL from content
function getImageUrl(content) {
    if (content.imageUrl) {
        return content.imageUrl;
    }

    if (content.url && content.url.includes('youtube.com/watch')) {
        const videoId = content.url.split('v=')[1]?.split('&')[0];
        if (videoId) {
            return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        }
    }

    return 'https://mbainative.com/images/logo-mbainative.png';
}

async function main() {
    // Get credentials from environment
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const organizationId = process.env.LINKEDIN_ORGANIZATION_ID;

    if (!accessToken || !organizationId) {
        console.error('❌ Missing LinkedIn credentials. Required:');
        console.error('   LINKEDIN_ACCESS_TOKEN');
        console.error('   LINKEDIN_ORGANIZATION_ID');
        process.exit(1);
    }

    // Load social content
    const contentPath = path.join(__dirname, '../public/data/social-content.json');

    if (!fs.existsSync(contentPath)) {
        console.error('❌ social-content.json not found. Run generate-social-content.js first.');
        process.exit(1);
    }

    const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));

    // LinkedIn allows longer posts, use contentLong if available or full content
    const hashtags = content.post.hashtags.slice(0, 5).map(h => `#${h}`).join(' ');

    // LinkedIn prefers longer, more professional content
    let postText = content.post.content;

    // Add link and hashtags
    if (content.post.url) {
        postText += `\n\n🔗 ${content.post.url}`;
    }
    postText += `\n\n${hashtags}`;

    console.log('📝 LinkedIn post to publish:');
    console.log('---');
    console.log(postText);
    console.log('---');
    console.log(`Length: ${postText.length} characters`);

    // Get image
    const imageUrl = getImageUrl(content.post);
    console.log(`🖼️ Image URL: ${imageUrl}`);

    // Post to LinkedIn
    const client = new LinkedInClient(accessToken, organizationId);

    try {
        const result = await client.post(postText, imageUrl);
        console.log('✅ LinkedIn post published successfully!');
        console.log(`   Post ID: ${result.id}`);
    } catch (error) {
        console.error('❌ Failed to post to LinkedIn:', error.message);
        process.exit(1);
    }
}

main();
