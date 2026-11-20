"""Execute the published UPDATE walkthrough through the schema-checked fixture."""

from copy import deepcopy
import base64
import json
import os
from pathlib import Path
import shutil
import subprocess
from urllib.request import Request, urlopen

import pytest

from examples import update_scripts
from test_examples import PB, fixture_server, package_sample


def candidate_files(kind, directory):
    inputs = []
    if kind == 'skill':
        package_sample(directory)
    for stem, detail in (('proposal-content', 'First draft'), ('proposal-content-reviewed', 'Reviewed draft')):
        content = {'attributes': {'topic': 'refund'}, 'metadata': {'review': detail}}
        if kind == 'faq':
            faq = {'question': 'When will my refund appear?', 'answer': detail}
            content['payload'] = {'faq': faq}
            path = directory / f'{stem}.cli.json'
            path.write_text(json.dumps({**faq, 'attributes': content['attributes'], 'metadata': content['metadata']}))
        else:
            package = directory / 'refund-support-reply.zip'
            content['payload'] = {'skillPackage': {'packageBase64': base64.b64encode(package.read_bytes()).decode()}}
            path = directory / 'refund-support-reply'
            (path / '.iris-playbook.json').write_text(json.dumps({'attributes': content['attributes'], 'metadata': content['metadata']}))
            # Give replacement its own directory so the complete snapshots stay distinct.
            snapshot = directory / stem / path.name
            snapshot.parent.mkdir()
            shutil.copytree(path, snapshot)
            path = snapshot
        (directory / f'{stem}.json').write_text(json.dumps(content))
        inputs.append(path)
    return inputs


def run_example(suffix, directory, env):
    script = directory / f'proposals_update.{suffix}'
    script.write_text(update_scripts()[suffix])
    if suffix == 'py':
        python = os.getenv('PLAYBOOK_DOCS_UPDATE_PYTHON')
        if not python:
            pytest.skip('set PLAYBOOK_DOCS_UPDATE_PYTHON to the core 1.3.0 environment')
        command = [python, str(script)]
    elif suffix == 'mts':
        prefix = os.getenv('PLAYBOOK_DOCS_UPDATE_NODE_DIR')
        if not prefix:
            pytest.skip('set PLAYBOOK_DOCS_UPDATE_NODE_DIR to the TypeScript 1.3.0 environment')
        node_modules = Path(prefix) / 'node_modules'
        (directory / 'node_modules').symlink_to(node_modules, target_is_directory=True)
        subprocess.run([str(node_modules / '.bin/tsc'), '--noEmit', '--strict', '--module', 'NodeNext',
                        '--target', 'ES2022', str(script)], cwd=directory, check=True, capture_output=True)
        command = ['node', str(script)]
    else:
        if suffix == 'cli.sh':
            iris_bin = os.getenv('PLAYBOOK_DOCS_UPDATE_IRIS_BIN')
            if iris_bin:
                env = {**env, 'PATH': iris_bin + os.pathsep + env['PATH']}
            help_result = subprocess.run(
                ['iris', 'agent-playbooks', 'proposals', 'create', '--help'],
                env=env, capture_output=True, text=True, check=True,
            )
            if '--update' not in help_result.stdout:
                if iris_bin:
                    pytest.fail('The explicitly supplied Iris CLI does not support UPDATE')
                pytest.skip('The pinned Iris CLI release does not support UPDATE')
        command = ['bash', str(script)]
    return subprocess.run(command, cwd=directory, env=env, text=True, capture_output=True, timeout=30)


def setup_update(kind, fixture_server, directory):
    state, env = fixture_server
    entry_id = state.faq_id if kind == 'faq' else state.skill_id
    entry = state.entries[entry_id]
    entry['entryKey'] = 'refund-guide'
    basis = state.versions[entry_id][0]
    basis['content']['metadata'] = {'old_annotation': 'omit in the new version'}
    if kind == 'skill':
        resources = basis['content']['payload']['skill']['resources']
        resources.append({**resources[0], 'path': 'references/retired-template.md', 'resourceId': 'res_' + 'f' * 24})
    state.append(entry_id, deepcopy(basis['content']))
    initial, revised = candidate_files(kind, directory)
    env.update(PLAYBOOK_ENTRY_ID=entry_id, PLAYBOOK_BASED_ON_VERSION='1', PLAYBOOK_ENTRY_TYPE=kind,
               PLAYBOOK_UPDATE_CANDIDATE=str(initial), PLAYBOOK_UPDATE_REVISED=str(revised))
    return state, env, entry_id


