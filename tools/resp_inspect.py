#!/usr/bin/env python3
"""Inspect raw RESP2/RESP3 replies for a Redis command.

Usage:
    python3 resp_inspect.py FT.AGGREGATE idx '*' GROUPBY 1 @country REDUCE COUNT 0 AS num
    python3 resp_inspect.py --no-resp2 HGETALL myhash

Runs the command in both protocols by default and prints the reply with
each node tagged by its RESP type. Used to verify `returns` specs against
real server behaviour and to inspect commands whose prose documentation
is too thin to bootstrap a spec from.

Caveat: redis-py with `disable_decoding=True` returns bytes for both
simple_string and bulk_string replies, so this inspector labels both
as `<string>`. The structural shape (array vs map vs integer vs null
vs string) is faithful; the simple/bulk distinction is not. For most
documentation purposes the structural shape is the important part.
"""

import argparse
import sys

from redis.connection import Connection


def inspect(host, port, protocol, command_args):
    conn = Connection(host=host, port=port, protocol=protocol)
    conn.connect()
    conn.send_command(*command_args)
    return conn.read_response(disable_decoding=True)


def pretty(obj, indent=0):
    pad = "  " * indent
    if isinstance(obj, bool):
        return f"<boolean> {obj}"
    if isinstance(obj, int):
        return f"<integer> {obj}"
    if isinstance(obj, float):
        return f"<double> {obj}"
    if obj is None:
        return "<null>"
    if isinstance(obj, bytes):
        try:
            return f"<string len={len(obj)}> {obj.decode('utf-8')!r}"
        except UnicodeDecodeError:
            return f"<string len={len(obj)} binary> {obj!r}"
    if isinstance(obj, str):
        return f"<string> {obj!r}"
    if isinstance(obj, list):
        if not obj:
            return "<array len=0> []"
        lines = [f"<array len={len(obj)}>"]
        for i, item in enumerate(obj):
            lines.append(f"{pad}  [{i}] {pretty(item, indent + 1)}")
        return "\n".join(lines)
    if isinstance(obj, dict):
        if not obj:
            return "<map size=0> {}"
        lines = [f"<map size={len(obj)}>"]
        for k, v in obj.items():
            lines.append(f"{pad}  {pretty(k, indent + 1)}:")
            lines.append(f"{pad}    {pretty(v, indent + 2)}")
        return "\n".join(lines)
    if isinstance(obj, set):
        if not obj:
            return "<set size=0> {}"
        lines = [f"<set size={len(obj)}>"]
        for i, item in enumerate(sorted(obj, key=repr)):
            lines.append(f"{pad}  [{i}] {pretty(item, indent + 1)}")
        return "\n".join(lines)
    return f"<{type(obj).__name__}> {obj!r}"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--host", default="localhost")
    p.add_argument("--port", type=int, default=6379)
    p.add_argument("--no-resp2", action="store_true")
    p.add_argument("--no-resp3", action="store_true")
    p.add_argument("command", nargs="+")
    args = p.parse_args()

    rc = 0
    for proto in (2, 3):
        if (proto == 2 and args.no_resp2) or (proto == 3 and args.no_resp3):
            continue
        print(f"\n===== RESP{proto} =====")
        try:
            reply = inspect(args.host, args.port, proto, args.command)
            print(pretty(reply))
        except Exception as e:
            print(f"<error> {type(e).__name__}: {e}")
            rc = 1
    return rc


if __name__ == "__main__":
    sys.exit(main())
