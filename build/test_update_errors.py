#!/usr/bin/env python3
"""
Unit tests for errors/update_errors.py, the tool that keeps the error reference
up to date with new Redis releases. They run offline.
"""

import contextlib
import io
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'errors'))

import update_errors as u  # noqa: E402


def corpus(*values, errors=True):
    return u.Corpus({'repo': 'redis', 'tag': 't', 'literals': [[v, 'src/a.c', i + 1, errors] for i, v in enumerate(values)]})


class TestNormalize(unittest.TestCase):
    def test_printf_formats_become_placeholders(self):
        self.assertEqual(u.normalize("wrong number of arguments for '%s' command"),
                         "wrong number of arguments for '\0' command")
        self.assertEqual(u.normalize('value %lld out of %.*s range %%'), 'value \0 out of \0 range %')

    def test_rust_formats(self):
        self.assertEqual(u.normalize('bad {name} at {}: {{x}}', rust=True), 'bad \0 at \0: {x}')

    def test_message_placeholders_and_spaces(self):
        self.assertEqual(u.normalize('ERR  unknown command <command>,\n with', message=True), 'ERR unknown command \0, with')


class TestLiterals(unittest.TestCase):
    def test_adjacent_c_strings_are_joined(self):
        found = u.literals('addReplyErrorFormat(c, "value " "is %" PRId64 " big");', rust=False)
        self.assertEqual(found, [(1, 'value is \0 big', True)])

    def test_comments_and_chars_are_skipped(self):
        src = '// addReplyError(c, "in a comment");\nchar q = \'"\';\naddReplyError(c, "real one");\n'
        self.assertEqual([v for _, v, _ in u.literals(src, rust=False)], ['real one'])

    def test_logging_is_not_an_error(self):
        src = 'serverLog(LL_WARNING,\n    "Error opening the file");\nif (err) addReplyError(c,\n  "Error reply");\n'
        self.assertEqual([(v, e) for _, v, e in u.literals(src, rust=False)],
                         [('Error opening the file', False), ('Error reply', True)])

    def test_rust_raw_strings_and_line_continuation(self):
        src = 'return Err(RedisError::String(format!("bad path \\\n        {}", p)));\nlet r = r#"raw "quoted""#;\n'
        self.assertEqual([v for _, v, _ in u.literals(src, rust=True)], ['bad path \0', 'raw "quoted"'])

    def test_rust_lifetimes_are_not_chars(self):
        src = "fn f<'a>(x: &'a str) -> Result<(), &'a str> { Err(\"too long\") }"
        self.assertEqual([v for _, v, _ in u.literals(src, rust=True)], ['too long'])


class TestAnchors(unittest.TestCase):
    def test_whole_fragment(self):
        e = {'message': "ERR wrong number of arguments for '<command>' command", 'prefix': 'ERR'}
        self.assertEqual(u.anchor(e, corpus("wrong number of arguments for '\0' command")),
                         "wrong number of arguments for '")

    def test_message_built_from_pieces(self):
        # The offset part is added by other code, so only the start of the fragment is in one string.
        e = {'message': "SEARCH_SYNTAX 'ismissing' requires defining the field with 'INDEXMISSING' at offset <n> near <t>",
             'prefix': 'SEARCH_SYNTAX'}
        c = corpus("'ismissing' requires defining the field with 'INDEXMISSING'", 'at offset \0 near \0')
        self.assertEqual(u.anchor(e, c), "'ismissing' requires defining the field with 'INDEXMISSING'")

    def test_short_message_needs_a_whole_string(self):
        e = {'message': 'Bad capacity', 'prefix': 'Bad'}
        self.assertEqual(u.anchor(e, corpus('Bad capacity')), 'Bad capacity')
        self.assertIsNone(u.anchor(e, corpus('Bad capacity value')))

    def test_where_puts_error_code_first(self):
        c = u.Corpus({'repo': 'redis', 'tag': 't', 'literals': [
            ['DB index is out of range', 'src/a.c', 5, False], ['DB index is out of range', 'src/b.c', 9, True]]})
        self.assertEqual(c.where('index is out'), [('src/b.c', 9), ('src/a.c', 5)])


class TestRemap(unittest.TestCase):
    def test_duplicate_lines_follow_their_neighbours_and_the_message(self):
        old = ['x', 'if (bad) {', 'addReplyError(c,', '"first message");', '}', 'addReplyError(c,', '"second message");',
               'removed();']
        new = ['new line', 'addReplyError(c,', '"second message");', 'x', 'if (bad) {', 'addReplyError(c,',
               '"first message");', '}']
        files = {'old': old, 'new': new}
        with patch.object(u, 'file_lines', lambda name, tag, path: files[tag]):
            self.assertEqual(u.remap('redis', 'old', 'new', 'src/a.c', 3, 'first message'), ('src/a.c', 6))
            self.assertEqual(u.remap('redis', 'old', 'new', 'src/a.c', 6, 'second message'), ('src/a.c', 2))
            self.assertEqual(u.remap('redis', 'old', 'new', 'src/a.c', 1), ('src/a.c', 4))
            self.assertIsNone(u.remap('redis', 'old', 'new', 'src/a.c', 8))


