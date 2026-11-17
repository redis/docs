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
        # The fixture uses the markup the api-reference pages actually emit. An
        # earlier version invented `<div id="redoc">`, which no page uses, and it
        # passed only because the detector then matched the bare substring.
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/operate/api#tag/Cluster/operation/x" >}}.\n'},
            pages={"/operate/api":
                   '<html><redoc spec-url="/openapi.json"></redoc></html>'})
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

    # A leaf page beside a section _index, each with a *different* anchor, so these
    # tests fail if the resolver picks the wrong one rather than passing by luck.
    SAME_PAGE_TREE = {"/develop": '<html><h2 id="section-only">S</h2></html>',
                      "/develop/thing": '<html><h2 id="page-only">P</h2></html>'}

    def test_same_page_relref_checks_the_current_page(self):
        findings, tally = self.run_check(
            {"develop/thing.md": 'See {{< relref "#page-only" >}}.\n'},
            pages=self.SAME_PAGE_TREE)
        self.assertEqual(findings, [], "own-page anchor must resolve")
        self.assertEqual(tally["relref_ok"], 1)

    def test_same_page_relref_does_not_check_the_section_index(self):
        """The regression: an empty path resolved to the sibling section page."""
        findings, _ = self.run_check(
            {"develop/thing.md": 'See {{< relref "#section-only" >}}.\n'},
            pages=self.SAME_PAGE_TREE)
        self.assertEqual(len(findings), 1, "section's anchor is not on this page")

    def test_same_page_relref_from_an_index_page(self):
        """_index.md publishes at its directory, so its own page is that directory."""
        findings, tally = self.run_check(
            {"develop/_index.md": 'See {{< relref "#section-only" >}}.\n'},
            pages=self.SAME_PAGE_TREE)
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1)

    def test_unresolvable_relative_path_is_unhandled_not_a_finding(self):
        """A bad relref *path* fails the build, so non-resolution is our limit."""
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "some/unknown/shape#anchor" >}}.\n'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_unhandled"], 1)

    # --- .md paths, which Hugo accepts as page references ----------------------

    def test_md_suffix_relref_is_checked(self):
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing.md#no-such-heading" >}}.\n'})
        self.assertEqual(len(findings), 1, findings)

    def test_md_suffix_relref_valid_passes(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing.md#real-heading" >}}.\n'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1)

    def test_index_md_suffix_resolves_to_its_directory(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing/_index.md#real-heading" >}}.\n'},
            pages={"/develop/thing": PAGE})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1)

    def test_self_link_to_a_literal_md_file_keeps_its_extension(self):
        """Regression guard: stripping .md must not break the published .md twins."""
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            content, public = build_tree(
                root, {"/develop/thing": PAGE},
                {"a.md": "[x](https://redis.io/docs/latest/develop/thing/index.html.md)\n"})
            (public / "develop/thing/index.html.md").write_text("# t", encoding="utf-8")
            findings, tally = cia.check(content, public)
        self.assertEqual(findings, [])
        self.assertEqual(tally["self_ok"], 1)

    # --- client-rendered detection must match a mount, not a mention -----------

    def test_swagger_mention_in_prose_is_not_client_rendered(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#no-such-heading" >}}.\n'},
            pages={"/develop/thing":
                   '<html><h2 id="real-heading">R</h2>'
                   '<p>browse to http://localhost:8080/swagger-ui/ to see it</p>'
                   '<code>springfox-swagger-ui</code></html>'})
        self.assertEqual(len(findings), 1, "a prose mention must not skip the check")
        self.assertEqual(tally["unverifiable"], 0)

    def test_redoc_element_is_client_rendered(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#whatever" >}}.\n'},
            pages={"/develop/thing": '<html><redoc spec-url="x"></redoc></html>'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["unverifiable"], 1)

    # --- the anchor pool must hold only real jump targets ---------------------

    def test_meta_name_is_not_a_jump_target(self):
        """Every page carries <meta name="description">; #description is not an anchor."""
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#description" >}}.\n'},
            pages={"/develop/thing":
                   '<html><head><meta name="description" content="x">'
                   '<meta name="viewport" content="y"></head>'
                   '<h2 id="real-heading">R</h2></html>'})
        self.assertEqual(len(findings), 1, "a meta name must not satisfy a fragment")

    def test_data_prefixed_attributes_are_not_jump_targets(self):
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#nope" >}}.\n'},
            pages={"/develop/thing":
                   '<html><div data-id="nope" data-name="nope"></div>'
                   '<h2 id="real-heading">R</h2></html>'})
        self.assertEqual(len(findings), 1, "data-id/data-name must not count")

    def test_url_query_parameter_is_not_a_jump_target(self):
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#GTM-ABC123" >}}.\n'},
            pages={"/develop/thing":
                   '<html><iframe src="https://gtm.example/ns.html?id=GTM-ABC123">'
                   '</iframe><h2 id="real-heading">R</h2></html>'})
        self.assertEqual(len(findings), 1, "an id= query param must not count")

    def test_ids_inside_script_bodies_are_not_jump_targets(self):
        findings, _ = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#in-a-script" >}}.\n'},
            pages={"/develop/thing":
                   '<html><script>var u="x?id=in-a-script";</script>'
                   '<h2 id="real-heading">R</h2></html>'})
        self.assertEqual(len(findings), 1, "script bodies are not markup")

    def test_a_name_still_counts_but_only_on_anchor_tags(self):
        findings, tally = self.run_check(
            {"a.md": 'See {{< relref "/develop/thing#legacy" >}}.\n'},
            pages={"/develop/thing":
                   '<html><a name="legacy"></a><h2 id="real-heading">R</h2></html>'})
        self.assertEqual(findings, [])
        self.assertEqual(tally["relref_ok"], 1)

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
