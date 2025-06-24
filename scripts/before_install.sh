#!/usr/bin/bash
pm2 stop all || true
echo "Removing old app files..."
rm -rf /home/ubuntu/remotion-api/*