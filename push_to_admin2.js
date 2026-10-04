const git = require('./server/node_modules/isomorphic-git');
const http = require('./server/node_modules/isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!token) {
  console.error('Error: Please provide a GitHub Personal Access Token (PAT).');
  console.log('Usage: node push_to_admin2.js <YOUR_GITHUB_TOKEN>');
  process.exit(1);
}

async function runPush() {
  try {
    console.log('Verifying repository status and staging changes...');
    const matrix = await git.statusMatrix({ fs, dir });
    for (const [filepath, headStatus, workdirStatus, stageStatus] of matrix) {
      if (workdirStatus === 0 && stageStatus !== 0) {
        await git.remove({ fs, dir, filepath });
      } else if (workdirStatus !== 0) {
        await git.add({ fs, dir, filepath });
      }
    }

    try {
      await git.commit({
        fs,
        dir,
        message: 'feat: Complete A SQUARED Luxury Real Estate Suite & Admin Dashboard',
        author: {
          name: 'Rishi D',
          email: 'rishi@asquared.ae'
        }
      });
      console.log('Committed new changes.');
    } catch (e) {
      console.log('No new changes to commit (already up to date).');
    }

    console.log('Pushing main branch to https://github.com/rishid-081010/admin2.git ...');
    const pushResult = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => ({
        username: token,
        password: ''
      })
    });

    console.log('Successfully pushed all dashboard code to https://github.com/rishid-081010/admin2 !');
    console.log('Push Result:', pushResult);
  } catch (err) {
    console.error('Push failed:', err.message);
  }
}

runPush();
