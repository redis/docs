import logging
import os
import re
from .structured_data import StructuredData
from .syntax import Command
from .util import die, command_filename


class Markdown:
    FM_TYPES = {
        '{\n': {
            'eof': '}\n',
            'ext': '.json'
        },
        '---\n': {
            'eof': '---\n',
            'ext': '.yaml'
        },
        '+++\n': {
            'eof': '+++\n',
            'ext': '.toml'
        }
    }

    def __init__(self, filepath: str, warnings: bool = False):
        self.filepath = filepath
        self.warnings = warnings
        self.fm_data = dict()
        self.fm_type = self.FM_TYPES.get('---\n')
        self.fm_ext = self.fm_type.get('ext')
        self.payload = ''
        if not self.filepath or not os.path.exists(self.filepath):
            return
        with open(self.filepath, 'r') as f:
            payload = f.readlines()
        if len(payload) == 0:
            self.fm_type = self.FM_TYPES.get('---\n')
            self.fm_ext = self.fm_type.get('ext')
            return
        i = 0
        while i < len(payload):
            if payload[i].startswith('\ufeff'):  # BOM workaround
                payload[i] = payload[i][1:]
            if payload[i].strip() == '':         # Munch newlines and whitespaces
                i += 1
            else:
                self.fm_type = self.FM_TYPES.get(payload[i])
                break

        if not self.fm_type:
            self.payload = ''.join(payload)
            self.fm_type = self.FM_TYPES.get('---\n')
            self.fm_ext = self.fm_type.get('ext')
            return
        eof, self.fm_ext = self.fm_type.get('eof'), self.fm_type.get('ext')
        found = False
        for j in range(i+1, len(payload)):
            if payload[j] == eof:
                found = True
                break
        if not found and payload[j].strip() != eof.strip():
            die(f'No EOF for frontmatter: {payload}')
        if self.fm_ext == '.json':
            self.fm_data.update(StructuredData.loads(
                self.fm_ext, ''.join(payload[i:j+1])))
            self.payload = ''.join(payload[j+1:])
        else:
            self.fm_data.update(StructuredData.loads(
                self.fm_ext, ''.join(payload[i+1:j])))
            self.payload = ''.join(payload[j+1:])

    def add_github_metadata(self, github_repo: str, github_branch: str, github_path: str) -> None:
        if self.fm_data.get('github_repo'):
            return
        self.fm_data['github_repo'] = github_repo
        self.fm_data['github_branch'] = github_branch
        self.fm_data['github_path'] = github_path

    def report_links(self) -> None:
        exc = ['./', '#', '/commands', '/community', '/docs', '/topics']
        for link in re.finditer(r'(\[.+])(\(.+\))', self.payload):
            ex = False
            for e in exc:
                if link[1].startswith(f'({e}'):
                    ex = True
                    break
            if not ex:
                print(f'"{link[1]}","{link[0]}","{self.filepath}"')

    def persist(self) -> None:
        # self.report_links()
        payload = self.payload
        if self.fm_type:
            fm = StructuredData.dumps(self.fm_ext, self.fm_data)
            if self.fm_ext != '.json':
                fm = f'{self.fm_type.get("eof")}{fm}{self.fm_type.get("eof")}'
            else:
                fm += '\n'
            payload = fm + payload
        else:
            if self.warnings:
                logging.warning(
                    f'{self.filepath} has no FrontMatter attached - please make a corrective move ASAP!')

        with open(self.filepath, 'w') as f:
            f.write(payload)

    @staticmethod
    def get_command_tokens(arguments: dict) -> set:
        """ Extract tokens from command arguments """
        rep = set()
        if type(arguments) is list:
            for arg in arguments:
                rep = rep.union(Markdown.get_command_tokens(arg))
        else:
            if 'token' in arguments:
                rep.add(arguments['token'])
            if 'arguments' in arguments:
                for arg in arguments['arguments']:
                    rep = rep.union(Markdown.get_command_tokens(arg))
        return rep

    @staticmethod
    def make_command_linkifier(commands: dict, name: str):
        """
        Returns a function (for re.sub) that converts valid ticked command names to
        markdown links. This excludes the command in the context, as well as any of
        its arguments' tokens.
        """
        if name:
            exclude = set([name])
            tokens = Markdown.get_command_tokens(commands.get(name))
            exclude.union(tokens)
        else:
            exclude = set()

        def linkifier(m):
            command = m.group(1)
            if command in commands and command not in exclude:
                return f'[`{command}`]({{{{< relref "/commands/{command_filename(command)}" >}}}})'
            else:
                return m.group(0)
        return linkifier

    def generate_commands_links(self, name: str, commands: dict, payload: str) -> str:
        """ Generate markdown links for back-ticked commands """
        linkifier = Markdown.make_command_linkifier(commands, name)
        rep = re.sub(r'`([A-Z][A-Z-_ \.]*)`', linkifier, payload)
        rep = re.sub(r'`!([A-Z][A-Z-_ \.]*)`', lambda x: f'`{x[1]}`', rep)
        return rep

    @staticmethod
    def get_cli_shortcode(m):
        snippet = m[1]
        start = f'{{{{% redis-cli %}}}}'
        end = f'{{{{% /redis-cli %}}}}'
        return f'{start}\n{snippet.strip()}\n{end}\n'

    @staticmethod
    def convert_cli_snippets(payload):
        """ Convert the ```cli notation to Hugo shortcode syntax """
        rep = re.sub(r'```cli(.*?)```',
                     Markdown.get_cli_shortcode, payload, flags=re.S)
        return rep

    @staticmethod
    def convert_reply_shortcuts(payload):
        """ Convert RESP reply type shortcuts to links """
        def reply(x):
            resp = {
                'simple-string': ('simple-strings', 'Simple string reply'),
                'simple-error': ('simple-errors', 'Simple error reply'),
                'integer': ('integers', 'Integer reply'),
                'bulk-string': ('bulk-strings', 'Bulk string reply'),
                'array': ('arrays', 'Array reply'),
                'nil': ('bulk-strings', 'Nil reply'),
                'null': ('nulls', 'Null reply'),
                'boolean': ('booleans', 'Boolean reply'),
                'double': ('doubles', 'Double reply'),
                'big-number': ('big-numbers', 'Big number reply'),
                'bulk-error': ('bulk-errors', 'Bulk error reply'),
                'verbatim-string': ('verbatim-strings', 'Verbatim string reply'),
                'map': ('maps', 'Map reply'),
                'set': ('sets', 'Set reply'),
                'push': ('pushes', 'Push reply')
            }
            rep = resp.get(x.group(1), None)
            if rep:
                return f'[{rep[1]}](/docs/reference/protocol-spec#{rep[0]})'
            return f'[]'

        rep = re.sub(r'@([a-z\-]+)-reply', reply, payload)
        return rep

    @staticmethod
    def convert_command_sections(payload):
        """ Converts redis-doc section headers to MD """
        rep = re.sub(r'@examples\n',
                     '## Examples\n', payload)
        rep = re.sub(r'@return\n',
                     '## Return\n', rep)
        return rep

    def add_command_frontmatter(self, name, commands):
        """ Sets a JSON FrontMatter payload for a command page """
        data = commands.get(name)
        c = Command(name, data)
        data.update({
            'title': name,
            'linkTitle': name,
            'description': data.get('summary'),
            'syntax_str': str(c),
            'syntax_fmt': c.syntax(),
            'hidden': c.isPureContainer() or c.isHelpCommand()
        })
        if 'replaced_by' in data:
            data['replaced_by'] = self.generate_commands_links(
                name, commands, data.get('replaced_by'))
        self.fm_type = self.FM_TYPES.get('---\n')
        self.fm_ext = self.fm_type.get('ext')
        self.fm_data.update(data)

    def process_command(self, name, commands):
        """ New command processing logic """
        logging.debug(f'Processing command {self.filepath}')
        self.payload = self.generate_commands_links(
            name, commands, self.payload)
        self.payload = self.convert_command_sections(self.payload)
        self.payload = self.convert_reply_shortcuts(self.payload)
        self.payload = self.convert_cli_snippets(self.payload)
        self.add_command_frontmatter(name, commands)
        self.persist()

    def process_doc(self, commands):
        """ New doc processing logic """
        logging.debug(f'Processing document {self.filepath}')
        self.payload = self.generate_commands_links(
            None, commands, self.payload)
        self.persist()

    def patch_module_paths(self, module_id: str, module_path) -> None:
        """ Replaces absolute module documentation links """
        def rep(x):
            if x.group(2).startswith(f'(/{module_id}/'):
                r = f'{x.group(1)}(/{module_path}/{x.group(2)[len(module_id)+3:-1]})'
                return r
            else:
                return x.group(0)
        self.payload = re.sub(r'(\[.+])(\(.+\))', rep, self.payload)
