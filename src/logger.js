import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.resolve(__dirname, '..', 'logs');

class Logger {
    constructor() {
        this.logsDir = LOGS_DIR;
        this.ensureLogsDirectory();
    }

    ensureLogsDirectory() {
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
    }

    getLogFileName() {
        const today = new Date().toISOString().split('T')[0];
        return path.join(this.logsDir, `upload-${today}.log`);
    }

    log(level, message, error = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}${error ? '\n' + error.stack : ''}\n`;
        
        try {
            fs.appendFileSync(this.getLogFileName(), logEntry);
        } catch (err) {
            console.error(`[ERROR] Failed to write to log file: ${err.message}`);
        }
    }

    info(message) {
        this.log('INFO', message);
    }

    error(message, err = null) {
        this.log('ERROR', message, err);
    }

    success(message) {
        this.log('SUCCESS', message);
    }
}

export default Logger;

