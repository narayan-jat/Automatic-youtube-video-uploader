import { config } from 'dotenv';
import Scheduler from './scheduler.js';
import run from './uploader.js';
import Logger from './logger.js';

config();

const logger = new Logger();
const scheduler = new Scheduler();

async function catchUp() {
    logger.info('Checking for missed uploads...');
    
    if (!scheduler.shouldRunCatchUp()) {
        logger.info('No missed uploads detected');
        return;
    }

    logger.info('Missed uploads detected, running catch-up...');
    
    try {
        // Run until no more videos to upload
        let attempts = 0;
        const maxAttempts = 10; // Prevent infinite loops
        
        while (attempts < maxAttempts) {
            try {
                await run(true); // true indicates this is a catch-up run
                attempts++;
                // Small delay between uploads
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                // Check if it's a "no videos" error (uploader returns without error when no videos)
                if (error.message && (
                    error.message.includes('No new videos') || 
                    error.message.includes('All videos have been uploaded')
                )) {
                    logger.info('No more videos to upload');
                    break;
                }
                logger.error(`Catch-up upload failed: ${error.message}`, error);
                throw error;
            }
        }
        logger.info('Catch-up completed successfully');
    } catch (error) {
        logger.error(`Catch-up failed: ${error.message}`, error);
        throw error;
    }
}

catchUp().catch(error => {
    logger.error(`Fatal error in catch-up: ${error.message}`, error);
    process.exit(1);
});

