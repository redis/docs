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

    def apply(self, *items):
        work = {'new': list(items), 'gone': [], 'review': [], 'unused_codes_now_used': [], 'sources': [],
                'target': {'redis': '9.0.0'}}
        data = {'versions': {}, 'errors': []}
        with patch.object(u, 'latest_work') as latest, patch.object(u, 'load_data', return_value=data), \
                patch.object(u, 'save_data') as save, patch.object(u, 'cmd_check', return_value=0):
            latest.return_value.read_text.return_value = json.dumps(work)
            with contextlib.redirect_stdout(io.StringIO()):
                u.cmd_apply(type('Args', (), {'work': None})())
        return save.call_args[0][0]['errors']

    def test_apply_adds_a_message(self):
        self.assertEqual(len(self.apply({'id': 'new-1', 'decision': 'add', 'entries': [self.entry()]})), 1)

    def test_apply_refuses_a_message_added_twice(self):
        with self.assertRaises(SystemExit) as stop:
            self.apply({'id': 'new-1', 'decision': 'add', 'entries': [self.entry()]},
                       {'id': 'new-extra-1', 'decision': 'add', 'entries': [self.entry()]})
        self.assertIn('new-1 adds the message', str(stop.exception))

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
        # The real baseline, so that the new page sorts after pages that it has.
        with open(os.path.join(os.path.dirname(__file__), 'errors', 'live_baseline.json')) as f:
            baseline = json.load(f)
        results = {**baseline, 'denied': {'raw': ['-DENIED']}, 'zzz-new': {'raw': ['-ZZZ']}}
        self.assertEqual(self.lc.compare(baseline, results), [])
        self.assertEqual(self.lc.unrecorded(baseline, results), ['denied', 'zzz-new'])

    def test_failures_and_lost_replies_are_changes(self):
        meta = {'_meta': {'redis_py': None}}
        baseline = {**meta, 'oom': {'raw': ['-OOM']}}
        results = {**meta, '_failures': {'notes': ['standalone: boom']}}
        self.assertEqual([p for p, _ in self.lc.compare(baseline, results)], ['_failures', 'oom'])


if __name__ == '__main__':
    unittest.main()
