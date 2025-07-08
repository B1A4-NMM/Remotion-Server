module.exports = {
  apps: [
    {
      name: 'remotion-api',
      script: 'dist/src/main.js',
      interpreter: '/home/ubuntu/.nvm/versions/node/v20.19.3/bin/node', // ← Node 20 경로 명시
    },
  ],
};