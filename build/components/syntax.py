from enum import Enum
import logging
from textwrap import fill
from typing import List
import os
import sys

# Non-breaking space
NBSP = '\xa0'

# HTML Word Break Opportunity
WBR = '<wbr>'

# Import railroad diagrams library
try:
    import railroad
except ImportError:
    railroad = None
    logging.warning("railroad-diagrams library not available. Railroad diagram generation will be skipped.")

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
    FUNCTION = 'function'
    INDEX = 'index'
    KEYNUM = 'keynum'
    KEYWORD = 'keyword'
    RANGE = 'range'
    UNKNOWN = 'unknown'


class Argument:
    def __init__(self, data: dict = {}, level: int = 0, max_width: int = 640) -> None:
        logging.debug("ENTERING: ")
        self._stack = []
        self._level: int = level
        self._max_width: int = max_width
        self._name: str = data.get('name', data.get('token', 'unnamed'))
        self._type = ArgumentType(data.get('type', 'string'))
        self._optional: bool = data.get('optional', False)
        self._multiple: bool = data.get('multiple', False)
        self._multiple_token: bool = data.get('multiple_token', False)
        self._token: str | None = data.get('token')
        self._display: str = data.get('display_text', self._name)
        if self._token == '':
            self._token = '""'
        self._arguments: List[Argument] = [
            Argument(arg, self._level+1) for arg in data.get('arguments', [])]
        logging.debug("EXITING: ")

    def syntax(self, **kwargs) -> str:
        logging.debug("ENTERING: ")
        show_types = kwargs.get('show_types')
        args = ''
        if self._type == ArgumentType.BLOCK:
            args += ' '.join([arg.syntax() for arg in self._arguments])
        elif self._type == ArgumentType.ONEOF:
            args += f' | '.join([arg.syntax() for arg in self._arguments])
        elif self._type == ArgumentType.FUNCTION:
            # Functions should display their token/name, not expand nested arguments
            args += self._display
            if show_types:
                args += f':{self._type.value}'
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

        logging.debug("EXITING: ")
        return f'{syntax}'

    def to_railroad(self) -> 'railroad.Node':
        """Convert this argument to a railroad diagram component."""
        if railroad is None:
            raise ImportError("railroad-diagrams library not available")

        logging.debug(f"Converting argument '{self._name}' of type {self._type} to railroad")

        # Handle different argument types
        if self._type == ArgumentType.PURE_TOKEN:
            # Pure tokens are just terminal text
            component = railroad.Terminal(self._token or self._name)
        elif self._type == ArgumentType.BLOCK:
            # Blocks are sequences of their arguments
            if self._arguments:
                components = [arg.to_railroad() for arg in self._arguments]
                component = railroad.Sequence(*components)
            else:
                component = railroad.Terminal(self._display)
        elif self._type == ArgumentType.ONEOF:
            # OneOf is a choice between arguments
            if self._arguments:
                components = [arg.to_railroad() for arg in self._arguments]
                # Use the first option as the default (index 0)
                component = railroad.Choice(0, *components)
            else:
                component = railroad.Terminal(self._display)
        else:
            # Regular arguments (string, integer, etc.)
            if self._token:
                # If there's a token, create a sequence of token + argument
                token_part = railroad.Terminal(self._token)
                arg_part = railroad.NonTerminal(self._display)
                component = railroad.Sequence(token_part, arg_part)
            else:
                # Just the argument
                component = railroad.NonTerminal(self._display)

        # Handle multiple (repeating) arguments
        if self._multiple:
            if self._multiple_token and self._token:
                # Multiple with token repetition: arg [token arg ...]
                repeat_part = railroad.Sequence(railroad.Terminal(self._token), component)
                component = railroad.Sequence(component, railroad.ZeroOrMore(repeat_part))
            else:
                # Multiple without token: arg [arg ...]
                component = railroad.OneOrMore(component)

        # Handle optional arguments
        if self._optional:
            component = railroad.Optional(component)

        return component


