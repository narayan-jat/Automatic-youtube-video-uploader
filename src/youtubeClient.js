import fs from 'fs';
import { google } from 'googleapis';

class YouTubeClient {
    constructor({ clientId, clientSecret, redirectUri, refreshToken }) {
        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        if (refreshToken) {
            this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        }
        this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
    }

    async authenticate() {
        try {
            const tokenInfo = await this.oauth2Client.getAccessToken();
            this.accessToken = tokenInfo?.token;
            if (this.accessToken) {
                try {
                    const channelResponse = await this.youtube.channels.list({
                        part: ['snippet', 'contentDetails', 'statistics'],
                        mine: true
                    });
                    
                    if (channelResponse.data.items && channelResponse.data.items.length > 0) {
                        const channel = channelResponse.data.items[0];
                        this.channelId = channel.id;
                        this.channelTitle = channel.snippet?.title || 'Unknown';
                        this.channelUrl = `https://www.youtube.com/channel/${channel.id}`;
                    }
                } catch (channelErr) {
                    // Ignore channel info errors
                }
            }
            return this.accessToken;
        } catch (err) {
            console.error(`[ERROR] YouTube authentication failed: ${err.message}`);
            throw err;
        }
    }

    async uploadVideo(videoPath, title, description, tags = [], isForKids = false, language = 'en') {
        try {
            const res = await this.youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title,
                        description,
                        tags,
                        categoryId: '22',
                        defaultLanguage: language
                    },
                    status: {
                        privacyStatus: 'public',
                        madeForKids: isForKids
                    }
                },
                media: {
                    body: fs.createReadStream(videoPath)
                }
            });

            if (!res || !res.data) {
                throw new Error('Upload failed: No response data');
            }
            
            return res.data;
        } catch (err) {
            console.error(`[ERROR] Video upload failed: ${err.message}`);
            if (err.response) {
                console.error(`[ERROR] API Error: ${JSON.stringify(err.response.data, null, 2)}`);
            }
            throw err;
        }
    }
}

export default YouTubeClient;