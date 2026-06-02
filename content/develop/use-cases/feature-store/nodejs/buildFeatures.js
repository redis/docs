#!/usr/bin/env node
"use strict";

/**
 * Synthesize a small batch of users with realistic-looking features and
 * bulk-load them into Redis with a 24-hour key-level TTL.
 *
 * Stands in for the nightly Spark / Feast materialization job in a real
 * deployment. In production the equivalent of this script lives in an
 * offline pipeline that reads from the offline store and writes the
 * serving-time hashes into Redis via `HSET` + `EXPIRE`.
 */

const { createClient } = require("redis");
const { FeatureStore } = require("./featureStore");

const COUNTRY_CHOICES = [
  "US", "GB", "DE", "FR", "IN", "BR", "JP", "AU", "CA", "NL",
];
const RISK_SEGMENTS = ["low", "medium", "high"];
const RISK_WEIGHTS = [70, 25, 5];
const CHARGEBACK_BUCKETS = [0, 1, 2, 3];
const CHARGEBACK_WEIGHTS = [85, 10, 4, 1];

/**
 * Deterministic LCG so the synthetic data is reproducible across runs
 * without pulling in a third-party PRNG. Not for any other purpose.
 */
function makeRng(seed) {
  let state = (seed >>> 0) || 1;
  return {
    next() {
      // Numerical Recipes LCG constants.
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x1_0000_0000;
    },
    int(min, max) {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    float(min, max) {
      return this.next() * (max - min) + min;
    },
    choice(items) {
      return items[this.int(0, items.length - 1)];
    },
    weightedChoice(items, weights) {
      const total = weights.reduce((a, b) => a + b, 0);
      let r = this.next() * total;
      for (let i = 0; i < items.length; i += 1) {
        r -= weights[i];
        if (r < 0) return items[i];
      }
      return items[items.length - 1];
    },
  };
}

/**
 * Generate `count` synthetic user feature rows.
 *
 * The shape mirrors a small fraud-scoring feature set: country and
 * risk segment as TAG-like categorical features, plus a few numeric
 * aggregates over recent windows.
 *
 * @param {number} count
 * @param {number} [seed=42]
 */
function synthesizeUsers(count, seed = 42) {
  const rng = makeRng(seed);
  const users = {};
  for (let i = 1; i <= count; i += 1) {
    const uid = `u${String(i).padStart(4, "0")}`;
    users[uid] = {
      country_iso: rng.choice(COUNTRY_CHOICES),
      risk_segment: rng.weightedChoice(RISK_SEGMENTS, RISK_WEIGHTS),
      account_age_days: rng.int(7, 2400),
      tx_count_7d: rng.int(0, 80),
      avg_amount_30d: Number(rng.float(5, 350).toFixed(2)),
      chargeback_count_180d: rng.weightedChoice(
        CHARGEBACK_BUCKETS,
        CHARGEBACK_WEIGHTS,
      ),
    };
  }
  return users;
}

function parseArgs(argv) {
  const opts = {
    redisHost: "localhost",
    redisPort: 6379,
    count: 200,
    ttlSeconds: 24 * 60 * 60,
    keyPrefix: "fs:user:",
    seed: 42,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => argv[i + 1];
    switch (arg) {
      case "--redis-host": opts.redisHost = next(); i += 1; break;
      case "--redis-port": opts.redisPort = Number(next()); i += 1; break;
      case "--count": opts.count = Number(next()); i += 1; break;
      case "--ttl-seconds": opts.ttlSeconds = Number(next()); i += 1; break;
      case "--key-prefix": opts.keyPrefix = next(); i += 1; break;
      case "--seed": opts.seed = Number(next()); i += 1; break;
      case "-h":
      case "--help":
        console.log(
          "Usage: node buildFeatures.js " +
            "[--redis-host H] [--redis-port P] [--count N] " +
            "[--ttl-seconds S] [--key-prefix PREFIX] [--seed N]",
        );
        process.exit(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(2);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const client = createClient({
    socket: { host: opts.redisHost, port: opts.redisPort },
  });
  client.on("error", (err) => console.error("Redis client error:", err));
  await client.connect();

  const store = new FeatureStore({
    redisClient: client,
    keyPrefix: opts.keyPrefix,
    batchTtlSeconds: opts.ttlSeconds,
  });

  const rows = synthesizeUsers(opts.count, opts.seed);
  await store.bulkLoad(rows);

  console.log(
    `Materialized ${Object.keys(rows).length} users at ${opts.keyPrefix}* ` +
      `with a ${opts.ttlSeconds}s key-level TTL.`,
  );

  await client.quit();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { synthesizeUsers };
