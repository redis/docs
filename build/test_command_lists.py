#!/usr/bin/env python3
"""
Comprehensive test suite for command list extraction and enrichment.
Tests CLI parser, markdown parser, command enricher, and integration.
"""

import sys
import os
import json
import tempfile

# Add the build directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from components.cli_parser import extract_cli_commands
from components.markdown_parser import extract_examples_from_markdown, extract_command_names
from components.command_enricher import enrich_commands, generate_command_link


def test_cli_parser_single_word_commands():
    """Test extraction of single-word commands."""
    content = """> SET key value
> GET key
> DEL key"""
    
    commands = extract_cli_commands(content)
    assert commands == ['SET', 'GET', 'DEL'], f"Expected ['SET', 'GET', 'DEL'], got {commands}"
    print("✓ Single-word commands test passed")


def test_cli_parser_multi_word_commands():
    """Test extraction of multi-word commands."""
    content = """> ACL CAT
> CLIENT LIST
> SCRIPT LOAD "return 1\""""
    
    commands = extract_cli_commands(content)
    assert 'ACL CAT' in commands, f"Expected 'ACL CAT' in {commands}"
    assert 'CLIENT LIST' in commands, f"Expected 'CLIENT LIST' in {commands}"
    print("✓ Multi-word commands test passed")


def test_cli_parser_dot_notation():
    """Test extraction of dot notation commands."""
    content = """> JSON.SET doc $ '{}'
> JSON.GET doc
> GRAPH.QUERY mygraph "RETURN 1\""""
    
    commands = extract_cli_commands(content)
    assert 'JSON.SET' in commands, f"Expected 'JSON.SET' in {commands}"
    assert 'JSON.GET' in commands, f"Expected 'JSON.GET' in {commands}"
    print("✓ Dot notation commands test passed")


def test_cli_parser_ignores_output():
    """Test that output lines are ignored."""
    content = """> SET key value
(integer) 1
> GET key
"value"
> LPUSH myqueue item
(integer) 1"""

    commands = extract_cli_commands(content)
    assert commands == ['SET', 'GET', 'LPUSH'], f"Expected ['SET', 'GET', 'LPUSH'], got {commands}"
    print("✓ Output line filtering test passed")


def test_markdown_parser_basic():
    """Test markdown parser with basic example."""
    content = """{{< clients-example set="test_set" step="test_step" >}}
> SET key value
(integer) 1
> GET key
"value"
{{< /clients-example >}}"""
    
    examples = extract_examples_from_markdown(content)
    assert 'test_set' in examples, f"Expected 'test_set' in {examples}"
    assert 'test_step' in examples['test_set'], f"Expected 'test_step' in {examples['test_set']}"
    assert examples['test_set']['test_step'] == ['SET', 'GET'], f"Got {examples['test_set']['test_step']}"
    print("✓ Markdown parser basic test passed")


def test_markdown_parser_multiple_steps():
    """Test markdown parser with multiple steps."""
    content = """{{< clients-example set="multi_step" step="step1" >}}
> SET key1 value1
(integer) 1
{{< /clients-example >}}

{{< clients-example set="multi_step" step="step2" >}}
> GET key1
"value1"
{{< /clients-example >}}"""
    
    examples = extract_examples_from_markdown(content)
    assert 'multi_step' in examples
    assert 'step1' in examples['multi_step']
    assert 'step2' in examples['multi_step']
    print("✓ Markdown parser multiple steps test passed")


def test_command_enricher_basic():
    """Test command enricher with basic commands."""
    commands = ['SET', 'GET', 'DEL']
    enriched = enrich_commands(commands)
    
    assert len(enriched) == 3, f"Expected 3 enriched commands, got {len(enriched)}"
    assert enriched[0]['name'] == 'SET'
    assert enriched[0]['link'] == '/commands/set'
    print("✓ Command enricher basic test passed")


def test_command_enricher_multi_word():
    """Test command enricher with multi-word commands."""
    commands = ['ACL CAT', 'CLIENT LIST']
    enriched = enrich_commands(commands)
    
    assert enriched[0]['link'] == '/commands/acl-cat'
    assert enriched[1]['link'] == '/commands/client-list'
    print("✓ Command enricher multi-word test passed")


def test_command_enricher_dot_notation():
    """Test command enricher with dot notation."""
    commands = ['JSON.SET', 'JSON.GET']
    enriched = enrich_commands(commands)
    
    assert enriched[0]['link'] == '/commands/json.set'
    assert enriched[1]['link'] == '/commands/json.get'
    print("✓ Command enricher dot notation test passed")


def test_generate_command_link():
    """Test command link generation."""
    assert generate_command_link('SET') == '/commands/set'
    assert generate_command_link('ACL CAT') == '/commands/acl-cat'
    assert generate_command_link('JSON.SET') == '/commands/json.set'
    assert generate_command_link('CLIENT LIST') == '/commands/client-list'
    print("✓ Command link generation test passed")


def test_extract_command_names_with_redis_prompt():
    """Test extract_command_names with redis> prompt."""
    content = """redis> RPUSH mylist "one" "two"
(integer) 2
redis> LPOP mylist
"one\""""
    
    commands = extract_command_names(content)
    assert commands == ['RPUSH', 'LPOP'], f"Expected ['RPUSH', 'LPOP'], got {commands}"
    print("✓ extract_command_names with redis> prompt test passed")


def test_deduplication():
    """Test that duplicate commands are deduplicated."""
    content = """> SET key1 value1
> SET key2 value2
> GET key1
> GET key2"""
    
    commands = extract_cli_commands(content)
    assert commands == ['SET', 'GET'], f"Expected ['SET', 'GET'], got {commands}"
    print("✓ Deduplication test passed")


def test_integration_end_to_end():
    """Test end-to-end flow from markdown to enriched commands."""
    # Create a markdown example
    markdown_content = """{{< clients-example set="integration_test" step="step1" >}}
> RPUSH myqueue item1 item2
(integer) 2
> LPOP myqueue
"item1"
{{< /clients-example >}}"""

    # Extract examples from markdown
    examples = extract_examples_from_markdown(markdown_content)
    assert 'integration_test' in examples
    assert 'step1' in examples['integration_test']
    commands = examples['integration_test']['step1']

    # Enrich the commands
    enriched = enrich_commands(commands)
    assert len(enriched) == 2
    assert enriched[0]['name'] == 'RPUSH'
    assert enriched[1]['name'] == 'LPOP'
    assert enriched[0]['link'] == '/commands/rpush'
    assert enriched[1]['link'] == '/commands/lpop'
    print("✓ End-to-end integration test passed")


def main():
    """Run all tests."""
    print("Testing Command List Feature\n")
    print("=" * 50)
    
    try:
        # CLI Parser tests
        print("\nCLI Parser Tests:")
        test_cli_parser_single_word_commands()
        test_cli_parser_multi_word_commands()
        test_cli_parser_dot_notation()
        test_cli_parser_ignores_output()
        test_deduplication()
        
        # Markdown Parser tests
        print("\nMarkdown Parser Tests:")
        test_markdown_parser_basic()
        test_markdown_parser_multiple_steps()
        test_extract_command_names_with_redis_prompt()
        
        # Command Enricher tests
        print("\nCommand Enricher Tests:")
        test_command_enricher_basic()
        test_command_enricher_multi_word()
        test_command_enricher_dot_notation()
        test_generate_command_link()

        # Integration tests
        print("\nIntegration Tests:")
        test_integration_end_to_end()

        print("\n" + "=" * 50)
        print("✅ All tests passed!")
        return 0
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())

