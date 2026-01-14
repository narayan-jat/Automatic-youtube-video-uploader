import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

class FacebookClient {
    constructor(accessToken, pageId = null) {
        if (!accessToken) {
            throw new Error('Facebook access token is required');
        }
        this.accessToken = accessToken;
        this.pageId = pageId;
        this.baseUrl = 'https://graph.facebook.com/v21.0';
    }

    /**
     * Upload a video as a Facebook Reel
     * @param {string} videoPath - Path to video file
     * @param {Object} options - Reel options
     * @param {string} options.caption - Caption/text for the reel
     * @param {Array<string>} options.hashtags - Array of hashtags (without #)
     * @param {string} options.locationId - Facebook location ID (optional)
     * @param {string} options.thumbOffset - Thumbnail offset in seconds (optional)
     * @param {boolean} options.publishToFeed - Whether to publish to feed (default: true)
     * @param {string} options.targeting - Targeting options (optional)
     * @returns {Promise<Object>} Upload result with reel ID
     */
    async postReel(videoPath, options = {}) {
        const {
            caption = '',
            hashtags = [],
            locationId = null,
            thumbOffset = null,
            publishToFeed = true,
            targeting = null
        } = options;

        try {
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }

            // Format caption with hashtags
            let formattedCaption = caption;
            if (hashtags.length > 0) {
                const hashtagString = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ');
                formattedCaption = formattedCaption ? `${formattedCaption}\n\n${hashtagString}` : hashtagString;
            }

            // Facebook Reels API uses a simpler approach
            // Upload video directly with metadata
            const formData = new FormData();
            formData.append('video_file', fs.createReadStream(videoPath));
            formData.append('access_token', this.accessToken);
            formData.append('description', formattedCaption);
            formData.append('publish_to_feed', publishToFeed.toString());
            formData.append('upload_type', 'video_reel');

            if (locationId) {
                formData.append('location_id', locationId);
            }

            if (thumbOffset !== null) {
                formData.append('thumb_offset', thumbOffset.toString());
            }

            if (targeting) {
                formData.append('targeting', JSON.stringify(targeting));
            }

            const uploadResponse = await fetch(
                `${this.baseUrl}/${this.pageId || 'me'}/video_reels`,
                {
                    method: 'POST',
                    headers: {
                        ...formData.getHeaders()
                    },
                    body: formData
                }
            );

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Failed to upload reel: ${uploadResponse.status} ${errorText}`);
            }

            const uploadData = await uploadResponse.json();
            return {
                success: true,
                reelId: uploadData.id,
                permalink: uploadData.permalink || null
            };

        } catch (error) {
            console.error(`[ERROR] Facebook reel upload failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Upload a video as a regular Facebook post
     * @param {string} videoPath - Path to video file
     * @param {Object} options - Post options
     * @param {string} options.message - Post message/caption
     * @param {Array<string>} options.hashtags - Array of hashtags (without #)
     * @param {string} options.locationId - Facebook location ID (optional)
     * @param {string} options.thumbOffset - Thumbnail offset in seconds (optional)
     * @param {string} options.title - Video title (optional)
     * @param {string} options.description - Video description (optional)
     * @param {boolean} options.published - Whether to publish immediately (default: true)
     * @param {string} options.privacy - Privacy setting: 'EVERYONE', 'ALL_FRIENDS', 'FRIENDS_OF_FRIENDS', 'SELF' (default: 'EVERYONE')
     * @returns {Promise<Object>} Upload result with post ID
     */
    async postVideo(videoPath, options = {}) {
        const {
            message = '',
            hashtags = [],
            locationId = null,
            thumbOffset = null,
            title = null,
            description = null,
            published = true,
            privacy = 'EVERYONE'
        } = options;

        try {
            if (!fs.existsSync(videoPath)) {
                throw new Error(`Video file not found: ${videoPath}`);
            }

            // Format message with hashtags
            let formattedMessage = message;
            if (hashtags.length > 0) {
                const hashtagString = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ');
                formattedMessage = formattedMessage ? `${formattedMessage}\n\n${hashtagString}` : hashtagString;
            }

            // Step 1: Upload video file
            const formData = new FormData();
            formData.append('source', fs.createReadStream(videoPath));
            formData.append('access_token', this.accessToken);
            formData.append('description', formattedMessage);
            formData.append('published', published.toString());

            if (title) {
                formData.append('title', title);
            }

            if (description) {
                formData.append('description', description);
            }

            if (locationId) {
                formData.append('place', locationId);
            }

            if (thumbOffset !== null) {
                formData.append('thumb_offset', thumbOffset.toString());
            }

            if (privacy) {
                formData.append('privacy', JSON.stringify({ value: privacy }));
            }

            const uploadResponse = await fetch(
                `${this.baseUrl}/${this.pageId || 'me'}/videos`,
                {
                    method: 'POST',
                    headers: {
                        ...formData.getHeaders()
                    },
                    body: formData
                }
            );

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Failed to upload video: ${uploadResponse.status} ${errorText}`);
            }

            const uploadData = await uploadResponse.json();
            return {
                success: true,
                postId: uploadData.id,
                permalink: uploadData.permalink || null
            };

        } catch (error) {
            console.error(`[ERROR] Facebook video post failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Post a text/image post to Facebook
     * @param {Object} options - Post options
     * @param {string} options.message - Post message
     * @param {Array<string>} options.hashtags - Array of hashtags
     * @param {string} options.imagePath - Path to image file (optional)
     * @param {string} options.locationId - Facebook location ID (optional)
     * @param {string} options.link - Link to attach (optional)
     * @param {boolean} options.published - Whether to publish immediately (default: true)
     * @returns {Promise<Object>} Upload result with post ID
     */
    async postStatus(options = {}) {
        const {
            message = '',
            hashtags = [],
            imagePath = null,
            locationId = null,
            link = null,
            published = true
        } = options;

        try {
            // Format message with hashtags
            let formattedMessage = message;
            if (hashtags.length > 0) {
                const hashtagString = hashtags.map(tag => `#${tag.replace('#', '')}`).join(' ');
                formattedMessage = formattedMessage ? `${formattedMessage}\n\n${hashtagString}` : hashtagString;
            }

            const params = new URLSearchParams({
                access_token: this.accessToken,
                message: formattedMessage,
                published: published.toString()
            });

            if (locationId) {
                params.append('place', locationId);
            }

            if (link) {
                params.append('link', link);
            }

            let endpoint = `${this.baseUrl}/${this.pageId || 'me'}/feed`;

            // If image is provided, use photos endpoint
            if (imagePath && fs.existsSync(imagePath)) {
                endpoint = `${this.baseUrl}/${this.pageId || 'me'}/photos`;
                const formData = new FormData();
                formData.append('source', fs.createReadStream(imagePath));
                formData.append('access_token', this.accessToken);
                formData.append('message', formattedMessage);
                formData.append('published', published.toString());

                if (locationId) {
                    formData.append('place', locationId);
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        ...formData.getHeaders()
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Failed to post image: ${response.status} ${errorText}`);
                }

                const data = await response.json();
                return {
                    success: true,
                    postId: data.id,
                    permalink: data.permalink || null
                };
            }

            // Text post
            const response = await fetch(`${endpoint}?${params}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to post status: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            return {
                success: true,
                postId: data.id,
                permalink: data.permalink || null
            };

        } catch (error) {
            console.error(`[ERROR] Facebook status post failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get page access token from user access token
     * @param {string} userAccessToken - User access token
     * @returns {Promise<string>} Page access token
     */
    async getPageAccessToken(userAccessToken) {
        try {
            const response = await fetch(
                `${this.baseUrl}/me/accounts?access_token=${userAccessToken}`
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to get pages: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            if (data.data && data.data.length > 0) {
                return data.data[0].access_token;
            }

            throw new Error('No pages found for this user');
        } catch (error) {
            console.error(`[ERROR] Failed to get page access token: ${error.message}`);
            throw error;
        }
    }
}

export default FacebookClient;

