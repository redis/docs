"""Execute the displayed clients against a local, schema-checked HTTP fixture.

This verifies client signatures, serialized requests, response handling, and tab
parity. Framework and MCP client checks are in test_agents.py. No live model or
deployed service is called.
"""

import ast
import base64
from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from hashlib import sha256
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading
from urllib.parse import parse_qs, urlsplit
from zipfile import ZipFile

from jsonschema import Draft4Validator
import pytest
import yaml

from examples import DOCS, FENCE, GUIDES, blocks, full_examples, processed, source_path, scripts, skill_package, standalone_python

HERE = Path(__file__).parent
SPEC = json.loads((DOCS / 'api-reference/openapi.json').read_text())
PB = 'pb_' + 'a' * 32
NOW = '2026-10-07T12:00:00Z'
DIGEST = 'sha256:' + 'd' * 64
RESOURCE = 'res_' + 'e' * 24
FILE_TEXT = (
    'Refund listed: Your order history shows "<displayed-stage>". Support can help if you need more information about that stage.\n\n'
    'Refund missing: Contact support with your order number and explain that no refund appears in your order history.\n'
)
TASK = (
    "Draft a customer reply using the refund-support-reply skill and template. "
    "The customer says their refund stage is Processing."
)
DISCOVERY_QUERY = 'Draft a reply for a customer whose refund shows Processing'
READY_REPLY = 'Your order history shows "Processing". Support can help if you need more information about that stage.'

def validate(value, schema):
    Draft4Validator({**schema, 'components': SPEC['components']}).validate(value)


