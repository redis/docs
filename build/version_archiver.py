import os, shutil, re, argparse


class VersionArchiver:
    def __init__(self, product, version):
        self.product = product
        self.new_version = version

        if self.product in ("kubernetes", "rs"):
            self.prefix = "operate"
        else:
            self.prefix = "integrate"
        self.new_directory = os.path.join("content",self.prefix,self.product,self.new_version)
        self.latest = os.path.join("content",self.prefix,self.product)

    def archive_version(self):
        """Copy all files from latest in new versioned directory, excluding release-notes"""

        # Walk through the latest directory
        for root, dirs, files in os.walk(self.latest):
            # Exclude directories with numbers in their names (other releases) and 'release-notes' directory
            dirs[:] = [
                d
                for d in dirs
                if not any(char.isdigit() for char in d) and d != "release-notes"
            ]

            # Create the corresponding destination directory if it does not exist
            relative_path = os.path.relpath(root, self.latest)
            dest_dir = os.path.join(self.new_directory, relative_path)
            if not os.path.exists(dest_dir):
                os.makedirs(dest_dir)

            for file in files:
                src_file = os.path.join(root, file)
                dest_file = os.path.join(dest_dir, file)
                shutil.copy2(src_file, dest_file)

    def update_relrefs(self, file_path, version, product):
        """Helper function for updating relrefs"""

        # Define a pattern to match relref links dynamically using product
        pattern = (
            r'(\(\{\{< ?relref "/'
            + self.prefix
            + "/"
            + re.escape(product)
            + r'/([^"]+)" ?>\}\})'
        )
        with open(file_path, "r") as file:
            lines = file.readlines()

        modified = False

        # Process each line in the file
        for i in range(len(lines)):
            # Search for relref links
            def replace_link(match):
                full_match = match.group(0)  # The entire match
                link = match.group(1)  # The actual relref link

                # Check if the link contains 'release-notes' and whether the replacement has already happened
                if (
                    "release-notes" not in link
                    and f"/{self.prefix}/{product}/{version}" not in link
                ):
                    # Otherwise, replace it
                    new_link = link.replace(
                        f"/{self.prefix}/{product}/",
                        f"/{self.prefix}/{product}/{version}/",
                    )
                    return f"{new_link}"
                return full_match

            # Replace all relref links in the line
            modified_line = re.sub(pattern, replace_link, lines[i])

            # If the line was modified, update the lines list
            if modified_line != lines[i]:
                lines[i] = modified_line
                modified = True

        # If any modification was made, write the updated content back to the file
        if modified:
            with open(file_path, "w") as file:
                file.writelines(lines)

    def version_relrefs(self):
        """Make all relrefs in a versioned directory versioned"""

        # Walk through the new directory and process all .md files
        for root, _, files in os.walk(self.new_directory):
            for file_name in files:
                if file_name.endswith(".md"):
                    file_path = os.path.join(root, file_name)
                    self.update_relrefs(file_path, self.new_version, self.product)

    def inject_url_frontmatter(self):
        """Inject url frontmatter property"""

        base_url = self.new_directory.strip("content").strip(f"/{self.new_version}")

        # Walk through the new directory
        for root, dirs, files in os.walk(self.new_directory):
            for file in files:
                file_path = os.path.join(root, file)

                # Read the file line by line
                with open(file_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()

                # Find the positions of the first and second '---' markers
                first_emdash_index = -1
                second_emdash_index = -1

                # Search for the frontmatter markers
                for i, line in enumerate(lines):
                    if line.strip() == "---":
                        if first_emdash_index == -1:
                            first_emdash_index = i
                        elif second_emdash_index == -1:
                            second_emdash_index = i
                            break

                if first_emdash_index != -1 and second_emdash_index != -1:
                    # Extract the frontmatter lines
                    frontmatter_lines = lines[
                        first_emdash_index + 1 : second_emdash_index
                    ]

                    # If the url property already exists, skip
                    if any("url" in f for f in frontmatter_lines):
                        break

                    if file_path == os.path.join(self.new_directory,"_index.md"):
                        for idx, item in enumerate(frontmatter_lines):
                            if "linkTitle" in item:
                                frontmatter_lines[idx] = (
                                    f"linkTitle: {self.new_version}\n"
                                )
                        frontmatter_lines.append(
                            f"bannerText: This documentation applies to version {self.new_version}.\n"
                        )
                        frontmatter_lines.append(f"bannerChildren: true\n")

                    # Add the 'url' field to the frontmatter
                    relative_path = os.path.relpath(root, self.new_directory)
                    if file == "_index.md":

                        if relative_path == ".":
                            url = f"url: '/{base_url}/{self.new_version}/'"
                        else:
                            url = f"url: '/{base_url}/{self.new_version}/{relative_path}/'"

                    else:
                        f = file.strip(".md")
                        if relative_path == ".":
                            url = f"url: '/{base_url}/{self.new_version}/{f}/'"
                        else:
                            url = f"url: '/{base_url}/{self.new_version}/{relative_path}/{f}/'"

                    # Add url at the end of the frontmatter
                    frontmatter_lines.append(url + "\n")

                    # Rebuild the content with the updated frontmatter
                    updated_lines = (
                        lines[: first_emdash_index + 1]
                        + frontmatter_lines
                        + lines[second_emdash_index:]
                    )

                    # Write the updated content back to the file
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.writelines(updated_lines)
                else:
                    # skip files without frontmatter
                    pass


def validate_product(value):
    """Custom validator for product argument to allow only 'rs' or 'kubernetes'"""
    if value not in ["rs", "kubernetes", "redis-data-integration"]:
        raise argparse.ArgumentTypeError(
            "Product must be either 'rs' or 'kubernetes' or 'redis-data-integration'."
        )
    return value


def validate_version(value):
    """Custom validator for version argument to ensure it follows the version format (e.g., 7, 7.1, 7.1.11)"""
    version_pattern = r"^\d+(\.\d+){0,2}(\.\d+)?$"
    if not re.match(version_pattern, value):
        raise argparse.ArgumentTypeError(
            "Version must be in the format 'x', 'x.x', or 'x.x.x' (e.g., 7, 7.1, 7.1.11)."
        )
    return value


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="Archive documentation for a specific version of a Redis product."
    )
    parser.add_argument(
        "product",
        type=validate_product,
        help="The name of the product (e.g., rs, kubernetes, redis-data-integration)",
    )
    parser.add_argument(
        "version",
        type=validate_version,
        help="The release version (e.g., 7, 7.1, 7.1.11)",
    )
    args = parser.parse_args()

    r = VersionArchiver(args.product, args.version)
    r.archive_version()
    r.version_relrefs()
    r.inject_url_frontmatter()
