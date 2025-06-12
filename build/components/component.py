import logging
import glob
import os
import shutil

import semver
import uuid
from typing import Tuple
from urllib.parse import urlparse, ParseResult

from .markdown import Markdown
from .structured_data import load_dict, dump_dict
from .syntax import Command
from .util import die, mkdir_p, rsync, regex_in_file, run, rm_rf, command_filename, slugify
from .example import Example

def parseUri(uri: str) -> Tuple[ParseResult, str, str]:
    _uri = urlparse(uri)
    dirname = os.path.dirname(uri)
    _, name = os.path.split(_uri.path)
    _, ext = os.path.splitext(name)
    return _uri, dirname, name, ext


class Component(dict):
    def __init__(self, filepath: str = None, root: dict = None, args: dict = None):
        super().__init__()
        self._root = root
        self._args = args
        if filepath:
            self._uri, self._dirname, self._filename, self._ext = parseUri(
                filepath)
            self.update(load_dict(filepath))
        self._id = self.get('id')
        self._type = self.get('type')
        self._name = self.get('name', self._id)
        self._desc = self.get('description', '')
        self._stack_path = self.get('stack_path', '')
        self._repository = self.get('repository', None)

    @staticmethod
    def _dump_payload(spath: str, dpath: str, payload: list, repo: str = None, repo_branch: str = None) -> None:
        if not payload:
            return []
        files = []
        for dump in payload:
            src = dump.get('src')
            dst = dump.get('dst', src)
            proc_md = dump.get('proc_md')
            s = os.path.join(spath, src)
            d = os.path.join(dpath, dst)
            if os.path.isfile(s):
                mkdir_p(os.path.dirname(d))
            else:
                mkdir_p(d)
            files += rsync(s, d)

            # if proc_md:
                #Component._add_meta_fm(repo, repo_branch, d, src)

            search = dump.get('search', None)
            replace = dump.get('replace', None)
            if search:
                if os.path.isdir(s):
                    files = next(os.walk(d), (None, None, []))[2]
                else:
                    files = [d]
                for file in files:
                    regex_in_file(file, search, replace)

    @staticmethod
    def _get_dev_branch(repository: dict) -> str:
        branch = repository.get("dev_branch")
        post = repository .get("branches_postfix", "")
        return f'{branch}{post}'

    @staticmethod
    def _add_meta_fm(repo: str, branch: str, base: str, path: str) -> None:
        _, dirs, files = next(os.walk(base))
        for d in dirs:
            spath = path.split('/')[-1]
            if spath == d:
                Component._add_meta_fm(repo, branch, os.path.join(base, d), path)
            else:
                Component._add_meta_fm(repo, branch, os.path.join(base, d), os.path.join(path, d))
        for f in files:
            if not f.endswith('.md'):
                continue
            md = Markdown(os.path.join(base, f))
            md.add_github_metadata(repo, branch, os.path.join(path, f))
            md.persist()

    def _git_clone(self, repo) -> str:
        git_uri = repo.get('git_uri')
        private = repo.get('private', False)
        uri, _, name, ext = parseUri(git_uri)
        to = f'{self._root._tempdir}/{name}'
        if uri.scheme == 'https' and ext in ['', '.git'] and self._repo_uri() != git_uri:
            if not self._root._skip_clone and git_uri not in self._root._clones:
                rm_rf(to)
                mkdir_p(to)
                logging.debug(
                    f'Cloning {private and "private" or "public"} {git_uri} to {to}')
                self._root._clones[git_uri] = True
                if private:
                    pat = os.environ.get('PRIVATE_ACCESS_TOKEN')
                    if pat is None:
                        die('Private repos without a PRIVATE_ACCESS_TOKEN - aborting.')
                    git_uri = f'{uri.scheme}://{pat}@{uri.netloc}{uri.path}'
                run(f'git clone {git_uri} {to}')
                run(f'git fetch --all --tags', cwd=to)
            else:
                logging.debug(f'Skipping clone {git_uri}')
            return to
        elif self._repo_uri() == git_uri:
            return self._repo_env_dir()
        elif (uri.scheme == 'file' or uri.scheme == '') and ext == '':
            return uri.path
        else:
            die('Cannot determine git repo - aborting.')

    def _get_commands(self) -> list:
        commands = self.get('commands')
        repo = self._git_clone(commands)
        branch = Component._get_dev_branch(commands)
        self._checkout(branch, repo, commands)
        path = commands.get('path', '')

        logging.info(f'Copying {self._id} commands')
        filename = commands.get('defs', 'commands.json')
        filepath = f'{repo}/{filename}'
        logging.info(
            f'Reading {self._id} {self._type} commands.json from {branch}/{filename}')
        cmds = load_dict(filepath)

        sinter = set(cmds).intersection(set(self._root._commands))
        if len(sinter) != 0:
            logging.error(f'Duplicate command(s) found in {self._id}:')
            logging.error(sinter)
            die()

        if self._type == 'module':
            for key in cmds:
                cmds[key]['module'] = self._name
                cmds[key]['stack_path'] = self._stack_path
        self._root._commands.update(cmds)

        base = f'{repo}/{path}/'
        dst = f'{self._root._website.get("content")}/commands/'
        srcs = [f'{base}{command_filename(cmd)}.md' for cmd in cmds]
        files = rsync(' '.join(srcs), dst)[1:-5]
        self._dump_payload(base, dst, cmds.get('payload', None))
        #self._add_meta_fm(commands.get('git_uri'), branch, dst, path)
        if self._type == 'module':
            for file in files:
                path = f'{dst}/{file}'
                md = Markdown(path)
                md.patch_module_paths(self._id, self._stack_path)
                md.persist()
        return files

    def _get_groups(self) -> None:
        for key, val in self.get('groups').items():
            d = {
                'display': val.get('display', self._name),
                'description': val.get('description', self._desc),
                'weight': self.get('stack_weight', 0)
            }
            if self._type == 'module':
                top = 'stack'
                vdt = {}
            else:
                top = 'core'
                vdt = []
            if not self._root._groups.get(top):
                self._root._groups[top] = {}
                self._root._versions[top] = vdt
            if self._type == 'module':
                self._root._versions[top][key] = []
            self._root._groups[top][key] = d

    def _get_docs(self) -> list:
        docs = self.get('docs')
        if docs is None:
            return []

        repo = self._git_clone(docs)
        branch = Component._get_dev_branch(docs)
        self._checkout(branch, repo, docs)
        path = docs.get('path', '')
        logging.info(f'Copying {self._id} docs')
        src = f'{repo}/{path}/'
        dst = f'{self._content}'
        mkdir_p(dst)
        files = rsync(src, dst)[1:-5]
        Component._dump_payload(src, dst, docs.get('payload', None))
        #Component._add_meta_fm(docs.get('git_uri'), branch, dst, path)
        return files

    def _get_misc(self) -> None:
        misc = self.get('misc')
        payload = misc.get('payload')
        repo = self._git_clone(misc)
        branch = Component._get_dev_branch(misc)
        self._checkout(branch, repo, misc)
        Component._dump_payload(repo, self._root._content, payload, misc.get('git_uri'), branch)
        return

    def _repo_env_dir(self) -> str:
        if os.getenv(f'REPO_DIR'):
            return os.getenv(f'REPO_DIR')
        return ''

    def _repo_uri(self) -> str:
        if(os.getenv('REPOSITORY_URL')):
            return os.getenv('REPOSITORY_URL')
        return ''

    def _preview_mode(self) -> bool:
        if(os.getenv("PREVIEW_MODE") == 1):
            return True
        return False

    def _skip_checkout(self, obj) -> bool:
        if obj.get('git_uri') == self._repo_uri() and self._preview_mode():
            return True
        return False

    def _checkout(self, ref, dest, obj):
        if not self._skip_checkout(obj):
            run(f'git checkout {ref}', cwd=dest)

