from contextlib import contextmanager
import errno
import logging
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from textwrap import TextWrapper
from urllib.request import urlopen

# ------------------------------------------------------------------------------
# Utilites


@contextmanager
def cwd(path):
    d0 = os.getcwd()
    os.chdir(str(path))
    try:
        yield
    finally:
        os.chdir(d0)


def mkdir_p(dir):
    if dir == '':
        return
    try:
        return os.makedirs(dir, exist_ok=True)
    except TypeError:
        pass
    try:
        return os.makedirs(dir)
    except OSError as e:
        if e.errno != errno.EEXIST or os.path.isfile(dir):
            raise


def relpath(dir, rel):
    return os.path.abspath(os.path.join(dir, rel))


def rm_rf(path):
    if os.path.isdir(path) and not os.path.islink(path):
        shutil.rmtree(path)
    elif os.path.exists(path):
        os.remove(path)


def tempfilepath(prefix=None, suffix=None):
    if sys.version_info < (3, 0):
        if prefix is None:
            prefix = ''
        if suffix is None:
            suffix = ''
    fd, path = tempfile.mkstemp(prefix=prefix, suffix=suffix)
    os.close(fd)
    return path


def wget(url, dest="", tempdir=False):
    if dest == "":
        dest = os.path.basename(url)
        if dest == "":
            dest = tempfilepath()
        elif tempdir:
            dest = os.path.join('/tmp', dest)
    ufile = urlopen(url)
    data = ufile.read()
    with open(dest, "wb") as file:
        file.write(data)
    return os.path.abspath(dest)


def run(cmd, cwd=None, nop=None, _try=False):
    if cmd.find('\n') > -1:
        cmds1 = str.lstrip(TextWrapper.dedent(cmd))
        cmds = filter(lambda s: str.lstrip(s) != '', cmds1.split("\n"))
        cmd = "; ".join(cmds)
        cmd_for_log = cmd
    else:
        cmd_for_log = cmd
    logging.debug(f'run: {cmd}')
    sys.stdout.flush()
    if nop:
        return
    sp = subprocess.Popen(["bash", "-e", "-c", cmd],
                          cwd=cwd,
                          stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE)
    out, err = sp.communicate()
    if sp.returncode != 0:
        logging.error(f'command failed: {cmd_for_log}')
        logging.error(err.decode('utf-8'))
        if not _try:
            die()
    return out.decode('utf-8')


def die(msg: str = 'aborting - have a nice day!') -> None:
    logging.error(msg)
    exit(1)


def rsync(src: str, dst: str, exclude: list = ['.*'], include: list = ['*']):
    ex = [f'"{x}"' for x in exclude]
    ix = [f'"{x}"' for x in include]
    cmd = f'rsync -av --no-owner --no-group --include={{{",".join(ix)}}} --exclude={{{",".join(ex)}}} {src} {dst}'
    ret = run(cmd)
    return ret.split('\n')


def log_func(args: list) -> None:
    caller = sys._getframe(1).f_code.co_name
    logging.debug('called %s(%s)', caller, args)


def log_dict(msg, obj, *props):
    d = {prop: obj.get(prop, None) for prop in props}
    logging.info(f'{msg} {d}')


# def filter_by_res(elems: list, include: str, exclude: list) -> list:
#     log_func(locals())
#     e = [re.match(include, elem) for elem in elems]
#     e = [elem[1] for elem in e if elem]
#     for ex in exclude:
#         e = [x for x in e if not re.match(ex, x)]
#     e.sort(reverse=True)
#     return e


# def get_tags(repo_path: str, res: dict) -> list:
#     tags = do_or_die(['git', 'tag'], cwd=repo_path).split('\n')
#     tags = filter_by_res(tags, res.get('include_tag_regex'),
#                          res.get('exclude_tag_regexes'))
#     return tags


# def get_branches(repo_path: str, res: dict) -> list:
#     branches = do_or_die(['git', 'branch', '-r'], cwd=repo_path).split('\n')
#     branches = [branch.strip() for branch in branches]
#     branches = filter_by_res(branches, f'origin/({res.get("include_branch_regex")})',
#                              [f'origin/({bre})' for bre in res.get('exclude_branch_regexes')])
#     return branches


# def get_dev_docs(website: dict, piece: dict, piece_path: str, commands: dict) -> dict:
#     rels = piece.get('releases', None)
#     rels_repo = f'{piece_path}/rels_repo'
#     if type(rels) is dict:
#         source = rels.get('source', None)
#         if source not in piece:
#             logging.error(
#                 f'Invalid releases source key for {id} - aborting.')
#         if source == 'docs':
#             rels_repo = docs_repo
#         elif source == 'repository':
#             git_get(piece.get(source).get(
#                 'git_uri'), rels_repo, args.skip_clone)

#     if rels:
#         tags = []
#         if rels.get('tags', False):
#             tags = get_tags(rels_repo, rels)
#         branches = get_branches(rels_repo, rels)

#     for (s, d) in payload:
#         do_or_die(['rsync', '-av', '--no-owner', '--no-group', s, d])

#     return commands


# ------------------------------------------------------------------------------
def command_filename(name: str) -> str:
    return name.lower().replace(' ', '-')


def regex_in_file(path: str, search: str, replace: str):
    with open(path, 'r') as f:
        p = f.read()
    r = re.compile(search)
    p = r.sub(replace, p)
    with open(path, 'w') as f:
        f.write(p)

def slugify(value, allow_unicode=False):
    """
    Taken from https://github.com/django/django/blob/master/django/utils/text.py
    Convert to ASCII if 'allow_unicode' is False. Convert spaces or repeated
    dashes to single dashes. Remove characters that aren't alphanumerics,
    underscores, or hyphens. Convert to lowercase. Also strip leading and
    trailing whitespace, dashes, and underscores.
    """
    value = str(value)
    if allow_unicode:
        value = unicodedata.normalize('NFKC', value)
    else:
        value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value.lower())
    return re.sub(r'[-\s]+', '-', value).strip('-_')