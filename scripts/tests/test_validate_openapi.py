import importlib.util
import unittest
from pathlib import Path


VALIDATOR_PATH = Path(__file__).parents[1] / "validate_openapi.py"
SPEC = importlib.util.spec_from_file_location("validate_openapi", VALIDATOR_PATH)
assert SPEC is not None and SPEC.loader is not None
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


def openapi_document() -> dict:
    return {
        "openapi": "3.0.1",
        "info": {"title": "Redis Cloud API", "version": "Version 1"},
        "paths": {
            "/v1/subscriptions": {
                "get": {
                    "operationId": "getSubscriptions",
                    "responses": {
                        "200": {
                            "description": "Success",
                            "content": {
                                "application/json": {
                                    "schema": {"$ref": "#/components/schemas/Subscription"}
                                }
                            },
                        }
                    },
                }
            }
        },
        "components": {"schemas": {"Subscription": {"type": "object"}}},
    }


def add_valid_rdi_contract(document: dict) -> None:
    operation = document["paths"]["/v1/subscriptions"]["get"]
    operation["tags"] = [VALIDATOR.RDI_TAG]
    operation["security"] = [{"x-api-key": [], "x-api-secret-key": []}]
    document["x-openapi-sources"] = {
        "rdi-core": {
            "repository": "RedisLabs/redis-data-integration",
            "commit_sha": "a" * 40,
            "artifact_kind": "release",
            "artifact_name": "rdi-openapi-1.19.0.json",
            "sha256": "b" * 64,
            "release_tag": "1.19.0",
        },
        "cloud-rdi": {
            "repository": "redislabsdev/cloud-rdi-service",
            "commit_sha": "c" * 40,
            "artifact_kind": "actions",
            "artifact_name": "cloud-rdi-openapi-c.json",
            "sha256": "d" * 64,
            "run_id": 123456,
        },
    }


class ValidateOpenapiTest(unittest.TestCase):
    def test_accepts_a_valid_file(self):
        self.assertEqual([], VALIDATOR.validate(openapi_document()))

    def test_rejects_a_missing_reference(self):
        document = openapi_document()
        document["paths"]["/v1/subscriptions"]["get"]["responses"]["200"]["content"][
            "application/json"
        ]["schema"]["$ref"] = "#/components/schemas/Missing"

        errors = VALIDATOR.validate(document)

        self.assertTrue(any("missing reference" in error for error in errors))

    def test_rejects_a_duplicate_operation_id(self):
        document = openapi_document()
        document["paths"]["/v1/databases"] = {
            "get": {
                "operationId": "getSubscriptions",
                "responses": {"200": {"description": "Success"}},
            }
        }

        errors = VALIDATOR.validate(document)

        self.assertTrue(any("is used by both" in error for error in errors))

    def test_requires_rdi_authentication_keys_together(self):
        document = openapi_document()
        operation = document["paths"]["/v1/subscriptions"]["get"]
        operation["tags"] = [VALIDATOR.RDI_TAG]
        operation["security"] = [{"x-auth-token": []}]

        errors = VALIDATOR.validate(document, require_rdi=True)

        self.assertTrue(any("must require only x-api-key" in error for error in errors))

    def test_rejects_extra_rdi_authentication_requirements(self):
        invalid_security_values = [
            [
                {
                    "x-api-key": [],
                    "x-api-secret-key": [],
                    "x-auth-token": [],
                }
            ],
            [
                {"x-api-key": [], "x-api-secret-key": []},
                {"x-auth-token": []},
            ],
        ]
        for security in invalid_security_values:
            with self.subTest(security=security):
                document = openapi_document()
                add_valid_rdi_contract(document)
                document["paths"]["/v1/subscriptions"]["get"]["security"] = security

                errors = VALIDATOR.validate(document, require_rdi=True)

                self.assertTrue(any("must require only" in error for error in errors))

    def test_requires_security_on_each_rdi_operation(self):
        document = openapi_document()
        add_valid_rdi_contract(document)
        document["security"] = [{"x-api-key": [], "x-api-secret-key": []}]
        del document["paths"]["/v1/subscriptions"]["get"]["security"]

        errors = VALIDATOR.validate(document, require_rdi=True)

        self.assertTrue(any("must require only" in error for error in errors))

    def test_accepts_rdi_authentication_keys_together(self):
        document = openapi_document()
        add_valid_rdi_contract(document)

        self.assertEqual([], VALIDATOR.validate(document, require_rdi=True))

    def test_requires_rdi_source_metadata(self):
        document = openapi_document()
        operation = document["paths"]["/v1/subscriptions"]["get"]
        operation["tags"] = [VALIDATOR.RDI_TAG]
        operation["security"] = [{"x-api-key": [], "x-api-secret-key": []}]

        errors = VALIDATOR.validate(document, require_rdi=True)

        self.assertTrue(any("x-openapi-sources must contain" in error for error in errors))

    def test_rejects_invalid_rdi_source_metadata(self):
        document = openapi_document()
        add_valid_rdi_contract(document)
        document["x-openapi-sources"]["rdi-core"]["commit_sha"] = "A" * 40
        document["x-openapi-sources"]["rdi-core"]["release_tag"] = "0.0.123"
        document["x-openapi-sources"]["cloud-rdi"]["sha256"] = "D" * 64
        document["x-openapi-sources"]["cloud-rdi"]["run_id"] = 0

        errors = VALIDATOR.validate(document, require_rdi=True)

        self.assertTrue(any("commit_sha must be a lowercase" in error for error in errors))
        self.assertTrue(any("release_tag is missing or invalid" in error for error in errors))
        self.assertTrue(any("sha256 must be a lowercase" in error for error in errors))
        self.assertTrue(any("cloud-rdi.run_id is missing or invalid" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
