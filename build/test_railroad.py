#!/usr/bin/env python3
"""
Test script for generating railroad diagrams for Redis commands.
This demonstrates the proof-of-concept implementation.
"""

import json
import logging
import os
import sys
from pathlib import Path

# Add the build directory to the path so we can import components
sys.path.insert(0, os.path.dirname(__file__))

from components.syntax import Command

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def load_command_data():
    """Load FT.AGGREGATE command data for testing."""
    # This is a simplified version of the FT.AGGREGATE command structure
    # based on the frontmatter from content/commands/ft.aggregate.md
    return {
        "FT.AGGREGATE": {
            "arguments": [
                {
                    "name": "index",
                    "type": "string"
                },
                {
                    "name": "query", 
                    "type": "string"
                },
                {
                    "name": "verbatim",
                    "optional": True,
                    "token": "VERBATIM",
                    "type": "pure-token"
                },
                {
                    "name": "load",
                    "optional": True,
                    "type": "block",
                    "arguments": [
                        {
                            "name": "count",
                            "token": "LOAD",
                            "type": "string"
                        },
                        {
                            "name": "field",
                            "type": "string",
                            "multiple": True
                        }
                    ]
                },
                {
                    "name": "timeout",
                    "optional": True,
                    "token": "TIMEOUT",
                    "type": "integer"
                },
                {
                    "name": "loadall",
                    "optional": True,
                    "token": "LOAD *",
                    "type": "pure-token"
                },
                {
                    "name": "groupby",
                    "optional": True,
                    "type": "block",
                    "multiple": True,
                    "arguments": [
                        {
                            "name": "nargs",
                            "token": "GROUPBY",
                            "type": "integer"
                        },
                        {
                            "name": "property",
                            "type": "string",
                            "multiple": True
                        },
                        {
                            "name": "reduce",
                            "optional": True,
                            "type": "block",
                            "multiple": True,
                            "arguments": [
                                {
                                    "name": "function",
                                    "token": "REDUCE",
                                    "type": "string"
                                },
                                {
                                    "name": "nargs",
                                    "type": "integer"
                                },
                                {
                                    "name": "arg",
                                    "type": "string",
                                    "multiple": True
                                },
                                {
                                    "name": "name",
                                    "optional": True,
                                    "token": "AS",
                                    "type": "string"
                                }
                            ]
                        }
                    ]
                },
                {
                    "name": "limit",
                    "optional": True,
                    "type": "block",
                    "arguments": [
                        {
                            "name": "limit",
                            "token": "LIMIT",
                            "type": "pure-token"
                        },
                        {
                            "name": "offset",
                            "type": "integer"
                        },
                        {
                            "name": "num",
                            "type": "integer"
                        }
                    ]
                }
            ]
        }
    }

def test_simple_command():
    """Test with a simple command first."""
    simple_data = {
        "GET": {
            "arguments": [
                {
                    "name": "key",
                    "type": "string"
                }
            ]
        }
    }

    print("Testing simple GET command...")
    command = Command("GET", simple_data["GET"])

    try:
        svg_content = command.to_railroad_diagram()
        output_file = "static/images/railroad/get.svg"
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(svg_content)

        print(f"✅ Simple GET command diagram generated: {output_file}")
        print(f"   SVG length: {len(svg_content)} characters")

    except Exception as e:
        print(f"❌ Failed to generate simple command diagram: {e}")
        return False

    return True

def test_additional_commands():
    """Test with a few more commands to show versatility."""
    commands_data = {
        "SET": {
            "arguments": [
                {
                    "name": "key",
                    "type": "string"
                },
                {
                    "name": "value",
                    "type": "string"
                },
                {
                    "name": "expiration",
                    "optional": True,
                    "type": "oneof",
                    "arguments": [
                        {
                            "name": "ex",
                            "token": "EX",
                            "type": "integer"
                        },
                        {
                            "name": "px",
                            "token": "PX",
                            "type": "integer"
                        }
                    ]
                },
                {
                    "name": "condition",
                    "optional": True,
                    "type": "oneof",
                    "arguments": [
                        {
                            "name": "nx",
                            "token": "NX",
                            "type": "pure-token"
                        },
                        {
                            "name": "xx",
                            "token": "XX",
                            "type": "pure-token"
                        }
                    ]
                }
            ]
        },
        "ZADD": {
            "arguments": [
                {
                    "name": "key",
                    "type": "string"
                },
                {
                    "name": "options",
                    "optional": True,
                    "type": "oneof",
                    "arguments": [
                        {
                            "name": "nx",
                            "token": "NX",
                            "type": "pure-token"
                        },
                        {
                            "name": "xx",
                            "token": "XX",
                            "type": "pure-token"
                        }
                    ]
                },
                {
                    "name": "ch",
                    "optional": True,
                    "token": "CH",
                    "type": "pure-token"
                },
                {
                    "name": "incr",
                    "optional": True,
                    "token": "INCR",
                    "type": "pure-token"
                },
                {
                    "name": "score_member",
                    "type": "block",
                    "multiple": True,
                    "arguments": [
                        {
                            "name": "score",
                            "type": "double"
                        },
                        {
                            "name": "member",
                            "type": "string"
                        }
                    ]
                }
            ]
        }
    }

    print("\nTesting additional commands...")

    for cmd_name, cmd_data in commands_data.items():
        print(f"  Generating {cmd_name}...")
        try:
            command = Command(cmd_name, cmd_data)
            svg_content = command.to_railroad_diagram()
            output_file = f"static/images/railroad/{cmd_name.lower()}.svg"

            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(svg_content)

            print(f"    ✅ {cmd_name} diagram generated: {output_file}")

        except Exception as e:
            print(f"    ❌ Failed to generate {cmd_name} diagram: {e}")
            return False

    return True

def test_complex_command():
    """Test with the complex FT.AGGREGATE command."""
    command_data = load_command_data()
    
    print("\nTesting complex FT.AGGREGATE command...")
    command = Command("FT.AGGREGATE", command_data["FT.AGGREGATE"])
    
    try:
        svg_content = command.to_railroad_diagram()
        output_file = "static/images/railroad/ft.aggregate.svg"
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        
        print(f"✅ FT.AGGREGATE command diagram generated: {output_file}")
        print(f"   SVG length: {len(svg_content)} characters")
        
        # Also show the traditional syntax for comparison
        print(f"\n📝 Traditional syntax:")
        print(f"   {command.syntax()}")
        
    except Exception as e:
        print(f"❌ Failed to generate complex command diagram: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

def main():
    """Main test function."""
    print("🚂 Railroad Diagram Generator - Proof of Concept")
    print("=" * 50)
    
    # Check if railroad library is available
    try:
        import railroad
        print(f"✅ Railroad diagrams library available (version: {getattr(railroad, '__version__', 'unknown')})")
    except ImportError:
        print("❌ Railroad diagrams library not available. Please install with:")
        print("   pip install railroad-diagrams")
        return 1
    
    # Test simple command first
    if not test_simple_command():
        return 1

    # Test additional commands
    if not test_additional_commands():
        return 1

    # Test complex command
    if not test_complex_command():
        return 1

    print("\n🎉 All tests passed! Railroad diagrams generated successfully.")
    print("\nGenerated diagrams:")
    for svg_file in Path("static/images/railroad").glob("*.svg"):
        print(f"  📄 {svg_file}")

    print("\nNext steps:")
    print("1. Open the generated SVG files in a browser to view the diagrams")
    print("2. Integrate this into the build pipeline (update_cmds.py)")
    print("3. Modify Hugo templates to display the diagrams")

    return 0

if __name__ == "__main__":
    sys.exit(main())
