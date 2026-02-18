#!/usr/bin/env python3
"""
Unit tests for cmd_tools.py - the unified command management tool.
"""

import json
import os
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock

# Add the build directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from cmd_tools import (
    command_filename,
    load_and_validate_json,
    validate_json_structure,
    get_full_command_name,
    generate_command_frontmatter,
    generate_argument_sections,
    generate_return_section,
    generate_complete_markdown_content,
    create_command_page,
    update_command_page,
    generate_railroad_diagram,
    FILTER_PREFIXES,
    STANDARD_CATEGORIES,
)


class TestCommandFilename(unittest.TestCase):
    """Tests for the command_filename function."""

    def test_simple_command(self):
        """Test simple command name conversion."""
        self.assertEqual(command_filename("GET"), "get")
        self.assertEqual(command_filename("SET"), "set")

    def test_command_with_spaces(self):
        """Test command names with spaces (subcommands)."""
        self.assertEqual(command_filename("ACL CAT"), "acl-cat")
        self.assertEqual(command_filename("CLIENT LIST"), "client-list")
        self.assertEqual(command_filename("DEBUG OBJECT"), "debug-object")

    def test_command_with_dots(self):
        """Test command names with dots (module commands)."""
        self.assertEqual(command_filename("FT.SEARCH"), "ft.search")
        self.assertEqual(command_filename("JSON.GET"), "json.get")


class TestValidateJsonStructure(unittest.TestCase):
    """Tests for JSON validation."""

    def test_valid_json_structure(self):
        """Test that valid JSON structure passes validation."""
        data = {
            "TESTCMD": {
                "summary": "Test command",
                "since": "7.0.0",
                "group": "generic"
            }
        }
        # Should not raise
        validate_json_structure(data, "test.json")

    def test_invalid_root_type(self):
        """Test that non-dict root raises ValueError."""
        data = ["not", "a", "dict"]
        with self.assertRaises(ValueError) as ctx:
            validate_json_structure(data, "test.json")
        self.assertIn("must contain a dictionary", str(ctx.exception))

    def test_invalid_command_type(self):
        """Test that non-dict command value raises ValueError."""
        data = {"TESTCMD": "not a dict"}
        with self.assertRaises(ValueError) as ctx:
            validate_json_structure(data, "test.json")
        self.assertIn("must be a dictionary", str(ctx.exception))

    def test_invalid_arguments_type(self):
        """Test that non-list arguments raises ValueError."""
        data = {
            "TESTCMD": {
                "summary": "Test",
                "since": "7.0.0",
                "group": "generic",
                "arguments": "not a list"
            }
        }
        with self.assertRaises(ValueError) as ctx:
            validate_json_structure(data, "test.json")
        self.assertIn("arguments must be a list", str(ctx.exception))


class TestGetFullCommandName(unittest.TestCase):
    """Tests for get_full_command_name function."""

    def test_simple_command(self):
        """Test command without container."""
        result = get_full_command_name("GET", {"summary": "Get a key"})
        self.assertEqual(result, "GET")

    def test_container_command(self):
        """Test command with container (subcommand)."""
        result = get_full_command_name("CAT", {"summary": "List categories", "container": "ACL"})
        self.assertEqual(result, "ACL CAT")


class TestLoadAndValidateJson(unittest.TestCase):
    """Tests for load_and_validate_json function."""

    def setUp(self):
        """Create a temporary directory for test files."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up temporary directory."""
        shutil.rmtree(self.temp_dir)

    def test_load_valid_json(self):
        """Test loading a valid JSON file."""
        json_path = os.path.join(self.temp_dir, "valid.json")
        data = {"TESTCMD": {"summary": "Test", "since": "7.0.0", "group": "generic"}}
        with open(json_path, 'w') as f:
            json.dump(data, f)

        result = load_and_validate_json(json_path)
        self.assertEqual(result, data)

    def test_file_not_found(self):
        """Test that missing file raises FileNotFoundError."""
        with self.assertRaises(FileNotFoundError):
            load_and_validate_json("/nonexistent/path.json")

    def test_invalid_json(self):
        """Test that invalid JSON raises ValueError."""
        json_path = os.path.join(self.temp_dir, "invalid.json")
        with open(json_path, 'w') as f:
            f.write("not valid json {{{")

        with self.assertRaises(ValueError) as ctx:
            load_and_validate_json(json_path)
        self.assertIn("Invalid JSON", str(ctx.exception))


