#!/bin/bash

# Setup script for YouTube Uploader cron jobs
# This script will add cron jobs for scheduled uploads at 9 AM and 7 PM

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_PATH=$(which node)
ENV_FILE="$SCRIPT_DIR/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Check if node is available
if [ -z "$NODE_PATH" ]; then
    echo "Error: Node.js not found. Please install Node.js first."
    exit 1
fi

# Create cron job entries
CRON_JOB_1="0 9 * * * cd $SCRIPT_DIR && $NODE_PATH src/scheduled.js >> $SCRIPT_DIR/logs/cron.log 2>&1"
CRON_JOB_2="0 19 * * * cd $SCRIPT_DIR && $NODE_PATH src/scheduled.js >> $SCRIPT_DIR/logs/cron.log 2>&1"

# Check if cron jobs already exist
if crontab -l 2>/dev/null | grep -q "src/scheduled.js"; then
    echo "Cron jobs already exist. Removing old entries..."
    crontab -l 2>/dev/null | grep -v "src/scheduled.js" | crontab -
fi

# Add new cron jobs
(crontab -l 2>/dev/null; echo "$CRON_JOB_1"; echo "$CRON_JOB_2") | crontab -

echo "✅ Cron jobs installed successfully!"
echo ""
echo "Scheduled times:"
echo "  - 9:00 AM (09:00)"
echo "  - 7:00 PM (19:00)"
echo ""
echo "To view your cron jobs, run: crontab -l"
echo "To remove cron jobs, run: crontab -e (then delete the lines)"