class ContractFixture:
    def __init__(self, tool_error=False):
        self.entries = {}
        self.versions = {}
        self.proposals = {}
        self.calls = []
        self.errors = []
        self.mcp_methods = []
        self.model_requests = []
        self.tool_error = tool_error
        self.omit_totals = False
        self.resource_contents = {DIGEST: FILE_TEXT.encode()}
        self.skill_id = self.create('skill', self.skill_content())['entry']['entryId']
        self.publish(self.skill_id, 1)
        self.faq_id = self.create('faq', {'payload': {'faq': {'question': 'Sample question', 'answer': 'Sample answer'}}})['entry']['entryId']
        self.publish(self.faq_id, 1)

    def skill_content(self):
        return {'intents': [], 'attributes': {}, 'payload': {'skill': {
            'format': 'agent-skills',
            'manifest': {'name': 'refund-support-reply', 'description': 'Draft a customer reply from a reported refund stage or a missing refund.'},
            'instructions': 'Read references/reply-template.md, select the matching template, and preserve the reported stage.',
            'resources': [{
                'resourceId': RESOURCE, 'uri': 'playbook://returned-version/reply-template.md',
                'path': 'references/reply-template.md', 'digest': DIGEST,
                'sizeBytes': len(FILE_TEXT), 'mimeType': 'text/markdown', 'executable': False,
            }],
        }}}

    def create(self, kind, content):
        eid = 'ent_' + f'{len(self.entries) + 1:032x}'
        self.entries[eid] = {'entryId': eid, 'entryType': kind, 'latestVersion': 0, 'createdAt': NOW, 'updatedAt': NOW}
        self.versions[eid] = []
        return self.append(eid, content)

    def append(self, eid, content):
        entry = self.entries[eid]
        entry['latestVersion'] += 1
        version = {'entryId': eid, 'entryType': entry['entryType'], 'version': entry['latestVersion'],
                   'createdAt': NOW, 'contentDigest': DIGEST, 'content': deepcopy(content)}
        self.versions[eid].append(version)
        return {'entry': deepcopy(entry), 'version': deepcopy(version)}

    def preview_content(self, content):
        content = deepcopy(content)
        if 'skill' in content['payload']:
            skill = content['payload']['skill']
            content['payload']['skill'] = {**skill['manifest'], 'uri': 'playbook://returned-version/SKILL.md'}
        return content

    def publish(self, eid, version):
        self.entries[eid]['publication'] = {
            'version': version, 'at': NOW,
            'content': self.preview_content(self.versions[eid][version - 1]['content']),
        }
        return deepcopy(self.entries[eid])

    def preview(self, eid, scored=False):
        entry = self.entries[eid]
        pub = entry['publication']
        result = {'entryId': eid, 'entryType': entry['entryType'], 'version': pub['version'],
                  'intents': pub['content'].get('intents', []), **pub['content']['payload']}
        if scored:
            result['score'] = 0.95
        return result

    def parse_package(self, body):
        with ZipFile(io.BytesIO(base64.b64decode(body['packageBase64']))) as archive:
            assert set(n for n in archive.namelist() if not n.endswith('/')) == {
                'refund-support-reply/SKILL.md', 'refund-support-reply/references/reply-template.md',
            }
            source = archive.read('refund-support-reply/SKILL.md').decode()
            manifest = yaml.safe_load(source.split('---', 2)[1])
            assert manifest['name'] == 'refund-support-reply'
            assert manifest['description']
            template = archive.read('refund-support-reply/references/reply-template.md')
        content = self.skill_content()
        content.update(body.get('content', {}))
        content['payload']['skill']['manifest'] = manifest
        content['payload']['skill']['instructions'] = source.split('---', 2)[2].strip()
        digest = 'sha256:' + sha256(template).hexdigest()
        self.resource_contents[digest] = template
        content['payload']['skill']['resources'][0].update(digest=digest, sizeBytes=len(template))
        return content

    def page(self, items, member, query, include_total=True):
        # Exercise empty and short pages without allowing clients to stop early.
        cursor = query.get('cursor')
        if cursor is None:
            result = {member: [], 'nextCursor': 'fixture+page/1='}
            if include_total and not self.omit_totals:
                result['total'] = len(items)
            return result
        if cursor == 'fixture+page/1=':
            result = {member: deepcopy(items[:1])}
            if len(items) > 1:
                result['nextCursor'] = 'fixture+page/2='
            return result
        assert cursor == 'fixture+page/2=', query
        return {member: deepcopy(items[1:])}

    def proposal_preview(self, proposal):
        preview = deepcopy(proposal)
        preview.pop('evidence')
        content = preview['action']['add']['candidate']['content']
        preview['action']['add']['candidate']['content'] = {
            'payload': {'faq': {'question': content['payload']['faq']['question']}},
        }
        return preview

    def mcp(self, body):
        method = body['method']
        self.mcp_methods.append(method)
        if 'id' not in body:
            return 202, None
        if method == 'server/discover':
            return 200, {'jsonrpc': '2.0', 'id': body['id'],
                         'error': {'code': -32601, 'message': 'Method not found'}}
        if method == 'initialize':
            result = {'protocolVersion': body['params']['protocolVersion'], 'capabilities': {'tools': {}},
                      'serverInfo': {'name': 'docs-contract-fixture', 'version': '1'}}
        elif method == 'tools/list':
            schemas = {
                'discover_entries': {'query': {'type': 'string'}},
                'load_skill': {'entry_id': {'type': 'string'}, 'version': {'type': 'integer'}},
                'fetch_resource': {'uri': {'type': 'string'}},
            }
            result = {'tools': [{
                'name': name,
                'inputSchema': {'type': 'object', 'properties': properties,
                                'required': list(properties), 'additionalProperties': False},
            } for name, properties in schemas.items()]}
        else:
            assert method == 'tools/call'
            name, args = body['params']['name'], body['params']['arguments']
            self.calls.append((name, args))
            if self.tool_error:
                result = {'isError': True, 'content': [{'type': 'text', 'text': 'fixture tool failure'}]}
            else:
                if name == 'discover_entries':
                    assert args == {'query': DISCOVERY_QUERY}
                    data = {'pinnedEntries': [], 'discoveredEntries': [self.preview(self.skill_id, True)], 'truncated': False}
                elif name == 'load_skill':
                    assert args == {'entry_id': self.skill_id, 'version': 1}
                    data = {'entryId': self.skill_id, 'version': 1, 'content': self.skill_content()['payload']['skill']}
                else:
                    assert name == 'fetch_resource'
                    assert args == {'uri': self.skill_content()['payload']['skill']['resources'][0]['uri']}
                    data = {'uri': args['uri'], 'mimeType': 'text/markdown', 'digest': DIGEST, 'text': FILE_TEXT}
                result = {'isError': False, 'content': [{'type': 'text', 'text': json.dumps(data)}], 'structuredContent': data}
        return 200, {'jsonrpc': '2.0', 'id': body['id'], 'result': result}

    def model_call(self, name, arguments):
        return {'type': 'function_call', 'id': f'fc_{len(self.model_requests)}',
                'call_id': f'call_{len(self.model_requests)}', 'name': name,
                'arguments': json.dumps(arguments), 'status': 'completed'}

    def model_message(self, text):
        return {'type': 'message', 'id': f'msg_{len(self.model_requests)}', 'role': 'assistant',
                'status': 'completed', 'content': [{'type': 'output_text', 'text': text, 'annotations': []}]}

    @staticmethod
    def tool_output(value):
        """Unwrap the text content blocks returned by either agent SDK."""
        while True:
            if isinstance(value, str):
                try:
                    value = json.loads(value)
                except json.JSONDecodeError:
                    return value
            elif isinstance(value, list):
                assert len(value) == 1, value
                value = value[0]
            elif isinstance(value, dict) and value.get('type') in ('text', 'input_text'):
                value = value['text']
            else:
                return value

    def request(self, method, path, body):
        if path.endswith('/mcp'):
            return self.mcp(body) if method == 'POST' else (405, None)
        url = urlsplit(path)
        path = url.path
        parsed_query = parse_qs(url.query, keep_blank_values=True)
        assert all(len(values) == 1 for values in parsed_query.values())
        query = {key: values[0] for key, values in parsed_query.items()}
        for route, methods in SPEC['paths'].items():
            match = re.fullmatch(re.sub(r'\{[^}]+\}', '([^/]+)', route), path)
            if match and method.lower() in methods:
                operation = methods[method.lower()]
                params = dict(zip(re.findall(r'\{([^}]+)\}', route), match.groups()))
                break
        else:
            raise AssertionError(f'Unknown operation: {method} {path}')
        assert params['playbookId'] == PB
        for parameter in operation.get('parameters', []):
            values = params if parameter['in'] == 'path' else query
            if parameter.get('required'):
                assert parameter['name'] in values, parameter
            if parameter['name'] not in values:
                continue
            value = values[parameter['name']]
            schema = parameter['schema']
            if schema.get('type') == 'integer':
                value = int(value)
            elif schema.get('type') == 'boolean':
                assert value in ('true', 'false')
                value = value == 'true'
            validate(value, schema)
        if body is not None:
            validate(body, operation['requestBody']['content']['application/json']['schema'])
        name = operation['operationId']
        self.calls.append((name, {'query': query} if query else deepcopy(body)))
        eid = params.get('faqId', params.get('skillId'))
        pid = params.get('proposalId')
        code = 200
        if name == 'GetPlaybookHealth':
            result = {key: 'ready' for key in ('status', 'metadataRedis', 'contentRedis', 'inference', 'license')}
            result['playbookId'] = PB
        elif name in ('CreateFaq', 'CreateSkill'):
            result = self.create('faq' if name == 'CreateFaq' else 'skill', body['content'] if name == 'CreateFaq' else self.parse_package(body))
            if 'entryKey' in body:
                self.entries[result['entry']['entryId']]['entryKey'] = body['entryKey']
                result['entry']['entryKey'] = body['entryKey']
            code = 201
        elif name in ('AppendFaqVersion', 'AppendSkillVersion'):
            result = self.append(eid, body['content'] if name == 'AppendFaqVersion' else self.parse_package(body))
            code = 201
        elif name in ('PublishFaq', 'PublishSkill'):
            result = self.publish(eid, body['version'])
        elif name in ('GetFaqVersion', 'GetSkillVersion'):
            result = deepcopy(self.versions[eid][int(params['version']) - 1])
        elif name == 'GetSkillResource':
            assert params['resourceId'] == RESOURCE
            version = self.versions[eid][int(params['version']) - 1]
            resource = version['content']['payload']['skill']['resources'][0]
            return 200, self.resource_contents[resource['digest']]
        elif name in ('GetFaq', 'GetSkill'):
            result = self.entries[eid]
        elif name in ('ListFaqs', 'ListSkills'):
            kind = 'faq' if name == 'ListFaqs' else 'skill'
            assert query.get('sortBy') == 'updatedAt' and query.get('sortOrder') == 'desc'
            assert query.get('limit') == '50'
            entries = [entry for entry in self.entries.values() if entry['entryType'] == kind]
            result = self.page(entries, 'faqs' if kind == 'faq' else 'skills', query)
        elif name in ('ListFaqVersions', 'ListSkillVersions'):
            assert query.get('limit') == '50'
            result = self.page(list(reversed(self.versions[eid])), 'versions', query, include_total=False)
        elif name == 'LookupEntries':
            results = []
            for reference in body['references']:
                entry = self.entries.get(reference.get('entryId'))
                if 'entryKey' in reference:
                    entry = next((e for e in self.entries.values() if e.get('entryKey') == reference['entryKey']), None)
                if entry is None:
                    results.append({'missing': {'reference': reference}})
                    continue
                latest = self.versions[entry['entryId']][-1]
                state = {'entryId': entry['entryId'], 'entryType': entry['entryType'],
                         'latest': {'version': latest['version'], 'contentDigest': latest['contentDigest']},
                         'versionCount': len(self.versions[entry['entryId']])}
                if 'entryKey' in entry:
                    state['entryKey'] = entry['entryKey']
                if 'publication' in entry:
                    version = self.versions[entry['entryId']][entry['publication']['version'] - 1]
                    state['publication'] = {'version': version['version'], 'contentDigest': version['contentDigest']}
                results.append({'found': {'reference': reference, 'entry': state}})
            result = {'results': results, 'maxVersions': 100}
        elif name in ('WithdrawFaq', 'WithdrawSkill'):
            self.entries[eid].pop('publication', None)
            result = self.entries[eid]
        elif name in ('DeleteFaq', 'DeleteSkill'):
            del self.entries[eid]
            result, code = None, 204
        elif name in ('SearchFaqs', 'SearchSkills', 'DiscoverEntries'):
            ids = [key for key, e in self.entries.items() if 'publication' in e]
            if name != 'DiscoverEntries':
                kind = 'faq' if name == 'SearchFaqs' else 'skill'
                ids = [key for key in ids if self.entries[key]['entryType'] == kind]
                result = {'matches': [self.preview(key, True) for key in ids]}
            else:
                pins = [p['entryId'] for p in body.get('pinnedEntries', [])]
                result = {'pinnedEntries': [self.preview(key) for key in pins],
                          'discoveredEntries': [self.preview(key, True) for key in ids if key not in pins], 'truncated': False}
        elif name == 'CreateProposal':
            pid = 'prp_' + f'{len(self.proposals) + 1:032x}'
            result = {'proposalId': pid, 'status': 'open', 'contentDigest': DIGEST, 'proposalRevision': 1,
                      'evidenceCount': 0, 'createdAt': NOW, 'updatedAt': NOW, 'inboxExpiresAt': NOW,
                      'purgeAt': NOW, 'action': body['action'], 'evidence': []}
            self.proposals[pid] = deepcopy(result)
            code = 201
        elif name == 'GetProposal':
            result = deepcopy(self.proposals[pid])
        elif name == 'ListProposals':
            assert query.get('sortBy') == 'updatedAt' and query.get('sortOrder') == 'desc'
            assert query.get('limit') == '50'
            statuses = ('open', 'promoting') if query['view'] == 'inbox' else ('trashed', 'promoted')
            items = [self.proposal_preview(p) for p in self.proposals.values() if p['status'] in statuses]
            result = self.page(items, 'proposals', query)
        elif name == 'SearchProposals':
            result = {'matches': [{'proposal': self.proposal_preview(p), 'score': 0.9}
                                  for p in self.proposals.values() if p['status'] == 'open']}
        elif name == 'SubmitProposalEvidence':
            evidence = {**body, 'evidenceId': params['evidenceId']}
            self.proposals[pid]['evidence'].append(evidence)
            self.proposals[pid]['evidenceCount'] += 1
            result = {'evidenceId': params['evidenceId'], 'disposition': 'added', 'evidenceCount': 1, 'updatedAt': NOW}
        elif name in ('ReplaceProposal', 'DismissProposal', 'RestoreProposal'):
            p = self.proposals[pid]
            if name != 'RestoreProposal':
                assert body['expectedProposalRevision'] == p['proposalRevision']
            if name == 'ReplaceProposal':
                p['action'] = body['action']
                p['proposalRevision'] += 1
            p['status'] = 'trashed' if name == 'DismissProposal' else 'open'
            result = deepcopy(p)
        elif name == 'AcceptProposal':
            p = self.proposals[pid]
            assert p['status'] == 'open'
            assert body['expectedProposalRevision'] == p['proposalRevision']
            result = self.create('faq', p['action']['add']['candidate']['content'])
            p['status'] = 'promoted'
        else:
            raise AssertionError(name)
        if result is not None:
            code = next(int(status) for status in operation['responses'] if status.startswith('2'))
            validate(result, operation['responses'][str(code)]['content']['application/json']['schema'])
        return code, result


