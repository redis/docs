"""
Synthesize a small batch of users with realistic-looking features and
bulk-load them into Redis with a 24-hour key-level TTL.

Stands in for the nightly Spark / Feast materialization job in a real
deployment. In production the equivalent of this script lives in an
offline pipeline that reads from the offline store and writes the
serving-time hashes into Redis via ``HSET`` + ``EXPIRE``.
"""

from __future__ import annotations

import argparse
import random
from typing import Iterable

from feature_store import RedisFeatureStore


COUNTRY_CHOICES = ("US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL")
RISK_SEGMENTS = ("low", "medium", "high")


def synthesize_users(count: int, seed: int = 42) -> dict[str, dict]:
    """Generate ``count`` synthetic user feature rows.

    The shape mirrors a small fraud-scoring feature set: country and
    risk segment as TAG-like categorical features, plus a few numeric
    aggregates over recent windows.
    """
    rng = random.Random(seed)
    users: dict[str, dict] = {}
    for i in range(1, count + 1):
        uid = f"u{i:04d}"
        users[uid] = {
            "country_iso": rng.choice(COUNTRY_CHOICES),
            "risk_segment": rng.choices(
                RISK_SEGMENTS, weights=(70, 25, 5), k=1,
            )[0],
            "account_age_days": rng.randint(7, 2400),
            "tx_count_7d": rng.randint(0, 80),
            "avg_amount_30d": round(rng.uniform(5, 350), 2),
            "chargeback_count_180d": rng.choices(
                (0, 1, 2, 3), weights=(85, 10, 4, 1), k=1,
            )[0],
        }
    return users


def main(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--redis-host", default="localhost")
    parser.add_argument("--redis-port", type=int, default=6379)
    parser.add_argument(
        "--count", type=int, default=200,
        help="Number of synthetic users to materialize.",
    )
    parser.add_argument(
        "--ttl-seconds", type=int, default=24 * 60 * 60,
        help="Key-level TTL for each user hash (default 24h).",
    )
    parser.add_argument(
        "--key-prefix", default="fs:user:",
        help="Hash key prefix for each user.",
    )
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args(list(argv) if argv is not None else None)

    import redis
    client = redis.Redis(
        host=args.redis_host, port=args.redis_port, decode_responses=True,
    )
    store = RedisFeatureStore(
        redis_client=client,
        key_prefix=args.key_prefix,
        batch_ttl_seconds=args.ttl_seconds,
    )

    rows = synthesize_users(args.count, seed=args.seed)
    store.bulk_load(rows)
    print(
        f"Materialized {len(rows)} users at {args.key_prefix}* "
        f"with a {args.ttl_seconds}s key-level TTL."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