class TestApplyValidation(unittest.TestCase):
    def entry(self, **kw):
        e = {'message': 'ERR backupdirname can\'t be empty', 'prefix': 'ERR', 'module': 'core',
             'commands': ['CONFIG SET'], 'explain': 'You set it to an empty string.', 'explain_basis': 'source'}
        e.update(kw)
        return e

    def test_good_entry(self):
        self.assertEqual(u.validate_entry(self.entry(), 'new-1'), [])

    def test_bad_entries(self):
        self.assertTrue(u.validate_entry(self.entry(explain=' '), 'x'))
        self.assertTrue(u.validate_entry(self.entry(explain_basis='guess'), 'x'))
        self.assertTrue(u.validate_entry(self.entry(prefix='WRONGTYPE'), 'x'))
        self.assertTrue(u.validate_entry(self.entry(module='redis'), 'x'))
        self.assertTrue(u.validate_entry(self.entry(colour='red'), 'x'))
        self.assertTrue(u.validate_entry(self.entry(commands=[]), 'x'))
        self.assertTrue(u.validate_entry(self.entry(commands=[], scope='most'), 'x'))
        self.assertEqual(u.validate_entry(self.entry(commands=[], scope='any'), 'x'), [])

    def apply(self, *items, errors=(), versions='8.10.3', **lists):
        work = {'new': list(items), 'gone': [], 'review': [], 'unused_codes_now_used': [], 'sources': [],
                'base': {'redis': '8.10.3'}, 'target': {'redis': '9.0.0'}, **lists}
        data = {'versions': {'redis': versions}, 'errors': [dict(e) for e in errors]}
        with patch.object(u, 'latest_work') as latest, patch.object(u, 'load_data', return_value=data), \
                patch.object(u, 'save_data') as save, patch.object(u, 'check', return_value=(['a page to update'], [])):
            latest.return_value.read_text.return_value = json.dumps(work)
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(u.cmd_apply(type('Args', (), {'work': None})()), 0)
        return save.call_args[0][0]['errors']

    def test_apply_adds_a_message(self):
        self.assertEqual(len(self.apply({'id': 'new-1', 'decision': 'add', 'entries': [self.entry()]})), 1)

    def test_apply_refuses_a_message_added_twice(self):
        with self.assertRaises(SystemExit) as stop:
            self.apply({'id': 'new-1', 'decision': 'add', 'entries': [self.entry()]},
                       {'id': 'new-extra-1', 'decision': 'add', 'entries': [self.entry()]})
        self.assertIn('new-1 adds the message', str(stop.exception))

    def test_apply_needs_the_data_at_the_work_files_base(self):
        with self.assertRaises(SystemExit) as stop:
            self.apply(versions='9.0.0')
        self.assertIn('already applied', str(stop.exception))
        with self.assertRaises(SystemExit) as stop:
            self.apply(versions='8.8.0')
        self.assertIn('Run the diff step again', str(stop.exception))

    def test_apply_checks_the_values_it_merges(self):
        e = self.entry()
        review = {'id': 'review-1', 'module': 'core', 'message': e['message'], 'decision': 'update'}
        for bad in ({'prefix': 'WRONGTYPE'}, {'module': 'redis'}, {'commands': 'SET'}):
            with self.assertRaises(SystemExit, msg=bad):
                self.apply(errors=[e], review=[{**review, 'set': bad}])
        with self.assertRaises(SystemExit) as stop:
            self.apply(review=[{**review, 'set': {'explain': 'x'}}])
        self.assertIn('the data has no core message', str(stop.exception))

    def test_a_code_now_used_gets_its_explanation_from_set(self):
        unused = {'message': 'SEARCH_KEYWORD Keyword error', 'prefix': 'SEARCH_KEYWORD', 'module': 'search',
                  'commands': [], 'unused': True}
        item = {'code': 'SEARCH_KEYWORD', 'uses': 2, 'decision': 'used'}
        with self.assertRaises(SystemExit) as stop:
            self.apply(errors=[unused], unused_codes_now_used=[item])
        self.assertIn('empty explain', str(stop.exception))
        saved = self.apply(errors=[unused], unused_codes_now_used=[
            {**item, 'set': {'explain': 'Your query has a reserved word.', 'explain_basis': 'source', 'scope': 'query'}}])
        self.assertNotIn('unused', saved[0])
        self.assertEqual(saved[0]['explain_basis'], 'source')

    def test_check_finds_a_repeated_message(self):
        problems, _ = u.check({'versions': u.load_data()['versions'], 'errors': [self.entry(), self.entry()]})
        self.assertIn('Listed twice: core: ' + self.entry()['message'], problems)


