"""Preserve validation failures when the operator runner also fails to clean up."""

from types import SimpleNamespace

import pytest

import live_operator


@pytest.mark.parametrize("failure,reason", (("delete", "playbook-cleanup"), ("close", "client-close")))
def test_cleanup_preserves_original_validation_failure(monkeypatch, failure, reason):
    calls = []
    records = []

    class Control:
        def create_playbook(self, **kwargs):
            return SimpleNamespace(playbook_id="test-playbook")

        def get_playbook(self, **kwargs):
            raise ValueError("original validation failure")

        def delete_playbook(self, **kwargs):
            calls.append("delete")
            if failure == "delete":
                raise OSError("cleanup failed")

        def __exit__(self, *args):
            calls.append("close")
            if failure == "close":
                raise OSError("close failed")

    monkeypatch.setattr(live_operator, "AgentPlaybooksService", lambda **kwargs: Control())
    monkeypatch.setenv("PLAYBOOK_ADMIN_TOKEN", "test-admin")
    monkeypatch.setenv("PLAYBOOK_IDS_CONTROL_TOKEN", "test-identity")
    args = SimpleNamespace(cp_url="http://control.invalid", embedding_provider="noop",
                           embedding_model="test", embedding_dimensions=384)
    with pytest.raises(ValueError, match="original validation failure"):
        live_operator.validate(args, lambda *args: records.append(args))
    assert calls == ["delete", "close"]
    assert records == [("cleanup", "failed", reason)]
