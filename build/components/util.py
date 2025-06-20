from contextlib import contextmanager
import errno
import logging
import os
import shutil
import subprocess
import sys
from textwrap import TextWrapper


def mkdir_p(dir):
    logging.debug("ENTERING: ")
    if dir == '':
        logging.debug("EXITING: ")
        return
    try:
        result = os.makedirs(dir, exist_ok=True)
        logging.debug("EXITING: ")
        return result
    except TypeError:
        pass
    try:
        result = os.makedirs(dir)
        logging.debug("EXITING: ")
        return result
    except OSError as e:
        if e.errno != errno.EEXIST or os.path.isfile(dir):
            logging.debug("EXITING: ")
            raise
        logging.debug("EXITING: ")


def rm_rf(path):
    logging.debug("ENTERING: ")
    if os.path.isdir(path) and not os.path.islink(path):
        shutil.rmtree(path)
    elif os.path.exists(path):
        os.remove(path)
    logging.debug("EXITING: ")


def run(cmd, cwd=None, nop=None, _try=False):
    logging.debug("ENTERING: ")
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
        logging.debug("EXITING: ")
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
    result = out.decode('utf-8')
    logging.debug("EXITING: ")
    return result


def die(msg: str = 'aborting - have a nice day!') -> None:
    logging.debug("ENTERING: ")
    logging.error(msg)
    exit(1)


def rsync(src: str, dst: str, exclude: list = ['.*'], include: list = ['*']):
    logging.debug("ENTERING: ")
    ex = [f'"{x}"' for x in exclude]
    ix = [f'"{x}"' for x in include]
    cmd = f'rsync -av --no-owner --no-group --include={{{",".join(ix)}}} --exclude={{{",".join(ex)}}} {src} {dst}'
    ret = run(cmd)
    result = ret.split('\n')
    logging.debug("EXITING: ")
    return result


def log_func(args: list) -> None:
    logging.debug("ENTERING: ")
    caller = sys._getframe(1).f_code.co_name
    logging.debug('called %s(%s)', caller, args)
    logging.debug("EXITING: ")


def log_dict(msg, obj, *props):
    logging.debug("ENTERING: ")
    d = {prop: obj.get(prop, None) for prop in props}
    logging.info(f'{msg} {d}')
    logging.debug("EXITING: ")
