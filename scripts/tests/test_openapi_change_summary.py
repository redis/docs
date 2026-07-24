import importlib.util
import unittest
from pathlib import Path


SUMMARY_PATH = Path(__file__).parents[1] / "openapi_change_summary.py"
SPEC = importlib.util.spec_from_file_location("openapi_change_summary", SUMMARY_PATH)
assert SPEC is not None and SPEC.loader is not None
SUMMARY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SUMMARY)


def document(paths=None, schemas=None, sources=None) -> dict:
    result = {
        "openapi": "3.0.1",
        "info": {"title": "Redis Cloud API", "version": "1"},
        "paths": paths or {},
        "components": {"schemas": schemas or {}},
    }
    if sources is not None:
        result["x-openapi-sources"] = sources
    return result


class OpenapiChangeSummaryTest(unittest.TestCase):
    def test_lists_operation_schema_and_source_changes(self):
        before = document(
            paths={
                "/removed": {"delete": {"operationId": "remove"}},
                "/same": {"get": {"operationId": "getSame"}},
            },
            schemas={"Removed": {}, "Same": {}},
            sources={"rdi-core": {"commit_sha": "a" * 40}},
        )
        after = document(
            paths={
                "/added": {"post": {"operationId": "add"}},
                "/same": {"get": {"operationId": "getSame"}},
            },
            schemas={"Added": {}, "Same": {}},
            sources={"rdi-core": {"commit_sha": "b" * 40}},
        )

        summary = SUMMARY.build_summary(before, after)

        self.assertIn("### Added operations (1)\n\n- `POST /added`", summary)
        self.assertIn("### Removed operations (1)\n\n- `DELETE /removed`", summary)
        self.assertIn("### Added schemas (1)\n\n- `Added`", summary)
        self.assertIn("### Removed schemas (1)\n\n- `Removed`", summary)
        self.assertIn('- Before: `{"rdi-core":{"commit_sha":"', summary)
        self.assertIn('- After: `{"rdi-core":{"commit_sha":"', summary)

    def test_reports_empty_lists_and_unchanged_source_metadata(self):
        value = document(sources={"rdi-core": {"commit_sha": "a" * 40}})

        summary = SUMMARY.build_summary(value, value)

        self.assertEqual(4, summary.count("(0)\n\nNone."))
        self.assertIn("### Source metadata\n\nNo change.", summary)


if __name__ == "__main__":
    unittest.main()
