#!/usr/bin/bash
cd /home/ubuntu/remotion-api
npm run build
pm2 start dist/main.js --name remotion-api