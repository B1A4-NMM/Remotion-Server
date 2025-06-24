#!/usr/bin/bash
cd /home/ubuntu/remotion-api
npm run build
pm2 stop remotion-api
pm2 delete remotion-api
pm2 start dist/main.js --name remotion-api