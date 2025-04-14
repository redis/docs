"""Image report
"""

from enum import Enum
from typing import Iterator, Match

import re
import argparse

shortcode_re_pattern_start = r"(\n)|\{\{[<%]\s*"
shortcode_re_body = "(/)?([\w\-]+)\s*(.+?)?"
shortcode_re_pattern_end = r"\s*[>%]\}\}"

shortcode_re_pattern = (
    shortcode_re_pattern_start +
    shortcode_re_body +
    shortcode_re_pattern_end
)


class ShortcodeTagType(Enum):
    """Specifies open or close shortcode tag."""
    OPEN = 1
    CLOSE = 2


class ShortcodeInfo:
    """Represents the information in a shortcode.
    """
    tag_type: ShortcodeTagType
    tag: str
    param_text: str
    pos_params: list[str]
    named_params: dict[str, str]

    def parse_params(self, param_str: str):
        param_re = r'"(([^"]|(?<=\\)")*)"|((\w+)=([^"\s]+))|((\w+)="(([^"]|(?<=\\)")*)")|([^"=\s]+)'

        for match in re.finditer(param_re, param_str):
            if match is None:
                self.pos_params = []
                self.named_params = {}
                return        
            elif match[1]:
                self.pos_params.append(match[1])
            elif match[3]:
                self.named_params[match[4]] = match[5]
            elif match[6]:
                self.named_params[match[7]] = match[8]
            elif match[10]:
                self.pos_params.append(match[10])

    def __init__(
            self, tag: str,
            tag_type: ShortcodeTagType,
            param_text: str = ""
    ):
        self.tag = tag
        self.tag_type = tag_type
        # self.param_text = param_text
        self.pos_params = []
        self.named_params = {}
        self.parse_params(param_text or "")

    def __str__(self) -> str:
        type_text: str

        if self.tag_type == ShortcodeTagType.OPEN:
            type_text = "OPEN"
        else:
            type_text = "CLOSE"

        result = f"{type_text} {self.tag}"

        if self.pos_params or self.named_params:
            result += ":"

        for pos_param in self.pos_params:
            result += f"\n    '{pos_param}'"
    
        for named_param, named_value in self.named_params.items():
            result += f"\n    {named_param} = {named_value}"

        return result


class ShortcodeIterator:
    """Iterates through all shortcodes in a string.
    """
    re_iterator: Iterator[Match[str]]
    linenum: int

    def __init__(self, text: str):
        self.re_iterator = re.finditer(shortcode_re_pattern, text)
        self.linenum = 1

    def __iter__(self):
        return self

    def __next__(self) -> tuple[ShortcodeInfo, int]:
        next_match = self.re_iterator.__next__()

        while True:
            if next_match[1]:
                self.linenum += 1
                next_match = self.re_iterator.__next__()
            elif next_match[2]:
                result = ShortcodeInfo(
                    next_match[3], ShortcodeTagType.CLOSE
                )

                return (result, self.linenum)
            else:
                result = ShortcodeInfo(
                    next_match[3],
                    ShortcodeTagType.OPEN,
                    next_match[4]
                )

                return (result, self.linenum)


parser = argparse.ArgumentParser(
    "Image report",
    "Scans a folder and report all Hugo image shortcodes found"
)

parser.add_argument("pathname", help="Path of the folder to scan")

args = parser.parse_args()

print(f"Scanning '{args.pathname}'")

with open(args.pathname, encoding="utf_8") as md_file:
    filetext = md_file.read()

    for shortcode, line in ShortcodeIterator(filetext):
        print(f"Line: {line}: {shortcode}")