class All(Component):
    def __init__(self, filepath: str, root: dict = None, args: dict = None):
        super().__init__(filepath, root, args)
        self._groups = {}
        self._commands = {}
        self._versions = {}
        self._clones = {}
        self._repos = {}
        self._tempdir = args.get('tempdir')
        self._website = self.get('website')
        self._skip_clone = self.get('skip_clone')
        self._content = f'{self._website.get("path")}/{self._website.get("content")}'
        self._examples = {}
        mkdir_p(self._content)

    def _persist_commands(self) -> None:
        filepath = f'{self._website.get("path")}/{self._website.get("commands")}'
        logging.info(f'Persisting {self._id} commands: {filepath}')
        dump_dict(filepath, self._commands)

    def _persist_groups(self) -> None:
        filepath = f'{self._website.get("path")}/{self._website.get("groups")}'
        logging.info(f'Persisting {self._id} groups: {filepath}')
        dump_dict(filepath, self._groups)

    def _persist_examples(self) -> None:
        filepath = f'{self._website.get("path")}/{self._website.get("examples")}'
        logging.info(f'Persisting {self._id} examples: {filepath}')
        dump_dict(filepath, self._examples)

    def _persist_versions(self) -> None:
        filepath = f'{self._website.get("path")}/{self._website.get("versions")}'
        logging.info(f'Persisting {self._id} versions: {filepath}')
        for cmd in self._commands.values():
            since = semver.VersionInfo.parse(cmd.get('since'))
            since = f'{since.major}.{since.minor}'
            if not cmd.get('module'):
                vers = self._versions['core']
            else:
                vers = self._versions['stack'][cmd.get('group')]
            if since not in vers:
                vers.append(since)
                vers.sort(reverse=True)
        dump_dict(filepath, self._versions)

    def _make_repos(self) -> None:
        logging.info(f'Making {self._id} repositories')
        meta = load_dict(self.get('website').get('meta'))
        for kname, kind in self._repos.items():
            for gname, group in kind.items():
                path = f'{self._content}/resources/{kname}'
                mkdir_p(path)
                for pname, project in group.items():
                    filename = f'{path}/{slugify(gname)}_{slugify(pname)}.md'
                    # cheap hack to workaround two (or more) clients that resolve to the same filename
                    if kname == 'clients' and os.path.isfile(filename):
                        uu = uuid.uuid4().hex[0:7]
                        filename = f'{path}/{slugify(gname)}_{slugify(pname)}{uu}.md'
                    md = Markdown(filename, True)
                    md.payload = ''
                    md.fm_data['recommended'] = False
                    md.fm_data['official'] = False
                    md.fm_data.update(project)
                    md.fm_data.update({'title': pname})
                    md.fm_data.update({'group': gname})
                    md.fm_data.update({'kind': kname})
                    md.fm_data.update(meta.get(project.get('repository'), {}))
                    md.persist()
        dump_dict(f'data/repos.json', self._repos)

    def _process_commands(self) -> None:
        logging.info(f'Processing {self._id} commands')
        for name in self._commands:
            path = f'{self._content}/commands/{command_filename(name)}.md'
            md = Markdown(path)
            md.process_command(name, self._commands)
            # Note: SVG generation removed as part of directory structure simplification

    def _process_docs(self) -> None:
        logging.info(f'Processing {self._id} docs')
        out = run(
            f'find {self._content} -type f -name "*.md" | grep -ive "{self._content}/commands"').strip().split('\n')
        for md_path in out:
            md = Markdown(md_path, True)
            md.process_doc(self._commands)

    def apply(self) -> None:
        for kind in ['clients','core', 'docs', 'modules',  'assets']:
            for component in self.get(kind):
                if type(component) == str:
                    basename, ext = os.path.splitext(component)
                    if ext == '':
                        component += self._ext
                    filename = f'{self._dirname}/{component}'
                    if kind == 'core':
                        c = Core(filename, self)
                    elif kind == 'docs':
                        c = Docs(filename, self)
                    elif kind == 'modules':
                        if self._args.get('module') in ['*', basename]:
                            c = Module(filename, self)
                        else:
                            continue
                    elif kind == 'clients':
                        c = Client(filename, self)
                    elif kind == 'assets':
                        c = Asset(filename, self)
                else:
                    die(f'Unknown component definition for {component}')
                c.apply()
        # self._persist_commands()
        # self._persist_groups()
        self._persist_examples()
        # self._persist_versions()
        # self._process_commands()
        # self._process_docs()
        self._make_repos()


