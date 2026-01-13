# YouTube Uploader - Scheduling Setup Guide

This guide will help you set up automatic scheduling for your YouTube uploader.

## Features

- **Scheduled Uploads**: Automatically uploads videos at 9:00 AM and 7:00 PM daily
- **Startup Catch-up**: Checks for missed uploads when your PC starts
- **System Notifications**: Get notified about upload success/failure
- **Error Logging**: All errors are logged to `logs/` directory

## Setup Instructions

### Step 1: Install Dependencies

Make sure all npm packages are installed:
```bash
npm install
```

### Step 2: Setup Cron Jobs (Scheduled Uploads)

Run the setup script to install cron jobs:
```bash
npm run setup-cron
```

Or manually:
```bash
bash setup-cron.sh
```

This will:
- Add cron jobs for 9:00 AM and 7:00 PM
- Log all cron runs to `logs/cron.log`

**Verify cron jobs:**
```bash
crontab -l
```

You should see two entries:
```
0 9 * * * cd /path/to/youtube-uploader && /usr/bin/node src/scheduled.js >> /path/to/youtube-uploader/logs/cron.log 2>&1
0 19 * * * cd /path/to/youtube-uploader && /usr/bin/node src/scheduled.js >> /path/to/youtube-uploader/logs/cron.log 2>&1
```

### Step 3: Setup Startup Catch-up (Optional but Recommended)

This will check for missed uploads when your PC starts:

```bash
npm run setup-startup
```

Or manually:
```bash
bash setup-startup.sh
```

This creates a systemd user service that runs on login.

**Verify service:**
```bash
systemctl --user status youtube-uploader-catchup
```

**Enable/Disable service:**
```bash
# Enable (runs on login)
systemctl --user enable youtube-uploader-catchup

# Disable
systemctl --user disable youtube-uploader-catchup

# Start manually
systemctl --user start youtube-uploader-catchup
```

### Step 4: Test the Setup

**Test scheduled run:**
```bash
npm run scheduled
```

**Test catch-up:**
```bash
npm run catch-up
```

## How It Works

### Scheduled Runs (9 AM & 7 PM)
- Cron jobs trigger at scheduled times
- Script runs and uploads next video
- Sends system notification on success/failure
- Logs everything to `logs/upload-YYYY-MM-DD.log`

### Startup Catch-up
- Runs when you log in to your system
- Checks if any scheduled times were missed
- If missed and videos available, uploads them
- Sends notification about catch-up run

### Notifications

You'll receive system notifications:
- **Success**: "YouTube Upload - Successful: Video uploaded successfully! Video ID: ..."
- **Failure**: "YouTube Upload - Failed: [error message]"
- **Catch-up**: Same notifications but with "Catch-up" in title

### Logs

All logs are stored in `logs/` directory:
- `logs/upload-YYYY-MM-DD.log` - Daily upload logs
- `logs/cron.log` - Cron execution logs
- `logs/startup.log` - Startup catch-up logs
- `logs/startup-error.log` - Startup catch-up errors

## Manual Commands

```bash
# Run scheduled upload manually
npm run scheduled

# Run catch-up manually
npm run catch-up

# Regular run (no scheduling)
npm start
```

## Troubleshooting

### Cron jobs not running
1. Check if cron service is running:
   ```bash
   sudo systemctl status cron
   ```

2. Check cron logs:
   ```bash
   tail -f logs/cron.log
   ```

3. Verify cron jobs:
   ```bash
   crontab -l
   ```

### Notifications not showing
- Make sure `notify-send` is installed:
  ```bash
  sudo apt install libnotify-bin
  ```

### Startup catch-up not working
1. Check service status:
   ```bash
   systemctl --user status youtube-uploader-catchup
   ```

2. Check logs:
   ```bash
   tail -f logs/startup.log
   tail -f logs/startup-error.log
   ```

3. Make sure systemd user services are enabled:
   ```bash
   sudo loginctl enable-linger $USER
   ```

## Removing Scheduled Jobs

**Remove cron jobs:**
```bash
crontab -e
# Delete the two lines with "src/scheduled.js"
```

**Remove startup service:**
```bash
systemctl --user disable youtube-uploader-catchup
systemctl --user stop youtube-uploader-catchup
rm ~/.config/systemd/user/youtube-uploader-catchup.service
systemctl --user daemon-reload
```

## Important Notes

- **PC must be ON**: Cron jobs only run when your PC is on and awake
- **Sleep mode**: If PC is sleeping, cron won't run (but catch-up will handle it)
- **Time zone**: Make sure your system timezone is correct
- **Permissions**: Ensure script has read/write permissions to videos and logs directories

