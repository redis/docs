from enum import Enum
from io import StringIO
from re import M
from textwrap import fill
from typing import List
from railroad import *

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

    def syntax(self, **kwargs) -> str:
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

        return f'{syntax}'

    def diagram(self) -> DiagramItem:
        if self._type == ArgumentType.COMMAND:
            s = []
            i = 0
            optionals = []
            while i < len(self._arguments):
                arg = self._arguments[i].diagram()
                if type(arg) is Optional:
                    optionals.append(arg)
                else:
                    if len(optionals) != 0:
                        optionals.sort(key=lambda x: x.width)
                        s += optionals
                        optionals = []
                    s.append(arg)
                i += 1
            if len(optionals) != 0:
                optionals.sort(key=lambda x: x.width)
                s += optionals

            self._stack.append(Sequence(Terminal(self._display)))
            for arg in s:
                if type(arg) is not Sequence:
                    items = [arg]
                else:
                    items = arg.items
                for a in items:
                    width = self._stack[-1].width
                    w = a.width
                    if width + w >= self._max_width:
                        self._stack.append(Sequence(a))
                    else:
                        self._stack[-1] = Sequence(*self._stack[-1].items, a)
        else:
            if self._type in [ArgumentType.BLOCK, ArgumentType.ONEOF] and len(self._arguments) > 0:
                args = [arg.diagram() for arg in self._arguments]
                if self._type == ArgumentType.BLOCK:
                    el = Sequence(*args)
                elif self._type == ArgumentType.ONEOF:
                    el = Choice(round(len(args)/2), *args)
            elif self._type != ArgumentType.PURE_TOKEN:
                el = NonTerminal(self._display, title=self._type.value)

            if self._multiple:
                if self._multiple_token:
                    el = Sequence(Terminal(self._token), el)
                el = OneOrMore(el)
            elif self._token:
                if self._type == ArgumentType.PURE_TOKEN:
                    el = Terminal(self._token)
                else:
                    el = Sequence(Terminal(self._token), el)
            if self._optional:
                el = Optional(el, True)

            return el


class Command(Argument):
    def __init__(self, cname: str, data: dict, max_width: int = 640) -> None:
        self._cname = cname
        self._cdata = data
        carg = {
            'name': self._cname,
            'type': ArgumentType.COMMAND.value,
            'arguments': data.get('arguments', [])
        }
        super().__init__(carg, 0, max_width)

    def __str__(self):
        s = ' '.join([arg.syntax() for arg in self._arguments[1:]])
        return s

    def isPureContainer(self) -> bool:
        return self._cdata.get('arguments') is None and self._cdata.get('arity',0) == -2 and len(self._cname.split(' ')) == 1

    def isHelpCommand(self) -> bool:
        return self._cname.endswith(' HELP')

    def syntax(self, **kwargs):
        opts = {
            'width': kwargs.get('width', 68),
            'subsequent_indent': ' ' * 2,
            'break_long_words': False,
            'break_on_hyphens': False
        }
        args = [self._name] + [arg.syntax() for arg in self._arguments]
        return fill(' '.join(args), **opts)

    def diagram(self) -> str:
        super().diagram()
        d = Diagram(Stack(*self._stack),css=None)
        s = StringIO()
        d.writeSvg(s.write)
        # Hack: strip out the 'width' and 'height' attrs from the svg
        s = s.getvalue()
        for attr in ['width', 'height']:
            a = f'{attr}="'
            x = s.find(a)
            y = s.find('"', x + len(a))
            s = s[:x-1] + s[y+1:]
        return s