@pytest.fixture
def fixture_server():
    state = ContractFixture()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def handle_request(self):
            try:
                if self.path == '/v1/responses':
                    assert self.headers.get('Authorization') == 'Bearer model-test-key'
                else:
                    assert self.headers.get('Authorization') in ('Bearer author-test-key', 'Bearer reader-test-key')
                raw = self.rfile.read(int(self.headers.get('Content-Length', '0')))
                body = json.loads(raw) if raw else None
                code, result = state.request(self.command, self.path, body)
            except Exception as error:
                state.errors.append(error)
                code, result = 500, {'error': str(error)}
            content = result if isinstance(result, bytes) else json.dumps(result).encode() if result is not None else b''
            self.send_response(code)
            self.send_header('Content-Type', 'text/markdown' if isinstance(result, bytes) else 'application/json')
            self.send_header('Content-Length', str(len(content)))
            if isinstance(result, bytes) and code == 200:
                self.send_header('Content-Digest', 'sha-256=:' + base64.b64encode(sha256(content).digest()).decode() + ':')
            self.end_headers()
            self.wfile.write(content)

        do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = handle_request

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    env = {**os.environ, 'PLAYBOOK_URL': f'http://127.0.0.1:{server.server_port}', 'PLAYBOOK_ID': PB,
           'PLAYBOOK_API_KEY': 'author-test-key',
           'PLAYBOOK_SKILL_ID': state.skill_id, 'PLAYBOOK_FAQ_ID': state.faq_id,
           'OPENAI_API_KEY': 'model-test-key', 'OPENAI_BASE_URL': f'http://127.0.0.1:{server.server_port}/v1',
           'OPENAI_AGENTS_DISABLE_TRACING': '1'}
    yield state, env
    server.shutdown()
    server.server_close()
    thread.join()


