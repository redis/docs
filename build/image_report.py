"""Image report
"""

from pylibs.hugotools import ShortcodeIterator

import argparse
import os


def scan_file(path: str, verbose: bool = True) -> list:
    """Scans a file for all `image` shortcodes.

    Args:
        path (str): Path to file.
        verbose (bool, optional): If True, prints the shortcodes found. Defaults to True.

    Returns:
        (list) A list of all image shortcodes found.
    """

    img_list = []
    img_names = []

    with open(path, encoding="utf_8") as md_file:
        text = md_file.read()

        for img, pos_info in ShortcodeIterator(
            text, lambda t: t.tag == "image"
        ):
            img_list.append((img, pos_info))
            img_names.append(img.named_params["filename"])

    if len(img_list) > 0 and verbose:
        print(f"File '{path}':")

        for img in img_list:
            print(
                f"    Line {img[1].line}: '{img[0].named_params['filename']}'"
            )

    # return len(img_list)
    return img_names


parser = argparse.ArgumentParser(
    "Image report",
    "Scans a folder and report all Hugo image shortcodes found"
)

parser.add_argument("pathname", help="Path of the folder to scan")
parser.add_argument("--find-unused", nargs=1, help="Prints out all images in IMAGEFOLDER that are not found in pathname. Set pathname to the top content folder to scan all content for images.", metavar="IMAGEFOLDER")

args = parser.parse_args()

print(f"Scanning '{args.pathname}'")

num_found = 0
all_images_found = []

for root, dirs, files in os.walk(args.pathname):
    for file in files:
        if file.endswith(".md"):
            fullpath = os.path.join(root, file)
            images_found = scan_file(fullpath, verbose=args.find_unused is None)
            num_found += len(images_found)
            all_images_found.extend(images_found)

if num_found == 0:
    print(f"No image shortcodes found in '{args.pathname}'")
else:
    print(f"Found {num_found} image shortcodes.")

if args.find_unused and num_found > 0:
    unique_images = list(set(all_images_found))
    print(f"Found {len(unique_images)} unique images in '{args.pathname}'.")
    print(f"Checking for images not found in '{args.pathname}' that are in '{args.find_unused[0]}'")

    unused_images = []

    for root, dirs, files in os.walk(args.find_unused[0]):
        for file in files:
            if (file.endswith(".png") or file.endswith(".jpg") or file.endswith(".webp")) and not any(file in img for img in unique_images):
                img_filepath = os.path.join(root, file)
                print(f"    Image '{img_filepath}' not found in '{args.pathname}'")
                unused_images.append(img_filepath)

    print(f"Found {len(unused_images)} unused images.")
