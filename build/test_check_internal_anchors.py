"""Tests for build/check_internal_anchors.py.

The two the ticket asks for explicitly are ``test_broken_self_link_fails`` and
``test_relref_with_bad_anchor_fails``. The positive controls matter just as much:
a checker that reports nothing passes a broken-link test for the wrong reason, so
each failure case has a mirror asserting the *valid* form is accepted.
"""

from __future__ import annotations

import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

import check_internal_anchors as cia


def build_tree(root: Path, pages: dict[str, str], sources: dict[str, str]) -> tuple[Path, Path]:
    """Write a minimal public/ and content/ pair and return their paths."""
    public, content = root / "public", root / "content"
    for url_path, html in pages.items():
        target = public / url_path.strip("/") / "index.html"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(html, encoding="utf-8")
    for rel, text in sources.items():
        target = content / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")
    return content, public


PAGE = '<html><h2 id="real-heading">Real heading</h2><a name="legacy-anchor"></a></html>'


class CheckInternalAnchors(unittest.TestCase):
    def run_check(self, sources, pages=None):
        pages = {"/develop/thing": PAGE} if pages is None else pages
        with TemporaryDirectory() as tmp:
            content, public = build_tree(Path(tmp), pages, sources)
            return cia.check(content, public)

    # --- the two failures the acceptance criteria name -------------------------

    def test_broken_self_link_fails(self):
        findings, _ = self.run_check(
            {"a.md": "See [x](https://redis.io/docs/latest/develop/nope/).\n"})
        self.assertEqual(len(findings), 1, findings)
        self.assertEqual(findings[0]["kind"], "self-link")
        self.assertIn("page not in built site", findings[0]["problem"])

    def test_relref_with_bad_anchor_fails(self):
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#no-such-heading" >}}.\n'})
        self.assertEqual(len(findings), 1, findings)
        self.assertEqual(findings[0]["kind"], "relref")
        self.assertIn("no-such-heading", findings[0]["problem"])

    def test_self_link_with_bad_anchor_fails(self):
        findings, _ = self.run_check(
            {"a.md": "See [x](https://redis.io/docs/latest/develop/thing/#ghost).\n"})
        self.assertEqual(len(findings), 1, findings)
        self.assertIn("#ghost", findings[0]["problem"])

    # --- positive controls: it must not pass by finding nothing ----------------

    def test_valid_self_link_passes(self):
        findings, tally = self.run_check(
            {"a.md": "See [x](https://redis.io/docs/latest/develop/thing/#real-heading).\n"})
        self.assertEqual(findings, [])
        self.assertEqual(tally["self_ok"], 1)

    def test_valid_relref_anchor_passes(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#real-heading" >}}.\n'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1)

    def test_legacy_a_name_anchor_counts(self):
        """<a name="..."> is a real jump target and must not be reported missing."""
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#legacy-anchor" >}}.\n'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1)

    # --- scoping: things that must NOT be reported -----------------------------

    def test_marketing_site_link_is_skipped_not_failed(self):
        """redis.io/blog is built elsewhere; absence from public/ proves nothing."""
        findings, tally = self.run_check({"a.md": "See [x](https://redis.io/blog/whatever/).\n"})
        self.assertEqual(findings, [])
        self.assertEqual(tally["self_skipped"], 1)

    def test_client_rendered_target_is_unverifiable_not_missing(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/operate/api#tag/Cluster/operation/x" >}}.\n'},
            pages={"/operate/api": '<html><div id="redoc"></div></html>'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["unverifiable"], 1)

    def test_archived_tree_is_not_scanned(self):
        findings, _ = self.run_check(
            {"operate/rs/7.4/old.md": "See [x](https://redis.io/docs/latest/develop/nope/).\n"})
        self.assertEqual(findings, [])

    def test_release_notes_are_not_scanned(self):
        findings, _ = self.run_check(
            {"operate/release-notes/x.md": "See [x](https://redis.io/docs/latest/develop/nope/).\n"})
        self.assertEqual(findings, [])

    # --- relref path shapes (regression: an earlier version saw only one) -----

    def test_dot_relative_relref_is_checked(self):
        findings, _ = self.run_check(
            {"develop/a.md": 'See {{< relref "./thing#no-such-heading" >}}.\n'})
        self.assertEqual(len(findings), 1, findings)
        self.assertIn("no-such-heading", findings[0]["problem"])

    def test_dot_relative_relref_valid_passes(self):
        findings, tally = self.run_check(
            {"develop/a.md": 'See {{< relref "./thing#real-heading" >}}.\n'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1)

    def test_bare_relative_relref_is_checked(self):
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "develop/thing#no-such-heading" >}}.\n'})
        self.assertEqual(len(findings), 1, findings)

    def test_trailing_fragment_outside_shortcode_is_checked(self):
        """{{< relref "/path" >}}#anchor puts the fragment outside the quotes."""
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing" >}}#no-such-heading here.\n'})
        self.assertEqual(len(findings), 1, findings)
        self.assertIn("no-such-heading", findings[0]["problem"])

    def test_trailing_fragment_valid_passes_and_is_not_double_counted(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing" >}}#real-heading here.\n'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1, "counted once, not twice")

    def test_unresolvable_relative_path_is_unhandled_not_a_finding(self):
        """A bad relref *path* fails the build, so non-resolution is our limit."""
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "some/unknown/shape#anchor" >}}.\n'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_unhandled"], 1)

    # --- resolution details ---------------------------------------------------

    def test_non_page_artifact_resolves(self):
        """sitemap.xml and docs.ndjson are real files, not pages that failed."""
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            content, public = build_tree(
                root, {"/develop/thing": PAGE},
                {"a.md": "See [x](https://redis.io/docs/latest/sitemap.xml).\n"})
            (public / "sitemap.xml").write_text("<urlset/>", encoding="utf-8")
            findings, tally = cia.check(content, public)
        self.assertEqual(findings, [])
        self.assertEqual(tally["self_ok"], 1)

    def test_prefixless_and_latest_prefix_resolve_alike(self):
        """CI rewrites baseURL to include /docs/latest; both forms must map the same."""
        for url in ("https://redis.io/docs/develop/thing/",
                    "https://redis.io/docs/latest/develop/thing/"):
            with self.subTest(url=url):
                findings, tally = self.run_check({"a.md": f"See [x]({url}).\n"})
                self.assertEqual(findings, [], url)
                self.assertEqual(tally["self_ok"], 1)

    def test_query_string_before_fragment_is_stripped(self):
        findings, _ = self.run_check(
            {"a.md": "[x](https://redis.io/docs/latest/develop/thing/?utm=1#real-heading)\n"})
        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