def package_sample(directory):
    source = skill_package()
    subprocess.run(['bash', '-euc', source], cwd=directory, check=True, capture_output=True)


def execute(page, suffix, directory, env, source=None):
    if source is None:
        source = scripts(page)[suffix]
    path = directory / f'{page}_example.{suffix}'
    path.write_text(source)
    if suffix == 'py':
        ast.parse(source)
        command = [sys.executable, str(path)]
    elif suffix == 'mts':
        (directory / 'node_modules').symlink_to((HERE / 'node_modules').resolve(), target_is_directory=True)
        command = [str((HERE / 'node_modules/.bin/tsx').resolve()), str(path)]
    else:
        command = ['bash', str(path)]
    package_sample(directory)
    return subprocess.run(command, env=env, cwd=directory, text=True, capture_output=True, timeout=30)


def normalized(calls):
    calls = deepcopy(calls)
    for name, body in calls:
        if isinstance(body, dict):
            body.pop('observedAt', None)
            if 'packageBase64' in body:
                with ZipFile(io.BytesIO(base64.b64decode(body.pop('packageBase64')))) as archive:
                    body['files'] = {n: archive.read(n).decode() for n in sorted(archive.namelist()) if not n.endswith('/')}
    return calls


@pytest.mark.parametrize('page,omit_totals',
                         [(guide, False) for guide in GUIDES if guide != 'mcp'] +
                         [(guide, True) for guide in ('faqs', 'skills', 'proposals')])