class Core(Component):
    def __init__(self, filepath: str, root: dict = None):
        super().__init__(filepath, root)
        self._content = f'{self._root._content}/{self._stack_path}'

    @staticmethod
    def _make_data(path: str) -> dict:
        data = {}
        for root, _, files in os.walk(path, topdown=False):
            for filename in files:
                fullpath = os.path.join(root, filename)
                name, _ = os.path.splitext(filename)
                s = root[len(path)+1:].split('/')
                key, domain = s[0], s[1]
                if len(s) > 2:
                    org = f'{s[2]}/'
                else:
                    org = ''
                d = load_dict(fullpath)
                field = d.pop('name')
                d.update({
                    'repository': f'{domain}/{org}{name}',
                })
                if key not in data:
                    data.update({
                        key: {}
                    })
                data.get(key).update({
                    field: d
                })
        return data

    def _get_data(self) -> None:
        data = self.get('data')
        repo = self._git_clone(data)
        branch = Component._get_dev_branch(data)
        self._checkout(branch, repo, data)
        logging.info(f'Getting {self._id} data')
        for src in ['languages', 'tool_types', 'resp2_replies', 'resp3_replies']:
            filename = data.get(src)
            filepath = f'{repo}/{filename}'
            rsync(filepath, 'data/')
        for src in ['clients', 'libraries', 'modules', 'tools']:
            data = self._make_data(f'{repo}/{src}')
            self._root._repos[src] = data

    def _get_conf_file(self) -> None:
        ''' Gets the unstable redis.conf and embeds it in the "template" '''
        proj = self.get('repository')
        repo = self._git_clone(proj)
        branch = Component._get_dev_branch(proj)
        self._checkout(branch, repo, proj)
        src = f'{repo}/redis.conf'
        dst = f'{self._content}/{self.get("config_file_template")}'
        logging.info(f'Embedding {self._id} redis.conf into {dst}')
        md = Markdown(dst)
        with open(src, 'r') as f:
            md.payload = f.read()
        md.payload = f'\n```\n{md.payload}\n```\n'
        md.persist()

    def apply(self) -> None:
        logging.info(f'Applying core {self._id}')
        files = self._get_docs()
        files += self._get_commands()
        self._get_misc()
        self._get_groups()
        self._get_data()
        self._get_conf_file()
        return files


