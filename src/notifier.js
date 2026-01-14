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

        // Check if we have DISPLAY (cron jobs don't have X11 access)
        const display = process.env.DISPLAY;
        if (!display) {
            // No DISPLAY available (likely running from cron)
            console.log(`[NOTIFICATION] ${title}: ${message}`);
            return;
        }

        try {
            // Set environment variables for the command
            const env = { 
                ...process.env, 
                DISPLAY: display,
                // DBUS_SESSION_BUS_ADDRESS might be needed for some systems
                DBUS_SESSION_BUS_ADDRESS: process.env.DBUS_SESSION_BUS_ADDRESS || ''
            };
            await execAsync(`notify-send --urgency=${urgency} "${title}" "${message}"`, { env });
        } catch (err) {
            // If notification fails, just log it (don't throw error)
            // This is expected in cron environments without X11
            console.log(`[NOTIFICATION] ${title}: ${message}`);
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

