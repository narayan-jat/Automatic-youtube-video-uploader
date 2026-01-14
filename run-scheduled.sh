#!/bin/bash

# Wrapper script for scheduled runs that sets up X11/DBUS environment
# This allows notifications to work in cron jobs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Try to get user's DISPLAY from active session
# Method 1: From who command
USER_DISPLAY=$(who | grep "$USER" | head -1 | awk '{print $NF}' | sed 's/[()]//g')

# Method 2: From X11 socket
if [ -z "$USER_DISPLAY" ]; then
    X_SOCKET=$(ls -t /tmp/.X11-unix/X* 2>/dev/null | head -1)
    if [ -n "$X_SOCKET" ]; then
        DISPLAY_NUM=$(echo "$X_SOCKET" | sed 's|/tmp/.X11-unix/X||')
        USER_DISPLAY=":${DISPLAY_NUM}"
    fi
fi

# Method 3: Default fallback
if [ -z "$USER_DISPLAY" ]; then
    USER_DISPLAY=":0"
fi

# Try to get DBUS session address
# Method 1: From active gnome/kde session
DBUS_SESSION=""
for pid in $(pgrep -u "$USER" -f "gnome-session\|kde-session\|xfce-session" 2>/dev/null | head -1); do
    if [ -n "$pid" ] && [ -f "/proc/$pid/environ" ]; then
        DBUS_SESSION=$(grep -z DBUS_SESSION_BUS_ADDRESS "/proc/$pid/environ" 2>/dev/null | cut -d= -f2- | tr -d '\0')
        break
    fi
done

# Method 2: From systemd user session
if [ -z "$DBUS_SESSION" ] && [ -n "$XDG_RUNTIME_DIR" ]; then
    DBUS_SESSION="unix:path=${XDG_RUNTIME_DIR}/bus"
fi

# Export environment variables
export DISPLAY="$USER_DISPLAY"
if [ -n "$DBUS_SESSION" ]; then
    export DBUS_SESSION_BUS_ADDRESS="$DBUS_SESSION"
fi

# Export PATH to ensure node is found
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Run the scheduled script
exec node src/scheduled.js

