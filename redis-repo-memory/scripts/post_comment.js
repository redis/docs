/**
 * post_comment.js
 *
 * Reads /tmp/memory_results.json (written by retrieve_memory.js) and posts
 * the results to GitHub:
 *   - Pull requests: posts or updates a PR comment with related history.
 *     On PR synchronize events (new commits pushed), always posts a new
 *     comment so each update is independently visible.
 *   - Pushes: posts a commit status and writes to the Actions step summary.
 *
 * Required environment variables:
 *   GITHUB_TOKEN       Automatically provided by Actions. Needs pull-requests:write
 *                      and statuses:write permissions (set in the workflow file).
 *   GITHUB_REPOSITORY  Automatically provided by Actions.
 */
'use strict';

const fs = require('fs');

const COMMENT_MARKER = '<!-- redis-repo-memory -->';

async function githubRequest(method, path, body, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

function buildMarkdown(related, context, sourceUrl) {
  const lines = [
    COMMENT_MARKER,
    '## 🧠 Redis Memory',
    '',
  ];

  if (related.length === 0) {
    lines.push("No related prior context found — this looks new to the repository's memory.");
  } else {
    lines.push(`Found **${related.length}** related item${related.length === 1 ? '' : 's'} from repository history:`);
    lines.push('');
    for (const item of related) {
      const label = item.type === 'pr_summary' ? 'PR' : item.type === 'issue_summary' ? 'Issue' : 'Commit';
      const link = item.sourceUrl ? `[${item.title}](${item.sourceUrl})` : `**${item.title}**`;
      lines.push(`- **${label}** — ${link}`);
      if (item.bodySummary) {
        lines.push(`  > ${item.bodySummary.split('\n')[0].slice(0, 140)}`);
      }
    }
  }

  lines.push('');
  lines.push(`*Memory updated at [${context.sha?.slice(0, 7)}](${sourceUrl})*`);
  return lines.join('\n');
}

async function postCommitStatus(repo, sha, related, sourceUrl, token) {
  const description = related.length === 0
    ? 'No related prior context found'
    : `Found ${related.length} related item${related.length === 1 ? '' : 's'}: ${related[0].title}`.slice(0, 140);

  await githubRequest('POST', `/repos/${repo}/statuses/${sha}`, {
    state: 'success',
    context: 'Redis Repository Memory',
    description,
    target_url: sourceUrl,
  }, token);
  console.log(`posted_commit_status sha=${sha?.slice(0, 7)} related=${related.length}`);
}

async function postOrUpdatePrComment(repo, prNumber, body, token) {
  const comments = await githubRequest('GET', `/repos/${repo}/issues/${prNumber}/comments`, null, token);
  const existing = comments.find(c => typeof c.body === 'string' && c.body.includes(COMMENT_MARKER));

  if (existing) {
    await githubRequest('PATCH', `/repos/${repo}/issues/comments/${existing.id}`, { body }, token);
    console.log(`updated_comment_id=${existing.id} pr=${prNumber}`);
  } else {
    const created = await githubRequest('POST', `/repos/${repo}/issues/${prNumber}/comments`, { body }, token);
    console.log(`created_comment_id=${created.id} pr=${prNumber}`);
  }
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!token) {
    console.error('GITHUB_TOKEN is not set');
    process.exit(1);
  }
  if (!repo) {
    console.error('GITHUB_REPOSITORY is not set');
    process.exit(1);
  }

  const { context, related, sourceUrl } = JSON.parse(
    fs.readFileSync('/tmp/memory_results.json', 'utf8')
  );

  const markdown = buildMarkdown(related, context, sourceUrl);

  if (context.prNumber) {
    if (context.action === 'synchronize') {
      // New commits pushed — always post a fresh comment so each update is visible
      const created = await githubRequest('POST', `/repos/${repo}/issues/${context.prNumber}/comments`, { body: markdown }, token);
      console.log(`created_comment_id=${created.id} pr=${context.prNumber} action=synchronize`);
    } else {
      await postOrUpdatePrComment(repo, context.prNumber, markdown, token);
    }
  } else {
    // Post commit status so results are visible on the commit without opening Actions
    await postCommitStatus(repo, context.sha, related, sourceUrl, token);

    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      fs.appendFileSync(summaryPath, markdown + '\n');
    } else {
      process.stdout.write(markdown + '\n');
    }
    console.log(`posted_to=step_summary related=${related.length}`);
  }
}

main().catch(err => {
  console.error('post_comment failed:', err.message);
  process.exit(1);
});