def test_displayed_tabs_execute_and_send_equivalent_requests(page, omit_totals, fixture_server, tmp_path):
    state, env = fixture_server
    traces = []
    for suffix in ('py', 'mts', 'sh'):
        fresh = ContractFixture()
        fresh.omit_totals = omit_totals
        if page == 'proposals':
            for index, status in enumerate(('open', 'open', 'promoted')):
                _, proposal = fresh.request('POST', f'/v1/playbooks/{PB}/proposals', {'action': {'add': {
                    'target': {'newEntry': {}}, 'candidate': {'content': {'payload': {'faq': {
                        'question': f'Sample review question {index}', 'answer': 'Sample review answer',
                    }}}},
                }}})
                fresh.proposals[proposal['proposalId']]['status'] = status
            fresh.calls.clear()
        state.__dict__.update(fresh.__dict__)
        directory = tmp_path / suffix
        directory.mkdir()
        result = execute(page, suffix, directory, env)
        assert not state.errors, state.errors
        assert result.returncode == 0, result.stdout + result.stderr
        if page == 'skills':
            created = next(body for name, body in state.calls if name == 'CreateSkill')
            appended = next(body for name, body in state.calls if name == 'AppendSkillVersion')
            assert 'channel' not in created['content']['attributes']
            assert appended['content']['attributes'] == {**created['content']['attributes'], 'channel': 'chat'}
            with ZipFile(io.BytesIO(base64.b64decode(created['packageBase64']))) as archive:
                assert archive.read('refund-support-reply/references/reply-template.md').decode().strip() in result.stdout
        if page in ('faqs', 'skills', 'proposals'):
            list_calls = {}
            for name, request in state.calls:
                if name.startswith('List'):
                    query = request['query']
                    list_calls.setdefault((name, query.get('view')), []).append(query.get('cursor'))
            assert list_calls
            for cursors in list_calls.values():
                assert cursors == [None, 'fixture+page/1=', 'fixture+page/2='], list_calls
            if omit_totals:
                assert 'unknown' in result.stdout
        traces.append(normalized(state.calls))
    assert traces[0] == traces[1] == traces[2]


