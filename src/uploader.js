import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import OpenAIClient from './openaiClient.js';
import GeminiClient from './geminiClient.js';
import YouTubeClient from './youtubeClient.js';
import FacebookClient from './facebookClient.js';
import Tracker from './tracker.js';
import Logger from './logger.js';
import Notifier from './notifier.js';
import Scheduler from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VIDEOS_DIR = path.resolve(__dirname, '..', 'videos');

async function extractAudioIfFFmpeg(videoPath, outPath) {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        execSync(`ffmpeg -y -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${outPath}"`, { stdio: 'ignore' });
        return outPath;
    } catch (err) {
        return null;
    }
}

export default async function run(isCatchUp = false) {
    const logger = new Logger();
    const notifier = new Notifier();
    const scheduler = new Scheduler();
    
    const runType = isCatchUp ? 'catch-up' : 'scheduled';
    logger.info(`Starting ${runType} upload process`);

    try {
        const OPENAI_KEY = process.env.OPENAI_API_KEY;
        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const youtubeCreds = {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectUri: process.env.GOOGLE_REDIRECT_URI,
            refreshToken: process.env.REFRESH_TOKEN
        };

        if (!GEMINI_KEY) {
            const error = 'GEMINI_API_KEY not found in environment variables';
            logger.error(error);
            throw new Error(error);
        }

        if (!youtubeCreds.clientId || !youtubeCreds.clientSecret || !youtubeCreds.refreshToken) {
            const error = 'Missing YouTube credentials in environment variables';
            logger.error(error);
            throw new Error(error);
        }

        let openai = null;
        if (OPENAI_KEY) {
            openai = new OpenAIClient(OPENAI_KEY);
        }

        const gemini = new GeminiClient(GEMINI_KEY);
        const yt = new YouTubeClient(youtubeCreds);
        const tracker = new Tracker();

        // Initialize Facebook client if credentials are available
        let facebook = null;
        const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
        const facebookPageId = process.env.FACEBOOK_PAGE_ID;
        const enableFacebook = process.env.ENABLE_FACEBOOK === 'true';
        
        if (enableFacebook && facebookAccessToken) {
            facebook = new FacebookClient(facebookAccessToken, facebookPageId || null);
            logger.info('Facebook client initialized');
        }

        if (!fs.existsSync(VIDEOS_DIR)) {
            const error = `Videos directory does not exist: ${VIDEOS_DIR}`;
            logger.error(error);
            throw new Error('Videos directory not found');
        }

        const files = fs.readdirSync(VIDEOS_DIR).filter(f => /\.(mp4|mov|mkv|webm)$/i.test(f));
        
        if (files.length === 0) {
            logger.info('No video files found in directory');
            scheduler.updateLastRun();
            return;
        }
        
        const next = files.find(f => !tracker.isUploaded(f));
        if (!next) {
            logger.info('All videos have been uploaded');
            scheduler.updateLastRun();
            const message = 'All videos have been uploaded. No new videos to upload.';
            await notifier.notifySuccess(message, isCatchUp);
            return;
        }

        logger.info(`Processing video: ${next}`);
        const videoPath = path.join(VIDEOS_DIR, next);
        const tmpAudio = path.join(process.cwd(), 'tmp_audio.wav');
        let transcript = null;
        const audioPath = await extractAudioIfFFmpeg(videoPath, tmpAudio);
        
        if (audioPath) {
            if (gemini) {
                transcript = await gemini.transcribeAudio(audioPath);
            } else if (openai) {
                transcript = await openai.transcribeAudio(audioPath);
            }
        }

        const context = [
            `filename: ${next}`,
            transcript ? `transcript: ${transcript.slice(0, 1000)}...` : 'no transcript available'
        ].join('\n\n');

        const suggested = await gemini.generateTitleAndDescription(context);

        const title = suggested.title || next.replace(/\.[^.]+$/, '');
        const description = suggested.description || '';
        const tags = Array.isArray(suggested.tags) ? suggested.tags : (suggested.tags ? suggested.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
        const isForKids = false;
        const language = 'hi';

        await yt.authenticate();
        const res = await yt.uploadVideo(videoPath, title, description, tags, isForKids, language);
        const videoId = res.id || res.data?.id;

        logger.info(`YouTube upload successful. Video ID: ${videoId}`);

        // // Upload to Facebook as Reel if enabled
        // let facebookResult = null;
        // if (facebook) {
        //     try {
        //         logger.info('Uploading to Facebook as Reel...');
        //         facebookResult = await facebook.postReel(videoPath, {
        //             caption: `${title}\n\n${description}`,
        //             hashtags: tags,
        //             publishToFeed: true
        //         });
        //         logger.info(`Facebook Reel uploaded successfully. Reel ID: ${facebookResult.reelId}`);
        //     } catch (fbError) {
        //         logger.error(`Facebook upload failed: ${fbError.message}`, fbError);
        //         // Don't fail the whole process if Facebook upload fails
        //     }
        // }

        // Mark as uploaded and delete video file
        tracker.markUploaded(next);
        scheduler.updateLastUpload();
        scheduler.updateLastRun();
        
        try {
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
                logger.info(`Deleted video file: ${next}`);
            }
        } catch (err) {
            logger.error(`Failed to delete video file: ${err.message}`, err);
        }

        // Cleanup temporary audio file
        try { 
            if (fs.existsSync(tmpAudio)) {
                fs.unlinkSync(tmpAudio);
            }
        } catch (err) {
            // Ignore cleanup errors
        }

        let successMessage = `Video uploaded to YouTube! Video ID: ${videoId}`;
        // if (facebookResult) {
        //     successMessage += ` | Facebook Reel ID: ${facebookResult.reelId}`;
        // }
        logger.success(successMessage);
        await notifier.notifySuccess(successMessage, isCatchUp);

    } catch (error) {
        const errorMessage = `Upload failed: ${error.message}`;
        logger.error(errorMessage, error);
        await notifier.notifyError(errorMessage, isCatchUp);
        throw error;
    }
}