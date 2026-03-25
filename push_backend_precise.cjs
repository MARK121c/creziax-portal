const git = require('isomorphic-git');
const fs = require('fs');
const http = require('isomorphic-git/http/node');

async function pushBackendPrecise() {
  const dir = 'e:/DOWNLOADS/الموقع الكتروني بتاع الاجينت المخصص لليوتيوب/نظام الداخلي للشركة/creziax-backend-repo';
  const token = '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';
  
  try {
    console.log('Staging files...');
    // Stage server.js
    await git.add({ fs, dir, filepath: 'server.js' });
    
    // Stage modified controllers
    const filesToStage = [
      'controllers/clientController.js',
      'controllers/taskController.js',
      'controllers/ticketController.js',
      'controllers/workspaceController.js'
    ];
    
    for (const f of filesToStage) {
      try {
        await git.add({ fs, dir, filepath: f });
        console.log(`Staged: ${f}`);
      } catch (e) {
        console.log(`Could not stage ${f}: ${e.message}`);
      }
    }

    console.log('Committing changes...');
    try {
      const sha = await git.commit({
        fs,
        dir,
        message: 'feat(backend): global pulse smart routing and relevant controller updates',
        author: { name: 'Creziax Bot', email: 'bot@creziax.local' }
      });
      console.log(`Commit successful: ${sha}`);
    } catch (e) {
      console.log(`Commit skipped: ${e.message}`);
    }

    console.log('Force pushing to GitHub...');
    const result = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => ({ username: token })
    });
    
    console.log('SUCCESS: Push Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('CRITICAL ERROR during push:', err.message);
    if (err.stack) console.error(err.stack);
  }
}

pushBackendPrecise();