@pytest.mark.parametrize('page', ('quickstart', 'skills'))
@pytest.mark.parametrize('suffix', ('py', 'mts', 'sh'))
def test_full_program_copy_retains_published_sample(page, suffix, fixture_server, tmp_path):
    state, env = fixture_server
    path = source_path(page, suffix)
    assert path in full_examples()
    if page == 'skills' and suffix != 'sh':
        package_sample(tmp_path)
    result = execute(page, suffix, tmp_path, env, source=full_examples()[path])
    assert not state.errors, state.errors
    assert result.returncode == 0, result.stdout + result.stderr
    assert not any(name.startswith(('Delete', 'Withdraw')) for name, _ in state.calls)
    kind = 'faq' if page == 'quickstart' else 'skill'
    sample = next(entry for entry in state.entries.values()
                  if entry['entryType'] == kind and entry['entryId'] not in (state.faq_id, state.skill_id))
    assert sample['publication']['version'] == (2 if page == 'quickstart' else 1)
    assert sample['entryId'] in result.stdout
    if page == 'quickstart':
        assert state.calls[-1][0] == 'SearchFaqs'
        final_answer = result.stdout.rsplit('Published answer:', 1)[-1] if suffix != 'sh' else result.stdout.rsplit('"answer":', 1)[-1]
        assert 'cannot guarantee a bank posting date' in final_answer


