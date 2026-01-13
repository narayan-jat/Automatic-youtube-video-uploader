import { config } from 'dotenv';
import Scheduler from './scheduler.js';
import run from './uploader.js';
import Logger from './logger.js';

config();

const logger = new Logger();
const scheduler = new Scheduler();

async function scheduledRun() {
    logger.info('Running scheduled upload...');
    
    try {
        await run(false); // false indicates this is a scheduled run
    } catch (error) {
        logger.error(`Scheduled upload failed: ${error.message}`, error);
        throw error;
    }
}

scheduledRun().catch(error => {
    logger.error(`Fatal error in scheduled run: ${error.message}`, error);
    process.exit(1);
});

