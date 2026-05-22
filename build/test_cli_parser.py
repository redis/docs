#!/usr/bin/env python3
"""
Test script for CLI parser to verify both > and redis> prompts are supported.
"""

import sys
import os

# Add the build directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from components.cli_parser import extract_cli_commands
from components.markdown_parser import extract_command_names


def test_cli_parser_with_greater_than_prompt():
    """Test parsing with > prompt."""
    content = """> SET key value
(integer) 1
> GET key
"value"
> DEL key
(integer) 1"""
    
    commands = extract_cli_commands(content)
    assert commands == ['SET', 'GET', 'DEL'], f"Expected ['SET', 'GET', 'DEL'], got {commands}"
    print("✓ Test with > prompt passed")


def test_cli_parser_with_redis_prompt():
    """Test parsing with redis> prompt."""
    content = """redis> RPUSH mylist "one" "two" "three"
(integer) 3
redis> LPOP mylist
"one"
redis> LRANGE mylist 0 -1
1) "two"
2) "three\""""
    
    commands = extract_cli_commands(content)
    assert commands == ['RPUSH', 'LPOP', 'LRANGE'], f"Expected ['RPUSH', 'LPOP', 'LRANGE'], got {commands}"
    print("✓ Test with redis> prompt passed")


def test_cli_parser_mixed_prompts():
    """Test parsing with mixed prompts."""
    content = """> SET key1 value1
(integer) 1
redis> SET key2 value2
(integer) 1
> GET key1
"value1"
redis> GET key2
"value2\""""
    
    commands = extract_cli_commands(content)
    assert commands == ['SET', 'GET'], f"Expected ['SET', 'GET'], got {commands}"
    print("✓ Test with mixed prompts passed")


def test_markdown_parser_with_redis_prompt():
    """Test markdown parser with redis> prompt."""
    content = """{{< clients-example set="cmds_list" step="lpop" >}}
redis> RPUSH mylist "one" "two" "three"
(integer) 3
redis> LPOP mylist
"one"
redis> LRANGE mylist 0 -1
1) "two"
2) "three"
{{< /clients-example >}}"""
    
    commands = extract_command_names(content)
    assert commands == ['RPUSH', 'LPOP', 'LRANGE'], f"Expected ['RPUSH', 'LPOP', 'LRANGE'], got {commands}"
    print("✓ Markdown parser test with redis> prompt passed")


def test_markdown_parser_with_greater_than_prompt():
    """Test markdown parser with > prompt."""
    content = """{{< clients-example set="hash_tutorial" step="set_get_all" >}}
> HSET bike:1 model Deimos
(integer) 1
> HGET bike:1 model
"Deimos"
> HGETALL bike:1
1) "model"
2) "Deimos"
{{< /clients-example >}}"""
    
    commands = extract_command_names(content)
    assert commands == ['HSET', 'HGET', 'HGETALL'], f"Expected ['HSET', 'HGET', 'HGETALL'], got {commands}"
    print("✓ Markdown parser test with > prompt passed")


def main():
    """Run all tests."""
    print("Testing CLI Parser with both > and redis> prompts\n")
    
    try:
        test_cli_parser_with_greater_than_prompt()
        test_cli_parser_with_redis_prompt()
        test_cli_parser_mixed_prompts()
        test_markdown_parser_with_redis_prompt()
        test_markdown_parser_with_greater_than_prompt()
        
        print("\n✅ All tests passed!")
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