@pytest.mark.parametrize('suffix', ('py', 'mts', 'sh'))
def test_proposal_edit_preserves_the_candidate_just_reviewed(suffix, fixture_server, tmp_path, monkeypatch):
    state, env = fixture_server
    original_request = state.request
    changed = False

    def another_reviewer(method, path, body):
        nonlocal changed
        if method == 'GET' and re.fullmatch(r'/v1/playbooks/[^/]+/proposals/prp_[0-9a-f]+', path) and not changed:
            proposal = state.proposals[path.rsplit('/', 1)[1]]
            content = proposal['action']['add']['candidate']['content']
            content['metadata'] = {'policyRevision': 'reviewed-update'}
            content['payload']['faq']['answer'] += ' Include the support case number if you have one.'
            proposal['proposalRevision'] += 1
            changed = True
        return original_request(method, path, body)

    monkeypatch.setattr(state, 'request', another_reviewer)
    result = execute('proposals', suffix, tmp_path, env)
    assert not state.errors, state.errors
    assert result.returncode == 0, result.stdout + result.stderr
    replacement = next(body for name, body in state.calls if name == 'ReplaceProposal')
    content = replacement['action']['add']['candidate']['content']
    assert replacement['expectedProposalRevision'] == 2
    assert content['metadata'] == {'policyRevision': 'reviewed-update'}
    assert content['payload']['faq']['answer'].endswith(
        ' Include the support case number if you have one. Do not send full card details.'
    )


@pytest.mark.parametrize('suffix', ('py', 'mts', 'sh'))
@pytest.mark.parametrize('json_error', (True, False))
def test_error_example_reports_failure_and_exits(suffix, json_error, fixture_server, tmp_path, monkeypatch):
    state, env = fixture_server
    original_request = state.request
    status = 404 if json_error else 502
    problem = {'status': 404, 'title': 'Not found', 'type': '/errors/resource-not-found'}
    validate(problem, {'$ref': '#/components/schemas/NotFoundErrorResponseContent'})

    def failed_read(method, path, body):
        if path.endswith('/faqs/' + state.faq_id):
            state.calls.append(('GetFaq', None))
            return status, problem if json_error else b'Upstream unavailable'
        return original_request(method, path, body)

    monkeypatch.setattr(state, 'request', failed_read)
    result = execute('limits', suffix, tmp_path, env)
    assert not state.errors, state.errors
    assert result.returncode != 0
    output = result.stdout + result.stderr
    assert 'Request failed:' in output and str(status) in output
    assert ('/errors/resource-not-found' if json_error else 'unknown') in output
    assert [name for name, _ in state.calls] == ['GetPlaybookHealth', 'GetFaq']


