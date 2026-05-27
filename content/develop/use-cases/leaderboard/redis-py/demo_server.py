#!/usr/bin/env python3
"""
Redis leaderboard demo server.

Run this file and visit http://localhost:8080 to add players, change scores,
inspect the top N entries, and view entries around a rank.
"""

from __future__ import annotations

import argparse
from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from leaderboard import RedisLeaderboard
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


SAMPLE_PLAYERS = [
    {
        "user_id": "player-1",
        "score": 980,
        "metadata": {
            "name": "Avery",
            "description": "Steady climber who never wastes a turn.",
        },
    },
    {
        "user_id": "player-2",
        "score": 1310,
        "metadata": {
            "name": "Mina",
            "description": "Always finds a way into the top three.",
        },
    },
    {
        "user_id": "player-3",
        "score": 1175,
        "metadata": {
            "name": "Noah",
            "description": "Takes big swings and occasionally lands them.",
        },
    },
    {
        "user_id": "player-4",
        "score": 1435,
        "metadata": {
            "name": "Priya",
            "description": "Current pace-setter with a ruthless endgame.",
        },
    },
    {
        "user_id": "player-5",
        "score": 1080,
        "metadata": {
            "name": "Jules",
            "description": "Quietly consistent and hard to catch.",
        },
    },
    {
        "user_id": "player-6",
        "score": 1240,
        "metadata": {
            "name": "Rin",
            "description": "Moves fast after every weekly reset.",
        },
    },
]


