const git = require('isomorphic-git');
const fs = require('fs');
const http = require('isomorphic-git/http/node');

async function pushPortal() {
  const dir = 'e:/DOWNLOADS/الموقع الكتروني بتاع الاجينت المخصص لليوتيوب/نظام الداخلي للشركة/creziax-portal';
  try {
    await git.add({ fs, dir, filepath: 'src/App.jsx' });
    await git.add({ fs, dir, filepath: 'src/dashboard/client/ClientMessages.jsx' });
    await git.add({ fs, dir, filepath: 'src/dashboard/shared/NotificationsPage.jsx' });
    await git.add({ fs, dir, filepath: 'src/components/Sidebar.jsx' });
    await git.add({ fs, dir, filepath: 'src/store/notificationStore.js' });
    
    await git.commit({
      fs,
      dir,
      message: 'feat(portal): implement Global Pulse smart routing notifications and Meeting Ticket UI in Client Chat',
      author: { name: 'Creziax Bot', email: 'bot@creziax.local' }
    });

    console.log('Portal commit successful. Pushing...');
    const pushResult = await git.push({
      fs, http, dir, remote: 'origin', ref: 'main',
      onAuth: () => ({ username: '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' })
    });
    console.log('Portal Push Result:', pushResult);
  } catch (e) { console.error('Portal Push Error:', e); }
}

async function pushBackend() {
  const dir = 'e:/DOWNLOADS/الموقع الكتروني بتاع الاجينت المخصص لليوتيوب/نظام الداخلي للشركة/creziax-backend-repo';
  try {
    await git.add({ fs, dir, filepath: 'server.js' });
    
    await git.commit({
      fs,
      dir,
      message: 'feat(backend): implement socket authentication and smart routing for Global Pulse',
      author: { name: 'Creziax Bot', email: 'bot@creziax.local' }
    });

    console.log('Backend commit successful. Pushing...');
    const pushResult = await git.push({
      fs, http, dir, remote: 'origin', ref: 'main',
      onAuth: () => ({ username: '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' })
    });
    console.log('Backend Push Result:', pushResult);
  } catch (e) { console.error('Backend Push Error:', e); }
}

async function main() {
  await pushPortal();
  await pushBackend();
}

main();