class TestTheRealData(unittest.TestCase):
    def test_sort_order_matches_the_data(self):
        errors = u.load_data()['errors']
        self.assertEqual(sorted(errors, key=u.sort_key), errors)

    def test_check_passes(self):
        problems, _ = u.check(u.load_data())
        self.assertEqual(problems, [])

    def without(self, keep):
        data = u.load_data()
        data['errors'] = [e for e in data['errors'] if keep(e)]
        return u.check(data)[0]

    def test_check_finds_a_page_whose_message_is_gone(self):
        # "ERR <reason>" is still in the data, and mustn't count as the page's message.
        problems = self.without(lambda e: e['message'] != 'ERR syntax error')
        self.assertTrue(any(p.startswith('common/err-syntax-error.md: no message') for p in problems), problems)

    def test_check_finds_a_section_without_messages(self):
        problems = self.without(lambda e: e['prefix'] != 'SEARCH_SYNTAX')
        self.assertTrue(any('section for SEARCH_SYNTAX has no messages' in p for p in problems), problems)

    def test_needs_section(self):
        self.assertTrue(u.needs_section('core', 'NOGROUP'))
        self.assertTrue(u.needs_section('search', 'SEARCH_SYNTAX'))
        self.assertFalse(u.needs_section('bloom', 'Bad'))


class TestLiveChecks(unittest.TestCase):
    def setUp(self):
        import live_checks
        self.lc = live_checks

    def test_client(self):
        if self.lc.redis:
            self.assertIsInstance(self.lc.client(port=6550), self.lc.redis.Redis)
        with patch.object(self.lc, 'redis', None):
            self.assertIsNone(self.lc.py_err(lambda: self.lc.client(port=6550).ping()))

    def test_a_page_without_a_baseline_is_not_a_change(self):
        # The real baseline, so that a new page sorts after pages that it has.
        with open(os.path.join(os.path.dirname(__file__), 'errors', 'live_baseline.json')) as f:
            baseline = json.load(f)
        new = ['mmm-new', 'zzz-new']
        self.assertFalse(set(new) & set(baseline))
        results = {**baseline, **{page: {'raw': ['-NEW']} for page in new}}
        self.assertEqual(self.lc.compare(baseline, results), [])
        self.assertEqual(self.lc.unrecorded(baseline, results), new)

    def accept(self, results):
        with tempfile.TemporaryDirectory() as work, patch.object(u, 'WORK', u.Path(work)), \
                patch.object(self.lc, 'run', return_value=results), \
                patch.object(u.Path, 'write_text') as write, self.assertRaises(SystemExit) as stop:
            u.cmd_verify(type('Args', (), {'version': '8.10.3', 'accept': True})())
        write.assert_not_called()
        return str(stop.exception)

    def test_accept_refuses_an_incomplete_run(self):
        with open(os.path.join(os.path.dirname(__file__), 'errors', 'live_baseline.json')) as f:
            baseline = json.load(f)
        failed = {**baseline, '_failures': {'notes': ['cluster: RuntimeError: 6560 did not start']}}
        self.assertIn('cluster: RuntimeError', self.accept(failed))
        lost = {k: v for k, v in baseline.items() if k != 'moved'}
        self.assertIn('common/moved.md: no server replies', self.accept(lost))
        # A page that kept its notes but lost its server reply is incomplete too.
        no_raw = {**baseline, 'loading': {k: v for k, v in baseline['loading'].items() if k != 'raw'}}
        self.assertIn('common/loading.md: no server replies', self.accept(no_raw))
        no_py = {**baseline, '_meta': {**baseline['_meta'], 'redis_py': None}}
        self.assertIn('Install redis-py', self.accept(no_py))

    def test_random_ids_are_not_changes(self):
        meta = {'_meta': {'redis_py': None}}
        info = 'INFO -> master_replid:%s\r\nmaster_repl_offset:%d'
        baseline = {**meta, 'masterdown': {'notes': [info % ('be4ddc0c3c1d7a2f9db6' * 2, 1)]}}
        results = {**meta, 'masterdown': {'notes': [info % ('3e8e5ca1e0feaf4f7ca2' * 2, 2)]}}
        self.assertEqual(self.lc.compare(baseline, results), [])

    def test_timings_are_not_changes(self):
        meta = {'_meta': {'redis_py': None}}
        baseline = {**meta, 'noperm': {'notes': ["ACL LOG -> [b'age-seconds', b'0']"]}}
        results = {**meta, 'noperm': {'notes': ["ACL LOG -> [b'age-seconds', b'0.001']"]}}
        self.assertEqual(self.lc.compare(baseline, results), [])

    def test_failures_and_lost_replies_are_changes(self):
        meta = {'_meta': {'redis_py': None}}
        baseline = {**meta, 'oom': {'raw': ['-OOM']}}
        results = {**meta, '_failures': {'notes': ['standalone: boom']}}
        self.assertEqual([p for p, _ in self.lc.compare(baseline, results)], ['_failures', 'oom'])


if __name__ == '__main__':
    unittest.main()
