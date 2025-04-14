"""Image report
"""

from pylibs.hugotools import ShortcodeIterator

import argparse

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