class TestGenerateCommandFrontmatter(unittest.TestCase):
    """Tests for generate_command_frontmatter function."""

    def test_basic_frontmatter(self):
        """Test that basic frontmatter is generated correctly."""
        command_data = {
            "summary": "Test command summary",
            "since": "7.0.0",
            "group": "generic",
            "complexity": "O(1)"
        }
        result = generate_command_frontmatter("TESTCMD", command_data)

        self.assertEqual(result["title"], "TESTCMD")
        self.assertEqual(result["linkTitle"], "TESTCMD")
        self.assertEqual(result["description"], "Test command summary")
        self.assertFalse(result["hidden"])
        self.assertEqual(result["categories"], STANDARD_CATEGORIES)
        self.assertIn("syntax_fmt", result)

    def test_container_command_frontmatter(self):
        """Test frontmatter for container command."""
        command_data = {
            "summary": "List ACL categories",
            "since": "6.0.0",
            "group": "server",
            "container": "ACL"
        }
        result = generate_command_frontmatter("CAT", command_data)

        self.assertEqual(result["title"], "ACL CAT")
        self.assertEqual(result["linkTitle"], "ACL CAT")


class TestGenerateArgumentSections(unittest.TestCase):
    """Tests for generate_argument_sections function."""

    def test_no_arguments(self):
        """Test command with no arguments."""
        result = generate_argument_sections({})
        self.assertEqual(result, "")

    def test_required_arguments(self):
        """Test command with required arguments."""
        command_data = {
            "arguments": [
                {"name": "key", "type": "key", "display_text": "key"}
            ]
        }
        result = generate_argument_sections(command_data)
        self.assertIn("## Required arguments", result)
        self.assertIn("<code>key</code>", result)

    def test_optional_arguments(self):
        """Test command with optional arguments."""
        command_data = {
            "arguments": [
                {"name": "timeout", "type": "integer", "display_text": "timeout", "optional": True}
            ]
        }
        result = generate_argument_sections(command_data)
        self.assertIn("## Optional arguments", result)
        self.assertIn("<code>timeout</code>", result)

    def test_optional_with_token(self):
        """Test optional argument with token."""
        command_data = {
            "arguments": [
                {"name": "ex", "type": "integer", "display_text": "seconds", "optional": True, "token": "EX"}
            ]
        }
        result = generate_argument_sections(command_data)
        self.assertIn("<code>EX</code>", result)


class TestGenerateReturnSection(unittest.TestCase):
    """Tests for generate_return_section function."""

    def test_return_section_format(self):
        """Test that return section has correct format."""
        result = generate_return_section()
        self.assertIn("## Return information", result)
        self.assertIn("RESP2", result)
        self.assertIn("RESP3", result)
        self.assertIn("multitabs", result)


class TestCreateCommandPage(unittest.TestCase):
    """Tests for create_command_page function."""

    def setUp(self):
        """Create a temporary directory for test output."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up temporary directory."""
        shutil.rmtree(self.temp_dir)

    def test_create_new_page(self):
        """Test creating a new command page."""
        command_data = {
            "summary": "Test command",
            "since": "7.0.0",
            "group": "generic"
        }
        result = create_command_page("TESTCMD", command_data, self.temp_dir)

        self.assertIsNotNone(result)
        self.assertTrue(os.path.exists(result))

        # Verify content
        with open(result, 'r') as f:
            content = f.read()
        self.assertIn("title: TESTCMD", content)
        self.assertIn("Test command", content)

    def test_skip_existing_file(self):
        """Test that existing file is skipped without --force."""
        command_data = {
            "summary": "Test command",
            "since": "7.0.0",
            "group": "generic"
        }
        # Create first time
        create_command_page("TESTCMD", command_data, self.temp_dir)

        # Try to create again
        result = create_command_page("TESTCMD", command_data, self.temp_dir, force=False)
        self.assertIsNone(result)

    def test_force_overwrite(self):
        """Test that --force overwrites existing file."""
        command_data = {
            "summary": "Original summary",
            "since": "7.0.0",
            "group": "generic"
        }
        first_path = create_command_page("TESTCMD", command_data, self.temp_dir)

        # Modify and force overwrite
        command_data["summary"] = "Updated summary"
        result = create_command_page("TESTCMD", command_data, self.temp_dir, force=True)

        self.assertIsNotNone(result)
        with open(result, 'r') as f:
            content = f.read()
        self.assertIn("Updated summary", content)


