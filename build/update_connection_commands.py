#!/usr/bin/env python3
"""
Script to add missing PHP, C#, and go-redis signatures to connection command files.
"""

import json
import os
from pathlib import Path

# Define the go-redis signatures for connection commands
GO_REDIS_SIGNATURES = {
    "CLIENT INFO": [{
        "signature": "ClientInfo(ctx context.Context) *ClientInfoCmd",
        "params": [{"name": "ctx", "type": "context.Context", "description": "Context"}],
        "returns": {"type": "*ClientInfoCmd", "description": ""}
    }],
    "CLIENT GETNAME": [{
        "signature": "ClientGetName(ctx context.Context) *StringCmd",
        "params": [{"name": "ctx", "type": "context.Context", "description": "Context"}],
        "returns": {"type": "*StringCmd", "description": ""}
    }],
    "CLIENT SETNAME": [{
        "signature": "ClientSetName(ctx context.Context, name string) *BoolCmd",
        "params": [
            {"name": "ctx", "type": "context.Context", "description": "Context"},
            {"name": "name", "type": "string", "description": "Client name"}
        ],
        "returns": {"type": "*BoolCmd", "description": ""}
    }],
    "CLIENT PAUSE": [{
        "signature": "ClientPause(ctx context.Context, dur time.Duration) *BoolCmd",
        "params": [
            {"name": "ctx", "type": "context.Context", "description": "Context"},
            {"name": "dur", "type": "time.Duration", "description": "Pause duration"}
        ],
        "returns": {"type": "*BoolCmd", "description": ""}
    }],
    "CLIENT UNBLOCK": [
        {
            "signature": "ClientUnblock(ctx context.Context, id int64) *IntCmd",
            "params": [
                {"name": "ctx", "type": "context.Context", "description": "Context"},
                {"name": "id", "type": "int64", "description": "Client ID to unblock"}
            ],
            "returns": {"type": "*IntCmd", "description": ""}
        },
        {
            "signature": "ClientUnblockWithError(ctx context.Context, id int64) *IntCmd",
            "params": [
                {"name": "ctx", "type": "context.Context", "description": "Context"},
                {"name": "id", "type": "int64", "description": "Client ID to unblock with error"}
            ],
            "returns": {"type": "*IntCmd", "description": ""}
        }
    ]
}

def update_command_file(filepath, go_redis_sigs=None):
    """Update a command file with missing signatures."""
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    modified = False
    
    # Add go-redis signatures if provided and currently empty
    if go_redis_sigs and not data["api_calls"].get("go-redis"):
        data["api_calls"]["go-redis"] = go_redis_sigs
        modified = True
        print(f"  Added {len(go_redis_sigs)} go-redis signature(s)")
    
    if modified:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
            f.write("\n\n")
    
    return modified

def main():
    mapping_dir = Path("data/command-api-mapping")
    
    for cmd_name, sigs in GO_REDIS_SIGNATURES.items():
        filepath = mapping_dir / f"{cmd_name}.json"
        if filepath.exists():
            print(f"Updating {cmd_name}...")
            if update_command_file(filepath, sigs):
                print(f"  ✓ Updated {cmd_name}")
            else:
                print(f"  - No changes needed for {cmd_name}")
        else:
            print(f"  ✗ File not found: {filepath}")

if __name__ == "__main__":
    main()

