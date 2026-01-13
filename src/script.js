import { config } from 'dotenv';
import run from './uploader.js';

// Load environment variables
const envResult = config();

// Run the uploader
run().catch(error => {
    console.error('\n========================================');
    console.error('❌ FATAL ERROR');
    console.error('========================================');
    console.error('[Main] Error uploading video:', error.message);
    if (error.stack) {
        console.error('[Main] Stack trace:');
        console.error(error.stack);
    }
    console.error('========================================\n');
    process.exit(1);
});