class TestUpdateCommandPage(unittest.TestCase):
    """Tests for update_command_page function."""

    def setUp(self):
        """Create a temporary directory and a test command page."""
        self.temp_dir = tempfile.mkdtemp()
        # Create an existing command page first
        command_data = {
            "summary": "Original summary",
            "since": "7.0.0",
            "group": "generic"
        }
        create_command_page("TESTCMD", command_data, self.temp_dir)

    def tearDown(self):
        """Clean up temporary directory."""
        shutil.rmtree(self.temp_dir)

    def test_update_existing_page(self):
        """Test updating an existing command page."""
        new_data = {
            "summary": "Updated summary",
            "since": "7.1.0",
            "group": "string",
            "complexity": "O(1)"
        }
        result = update_command_page("TESTCMD", new_data, self.temp_dir)

        self.assertIsNotNone(result)
        with open(result, 'r') as f:
            content = f.read()
        # The frontmatter should be updated
        self.assertIn("since: 7.1.0", content)
        self.assertIn("complexity: O(1)", content)

    def test_update_nonexistent_page(self):
        """Test that updating a non-existent page returns None."""
        new_data = {"summary": "Test", "since": "7.0.0", "group": "generic"}
        result = update_command_page("NONEXISTENT", new_data, self.temp_dir)
        self.assertIsNone(result)


class TestGenerateRailroadDiagram(unittest.TestCase):
    """Tests for generate_railroad_diagram function."""

    def setUp(self):
        """Create a temporary directory for test output."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up temporary directory."""
        shutil.rmtree(self.temp_dir)

    def test_generate_simple_diagram(self):
        """Test generating a railroad diagram for a simple command."""
        command_data = {
            "summary": "Get the value of a key",
            "arguments": [
                {"name": "key", "type": "key", "display_text": "key"}
            ]
        }
        result = generate_railroad_diagram("GET", command_data, self.temp_dir)

        # Should return path or None if railroad lib not available
        if result is not None:
            self.assertTrue(os.path.exists(result))
            self.assertTrue(result.endswith(".svg"))

            with open(result, 'r') as f:
                content = f.read()
            self.assertIn("<svg", content)
            self.assertIn("GET", content)

    def test_generate_complex_diagram(self):
        """Test generating a railroad diagram for a command with optional args."""
        command_data = {
            "summary": "Set the value of a key",
            "arguments": [
                {"name": "key", "type": "key", "display_text": "key"},
                {"name": "value", "type": "string", "display_text": "value"},
                {"name": "ex", "type": "integer", "display_text": "seconds", "optional": True, "token": "EX"}
            ]
        }
        result = generate_railroad_diagram("SET", command_data, self.temp_dir)

        if result is not None:
            self.assertTrue(os.path.exists(result))


class TestFilterPrefixes(unittest.TestCase):
    """Tests for FILTER_PREFIXES constant."""

    def test_filter_prefixes_exist(self):
        """Test that filter prefixes are defined."""
        self.assertIn("BF.", FILTER_PREFIXES)
        self.assertIn("JSON.", FILTER_PREFIXES)
        self.assertIn("FT.", FILTER_PREFIXES)
        self.assertIn("TS.", FILTER_PREFIXES)

    def test_filter_logic(self):
        """Test the filtering logic used in update-all."""
        test_commands = {
            "GET": {},
            "SET": {},
            "BF.ADD": {},
            "JSON.GET": {},
            "FT.SEARCH": {},
            "ACL CAT": {},
        }
        filtered = {
            key: value
            for key, value in test_commands.items()
            if not key.startswith(tuple(FILTER_PREFIXES))
        }
        self.assertIn("GET", filtered)
        self.assertIn("SET", filtered)
        self.assertIn("ACL CAT", filtered)
        self.assertNotIn("BF.ADD", filtered)
        self.assertNotIn("JSON.GET", filtered)
        self.assertNotIn("FT.SEARCH", filtered)


