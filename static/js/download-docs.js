/*
 * Documentation downloader.
 *
 * Drives the picker in the dialog every documentation page carries
 * (partials/download-docs.html), opened from the sidebar or the page-meta column.
 *
 * The build publishes one .tar.gz per product, version, and format (see
 * build/make_doc_bundles.py), so a single-product download is just a link. When a
 * reader picks several products we still hand them one archive, by stitching the
 * bundles together here: inflate each one, copy its entries up to its
 * end-of-archive marker, and deflate the result. Streams keep memory flat, so
 * selecting everything costs no more than selecting one product.
 *
 * Bundles put their files under redis-docs/<product>-<version>/, so a merged
 * archive unpacks into one tree with no collisions -- including two versions of
 * the same product.
 */
(function () {
  'use strict';

  var BLOCK = 512;
  // A tar ends with two zero blocks. Emit a whole record's worth so tools that
  // expect the 10 KiB default blocking factor stay happy.
  var END_OF_ARCHIVE = 10240;

  var canStream =
    typeof ReadableStream !== 'undefined' &&
    typeof CompressionStream !== 'undefined' &&
    typeof DecompressionStream !== 'undefined';

  /* --------------------------------------------------------------- tar merging */

  function octal(block, start, length) {
    var value = 0;
    for (var i = start; i < start + length; i++) {
      var byte = block[i];
      if (byte === 0 || byte === 32) break; // NUL or space ends the field
      value = value * 8 + (byte - 48);
    }
    return value;
  }

  function isZeroBlock(block) {
    for (var i = 0; i < BLOCK; i++) {
      if (block[i] !== 0) return false;
    }
    return true;
  }

  function concat(head, tail) {
    var out = new Uint8Array(head.length + tail.length);
    out.set(head, 0);
    out.set(tail, head.length);
    return out;
  }

  /*
   * Copy one archive's entries into `sink`, stopping at its end-of-archive
   * marker: leaving that in place would make every reader stop there and ignore
   * the archives appended after it. Walking the 512-byte headers (rather than
   * trimming trailing zeros) also keeps entries whose own contents end in zeros.
   */
  async function copyEntries(reader, sink) {
    var carry = new Uint8Array(0);
    var dataBlocks = 0; // payload blocks still to copy for the current entry

    for (;;) {
      var chunk = await reader.read();
      if (chunk.done) break;

      var buffer = carry.length ? concat(carry, chunk.value) : chunk.value;
      var offset = 0;
      var reachedEnd = false;

      while (buffer.length - offset >= BLOCK) {
        var block = buffer.subarray(offset, offset + BLOCK);
        if (dataBlocks > 0) {
          dataBlocks--;
        } else if (isZeroBlock(block)) {
          reachedEnd = true;
          break;
        } else {
          dataBlocks = Math.ceil(octal(block, 124, 12) / BLOCK);
        }
        offset += BLOCK;
      }

      if (offset > 0) sink.enqueue(buffer.slice(0, offset));
      if (reachedEnd) break;
      carry = buffer.slice(offset); // a partial block, held over for the next read
    }

    // Stopping early leaves the response body unread; closing it is tidiness, and
    // must not be allowed to fail the download.
    try {
      await reader.cancel();
    } catch (ignored) { /* best effort */ }
  }

  /*
   * Concatenate the given bundles into one uncompressed tar stream. `onFailure`
   * receives the real reason if one arises -- see mergedBlob for why that cannot
   * simply be read off the rejected promise.
   */
  function mergedStream(bundles, onProgress, onFailure) {
    return new ReadableStream({
      async start(controller) {
        try {
          for (var i = 0; i < bundles.length; i++) {
            if (onProgress) onProgress(i, bundles[i]);
            var response = await fetch(bundles[i].url);
            if (!response.ok) {
              throw new Error(bundles[i].file + ' is not available (HTTP ' + response.status + ')');
            }
            var inflated = response.body.pipeThrough(new DecompressionStream('gzip'));
            await copyEntries(inflated.getReader(), controller);
          }
          controller.enqueue(new Uint8Array(END_OF_ARCHIVE));
          controller.close();
        } catch (error) {
          if (onFailure) onFailure(error);
          controller.error(error);
        }
      }
    });
  }

  async function mergedBlob(bundles, onProgress) {
    // Reading a Response whose body stream errors does not necessarily reject with
    // that stream's reason: browsers substitute their own ("The operation was
    // aborted."), which loses the one useful sentence -- which archive failed and
    // why. So keep hold of the reason and rethrow it.
    var failure = null;
    var tar = mergedStream(bundles, onProgress, function (error) { failure = error; });

    try {
      return await new Response(tar.pipeThrough(new CompressionStream('gzip'))).blob();
    } catch (error) {
      throw failure || error;
    }
  }

  /* ------------------------------------------------------------ the current page */

  // The per-page file each format maps to. Hugo publishes one of each beside every
  // page's index.html (see [outputs] in config.toml).
  var PAGE_FILES = {
    md: { file: 'index.html.md', suffix: '.md' },
    'md-single': { file: 'index.html.md', suffix: '.md' },
    html: { file: 'index.html', suffix: '.html' },
    json: { file: 'index.json', suffix: '.json' }
  };

  /*
   * The file behind the page at `pathname` for one format, and a name to save it
   * under. Derived from the URL rather than rendered by Hugo, because the dialog's
   * markup is cached once and reused on every page.
   *
   * "md-single" collapses to Markdown: one page is already a single file.
   */
  function pageFileFor(pathname, format) {
    var spec = PAGE_FILES[format] || PAGE_FILES.md;
    var dir = pathname.charAt(pathname.length - 1) === '/' ? pathname : pathname + '/';
    var segments = dir.split('/').filter(Boolean);
    var name = segments.length ? segments[segments.length - 1] : 'index';
    return { url: dir + spec.file, filename: name + spec.suffix };
  }

  /* ------------------------------------------------------------ one picker form */

  function initForm(form) {
    var status = form.querySelector('[data-download-status]');
    var submit = form.querySelector('[data-download-submit]');
    var selectAll = form.querySelector('[data-select-all]');
    var format = form.querySelector('select[name="format"]');
    var formatHint = form.querySelector('[data-format-hint]');
    var checkboxes = form.querySelectorAll('input[name="docset"]');
    var bundleBase = form.dataset.bundleBase.replace(/\/$/, '');

    function setStatus(message, isError) {
      status.textContent = message || '';
      status.classList.toggle('text-redis-red-600', Boolean(isError));
    }

    var pageTitle = form.querySelector('[data-page-title]');
    var pageFile = form.querySelector('[data-page-file]');
    var pageButton = form.querySelector('[data-download-page]');

    /* The page's own name, read off the document rather than the template. */
    function currentPageTitle() {
      var heading = document.querySelector('main h1') || document.querySelector('h1');
      if (heading && heading.textContent.trim()) return heading.textContent.trim();
      return document.title.split('|')[0].trim() || location.pathname;
    }

    /*
     * One page on its own works in Markdown and JSON, which are self-contained. It
     * does not work in HTML: a page's stylesheet, fonts, and links all live at the
     * site root, so a lone index.html opens unstyled with dead links. That is the
     * whole reason the html format ships a product together with its assets, and why
     * this offers no single-page HTML rather than handing over a broken file.
     */
    function singlePageFormat() {
      return format.value !== 'html';
    }

    function describePage() {
      if (!pageFile) return;
      if (singlePageFormat()) {
        pageFile.textContent = pageFileFor(location.pathname, format.value).filename;
      } else {
        pageFile.textContent =
          'A single HTML page cannot carry its own styling. Choose Markdown or JSON, ' +
          'or download the whole product below.';
      }
      if (pageButton) pageButton.disabled = !singlePageFormat();
    }

    function describeFormat() {
      var option = format.options[format.selectedIndex];
      formatHint.textContent = (option && option.dataset.description) || '';
    }

    function selections() {
      var chosen = form.querySelectorAll('input[name="docset"]:checked');

      return Array.prototype.map.call(chosen, function (checkbox) {
        var id = checkbox.value;
        var versionField = form.querySelector('select[name="version-' + id + '"]');
        var version = versionField ? versionField.value : 'latest';
        var file = id + '-' + version + '-' + format.value + '.tar.gz';

        return {
          label: checkbox.dataset.title + (version === 'latest' ? '' : ' v' + version),
          file: file,
          url: bundleBase + '/' + file
        };
      });
    }

    /* Keep the Download button and the header checkbox in step with the rows. */
    function refresh() {
      var checked = form.querySelectorAll('input[name="docset"]:checked').length;
      submit.disabled = checked === 0;
      selectAll.checked = checked === checkboxes.length;
      selectAll.indeterminate = checked > 0 && checked < checkboxes.length;
    }

    function save(href, filename, revoke) {
      var link = document.createElement('a');
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (revoke) setTimeout(function () { URL.revokeObjectURL(href); }, 30000);
    }

    /*
     * One product needs no merging, so hand the URL to the browser and let it
     * stream to disk. A link download reports nothing if the archive is missing,
     * though, so ask first -- one HEAD turns a silent no-op into a message.
     */
    async function downloadOne(bundle) {
      var head = await fetch(bundle.url, { method: 'HEAD' });
      if (!head.ok) {
        throw new Error(bundle.file + ' is not available (HTTP ' + head.status + ').');
      }
      setStatus('Downloading ' + bundle.file + '.');
      save(bundle.url, bundle.file, false);
    }

    /* The one page the reader is on: a single published file, so no archive. */
    async function downloadThisPage() {
      if (!singlePageFormat()) return;
      var page = pageFileFor(location.pathname, format.value);
      var head = await fetch(page.url, { method: 'HEAD' });
      if (!head.ok) {
        throw new Error(
          'This page is not published as ' + page.filename +
          ' (HTTP ' + head.status + '). Try another format.'
        );
      }
      setStatus('Downloading ' + page.filename + '.');
      save(page.url, page.filename, false);
    }

    async function downloadMerged(bundles) {
      var today = new Date().toISOString().slice(0, 10);
      var filename = 'redis-docs-' + format.value + '-' + today + '.tar.gz';

      var blob = await mergedBlob(bundles, function (index, bundle) {
        setStatus('Fetching ' + bundle.label + ' (' + (index + 1) + ' of ' + bundles.length + ')…');
      });

      setStatus('Downloading ' + filename + ' (' + Math.round(blob.size / 1e6) + ' MB).');
      save(URL.createObjectURL(blob), filename, true);
    }

    /*
     * Without the compression streams we cannot build one archive, so hand over
     * the bundles as they are. Browsers throttle back-to-back downloads, hence
     * the gap between them.
     */
    function downloadSeparately(bundles) {
      setStatus('This browser cannot combine archives, so ' + bundles.length +
                ' separate files will download.');
      bundles.forEach(function (bundle, index) {
        setTimeout(function () { save(bundle.url, bundle.file, false); }, index * 800);
      });
    }

    form.addEventListener('change', function (event) {
      if (event.target === selectAll) {
        checkboxes.forEach(function (checkbox) { checkbox.checked = selectAll.checked; });
      }
      if (event.target === format) {
        describeFormat();
        describePage();
      }
      refresh();
      setStatus('');
    });

    if (pageButton) {
      pageButton.addEventListener('click', async function () {
        pageButton.disabled = true;
        try {
          await downloadThisPage();
        } catch (error) {
          setStatus(error.message, true);
        } finally {
          pageButton.disabled = false;
        }
      });
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      var bundles = selections();
      if (!bundles.length) return;

      submit.disabled = true;
      try {
        if (bundles.length === 1) {
          await downloadOne(bundles[0]);
        } else if (canStream) {
          await downloadMerged(bundles);
        } else {
          downloadSeparately(bundles);
        }
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        submit.disabled = false;
      }
    });

    if (pageTitle) pageTitle.textContent = currentPageTitle();
    describePage();
    describeFormat();
    refresh();
  }

  /* ------------------------------------------------------------------- the page */

  function init() {
    var dialog = document.getElementById('download-docs-dialog');
    if (!dialog) return;

    // Opening comes first: if wiring the picker below ever throws, the button is
    // still live and the dialog still shows.
    document.querySelectorAll('[data-open-download]').forEach(function (trigger) {
      trigger.addEventListener('click', function () { dialog.showModal(); });
    });
    // Both the header close button and Cancel; Escape is handled by <dialog>.
    dialog.querySelectorAll('[data-close-download]').forEach(function (button) {
      button.addEventListener('click', function () { dialog.close(); });
    });
    // Clicking the backdrop lands on the dialog element itself, not its contents.
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    document.querySelectorAll('form[data-docs-download]').forEach(initForm);
  }

  // build/test_download_docs.cjs loads this file outside a browser to exercise the
  // merging. Keyed on `document`, not on `module` being absent: any other script on
  // the page may define a `module` global, and then nothing here would run at all.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      copyEntries: copyEntries,
      mergedStream: mergedStream,
      mergedBlob: mergedBlob,
      pageFileFor: pageFileFor
    };
  }
  if (typeof document !== 'undefined') {
    init();
  }
})();