@pytest.mark.parametrize('suffix', ('py', 'mts', 'sh'))
@pytest.mark.parametrize('missing', (False, True))
def test_lookup_example_handles_found_and_missing_references(suffix, missing, fixture_server, tmp_path):
    state, env = fixture_server
    if missing:
        env['PLAYBOOK_FAQ_ID'] = 'ent_' + '0' * 32
    else:
        state.entries[state.faq_id]['entryKey'] = 'refund-status'
    index = ('py', 'mts', 'sh').index(suffix)
    setup = next(code for name, code in blocks('quickstart') if name == 'playbook-connect')[index]
    lookup = next(code for name, code in blocks('faqs') if name == 'playbook-faq-lookup')[index]
    binding = (
        'faq_id = os.environ["PLAYBOOK_FAQ_ID"]',
        'const faqId = requiredEnv("PLAYBOOK_FAQ_ID");',
        'FAQ_ID="$PLAYBOOK_FAQ_ID"',
    )[index]
    source = '\n\n'.join((setup, binding, lookup))
    result = execute('lookup', suffix, tmp_path, env, source=source)
    assert not state.errors, state.errors
    assert result.returncode == 0, result.stdout + result.stderr
    assert ('missing' in result.stdout.lower()) == missing
    assert [name for name, _ in state.calls] == ['GetPlaybookHealth', 'LookupEntries']
    assert state.calls[-1][1]['references'] == [
        {'entryId': env['PLAYBOOK_FAQ_ID']}, {'entryKey': 'refund-status'},
    ]


def test_displayed_async_python_example(fixture_server, tmp_path):
    state, env = fixture_server
    env['PLAYBOOK_API_KEY'] = 'reader-test-key'
    source = standalone_python('quickstart', 'Use Python asynchronously')
    result = execute('async_search', 'py', tmp_path, env, source=source)
    assert not state.errors, state.errors
    assert result.returncode == 0, result.stdout + result.stderr
    assert 'Sample answer' in result.stdout
    assert state.calls == [('SearchFaqs', {
        'query': 'Where can I see how my refund is progressing?', 'limit': 5,
    })]


@pytest.mark.parametrize('page', ('faqs', 'skills'))
@pytest.mark.parametrize('suffix', ('py', 'mts', 'sh'))
def test_full_withdrawal_copy_retains_entry_and_history(page, suffix, fixture_server, tmp_path):
    from copy import deepcopy
    state, env = fixture_server
    identifier = state.faq_id if page == 'faqs' else state.skill_id
    before = deepcopy(state.versions)
    path = source_path(page, suffix).with_name(f'{page}_withdraw.{suffix}')
    result = execute(page, suffix, tmp_path, env, source=processed(path)[0])
    assert result.returncode == 0, result.stdout + result.stderr
    assert not state.errors, state.errors
    assert identifier in state.entries
    assert state.entries[identifier].get('publication') is None
    assert state.versions == before
    assert not any(name.startswith('Delete') for name, _ in state.calls)


@pytest.mark.parametrize('page', ('faqs', 'skills'))
@pytest.mark.parametrize('suffix', ('py', 'mts', 'sh'))
def test_full_deletion_copy_deletes_only_the_selected_entry(page, suffix, fixture_server, tmp_path):
    state, env = fixture_server
    identifier = state.faq_id if page == 'faqs' else state.skill_id
    other = state.skill_id if page == 'faqs' else state.faq_id
    path = source_path(page, suffix).with_name(f'{page}_delete.{suffix}')
    result = execute(page, suffix, tmp_path, env, source=processed(path)[0])
    assert result.returncode == 0, result.stdout + result.stderr
    assert not state.errors, state.errors
    assert identifier not in state.entries and other in state.entries
    assert not any(name.startswith('Withdraw') for name, _ in state.calls)


def test_live_cleanup_attempts_all_resources_after_an_error(monkeypatch):
    from types import SimpleNamespace
    import live_examples
    calls = []
    def fail_first(method, url, token):
        calls.append(url)
        if len(calls) == 1:
            raise OSError('temporary connection failure')
    monkeypatch.setattr(live_examples, 'request', fail_first)
    args = SimpleNamespace(ids_url='http://identity.invalid', cp_url='http://control.invalid',
                           control_token='test-control', admin_token='test-admin')
    failures = live_examples.cleanup(args, 'test-playbook', ['key-one', 'key-two'])
    assert calls == ['http://identity.invalid/v1/api-keys/key-one',
                     'http://identity.invalid/v1/api-keys/key-two',
                     'http://control.invalid/v1/playbooks/test-playbook']
    assert len(failures) == 1 and 'temporary connection failure' in failures[0]