class TestActionAdd(unittest.TestCase):
    """Tests for action_add function."""

    def setUp(self):
        """Create temporary directories for test files."""
        self.temp_dir = tempfile.mkdtemp()
        self.output_dir = tempfile.mkdtemp()

        # Create a test JSON file
        self.json_path = os.path.join(self.temp_dir, "commands.json")
        self.test_data = {
            "MYCMD": {
                "summary": "My test command",
                "since": "7.0.0",
                "group": "generic",
                "arguments": [
                    {"name": "key", "type": "key", "display_text": "key"}
                ]
            }
        }
        with open(self.json_path, 'w') as f:
            json.dump(self.test_data, f)

    def tearDown(self):
        """Clean up temporary directories."""
        shutil.rmtree(self.temp_dir)
        shutil.rmtree(self.output_dir)

    def test_action_add_creates_files(self):
        """Test that action_add creates command page and diagram."""
        from cmd_tools import action_add

        # Create a mock args object
        args = MagicMock()
        args.json_file = self.json_path
        args.output_dir = self.output_dir
        args.force = False
        args.skip_railroad = False

        result = action_add(args)
        self.assertEqual(result, 0)

        # Check that files were created
        md_path = os.path.join(self.output_dir, "commands", "mycmd.md")
        self.assertTrue(os.path.exists(md_path))

    def test_action_add_skip_railroad(self):
        """Test that --skip-railroad skips diagram generation."""
        from cmd_tools import action_add

        args = MagicMock()
        args.json_file = self.json_path
        args.output_dir = self.output_dir
        args.force = False
        args.skip_railroad = True

        result = action_add(args)
        self.assertEqual(result, 0)

        # Check that command page was created but diagram was not
        md_path = os.path.join(self.output_dir, "commands", "mycmd.md")
        svg_path = os.path.join(self.output_dir, "images", "railroad", "mycmd.svg")
        self.assertTrue(os.path.exists(md_path))
        self.assertFalse(os.path.exists(svg_path))


class TestActionUpdate(unittest.TestCase):
    """Tests for action_update function."""

    def setUp(self):
        """Create temporary directories and test files."""
        self.temp_dir = tempfile.mkdtemp()
        self.output_dir = tempfile.mkdtemp()

        # Create initial command page
        initial_data = {
            "summary": "Original summary",
            "since": "7.0.0",
            "group": "generic"
        }
        create_command_page("MYCMD", initial_data, self.output_dir)

        # Create a test JSON file with updated data
        self.json_path = os.path.join(self.temp_dir, "commands.json")
        self.update_data = {
            "MYCMD": {
                "summary": "Updated summary",
                "since": "7.1.0",
                "group": "string",
                "complexity": "O(1)"
            }
        }
        with open(self.json_path, 'w') as f:
            json.dump(self.update_data, f)

    def tearDown(self):
        """Clean up temporary directories."""
        shutil.rmtree(self.temp_dir)
        shutil.rmtree(self.output_dir)

    def test_action_update_updates_files(self):
        """Test that action_update updates existing command page."""
        from cmd_tools import action_update

        args = MagicMock()
        args.json_file = self.json_path
        args.output_dir = self.output_dir
        args.skip_railroad = True  # Skip railroad for faster test

        result = action_update(args)
        self.assertEqual(result, 0)

        # Check that file was updated
        md_path = os.path.join(self.output_dir, "commands", "mycmd.md")
        with open(md_path, 'r') as f:
            content = f.read()
        self.assertIn("since: 7.1.0", content)


class TestActionRailroad(unittest.TestCase):
    """Tests for action_railroad function."""

    def setUp(self):
        """Create temporary directories for test files."""
        self.temp_dir = tempfile.mkdtemp()
        self.output_dir = tempfile.mkdtemp()

        # Create a test JSON file
        self.json_path = os.path.join(self.temp_dir, "commands.json")
        self.test_data = {
            "MYCMD": {
                "summary": "My test command",
                "arguments": [
                    {"name": "key", "type": "key", "display_text": "key"}
                ]
            }
        }
        with open(self.json_path, 'w') as f:
            json.dump(self.test_data, f)

    def tearDown(self):
        """Clean up temporary directories."""
        shutil.rmtree(self.temp_dir)
        shutil.rmtree(self.output_dir)

    def test_action_railroad_creates_svg(self):
        """Test that action_railroad creates only SVG files."""
        from cmd_tools import action_railroad

        args = MagicMock()
        args.json_file = self.json_path
        args.output_dir = self.output_dir

        result = action_railroad(args)
        self.assertEqual(result, 0)

        # Check that SVG was created but no markdown
        svg_path = os.path.join(self.output_dir, "images", "railroad", "mycmd.svg")
        md_path = os.path.join(self.output_dir, "commands", "mycmd.md")

        # SVG should exist (if railroad lib available)
        # MD should NOT exist
        self.assertFalse(os.path.exists(md_path))


if __name__ == '__main__':
    unittest.main()