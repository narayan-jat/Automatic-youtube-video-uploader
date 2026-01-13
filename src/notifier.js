import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class Notifier {
    constructor() {
        this.supportsNotifications = null;
    }

    async checkSupport() {
        if (this.supportsNotifications !== null) {
            return this.supportsNotifications;
        }

        try {
            await execAsync('which notify-send');
            this.supportsNotifications = true;
        } catch {
            this.supportsNotifications = false;
        }

        return this.supportsNotifications;
    }

    async notify(title, message, urgency = 'normal') {
        const supported = await this.checkSupport();
        
        if (!supported) {
            console.log(`[NOTIFICATION] ${title}: ${message}`);
            return;
        }

        try {
            await execAsync(`notify-send --urgency=${urgency} "${title}" "${message}"`);
        } catch (err) {
            console.error(`[ERROR] Failed to send notification: ${err.message}`);
        }
    }

    async notifySuccess(message, isCatchUp = false) {
        const title = isCatchUp 
            ? 'YouTube Upload - Catch-up Successful' 
            : 'YouTube Upload - Successful';
        await this.notify(title, message, 'normal');
    }

    async notifyError(message, isCatchUp = false) {
        const title = isCatchUp 
            ? 'YouTube Upload - Catch-up Failed' 
            : 'YouTube Upload - Failed';
        await this.notify(title, message, 'critical');
    }
}

export default Notifier;

