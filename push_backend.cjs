const git = require('isomorphic-git');
const fs = require('fs');
const http = require('isomorphic-git/http/node');

async function pushBackend() {
  const dir = 'e:/DOWNLOADS/الموقع الكتروني بتاع الاجينت المخصص لليوتيوب/نظام الداخلي للشركة/creziax-backend-repo';
  try {
    await git.add({ fs, dir, filepath: 'server.js' });
    
    // Attempting to commit (may fail if nothing new since last script run)
    try {
      await git.commit({
        fs,
        dir,
        message: 'feat(backend): implement socket authentication and smart routing for Global Pulse',
        author: { name: 'Creziax Bot', email: 'bot@creziax.local' }
      });
      console.log('Backend commit successful.');
    } catch (e) {
      console.log('Backend commit skipped or already committed.');
    }

    console.log('Pushing Backend with force: true...');
    const pushResult = await git.push({
      fs, http, dir, remote: 'origin', ref: 'main', force: true,
      onAuth: () => ({ username: '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' })
    });
    console.log('Backend Push Result:', pushResult);
  } catch (e) { console.error('Backend Push Error:', e); }
}

pushBackend();
