/*
 * Tests for the browser-side half of the documentation download widget.
 *
 * When a reader picks more than one product, the page stitches the published
 * bundles into a single .tar.gz (see static/js/download-docs.js). A tar ends
 * with zero blocks and every reader stops at the first one it meets, so getting
 * the seam wrong does not raise an error -- it silently produces an archive
 * holding only the first product. These tests run the real merge over bundles
 * built by the real packager and check the result with the system tar.
 *
 * Run with: node build/test_download_docs.cjs
 */

'use strict';

const assert = require('node:assert');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const { mergedBlob } = require(path.join(REPO, 'static/js/download-docs.js'));

const MANIFEST = {
  formats: [{ id: 'md', label: 'Markdown', summary: 'one .md file per page', description: 'x' }],
  docsets: [
    { id: 'alpha', title: 'Alpha', path: 'alpha' },
    { id: 'beta', title: 'Beta', path: 'beta' }
  ]
};

/* Write one Hugo-shaped page directory per entry of `pages`. */
function makePages(root, pages) {
  for (const [rel, body] of Object.entries(pages)) {
    const dir = rel ? path.join(root, rel) : root;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html.md'), body);
  }
}

/* Build real bundles with the real packager, then serve them to fetch(). */
function publishBundles(sites) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-downloads-'));
  const site = path.join(tmp, 'public');
  const out = path.join(tmp, 'bundles');
  const manifest = path.join(tmp, 'manifest.json');

  for (const [docset, pages] of Object.entries(sites)) {
    makePages(path.join(site, docset), pages);
  }
  fs.writeFileSync(manifest, JSON.stringify(MANIFEST));

  execFileSync('python3', [
    path.join(REPO, 'build/make_doc_bundles.py'),
    '--source', site, '--out', out, '--manifest', manifest
  ], { stdio: 'pipe' });

  globalThis.fetch = async (url) => {
    const file = path.join(out, path.basename(url));
    if (!fs.existsSync(file)) return new Response(null, { status: 404 });
    return new Response(fs.readFileSync(file), { status: 200 });
  };

  return { tmp, out };
}

function bundleRef(file) {
  return { file, url: 'https://redis.io/docs/latest/downloads/bundles/' + file, label: file };
}

function listing(archive) {
  return execFileSync('tar', ['tzf', archive], { encoding: 'utf8' })
    .trim().split('\n').filter(Boolean).sort();
}

async function merge(tmp, files) {
  const blob = await mergedBlob(files.map(bundleRef));
  const merged = path.join(tmp, 'merged.tar.gz');
  fs.writeFileSync(merged, Buffer.from(await blob.arrayBuffer()));
  return merged;
}

async function test_merged_archive_holds_every_product() {
  const { tmp } = publishBundles({
    alpha: { '': '# alpha root\n', 'one': '# alpha one\n' },
    beta: { '': '# beta root\n', 'two/three': '# beta three\n' }
  });

  const merged = await merge(tmp, ['alpha-latest-md.tar.gz', 'beta-latest-md.tar.gz']);
  const names = listing(merged);

  assert.ok(names.includes('redis-docs/alpha-latest/one.md'), names);
  assert.ok(names.includes('redis-docs/beta-latest/two/three.md'), names);
  // Both bundles' own README and MANIFEST survive the seam too.
  assert.strictEqual(names.filter((n) => n.endsWith('MANIFEST.json')).length, 2, names);
  console.log('✓ a merged archive holds every selected product');
}

async function test_merge_loses_no_entries() {
  const { tmp } = publishBundles({
    alpha: { '': 'a\n', 'one': 'b\n', 'one/deep': 'c\n' },
    beta: { '': 'd\n' }
  });

  const separate = ['alpha-latest-md.tar.gz', 'beta-latest-md.tar.gz'];
  const expected = separate
    .flatMap((file) => listing(path.join(tmp, 'bundles', file)))
    .sort();
  const merged = await merge(tmp, separate);

  assert.deepStrictEqual(listing(merged), expected);
  console.log('✓ merging loses no entries and adds none');
}

async function test_file_contents_survive_the_merge() {
  const { tmp } = publishBundles({
    alpha: { 'one': '# alpha one\n\nbody text\n' },
    beta: { 'two': '# beta two\n' }
  });

  const merged = await merge(tmp, ['alpha-latest-md.tar.gz', 'beta-latest-md.tar.gz']);
  const extracted = execFileSync(
    'tar', ['xzfO', merged, 'redis-docs/alpha-latest/one.md'], { encoding: 'utf8' }
  );

  assert.strictEqual(extracted, '# alpha one\n\nbody text\n');
  console.log('✓ file contents survive the merge byte for byte');
}