class LeaderboardDemoHandler(BaseHTTPRequestHandler):
    """Serve an interactive leaderboard demo page."""

    leaderboard: RedisLeaderboard | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return

        if parsed.path == "/api/state":
            self._handle_state_request(parsed.query)
            return

        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/api/players":
            self._handle_player_upsert()
            return

        if parsed.path == "/api/increment":
            self._handle_increment()
            return

        if parsed.path == "/api/config":
            self._handle_config_update()
            return

        if parsed.path == "/api/reset":
            self._handle_reset()
            return

        self.send_error(404)

    def _handle_state_request(self, query: str) -> None:
        params = parse_qs(query)
        top_count = self._parse_positive_int(params.get("top", ["5"])[0], default=5)
        around_rank = self._parse_positive_int(params.get("rank", ["3"])[0], default=3)
        around_count = self._parse_positive_int(params.get("around", ["5"])[0], default=5)

        top_entries = self.leaderboard.get_top(top_count)
        around_entries = self.leaderboard.get_around_rank(around_rank, around_count)

        self._send_json(
            {
                "leaderboard_key": self.leaderboard.key,
                "max_entries": self.leaderboard.max_entries,
                "top_count": top_count,
                "around_rank": around_rank,
                "around_count": around_count,
                "size": self.leaderboard.get_size(),
                "top_entries": top_entries,
                "around_entries": around_entries,
            },
            200,
        )

    def _handle_player_upsert(self) -> None:
        params = self._read_form_data()
        user_id = params.get("user_id", [""])[0].strip()
        score = self._parse_float(params.get("score", [""])[0])
        name = params.get("name", [""])[0].strip()
        description = params.get("description", [""])[0].strip()

        if not user_id:
            self._send_json({"error": "User ID is required."}, 400)
            return

        if score is None:
            self._send_json({"error": "Score must be a valid number."}, 400)
            return

        entry = self.leaderboard.upsert_user(
            user_id,
            score,
            {
                "name": name or user_id,
                "description": description or "No description provided.",
            },
        )

        self._send_json(
            {
                "message": "Player saved.",
                "entry": entry,
                "max_entries": self.leaderboard.max_entries,
            },
            200,
        )

    def _handle_increment(self) -> None:
        params = self._read_form_data()
        user_id = params.get("user_id", [""])[0].strip()
        amount = self._parse_float(params.get("amount", [""])[0])
        name = params.get("name", [""])[0].strip()
        description = params.get("description", [""])[0].strip()

        if not user_id:
            self._send_json({"error": "User ID is required."}, 400)
            return

        if amount is None:
            self._send_json({"error": "Increment must be a valid number."}, 400)
            return

        existing_metadata = self.leaderboard.get_user_metadata(user_id)
        metadata = existing_metadata or {
            "name": name or user_id,
            "description": description or "Created during score increment.",
        }
        if existing_metadata:
            if name:
                metadata["name"] = name
            if description:
                metadata["description"] = description

        entry = self.leaderboard.increment_score(user_id, amount, metadata)
        self._send_json(
            {
                "message": "Score updated.",
                "entry": entry,
                "max_entries": self.leaderboard.max_entries,
            },
            200,
        )

    def _handle_config_update(self) -> None:
        params = self._read_form_data()
        max_entries = self._parse_positive_int(
            params.get("max_entries", [""])[0],
            default=None,
        )
        if max_entries is None:
            self._send_json(
                {"error": "Max entries must be a whole number greater than 0."},
                400,
            )
            return

        trimmed_user_ids = self.leaderboard.set_max_entries(max_entries)
        self._send_json(
            {
                "message": "Leaderboard limit updated.",
                "max_entries": self.leaderboard.max_entries,
                "trimmed_user_ids": trimmed_user_ids,
            },
            200,
        )

    def _handle_reset(self) -> None:
        self._reset_demo_data()
        self._send_json(
            {
                "message": "Demo leaderboard reset.",
                "max_entries": self.leaderboard.max_entries,
            },
            200,
        )

    def _reset_demo_data(self) -> None:
        self.leaderboard.clear()
        for player in SAMPLE_PLAYERS:
            self.leaderboard.upsert_user(
                player["user_id"],
                player["score"],
                player["metadata"],
            )

    def _read_form_data(self) -> dict[str, list[str]]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length).decode("utf-8")
        return parse_qs(raw_body)

    def _parse_positive_int(self, raw_value: str, default: int | None) -> int | None:
        try:
            value = int(raw_value)
        except (TypeError, ValueError):
            return default
        if value < 1:
            return default
        return value

    def _parse_float(self, raw_value: str) -> float | None:
        try:
            return float(raw_value)
        except (TypeError, ValueError):
            return None

    def _send_json(self, payload: dict[str, object], status: int) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def _send_html(self, content: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(content.encode("utf-8"))

    def _html_page(self) -> str:
        title = escape("Redis Leaderboard Demo")
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title}</title>
    <style>
        :root {{
            color-scheme: light;
            --bg: #f7f4ec;
            --panel: #fffaf0;
            --panel-strong: #f0e6d2;
            --text: #1f2933;
            --muted: #52606d;
            --line: #d7cab2;
            --accent: #b45309;
            --accent-dark: #7c2d12;
            --good: #166534;
        }}
        * {{
            box-sizing: border-box;
        }}
        body {{
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            background:
                radial-gradient(circle at top left, rgba(180, 83, 9, 0.12), transparent 28%),
                linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%);
            color: var(--text);
        }}
        main {{
            max-width: 1120px;
            margin: 0 auto;
            padding: 32px 20px 48px;
        }}
        h1, h2, h3 {{
            margin-top: 0;
            color: #3b2f2f;
        }}
        p {{
            color: var(--muted);
            line-height: 1.5;
        }}
        .hero {{
            background: linear-gradient(135deg, rgba(180, 83, 9, 0.12), rgba(124, 45, 18, 0.08));
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 28px;
            margin-bottom: 24px;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 18px;
        }}
        .panel {{
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 14px 40px rgba(31, 41, 51, 0.05);
        }}
        .banner {{
            background: var(--panel-strong);
            color: var(--accent-dark);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 12px 14px;
            margin-bottom: 16px;
            min-height: 48px;
        }}
        form {{
            display: grid;
            gap: 10px;
        }}
        label {{
            font-size: 0.95rem;
            font-weight: 700;
            color: #4b3b30;
        }}
        input, textarea, button {{
            font: inherit;
        }}
        input, textarea {{
            width: 100%;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid var(--line);
            background: #fffdf8;
            color: var(--text);
        }}
        textarea {{
            min-height: 90px;
            resize: vertical;
        }}
        button {{
            border: 0;
            border-radius: 999px;
            padding: 11px 16px;
            background: linear-gradient(135deg, var(--accent), var(--accent-dark));
            color: white;
            cursor: pointer;
            font-weight: 700;
        }}
        button.secondary {{
            background: #e6dcc8;
            color: #4b3b30;
        }}
        .inline {{
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }}
        .toolbar {{
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 14px;
        }}
        .statline {{
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 8px;
            color: var(--muted);
            font-size: 0.95rem;
        }}
        .table-wrap {{
            overflow-x: auto;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
        }}
        th, td {{
            text-align: left;
            padding: 10px 8px;
            border-bottom: 1px solid rgba(215, 202, 178, 0.8);
            vertical-align: top;
        }}
        th {{
            color: #4b3b30;
            font-size: 0.95rem;
        }}
        .pill {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(180, 83, 9, 0.1);
            color: var(--accent-dark);
            font-size: 0.85rem;
            font-weight: 700;
        }}
        .success {{
            color: var(--good);
        }}
        @media (max-width: 720px) {{
            .inline {{
                grid-template-columns: 1fr;
            }}
        }}
    </style>
