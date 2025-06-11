import logging
import glob
import os
import shutil

from typing import Tuple
from urllib.parse import urlparse, ParseResult

from .structured_data import load_dict, dump_dict
from .util import die, mkdir_p, rsync, run, rm_rf
from .example import Example

def parseUri(uri: str) -> Tuple[ParseResult, str, str]:
    logging.debug("ENTERING: component.py:parseUri:17")
    _uri = urlparse(uri)
    dirname = os.path.dirname(uri)
    _, name = os.path.split(_uri.path)
    _, ext = os.path.splitext(name)
    logging.debug("EXITING: component.py:parseUri:22")
    return _uri, dirname, name, ext


class Component(dict):
    def __init__(self, filepath: str = None, root: dict = None, args: dict = None):
        logging.debug("ENTERING: component.py:Component.__init__:27")
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
        logging.debug("EXITING: component.py:Component.__init__:41")

    def _git_clone(self, repo) -> str:
        logging.debug("ENTERING: component.py:Component._git_clone:104")
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
            logging.debug("EXITING: component.py:Component._git_clone:122")
            return to
        elif self._repo_uri() == git_uri:
            logging.debug("EXITING: component.py:Component._git_clone:125")
            return self._repo_env_dir()
        elif (uri.scheme == 'file' or uri.scheme == '') and ext == '':
            logging.debug("EXITING: component.py:Component._git_clone:128")
            return uri.path
        else:
            die('Cannot determine git repo - aborting.')

    def _repo_env_dir(self) -> str:
        logging.debug("ENTERING: component.py:Component._repo_env_dir:233")
        if os.getenv(f'REPO_DIR'):
            logging.debug("EXITING: component.py:Component._repo_env_dir:235")
            return os.getenv(f'REPO_DIR')
        logging.debug("EXITING: component.py:Component._repo_env_dir:237")
        return ''

    def _repo_uri(self) -> str:
        logging.debug("ENTERING: component.py:Component._repo_uri:240")
        if(os.getenv('REPOSITORY_URL')):
            logging.debug("EXITING: component.py:Component._repo_uri:242")
            return os.getenv('REPOSITORY_URL')
        logging.debug("EXITING: component.py:Component._repo_uri:244")
        return ''

    def _skip_checkout(self, obj) -> bool:
        logging.debug("ENTERING: component.py:Component._skip_checkout:254")
        if obj.get('git_uri') == self._repo_uri() and self._preview_mode():
            logging.debug("EXITING: component.py:Component._skip_checkout:256")
            return True
        logging.debug("EXITING: component.py:Component._skip_checkout:258")
        return False

    def _checkout(self, ref, dest, obj):
        logging.debug("ENTERING: component.py:Component._checkout:261")
        if not self._skip_checkout(obj):
            run(f'git checkout {ref}', cwd=dest)
        logging.debug("EXITING: component.py:Component._checkout:264")

class All(Component):
    def __init__(self, filepath: str, root: dict = None, args: dict = None):
        logging.debug("ENTERING: component.py:All.__init__:271")
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
        logging.debug("EXITING: component.py:All.__init__:284")

    def _persist_examples(self) -> None:
        logging.debug("ENTERING: component.py:All._persist_examples:302")
        filepath = f'{self._website.get("path")}/{self._website.get("examples")}'
        logging.info(f'Persisting {self._id} examples: {filepath}')
        dump_dict(filepath, self._examples)
        logging.debug("EXITING: component.py:All._persist_examples:306")

    def apply(self) -> None:
        logging.debug("ENTERING: component.py:All.apply:373")
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
        self._persist_examples()
        logging.debug("EXITING: component.py:All.apply:402")


class Core(Component):
    def __init__(self, filepath: str, root: dict = None):
        logging.debug("ENTERING: component.py:Core.__init__:408")
        super().__init__(filepath, root)
        self._content = f'{self._root._content}/{self._stack_path}'
        logging.debug("EXITING: component.py:Core.__init__:411")

    def apply(self) -> None:
        logging.debug("ENTERING: component.py:Core.apply:477")
        logging.info(f'Applying core {self._id}')
        files = self._get_docs()
        files += self._get_commands()
        self._get_misc()
        self._get_groups()
        self._get_data()
        self._get_conf_file()
        logging.debug("EXITING: component.py:Core.apply:485")
        return files


class Client(Component):
    def __init__(self, filepath: str, root: dict = None):
        logging.debug("ENTERING: component.py:Client.__init__:558")
        print(str("file_path = {}".format(filepath)))
        super().__init__(filepath, root)
        logging.debug("EXITING: component.py:Client.__init__:561")

    def _get_example_id_from_file(self, path):
        logging.debug("ENTERING: component.py:Client._get_example_id_from_file:564")
        with open(path) as cf:
            fline = cf.readline()

        if 'EXAMPLE:' in fline:
            logging.debug("EXITING: component.py:Client._get_example_id_from_file:569")
            return fline.split(':')[1].strip()

        logging.debug("EXITING: component.py:Client._get_example_id_from_file:572")
        return None

    def _copy_examples(self):
        logging.debug("ENTERING: component.py:Client._copy_examples:577")
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
        logging.debug("EXITING: component.py:Client._copy_examples:615")

    def apply(self) -> None:
        logging.debug("ENTERING: component.py:Client.apply:618")
        logging.info(f'Applying client {self._id}')
        self._copy_examples()
        logging.debug("EXITING: component.py:Client.apply:621")