class Command(Argument):
    def __init__(self, cname: str, data: dict, max_width: int = 640) -> None:
        logging.debug("ENTERING: ")
        self._cname = cname
        self._cdata = data
        carg = {
            'name': self._cname,
            'type': ArgumentType.COMMAND.value,
            'arguments': data.get('arguments', [])
        }
        super().__init__(carg, 0, max_width)
        logging.debug("EXITING: ")

    def __str__(self):
        logging.debug("ENTERING: ")
        s = ' '.join([arg.syntax() for arg in self._arguments[1:]])
        logging.debug("EXITING: ")
        return s

    def syntax(self, **kwargs):
        logging.debug("ENTERING: ")
        opts = {
            'width': kwargs.get('width', 68),
            'subsequent_indent': ' ' * 2,
            'break_long_words': False,
            'break_on_hyphens': False
        }
        args = [self._name] + [arg.syntax() for arg in self._arguments]
        result = fill(' '.join(args), **opts)
        logging.debug("EXITING: ")
        return result

    def to_railroad_diagram(self, output_path: str = None) -> str:
        """Generate a railroad diagram for this command and return the SVG content."""
        if railroad is None:
            raise ImportError("railroad-diagrams library not available")

        logging.debug(f"Generating railroad diagram for command: {self._cname}")

        # Create the main command terminal
        command_terminal = railroad.Terminal(self._cname)

        # Convert all arguments to railroad components
        arg_components = []
        for arg in self._arguments:
            try:
                arg_components.append(arg.to_railroad())
            except Exception as e:
                logging.warning(f"Failed to convert argument {arg._name} to railroad: {e}")
                # Fallback to a simple terminal
                arg_components.append(railroad.NonTerminal(arg._name))

        # Create the complete diagram
        if arg_components:
            diagram_content = railroad.Sequence(command_terminal, *arg_components)
        else:
            diagram_content = command_terminal

        # Create the diagram
        diagram = railroad.Diagram(diagram_content)

        # Generate SVG
        svg_content = []
        diagram.writeSvg(svg_content.append)
        svg_string = ''.join(svg_content)

        # Apply Redis red styling and transparent background
        svg_string = self._apply_redis_styling(svg_string)

        # Save to file if output path is provided
        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(svg_string)
            logging.info(f"Railroad diagram saved to: {output_path}")

        return svg_string

    def _apply_redis_styling(self, svg_content: str) -> str:
        """
        Apply Redis red color scheme and transparent background to SVG.

        Args:
            svg_content: Original SVG content

        Returns:
            Modified SVG content with Redis styling
        """
        # Redis red color: #DC382D
        redis_red = "#DC382D"

        # Make background transparent by removing fill from the main SVG
        svg_content = svg_content.replace('fill="white"', 'fill="none"')
        svg_content = svg_content.replace('fill="#fff"', 'fill="none"')

        # Add custom CSS styling for Redis theme
        style_css = f'''<defs>
<style type="text/css"><![CDATA[
svg.railroad-diagram {{ background-color: transparent !important; }}
.terminal rect {{ fill: {redis_red} !important; stroke: {redis_red} !important; }}
.terminal text {{ fill: white !important; font-weight: bold; }}
.nonterminal rect {{ fill: none !important; stroke: {redis_red} !important; stroke-width: 2; }}
.nonterminal text {{ fill: {redis_red} !important; font-weight: bold; }}
path {{ stroke: {redis_red} !important; stroke-width: 2; fill: none; }}
circle {{ fill: {redis_red} !important; stroke: {redis_red} !important; }}
]]></style>
</defs>'''

        # Insert the style after the opening SVG tag
        import re
        if '<defs>' in svg_content:
            # Replace existing defs
            svg_content = re.sub(r'<defs>.*?</defs>', style_css, svg_content, flags=re.DOTALL)
        else:
            # Insert new defs after svg opening tag
            svg_content = re.sub(r'<svg([^>]*)>', f'<svg\\1>\n{style_css}', svg_content, count=1)

        # Override any existing background color and stroke styles
        import re

        # Replace the entire default style section with our Redis-themed styles
        default_style_pattern = r'<style>/\* <!\[CDATA\[ \*/.*?/\* \]\]> \*/</style>'
        redis_style_replacement = f'''<style>/* <![CDATA[ */
		svg.railroad-diagram {{
			background-color: transparent;
		}}
		svg.railroad-diagram path {{
			stroke-width: 2;
			stroke: {redis_red};
			fill: rgba(0,0,0,0);
		}}
		svg.railroad-diagram text {{
			font: bold 14px monospace;
			text-anchor: middle;
			fill: {redis_red};
		}}
		svg.railroad-diagram text.label {{
			text-anchor: start;
		}}
		svg.railroad-diagram text.comment {{
			font: italic 12px monospace;
		}}
		svg.railroad-diagram rect {{
			stroke-width: 2;
			stroke: {redis_red};
			fill: none;
		}}
		svg.railroad-diagram rect.group-box {{
			stroke: {redis_red};
			stroke-dasharray: 10 5;
			fill: none;
		}}
		/* ]]> */</style>'''

        svg_content = re.sub(default_style_pattern, redis_style_replacement, svg_content, flags=re.DOTALL)

        # Additional specific overrides for any remaining default colors
        svg_content = re.sub(r'fill:hsl\(120,100%,90%\)', 'fill: none', svg_content)
        svg_content = re.sub(r'stroke: gray', f'stroke: {redis_red}', svg_content)

        # Additional fallback overrides
        svg_content = re.sub(r'background-color:\s*[^;]+;', 'background-color: transparent;', svg_content)
        svg_content = re.sub(r'stroke:\s*black;', f'stroke: {redis_red};', svg_content)
        svg_content = re.sub(r'stroke:\s*#000;', f'stroke: {redis_red};', svg_content)

        return svg_content
