const git = require('isomorphic-git');
const fs = require('fs');
const http = require('isomorphic-git/http/node');

async function pushCode() {
  try {
    const dir = '.';
    await git.add({ fs, dir, filepath: 'src/dashboard/client/ClientProfile.jsx' });
    
    let sha = await git.commit({
      fs,
      dir,
      message: 'chore(client-portal): fully remove company logo card and unwanted branding from ClientProfile',
      author: {
        name: 'Creziax Bot',
        email: 'bot@creziax.local',
      }
    });

    let pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      onAuth: () => ({ username: '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' })
    });

    console.log('Push Result:', pushResult);
  } catch (err) {
    console.error('Error during git operations:', err);
  }
}

pushCode();