</head>
<body>
    <main>
        <section class="hero">
            <h1>Redis leaderboard demo</h1>
            <p>
                This demo stores scores in a Redis sorted set and keeps player details in per-user hashes.
                You can inspect the top performers, look around a rank position, and trim the board to a fixed size.
            </p>
            <div class="statline">
                <span class="pill">Sorted set rankings</span>
                <span class="pill">Hash-based metadata</span>
                <span class="pill">Top N and around-rank queries</span>
            </div>
        </section>

        <div class="banner" id="banner">Ready.</div>

        <div class="grid">
            <section class="panel">
                <h2>Add or update a player</h2>
                <form id="upsert-form">
                    <label>User ID <input name="user_id" value="player-7" required></label>
                    <div class="inline">
                        <label>Name <input name="name" value="Kai"></label>
                        <label>Score <input name="score" type="number" step="0.01" value="1125" required></label>
                    </div>
                    <label>Description <textarea name="description">New challenger climbing into contention.</textarea></label>
                    <button type="submit">Save player</button>
                </form>
            </section>

            <section class="panel">
                <h2>Increment a score</h2>
                <form id="increment-form">
                    <div class="inline">
                        <label>User ID <input name="user_id" value="player-2" required></label>
                        <label>Amount <input name="amount" type="number" step="0.01" value="25" required></label>
                    </div>
                    <label>Name for a new user <input name="name" value=""></label>
                    <label>Description for a new user <textarea name="description"></textarea></label>
                    <button type="submit">Add points</button>
                </form>
            </section>

            <section class="panel">
                <h2>Leaderboard settings</h2>
                <form id="config-form">
                    <div class="inline">
                        <label>Top entries to view <input id="top-count" type="number" min="1" value="5"></label>
                        <label>Entries around rank <input id="around-count" type="number" min="1" value="5"></label>
                    </div>
                    <div class="inline">
                        <label>Center rank <input id="around-rank" type="number" min="1" value="3"></label>
                        <label>Max leaderboard size <input name="max_entries" id="max-entries" type="number" min="1" value="100"></label>
                    </div>
                    <button type="submit">Apply max size</button>
                </form>
                <div class="toolbar" style="margin-top: 14px;">
                    <button class="secondary" id="refresh-button" type="button">Refresh view</button>
                    <button class="secondary" id="reset-button" type="button">Reset sample data</button>
                </div>
                <div class="statline">
                    <span>Leaderboard key: <strong id="leaderboard-key">leaderboard:demo</strong></span>
                    <span>Stored entries: <strong id="leaderboard-size">0</strong></span>
                    <span>Max kept: <strong id="leaderboard-limit">100</strong></span>
                </div>
            </section>
        </div>

        <div class="grid" style="margin-top: 18px;">
            <section class="panel">
                <h2>Top entries</h2>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>User</th>
                                <th>Score</th>
                                <th>Metadata</th>
                            </tr>
                        </thead>
                        <tbody id="top-table"></tbody>
                    </table>
                </div>
            </section>

            <section class="panel">
                <h2>Entries around rank</h2>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>User</th>
                                <th>Score</th>
                                <th>Metadata</th>
                            </tr>
                        </thead>
                        <tbody id="around-table"></tbody>
                    </table>
                </div>
            </section>
        </div>
    </main>

    <script>
        const banner = document.getElementById('banner');

        function setBanner(message, isSuccess = true) {{
            banner.textContent = message;
            banner.className = 'banner' + (isSuccess ? ' success' : '');
        }}

        function renderRows(targetId, entries) {{
            const target = document.getElementById(targetId);
            if (!entries.length) {{
                target.innerHTML = '<tr><td colspan="4">No entries found for this view.</td></tr>';
                return;
            }}

            target.innerHTML = entries.map((entry) => {{
                const metadata = entry.metadata || {{}};
                const name = metadata.name || entry.user_id;
                const description = metadata.description || '';
                return `
                    <tr>
                        <td>#${{entry.rank}}</td>
                        <td><strong>${{entry.user_id}}</strong><br><span>${{name}}</span></td>
                        <td>${{entry.score}}</td>
                        <td>${{description}}</td>
                    </tr>
                `;
            }}).join('');
        }}

        async function refreshState() {{
            const top = document.getElementById('top-count').value || '5';
            const around = document.getElementById('around-count').value || '5';
            const rank = document.getElementById('around-rank').value || '3';
            const response = await fetch(`/api/state?top=${{encodeURIComponent(top)}}&around=${{encodeURIComponent(around)}}&rank=${{encodeURIComponent(rank)}}`);
            const data = await response.json();

            document.getElementById('leaderboard-key').textContent = data.leaderboard_key;
            document.getElementById('leaderboard-size').textContent = data.size;
            document.getElementById('leaderboard-limit').textContent = data.max_entries;
            document.getElementById('max-entries').value = data.max_entries;

            renderRows('top-table', data.top_entries);
            renderRows('around-table', data.around_entries);
        }}

        async function postForm(url, form) {{
            const response = await fetch(url, {{
                method: 'POST',
                body: new URLSearchParams(new FormData(form)),
            }});
            return response.json();
        }}

        document.getElementById('upsert-form').addEventListener('submit', async (event) => {{
            event.preventDefault();
            const data = await postForm('/api/players', event.target);
            if (data.error) {{
                setBanner(data.error, false);
                return;
            }}
            const trimmed = data.entry.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ` Trimmed: ${{trimmed.join(', ')}}.` : '';
            setBanner(`Saved ${{data.entry.user_id}} at rank #${{data.entry.rank}} with score ${{data.entry.score}}.${{trimmedText}}`);
            await refreshState();
        }});

        document.getElementById('increment-form').addEventListener('submit', async (event) => {{
            event.preventDefault();
            const data = await postForm('/api/increment', event.target);
            if (data.error) {{
                setBanner(data.error, false);
                return;
            }}
            const trimmed = data.entry.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ` Trimmed: ${{trimmed.join(', ')}}.` : '';
            setBanner(`Updated ${{data.entry.user_id}} to score ${{data.entry.score}} at rank #${{data.entry.rank}}.${{trimmedText}}`);
            await refreshState();
        }});

        document.getElementById('config-form').addEventListener('submit', async (event) => {{
            event.preventDefault();
            const data = await postForm('/api/config', event.target);
            if (data.error) {{
                setBanner(data.error, false);
                return;
            }}
            const trimmed = data.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ` Trimmed: ${{trimmed.join(', ')}}.` : '';
            setBanner(`Leaderboard limit set to ${{data.max_entries}}.${{trimmedText}}`);
            await refreshState();
        }});

        document.getElementById('refresh-button').addEventListener('click', refreshState);

        document.getElementById('reset-button').addEventListener('click', async () => {{
            const response = await fetch('/api/reset', {{ method: 'POST' }});
            const data = await response.json();
            setBanner(data.message);
            await refreshState();
        }});

        refreshState().catch((error) => {{
            setBanner(`Failed to load leaderboard state: ${{error}}`, false);
        }});
    </script>
</body>
</html>
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis leaderboard demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP host to bind to")
    parser.add_argument("--port", type=int, default=8080, help="HTTP port to bind to")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument(
        "--max-entries",
        type=int,
        default=100,
        help="Maximum number of leaderboard entries to keep",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )
    redis_client.ping()

    leaderboard = RedisLeaderboard(
        redis_client=redis_client,
        key="leaderboard:demo",
        max_entries=args.max_entries,
    )
    LeaderboardDemoHandler.leaderboard = leaderboard
    leaderboard.clear()
    for player in SAMPLE_PLAYERS:
        leaderboard.upsert_user(
            player["user_id"],
            player["score"],
            player["metadata"],
        )

    server = ThreadingHTTPServer((args.host, args.port), LeaderboardDemoHandler)
    print(f"Leaderboard demo server running at http://{args.host}:{args.port}")
    print(f"Connected to Redis at {args.redis_host}:{args.redis_port}")
    print(f"Keeping the top {leaderboard.max_entries} entries")
    print("Press Ctrl+C to stop.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
