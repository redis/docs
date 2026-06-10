'use strict';

const fs = require('fs');
const { execSync } = require('child_process');

const eventName = process.env.GITHUB_EVENT_NAME;
const eventPath = process.env.GITHUB_EVENT_PATH;
const sha = process.env.GITHUB_SHA;
const ref = process.env.GITHUB_REF || '';
const repo = process.env.GITHUB_REPOSITORY;

if (!eventName || !eventPath) {
  console.error('Missing required GitHub environment variables (GITHUB_EVENT_NAME, GITHUB_EVENT_PATH)');
  process.exit(1);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));

function getChangedFiles(commitSha) {
  try {
    return execSync(`git diff --name-only ${commitSha}^1 ${commitSha}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

let context;

if (eventName === 'push') {
  const headCommit = event.head_commit || {};
  const branch = ref.replace('refs/heads/', '');
  const title = (headCommit.message || '').split('\n')[0];

  context = {
    eventName,
    type: 'push',
    sha,
    branch,
    repo,
    prNumber: null,
    title,
    body: headCommit.message || '',
    labels: [],
    changedFiles: getChangedFiles(sha),
    author: headCommit.author?.name || headCommit.committer?.name || 'unknown',
    timestamp: new Date().toISOString(),
  };
} else if (eventName === 'pull_request') {
  const pr = event.pull_request;
  context = {
    eventName,
    type: 'pull_request',
    sha: pr.head.sha,
    branch: pr.head.ref,
    repo,
    prNumber: pr.number,
    title: pr.title,
    body: pr.body || '',
    labels: (pr.labels || []).map(l => l.name),
    changedFiles: [],
    author: pr.user?.login || 'unknown',
    timestamp: new Date().toISOString(),
  };
} else if (eventName === 'workflow_dispatch') {
  context = {
    eventName,
    type: 'workflow_dispatch',
    sha,
    branch: ref.replace('refs/heads/', ''),
    repo,
    prNumber: null,
    title: 'Manual workflow dispatch',
    body: '',
    labels: [],
    changedFiles: [],
    author: event.sender?.login || 'unknown',
    timestamp: new Date().toISOString(),
  };
} else {
  console.error(`Unsupported event type: ${eventName}`);
  process.exit(1);
}

context.searchText = [context.title, context.body, context.changedFiles.join(' ')]
  .join('\n')
  .slice(0, 4000);

fs.writeFileSync('/tmp/memory_context.json', JSON.stringify(context, null, 2));

console.log(`trigger=${eventName} repo=${repo} title="${context.title}" files=${context.changedFiles.length}`);
