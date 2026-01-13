import { config } from 'dotenv';
import { google } from 'googleapis';
import http from 'http';
import url from 'url';

// Load environment variables
config();

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function getRefreshToken() {
    console.log('\n========================================');
    console.log('🔐 YouTube OAuth2 - Get Refresh Token');
    console.log('========================================\n');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('[ERROR] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env file');
        process.exit(1);
    }

    console.log('[STEP 1] Creating OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        REDIRECT_URI
    );

    // Generate the auth URL
    console.log('[STEP 2] Generating authorization URL...');
    const scopes = [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent' // Force consent to get refresh token
    });

    console.log('[STEP 2] ✓ Authorization URL generated\n');
    console.log('========================================');
    console.log('📋 INSTRUCTIONS:');
    console.log('========================================');
    console.log('1. A browser window will open automatically');
    console.log('2. Sign in with your Google account');
    console.log('3. Grant permissions to access YouTube');
    console.log('4. You will be redirected back to this app');
    console.log('5. Your refresh token will be displayed\n');
    console.log('If browser doesn\'t open, visit this URL manually:');
    console.log(authUrl);
    console.log('\nWaiting for authorization...\n');

    // Start a local server to receive the callback
    return new Promise((resolve, reject) => {
        const server = http.createServer(async (req, res) => {
            try {
                if (req.url.indexOf('/oauth2callback') > -1) {
                    const qs = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
                    const code = qs.get('code');
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body>
                                <h1>Authorization Successful!</h1>
                                <p>You can close this window and return to the terminal.</p>
                                <script>setTimeout(() => window.close(), 2000);</script>
                            </body>
                        </html>
                    `);
                    server.close();

                    if (code) {
                        console.log('[STEP 3] Authorization code received, exchanging for tokens...');
                        const { tokens } = await oauth2Client.getToken(code);
                        
                        if (tokens.refresh_token) {
                            console.log('\n========================================');
                            console.log('✅ SUCCESS! Your Refresh Token:');
                            console.log('========================================\n');
                            console.log(tokens.refresh_token);
                            console.log('\n========================================');
                            console.log('📝 Add this to your .env file:');
                            console.log('========================================\n');
                            console.log(`REFRESH_TOKEN=${tokens.refresh_token}\n`);
                            resolve(tokens.refresh_token);
                        } else {
                            console.error('\n[ERROR] No refresh token received!');
                            console.error('You may need to revoke access and try again.');
                            console.error('Make sure to use "prompt: consent" in the auth URL.\n');
                            reject(new Error('No refresh token received'));
                        }
                    } else {
                        reject(new Error('No authorization code received'));
                    }
                }
            } catch (e) {
                reject(e);
            }
        }).listen(PORT, () => {
            console.log(`[STEP 3] Local server started on port ${PORT}`);
            console.log('[STEP 3] Opening browser...\n');
            
            // Instructions to open browser manually
            console.log('Please copy and paste the URL above into your browser.\n');
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[ERROR] Port ${PORT} is already in use.`);
                console.error('Please close any application using this port and try again.\n');
            }
            reject(err);
        });
    });
}

getRefreshToken()
    .then((refreshToken) => {
        console.log('\n✅ Refresh token obtained successfully!');
        console.log('Copy the REFRESH_TOKEN value above and add it to your .env file.\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    });

