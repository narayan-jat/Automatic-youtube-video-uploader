import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEDULE_FILE = path.resolve(__dirname, '..', 'data', 'schedule.json');

// Scheduled times in 24-hour format
const SCHEDULED_TIMES = [
    { hour: 9, minute: 0, label: '9:00 AM' },
    { hour: 19, minute: 0, label: '7:00 PM' }
];

class Scheduler {
    constructor() {
        this.scheduleFile = SCHEDULE_FILE;
        this.ensureScheduleFile();
    }

    ensureScheduleFile() {
        const dir = path.dirname(this.scheduleFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.scheduleFile)) {
            this.saveSchedule({ lastUpload: null, lastRun: null });
        }
    }

    loadSchedule() {
        try {
            const data = fs.readFileSync(this.scheduleFile, 'utf8');
            return JSON.parse(data);
        } catch {
            return { lastUpload: null, lastRun: null };
        }
    }

    saveSchedule(schedule) {
        fs.writeFileSync(this.scheduleFile, JSON.stringify(schedule, null, 2));
    }

    updateLastUpload() {
        const schedule = this.loadSchedule();
        schedule.lastUpload = new Date().toISOString();
        this.saveSchedule(schedule);
    }

    updateLastRun() {
        const schedule = this.loadSchedule();
        schedule.lastRun = new Date().toISOString();
        this.saveSchedule(schedule);
    }

    getScheduledTimes() {
        return SCHEDULED_TIMES;
    }

    getNextScheduledTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        for (const scheduled of SCHEDULED_TIMES) {
            if (currentHour < scheduled.hour || 
                (currentHour === scheduled.hour && currentMinute < scheduled.minute)) {
                return scheduled;
            }
        }

        // If all times passed today, return first time tomorrow
        return SCHEDULED_TIMES[0];
    }

    shouldRunCatchUp() {
        const schedule = this.loadSchedule();
        const now = new Date();
        
        // If never run before, don't catch up (first run should be scheduled)
        if (!schedule.lastRun) {
            return false;
        }

        const lastRun = new Date(schedule.lastRun);
        const nowTime = now.getTime();
        const lastRunTime = lastRun.getTime();

        // Check if we missed any scheduled times since last run
        for (const scheduled of SCHEDULED_TIMES) {
            // Create scheduled time for today
            const scheduledToday = new Date(now);
            scheduledToday.setHours(scheduled.hour, scheduled.minute, 0, 0);
            
            // Create scheduled time for yesterday (in case we're checking early morning)
            const scheduledYesterday = new Date(now);
            scheduledYesterday.setDate(scheduledYesterday.getDate() - 1);
            scheduledYesterday.setHours(scheduled.hour, scheduled.minute, 0, 0);

            // Check if today's scheduled time passed and was after last run
            if (scheduledToday > lastRun && scheduledToday < now) {
                return true;
            }

            // Check if yesterday's scheduled time passed and was after last run
            if (scheduledYesterday > lastRun && scheduledYesterday < now) {
                return true;
            }
        }

        return false;
    }

    isScheduledTime() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        for (const scheduled of SCHEDULED_TIMES) {
            // Allow 5 minute window for cron execution
            if (currentHour === scheduled.hour && 
                currentMinute >= scheduled.minute && 
                currentMinute < scheduled.minute + 5) {
                return true;
            }
        }

        return false;
    }
}

export default Scheduler;