@pytest.mark.parametrize('suffix', ('py', 'sh', 'mts', 'cli.sh'))
@pytest.mark.parametrize('kind', ('faq', 'skill'))
def test_update_appends_to_the_target_and_publishes_the_receipt(kind, suffix, fixture_server, tmp_path, monkeypatch):
    state, env, entry_id = setup_update(kind, fixture_server, tmp_path)
    original = state.request

    def check_publication(method, path, body):
        if method == 'PUT' and path.endswith('/publication'):
            assert state.entries[entry_id]['publication']['version'] == 1
            assert state.entries[entry_id]['latestVersion'] == 3
            assert body == {'version': 3}
        return original(method, path, body)

    monkeypatch.setattr(state, 'request', check_publication)
    result = run_example(suffix, tmp_path, env)
    assert not state.errors, state.errors
    assert result.returncode == 0, result.stdout + result.stderr
    assert len(state.entries) == 2
    assert state.entries[entry_id]['entryKey'] == 'refund-guide'
    assert state.entries[entry_id]['publication']['version'] == 3
    version = state.versions[entry_id][-1]
    assert version['content']['metadata'] == {'review': 'Reviewed draft'}
    assert state.versions[entry_id][0]['content']['metadata'] == {'old_annotation': 'omit in the new version'}
    if kind == 'skill':
        resource, = version['content']['payload']['skill']['resources']
        packaged = (tmp_path / 'refund-support-reply/references/reply-template.md').read_bytes()
        assert state.resource_contents[resource['digest']] == packaged
        assert [file['path'] for file in state.versions[entry_id][0]['content']['payload']['skill']['resources']] == [
            'references/reply-template.md', 'references/retired-template.md',
        ]
        if suffix != 'cli.sh':
            assert any(op == 'GetProposalResource' for op, _ in state.calls)
            assert packaged.decode().strip() in result.stdout
    proposal_id, = state.proposals
    proposal = state.proposals[proposal_id]
    assert proposal['action']['update']['target'] == {'existingEntry': {'entryId': entry_id, 'basedOnVersion': 1}}
    replay_url = env['IRIS_AGENT_PLAYBOOKS_URL'] + f'/iris/data/v1/agent-playbooks/playbooks/{PB}/proposals/{proposal_id}/acceptance'
    request = Request(replay_url, method='POST', data=json.dumps({'expectedRevision': proposal['revision']}).encode(),
                      headers={'Authorization': 'Bearer ' + env['IRIS_AGENT_PLAYBOOKS_API_KEY'], 'Content-Type': 'application/json'})
    with urlopen(request, timeout=5) as response:
        assert response.status == 201
        assert json.load(response)['result'] == proposal['result']
    assert len(state.versions[entry_id]) == 3


@pytest.mark.parametrize('suffix', ('py', 'sh', 'mts', 'cli.sh'))
def test_update_stops_when_the_reviewed_revision_changes(suffix, fixture_server, tmp_path, monkeypatch):
    state, env, entry_id = setup_update('faq', fixture_server, tmp_path)
    original = state.request

    def competing_edit(method, path, body):
        if method == 'PATCH' and '/proposals/' in path:
            proposal_id = path.rsplit('/', 1)[1]
            state.proposals[proposal_id]['revision'] = 'edited-by-another-reviewer'
        return original(method, path, body)

    monkeypatch.setattr(state, 'request', competing_edit)
    result = run_example(suffix, tmp_path, env)
    assert not state.errors, state.errors
    assert result.returncode != 0
    assert any(op == 'ReplaceProposal' for op, _ in state.calls)
    assert all(op not in ('AcceptProposal', 'PublishFaq') for op, _ in state.calls)
    assert state.entries[entry_id]['latestVersion'] == 2
    assert state.entries[entry_id]['publication']['version'] == 1


def test_update_stops_if_the_target_was_deleted(fixture_server, tmp_path, monkeypatch):
    state, env, entry_id = setup_update('faq', fixture_server, tmp_path)
    original = state.request

    def delete_target_before_acceptance(method, path, body):
        if method == 'POST' and path.endswith('/acceptance'):
            del state.entries[entry_id]
            del state.versions[entry_id]
        return original(method, path, body)

    monkeypatch.setattr(state, 'request', delete_target_before_acceptance)
    result = run_example('sh', tmp_path, env)
    assert not state.errors, state.errors
    assert result.returncode == 22
    assert set(state.entries) == {state.skill_id}
    assert all(op != 'PublishFaq' for op, _ in state.calls)