class Docs(Component):
    def __init__(self, filepath: str, root: dict = None):
        super().__init__(filepath, root)
        self._content = f'{self._root._content}/{self._stack_path}'

    def apply(self) -> None:
        logging.info(f'Applying docs {self._id}')
        files = self._get_docs()
        self._get_misc()
        return files


class Module(Component):
    def __init__(self, filepath: str, root: dict = None):
        super().__init__(filepath, root)
        self._content = f'{self._root._content}/{self._stack_path}'

    def _process_module_docs(self, files: list) -> None:
        if self.get('type') == 'module':
            foes = [f'{self._content}/{f}' for f in ['index.md', '_index.md']]
            l = len(foes)
            while l > 0:
                f = foes.pop(0)
                l -= 1
                if os.path.isfile(f):
                    foes.append(f)
            if len(foes) == 0:
                logging.warning(
                    f'no index.md nor _index.md found in {self._content} - please rectify the situation stat!!')
            if len(foes) > 1:
                logging.warning(
                    f'both index.md and _index.md exist in {self._content} - please address this immediately!!!')

            stack_weight = self.get('stack_weight')
            for f in foes:
                md = Markdown(f)
                md.fm_data['weight'] = stack_weight
                md.persist()

            files = run(
                fr'find {self._content} -regex ".*\.md"').strip().split('\n')
            for f in files:
                md = Markdown(f)
                t = md.fm_data.pop('type', None)
                if t:
                    logging.warning(
                        f'the file {f} has a type set to `{t}` - please prevent future harm by acting now, thank you.')
                md.patch_module_paths(self._id, self._stack_path)
                md.persist()

    def apply(self) -> None:
        logging.info(f'Applying module {self._id}')
        files = self._get_docs()
        self._process_module_docs(files)
        files += self._get_commands()
        self._get_groups()
        return files

class Client(Component):
    def __init__(self, filepath: str, root: dict = None):
        print(str("file_path = {}".format(filepath)))
        super().__init__(filepath, root)

    def _get_example_id_from_file(self, path):
        with open(path) as cf:
            fline = cf.readline()

        if 'EXAMPLE:' in fline:
            return fline.split(':')[1].strip()

        return None

    def _copy_examples(self):
        if ex := self.get('examples'):
            repo = self._git_clone(ex)
            dev_branch = ex.get('dev_branch')
            self._checkout(dev_branch, repo, ex)
            path = ex.get('path', '')

            src = f'{repo}/{path}/'
            dst = f'{self._root._website.get("path")}/{self._root._website.get("examples_path")}'

            logging.info(f'Copying {self._id} examples to {dst}')

            for f in glob.glob(os.path.join(src, ex.get('pattern')), recursive=True):
                example_id = self._get_example_id_from_file(f)

                if not example_id:
                    continue

                example_metadata = {
                    'source': f,
                    'language': self.get('language').lower()
                }

                base_path = os.path.join(dst, example_id)
                mkdir_p(base_path)
                rsync(example_metadata['source'], base_path)

                target_path = os.path.join(base_path, f'{self.get("id")}_{os.path.basename(f)}')
                shutil.move(os.path.join(base_path, os.path.basename(f)), target_path)

                example_metadata['target'] = target_path
                e = Example(self.get('language'), target_path)
                example_metadata['highlight'] = e.highlight
                example_metadata['hidden'] = e.hidden
                example_metadata['named_steps'] = e.named_steps
                example_metadata['sourceUrl'] = (
                    f'{ex["git_uri"]}/tree/{ex["dev_branch"]}/{ex["path"]}/{os.path.basename(f)}'
                )
                examples = self._root._examples
                if example_id not in examples:
                    examples[example_id] = {}

                logging.info(f'Example {example_id} processed successfully.')
                examples[example_id][self.get('label')] = example_metadata

    def apply(self) -> None:
        logging.info(f'Applying client {self._id}')
        self._copy_examples()

class Asset(Component):
    def __init__(self, filepath: str, root: dict = None):
        super().__init__(filepath, root)

    def apply(self) -> None:
        logging.info(f'Applying asset {self._id}')
        repo = self._git_clone(self._repository)
        dev_branch = self._repository.get('dev_branch')
        self._checkout(dev_branch, repo, self._repository)        #
        return Component._dump_payload(repo, './', self._repository.get('payload'))
