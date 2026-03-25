const git = require('isomorphic-git');
const fs = require('fs');
const http = require('isomorphic-git/http/node');

async function pushBackend() {
  const dir = 'e:/DOWNLOADS/الموقع الكتروني بتاع الاجينت المخصص لليوتيوب/نظام الداخلي للشركة/creziax-backend-repo';
  try {
    console.log('Pushing Backend with force: true...');
    const pushResult = await git.push({
      fs, http, dir, remote: 'origin', ref: 'main', force: true,
      onAuth: () => ({ username: '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' })
    });
    console.log('SUCCESS: Backend Push Result:', JSON.stringify(pushResult, null, 2));
  } catch (e) { 
    console.error('ERROR during Backend Push:', e.message); 
    if (e.stack) console.error(e.stack);
  }
}

pushBackend();