async function test_payload_zeros_are_not_mistaken_for_the_archive_end() {
  /*
   * Two zero blocks end a tar, so a page whose own bytes are zeros looks exactly
   * like a terminator. Trimming trailing zeros instead of walking the entry
   * headers would truncate the archive here.
   */
  const { tmp } = publishBundles({
    alpha: { 'zeros': '\0'.repeat(2048), 'after': '# after the zeros\n' },
    beta: { '': '# beta\n' }
  });

  const merged = await merge(tmp, ['alpha-latest-md.tar.gz', 'beta-latest-md.tar.gz']);
  const names = listing(merged);

  assert.ok(names.includes('redis-docs/alpha-latest/after.md'), names);
  assert.ok(names.includes('redis-docs/beta-latest/index.md'), names);
  console.log('✓ zero bytes inside a page do not truncate the archive');
}

async function test_pages_larger_than_one_read_survive() {
  /* Entries spanning many blocks exercise the carry between stream reads. */
  const big = ('x'.repeat(99) + '\n').repeat(5000); // ~500 KB
  const { tmp } = publishBundles({
    alpha: { 'big': big },
    beta: { '': '# beta\n' }
  });

  const merged = await merge(tmp, ['alpha-latest-md.tar.gz', 'beta-latest-md.tar.gz']);
  const extracted = execFileSync(
    'tar', ['xzfO', merged, 'redis-docs/alpha-latest/big.md'],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );

  assert.strictEqual(extracted.length, big.length);
  assert.ok(listing(merged).includes('redis-docs/beta-latest/index.md'));
  console.log('✓ pages larger than a single stream read survive');
}

async function test_a_missing_bundle_reports_which_one() {
  /*
   * The reason has to survive being read back off the Response. Browsers do not
   * necessarily reject with the stream's own error -- they substitute "The
   * operation was aborted.", which hides which archive was missing -- so
   * mergedBlob holds on to the reason and rethrows it. Node happens to preserve
   * it either way, so this test guards the plumbing, not the browser behaviour.
   */
  const { tmp } = publishBundles({ alpha: { '': '# alpha\n' }, beta: { '': '# beta\n' } });

  await assert.rejects(
    () => merge(tmp, ['alpha-latest-md.tar.gz', 'gamma-latest-md.tar.gz']),
    /gamma-latest-md\.tar\.gz is not available \(HTTP 404\)/
  );
  console.log('✓ a bundle that is not published names itself in the error');
}

async function test_the_reason_survives_a_substituted_rejection() {
  /* Simulate the browser: make reading the merged body reject with its own
     generic error and check the useful one still comes out. */
  const { tmp } = publishBundles({ alpha: { '': '# alpha\n' } });
  const RealResponse = globalThis.Response;

  class SubstitutingResponse extends RealResponse {
    blob() {
      const abort = new Error('The operation was aborted.');
      abort.name = 'AbortError';
      // Let the stream reach its error first, so mergedStream reports the reason.
      return super.blob().then(() => Promise.reject(abort), () => Promise.reject(abort));
    }
  }

  globalThis.Response = SubstitutingResponse;
  try {
    await assert.rejects(
      () => merge(tmp, ['alpha-latest-md.tar.gz', 'missing-latest-md.tar.gz']),
      /missing-latest-md\.tar\.gz is not available \(HTTP 404\)/
    );
  } finally {
    globalThis.Response = RealResponse;
  }
  console.log('✓ the real reason survives a browser substituting its own error');
}

async function main() {
  const tests = [
    test_merged_archive_holds_every_product,
    test_merge_loses_no_entries,
    test_file_contents_survive_the_merge,
    test_payload_zeros_are_not_mistaken_for_the_archive_end,
    test_pages_larger_than_one_read_survive,
    test_a_missing_bundle_reports_which_one,
    test_the_reason_survives_a_substituted_rejection
  ];

  for (const t of tests) {
    await t();
  }
  console.log('\n✅ All tests passed!');
}

main().catch((error) => {
  console.error(`\n❌ ${error.message}`);
  process.exitCode = 1;
});
