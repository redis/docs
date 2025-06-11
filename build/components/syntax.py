from enum import Enum
import logging
from textwrap import fill
from typing import List

# Non-breaking space
NBSP = '\xa0'

# HTML Word Break Opportunity
WBR = '<wbr>'

class ArgumentType(Enum):
    INTEGER = 'integer'
    DOUBLE = 'double'
    STRING = 'string'
    UNIX_TIME = 'unix-time'
    PATTERN = 'pattern'
    KEY = 'key'
    ONEOF = 'oneof'
    BLOCK = 'block'
    PURE_TOKEN = 'pure-token'
    COMMAND = 'command'


class Argument:
    def __init__(self, data: dict = {}, level: int = 0, max_width: int = 640) -> None:
        logging.debug("ENTERING: syntax.py:Argument.__init__:28")
        self._stack = []
        self._level: int = level
        self._max_width: int = max_width
        self._name: str = data['name']
        self._type = ArgumentType(data['type'])
        self._optional: bool = data.get('optional', False)
        self._multiple: bool = data.get('multiple', False)
        self._multiple_token: bool = data.get('multiple_token', False)
        self._token: str | None = data.get('token')
        self._display: str = data.get('display_text', self._name)
        if self._token == '':
            self._token = '""'
        self._arguments: List[Argument] = [
            Argument(arg, self._level+1) for arg in data.get('arguments', [])]
        logging.debug("EXITING: syntax.py:Argument.__init__:42")

    def syntax(self, **kwargs) -> str:
        logging.debug("ENTERING: syntax.py:Argument.syntax:47")
        show_types = kwargs.get('show_types')
        args = ''
        if self._type == ArgumentType.BLOCK:
            args += ' '.join([arg.syntax() for arg in self._arguments])
        elif self._type == ArgumentType.ONEOF:
            args += f' | '.join([arg.syntax() for arg in self._arguments])
        elif self._type != ArgumentType.PURE_TOKEN:
            args += self._display
            if show_types:
                args += f':{self._type.value}'

        syntax = ''
        if self._optional:
            syntax += '['

        if self._token:
            syntax += f'{self._token}'
            if self._type != ArgumentType.PURE_TOKEN:
                syntax += NBSP

        if self._type == ArgumentType.ONEOF and (not self._optional or self._token):
            syntax += '<'

        if self._multiple:
            if self._multiple_token:
                syntax += f'{args} [{self._token} {args} ...]'
            else:
                syntax += f'{args} [{args} ...]'
        else:
            syntax += args

        if self._type == ArgumentType.ONEOF and (not self._optional or self._token):
            syntax = f'{syntax.rstrip()}>'
        if self._optional:
            syntax = f'{syntax.rstrip()}]'

        logging.debug("EXITING: syntax.py:Argument.syntax:81")
        return f'{syntax}'


class Command(Argument):
    def __init__(self, cname: str, data: dict, max_width: int = 640) -> None:
        logging.debug("ENTERING: syntax.py:Command.__init__:155")
        self._cname = cname
        self._cdata = data
        carg = {
            'name': self._cname,
            'type': ArgumentType.COMMAND.value,
            'arguments': data.get('arguments', [])
        }
        super().__init__(carg, 0, max_width)
        logging.debug("EXITING: syntax.py:Command.__init__:164")

    def __str__(self):
        logging.debug("ENTERING: syntax.py:Command.__str__:166")
        s = ' '.join([arg.syntax() for arg in self._arguments[1:]])
        logging.debug("EXITING: syntax.py:Command.__str__:168")
        return s

    def syntax(self, **kwargs):
        logging.debug("ENTERING: syntax.py:Command.syntax:181")
        opts = {
            'width': kwargs.get('width', 68),
            'subsequent_indent': ' ' * 2,
            'break_long_words': False,
            'break_on_hyphens': False
        }
        args = [self._name] + [arg.syntax() for arg in self._arguments]
        result = fill(' '.join(args), **opts)
        logging.debug("EXITING: syntax.py:Command.syntax:189")
        return result
