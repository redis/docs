"""Image report
"""

from pylibs.hugotools import ShortcodeIterator

import argparse
import os


def scan_file(path: str) -> int:
    """Scans a file for all `image` shortcodes.

    Args:
        path (str): Path to file.

    Returns:
        (int) Number of shortcodes found.
    """

    img_list = []

    with open(path, encoding="utf_8") as md_file:
        text = md_file.read()

        for img, pos_info in ShortcodeIterator(
            text, lambda t: t.tag == "image"
        ):
            img_list.append((img, pos_info))

    if len(img_list) > 0:
        print(f"File '{path}':")

        for img in img_list:
            print(
                f"    Line {img[1].line}: '{img[0].named_params['filename']}'"
            )

    return len(img_list)


parser = argparse.ArgumentParser(
    "Image report",
    "Scans a folder and report all Hugo image shortcodes found"
)

parser.add_argument("pathname", help="Path of the folder to scan")

args = parser.parse_args()

print(f"Scanning '{args.pathname}'")

num_found = 0

for root, dirs, files in os.walk(args.pathname):
    for file in files:
        if file.endswith(".md"):
            fullpath = os.path.join(root, file)
            num_found += scan_file(fullpath)

if num_found == 0:
    print(f"No image shortcodes found in '{args.pathname}'")
else:
    print(f"Found {num_found} image shortcodes.")
