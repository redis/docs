"""Execute the displayed CLI programs against the schema-checked HTTP fixture."""

from copy import deepcopy
from pathlib import Path
import sys

import pytest

from examples import cli_script, processed, source_path
from test_examples import execute, fixture_server


@pytest.fixture
def cli_server(fixture_server, monkeypatch):
    state, env = fixture_server
    state.strict_pagination = False
    # Reconciliation compares remote digests with local content. Give this
    # schema fixture coherent digests instead of its usual opaque constant.
    from redis_iris.cli.services.agent_playbook.client import _version
    from redis_iris.cli.services.agent_playbook.faqs import digest_remote_faq_version
    from redis_iris.cli.services.agent_playbook.skills import digest_remote_version

    original = state.request

    def request(method, path, body):
        for history in state.versions.values():
            for version in history:
                normalized = _version(version)
                digest = (digest_remote_faq_version(normalized)
                          if version['entryType'] == 'faq' else digest_remote_version(normalized))
                version['contentDigest'] = 'sha256:' + digest
        return original(method, path, body)

    monkeypatch.setattr(state, 'request', request)
    env['PATH'] = str(Path(sys.executable).parent) + ':' + env['PATH']
    return state, env


@pytest.mark.parametrize('page,copy', [
    ('quickstart', False), ('faqs', False), ('skills', False),
    ('proposals', False), ('retrieval', False), ('quickstart', True), ('skills', True),
])
def test_cli_programs_preserve_review_and_publication(page, copy, cli_server, tmp_path):
    state, env = cli_server
    original_ids = set(state.entries)
    if page == 'retrieval':
        env['PLAYBOOK_API_KEY'] = 'reader-test-key'
    source = (processed(source_path(page, 'cli.sh'))[0]
              if copy else cli_script(page))
    result = execute(page, 'cli.sh', tmp_path, env, source=source)
    assert not state.errors, state.errors
    assert result.returncode == 0, result.stdout + result.stderr
    names = [name for name, _ in state.calls]
    assert env['PLAYBOOK_API_KEY'] not in result.stdout + result.stderr
    if page in ('quickstart', 'faqs', 'skills'):
        created = next(entry for eid, entry in state.entries.items() if eid not in original_ids)
        versions = state.versions[created['entryId']]
        assert len(versions) == 2
        expected_publication = 2 if page == 'quickstart' else 1
        assert created['publication']['version'] == expected_publication
        assert not any(name.startswith(('Delete', 'Withdraw')) for name in names)
        assert names.index('GetFaqVersion' if page != 'skills' else 'GetSkillVersion') < names.index(
            'PublishFaq' if page != 'skills' else 'PublishSkill')
        assert not any(body.get('version') == 2 for name, body in state.calls
                       if name == 'PublishSkill')
    elif page == 'proposals':
        accepted = next(p for p in state.proposals.values() if p['status'] == 'promoted')
        entry_id = accepted['result']['versionCreated']['entryId']
        assert state.entries[entry_id]['publication']['version'] == 1
        assert accepted['evidenceCount'] == 1
        assert names.index('AcceptProposal') < names.index('PublishFaq')
        assert next(body for name, body in state.calls if name == 'AcceptProposal')[
            'expectedProposalRevision'] == accepted['proposalRevision']
        assert names.count('SubmitProposalEvidence') == 1
    else:
        assert not any(name.startswith(('Create', 'Append', 'Publish', 'Lookup', 'GetSkill'))
                       for name in names)
        assert any(name == 'DiscoverEntries' and body.get('pinnedEntries') for name, body in state.calls)


@pytest.mark.parametrize('page', ('faqs', 'skills'))
@pytest.mark.parametrize('action', ('withdraw', 'delete'))
def test_cli_cleanup_targets_only_the_selected_sample(page, action, cli_server, tmp_path):
    state, env = cli_server
    entry_id = state.faq_id if page == 'faqs' else state.skill_id
    before = deepcopy(state.entries)
    source = processed(source_path(page, 'cli.sh', action))[0]
    result = execute(page, 'cli.sh', tmp_path, env, source=source)
    assert not state.errors, state.errors
    assert result.returncode == 0, result.stdout + result.stderr
    for eid, entry in before.items():
        if eid != entry_id:
            assert state.entries[eid] == entry
    if action == 'withdraw':
        assert entry_id in state.entries and 'publication' not in state.entries[entry_id]
    else:
        assert entry_id not in state.entries
