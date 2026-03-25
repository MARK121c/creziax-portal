const https = require('https');
const fs = require('fs');
const path = require('path');

const REPO = 'MARK121c/creziax-backend';
const TOKEN = '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';
const BASE_DIR = 'e:/DOWNLOADS/الموقع الكتروني بتاع الاجينت المخصص لليوتيوب/نظام الداخلي للشركة/creziax-backend-repo';

const files = [
  'server.js',
  'controllers/clientController.js',
  'controllers/taskController.js',
  'controllers/ticketController.js',
  'controllers/workspaceController.js',
  'routes/contractRoutes.js'
];

async function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: urlPath,
      method: method,
      headers: {
        'User-Agent': 'Creziax-Bot',
        'Authorization': `token ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => data += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', (e) => reject(e));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  try {
    console.log('Fetching current branch info...');
    const branchInfo = await request('GET', `/repos/${REPO}/branches/main`);
    const latestCommitSha = branchInfo.commit.sha;
    const baseTreeSha = branchInfo.commit.commit.tree.sha;
    console.log(`Latest Commit: ${latestCommitSha}, Base Tree: ${baseTreeSha}`);

    console.log('Creating blobs for files...');
    const treeEntries = [];
    for (const file of files) {
      const fullPath = path.join(BASE_DIR, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      const blob = await request('POST', `/repos/${REPO}/git/blobs`, {
        content: content,
        encoding: 'utf-8'
      });
      console.log(`Blob created for ${file}: ${blob.sha}`);
      treeEntries.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }

    console.log('Creating new tree...');
    const newTree = await request('POST', `/repos/${REPO}/git/trees`, {
      base_tree: baseTreeSha,
      tree: treeEntries
    });
    console.log(`New Tree created: ${newTree.sha}`);

    console.log('Creating new commit...');
    const newCommit = await request('POST', `/repos/${REPO}/git/commits`, {
      message: 'fix(backend): socket self-notification and improved global pulse routing context',
      tree: newTree.sha,
      parents: [latestCommitSha]
    });
    console.log(`New Commit created: ${newCommit.sha}`);

    console.log('Updating branch reference...');
    await request('PATCH', `/repos/${REPO}/git/refs/heads/main`, {
      sha: newCommit.sha,
      force: true
    });
    console.log('SUCCESS: Branch main updated to new commit SHA.');
  } catch (err) {
    console.error('FAILED:', err.message);
    process.exit(1);
  }
}

run();
