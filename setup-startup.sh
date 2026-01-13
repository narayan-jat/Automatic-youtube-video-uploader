#!/bin/bash

# Setup script for startup catch-up
# This script creates a systemd user service for startup catch-up

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_PATH=$(which node)
USER=$(whoami)
SERVICE_NAME="youtube-uploader-catchup"
SERVICE_FILE="$HOME/.config/systemd/user/$SERVICE_NAME.service"

# Create systemd user directory if it doesn't exist
mkdir -p "$HOME/.config/systemd/user"

# Create service file
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=YouTube Uploader Catch-up Service
After=network.target

[Service]
Type=oneshot
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NODE_PATH $SCRIPT_DIR/src/catchup.js
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
StandardOutput=append:$SCRIPT_DIR/logs/startup.log
StandardError=append:$SCRIPT_DIR/logs/startup-error.log

[Install]
WantedBy=default.target
EOF

# Reload systemd
systemctl --user daemon-reload

# Enable the service
systemctl --user enable "$SERVICE_NAME.service"

echo "✅ Startup catch-up service installed successfully!"
echo ""
echo "Service name: $SERVICE_NAME"
echo "Service file: $SERVICE_FILE"
echo ""
echo "To start the service manually: systemctl --user start $SERVICE_NAME"
echo "To check service status: systemctl --user status $SERVICE_NAME"
echo "To disable the service: systemctl --user disable $SERVICE_NAME"

