<?php
/**
 * Redis event-stream helper backed by a single Redis Stream.
 *
 * Producers append events with `XADD`. Consumers belong to consumer
 * groups and read with `XREADGROUP`. The group as a whole tracks a
 * single `last-delivered-id` cursor, and each consumer gets its own
 * pending-entries list (PEL) of in-flight messages it has been handed.
 * Once a consumer has processed an entry it acknowledges it with
 * `XACK`; entries left unacknowledged past an idle threshold can be
 * swept to a healthy consumer with `XAUTOCLAIM` (or to a specific one
 * with `XCLAIM`).
 *
 * Each `XADD` carries an approximate `MAXLEN` so the stream stays
 * bounded as it rolls forward. `XRANGE` supports replay over the
 * retained history for debugging, audit, or rebuilding a downstream
 * projection. Note that approximate trimming can release entries that
 * are still in a group's PEL: those entries appear in `XAUTOCLAIM`'s
 * deleted-IDs list, which the caller should log and route to a
 * dead-letter store. Redis 7+ removes them from the PEL inside the
 * `XAUTOCLAIM` call itself, so no explicit `XACK` is needed.
 *
 * The same stream can be read by any number of consumer groups — each
 * group has its own cursor and its own pending lists, so analytics,
 * notifications, and audit can all process the full event flow at
 * their own pace without coordinating with each other.
 *
 * The PHP port differs from the others structurally: `php -S` runs
 * each HTTP request in a fresh process, so stats counters and worker
 * state can't live in object properties. Counters live in Redis under
 * `demo:streaming:stats`; per-consumer counters and recent buffers
 * under `demo:streaming:worker:{group}:{name}:*`; consumer workers run
 * as detached OS processes spawned by the demo server.
 *
 * Requires: predis/predis 3.x
 */

declare(strict_types=1);

use Predis\ClientInterface;
use Predis\Response\ServerException;

class EventStream
{
    public const STATS_KEY = 'demo:streaming:stats';
    public const WORKER_KEY_PREFIX = 'demo:streaming:worker';

    private ClientInterface $redis;
    private string $streamKey;
    private int $maxlenApprox;
    private int $claimMinIdleMs;

    public function __construct(
        ClientInterface $redis,
        string $streamKey = 'demo:events:orders',
        int $maxlenApprox = 10000,
        int $claimMinIdleMs = 15000
    ) {
        $this->redis = $redis;
        $this->streamKey = $streamKey;
        $this->maxlenApprox = $maxlenApprox;
        $this->claimMinIdleMs = $claimMinIdleMs;
    }

    public function streamKey(): string
    {
        return $this->streamKey;
    }

    public function maxlenApprox(): int
    {
        return $this->maxlenApprox;
    }

    public function claimMinIdleMs(): int
    {
        return $this->claimMinIdleMs;
    }

    public function client(): ClientInterface
    {
        return $this->redis;
    }

    // ------------------------------------------------------------------
    // Producer
    // ------------------------------------------------------------------

    /**
     * Append a single event. Returns the stream ID Redis assigned.
     *
     * @param array<string,mixed> $payload
     */
    public function produce(string $eventType, array $payload): string
    {
        $ids = $this->produceBatch([[$eventType, $payload]]);
        return $ids[0];
    }

    /**
     * Pipeline several `XADD` calls in one round trip.
     *
     * Each entry carries an approximate `MAXLEN` cap. The `~` flavour
     * lets Redis trim at a macro-node boundary, which is much cheaper
     * than exact trimming and is the right call for a retention
     * guardrail rather than a hard size limit.
     *
     * @param list<array{0:string,1:array<string,mixed>}> $events
     * @return list<string>
     */
    public function produceBatch(array $events): array
    {
        if (empty($events)) {
            return [];
        }
        // Predis pipelines without MULTI/EXEC return the raw results in
        // order. The fluent pipeline closure form is the simplest way
        // to drive a non-transactional pipeline in Predis 3.x.
        $stream = $this->streamKey;
        $maxlen = $this->maxlenApprox;
        $results = $this->redis->pipeline(function ($pipe) use ($events, $stream, $maxlen) {
            foreach ($events as [$eventType, $payload]) {
                $fields = self::encodeFields($eventType, $payload);
                // XADD <key> <fields-assoc> <id=*> {trim => [MAXLEN, ~, n]}
                $pipe->xadd($stream, $fields, '*', ['trim' => ['MAXLEN', '~', $maxlen]]);
            }
        });

        $ids = [];
        foreach ($results as $id) {
            $ids[] = (string) $id;
        }
        $this->redis->hincrby(self::STATS_KEY, 'produced_total', count($ids));
        return $ids;
    }

    /**
     * @param array<string,mixed> $payload
     * @return array<string,string>
     */
    private static function encodeFields(string $eventType, array $payload): array
    {
        $fields = [
            'type' => $eventType,
            'ts_ms' => (string) self::nowMs(),
        ];
        foreach ($payload as $k => $v) {
            $fields[(string) $k] = $v === null ? '' : (string) $v;
        }
        return $fields;
    }

    // ------------------------------------------------------------------
    // Consumer groups
    // ------------------------------------------------------------------

    /**
     * Create the consumer group if it doesn't exist.
     *
     * `$` means "deliver only events appended after this point"; pass
     * `0-0` to replay the entire stream into a fresh group.
     */
    public function ensureGroup(string $group, string $startId = '$'): void
    {
        try {
            // XGROUP CREATE <key> <group> <id> MKSTREAM
            $this->redis->xgroup('CREATE', $this->streamKey, $group, $startId, true);
        } catch (ServerException $exc) {
            if (strpos($exc->getMessage(), 'BUSYGROUP') === false) {
                throw $exc;
            }
        }
    }

    public function deleteGroup(string $group): int
    {
        try {
            return (int) $this->redis->xgroup('DESTROY', $this->streamKey, $group);
        } catch (ServerException $exc) {
            return 0;
        }
    }

    /**
     * Read new entries for this consumer via `XREADGROUP`.
     *
     * The `>` ID means "deliver entries this consumer group has not
     * delivered to *anyone* yet" — that is the at-least-once path.
     * Replaying an explicit ID instead would re-deliver an entry that
     * is already in this consumer's pending list (see
     * `consumeOwnPel` for that recovery path).
     *
     * @return list<array{0:string,1:array<string,string>}>
     */
    public function consume(string $group, string $consumer, int $count = 10, int $blockMs = 500): array
    {
        // Predis xreadgroup signature:
        // xreadgroup(group, consumer, count, block, noack, key, id)
        $raw = $this->redis->xreadgroup(
            $group,
            $consumer,
            $count,
            $blockMs,
            false,
            $this->streamKey,
            '>'
        );
        return self::flattenReadGroup($raw);
    }

    /**
     * Re-deliver entries already in this consumer's PEL.
     *
     * Reading with an explicit ID (`0` here) instead of `>` replays
     * the entries already assigned to this consumer name without
     * advancing the group's `last-delivered-id`. This is the
     * canonical recovery path after a crash on the same consumer
     * name, and is also how a consumer picks up entries that another
     * consumer (or `XAUTOCLAIM`) handed to it.
     *
     * @return list<array{0:string,1:array<string,string>}>
     */
    public function consumeOwnPel(string $group, string $consumer, int $count = 10): array
    {
        $raw = $this->redis->xreadgroup(
            $group,
            $consumer,
            $count,
            null,
            false,
            $this->streamKey,
            '0'
        );
        return self::flattenReadGroup($raw);
    }

    /**
     * `XACK` a list of IDs. Returns how many Redis confirmed.
     *
     * @param list<string> $ids
     */
    public function ack(string $group, array $ids): int
    {
        if (empty($ids)) {
            return 0;
        }
        // Predis 3.x XACK takes variadic IDs, not an array.
        $n = (int) $this->redis->xack($this->streamKey, $group, ...$ids);
        if ($n > 0) {
            $this->redis->hincrby(self::STATS_KEY, 'acked_total', $n);
        }
        return $n;
    }

    /**
     * Sweep idle pending entries to `$consumer`.
     *
     * A single `XAUTOCLAIM` call scans up to `$pageCount` PEL entries
     * starting at `$startId` and returns a continuation cursor. For a
     * full sweep, loop until the cursor returns to `0-0` (with a
     * `$maxPages` safety net so a very large PEL can't monopolise the
     * call).
     *
     * Returns `['claimed' => [...], 'deletedIds' => [...]]`. The
     * `deletedIds` are PEL entries whose stream payload had already
     * been trimmed (typically because `MAXLEN ~` retention outran a
     * slow consumer). `XAUTOCLAIM` removes those dangling slots from
     * the PEL itself — the caller does **not** need to `XACK` them —
     * but they cannot be retried either, so log and route them to a
     * dead-letter store.
     *
     * @return array{claimed: list<array{0:string,1:array<string,string>}>, deletedIds: list<string>}
     */
    public function autoclaim(
        string $group,
        string $consumer,
        int $pageCount = 100,
        string $startId = '0-0',
        int $maxPages = 10
    ): array {
        $claimedAll = [];
        $deletedAll = [];
        $cursor = $startId;

        for ($i = 0; $i < $maxPages; $i++) {
            $reply = $this->redis->xautoclaim(
                $this->streamKey,
                $group,
                $consumer,
                $this->claimMinIdleMs,
                $cursor,
                $pageCount
            );
            // Reply shape: [nextCursor, [[id, [k,v,k,v,...]], ...], [deletedIds...]]
            $nextCursor = isset($reply[0]) ? (string) $reply[0] : '0-0';
            $claimedRaw = $reply[1] ?? [];
            $deletedRaw = $reply[2] ?? [];

            foreach ($claimedRaw as $entry) {
                if (!is_array($entry) || !isset($entry[0])) {
                    continue;
                }
                $id = (string) $entry[0];
                $fields = self::pairsToDict(is_array($entry[1] ?? null) ? $entry[1] : []);
                $claimedAll[] = [$id, $fields];
            }
            foreach ($deletedRaw as $id) {
                $deletedAll[] = (string) $id;
            }

            if ($nextCursor === '0-0') {
                break;
            }
            $cursor = $nextCursor;
        }

        if (!empty($claimedAll)) {
            $this->redis->hincrby(self::STATS_KEY, 'claimed_total', count($claimedAll));
        }

        return ['claimed' => $claimedAll, 'deletedIds' => $deletedAll];
    }

    /**
     * Drop a consumer from a group.
     *
     * `XGROUP DELCONSUMER` destroys this consumer's PEL entries — any
     * entry it still owned is no longer tracked anywhere in the group
     * and `XAUTOCLAIM` will never find it again. Always
     * `handoverPending` (or `XCLAIM` it manually) to a healthy
     * consumer first; this method is the raw destructive call and is
     * exposed only for explicit cleanup.
     */
    public function deleteConsumer(string $group, string $consumer): int
    {
        try {
            return (int) $this->redis->xgroup('DELCONSUMER', $this->streamKey, $group, $consumer);
        } catch (ServerException $exc) {
            return 0;
        }
    }

    /**
     * Move every PEL entry owned by `$fromConsumer` to `$toConsumer`.
     *
     * Enumerates the source consumer's PEL with
     * `XPENDING ... CONSUMER` and reassigns each ID with `XCLAIM` at
     * zero idle time so the move is unconditional. (`XAUTOCLAIM` does
     * not filter by source consumer, so it cannot be used for a
     * per-consumer handover.)
     *
     * Call this before `deleteConsumer` whenever the source still has
     * pending entries — otherwise `XGROUP DELCONSUMER` would silently
     * destroy them and they could never be recovered.
     *
     * @return int Number of entries successfully claimed by `$toConsumer`.
     */
    public function handoverPending(
        string $group,
        string $fromConsumer,
        string $toConsumer,
        int $batch = 100
    ): int {
        $claimedTotal = 0;

        while (true) {
            // XPENDING <key> <group> [IDLE ms] <start> <end> <count> [consumer]
            $rows = $this->redis->xpending(
                $this->streamKey,
                $group,
                null,
                '-',
                '+',
                $batch,
                $fromConsumer
            );
            if (!is_array($rows) || empty($rows)) {
                break;
            }
            $ids = [];
            foreach ($rows as $row) {
                if (isset($row[0])) {
                    $ids[] = (string) $row[0];
                }
            }
            if (empty($ids)) {
                break;
            }
            // XCLAIM <key> <group> <consumer> <min-idle-ms> <id...>
            // Predis 3.x XCLAIM takes the IDs as the 5th positional
            // argument (array or scalar) — see XCLAIM::setArguments.
            $claimed = $this->redis->xclaim(
                $this->streamKey,
                $group,
                $toConsumer,
                0,
                $ids
            );
            if (is_array($claimed)) {
                $claimedTotal += count($claimed);
            }
            if (count($rows) < $batch) {
                break;
            }
        }

        if ($claimedTotal > 0) {
            $this->redis->hincrby(self::STATS_KEY, 'claimed_total', $claimedTotal);
        }
        return $claimedTotal;
    }

    // ------------------------------------------------------------------
    // Replay, length, trim
    // ------------------------------------------------------------------

    /**
     * Range read with `XRANGE` for replay or audit.
     *
     * Read-only: ranges do not update any group cursor and do not ack
     * anything. Useful for bootstrapping a new projection, for
     * building an audit view, or for debugging what actually went
     * through the stream.
     *
     * @return list<array{0:string,1:array<string,string>}>
     */
    public function replay(string $startId = '-', string $endId = '+', int $count = 100): array
    {
        $raw = $this->redis->xrange($this->streamKey, $startId, $endId, $count);
        $out = [];
        foreach ($raw as $id => $fields) {
            $out[] = [(string) $id, is_array($fields) ? $fields : []];
        }
        return $out;
    }

    /**
     * @return list<array{0:string,1:array<string,string>}>
     */
    public function tail(int $count = 10): array
    {
        $raw = $this->redis->xrevrange($this->streamKey, '+', '-', $count);
        $out = [];
        foreach ($raw as $id => $fields) {
            $out[] = [(string) $id, is_array($fields) ? $fields : []];
        }
        return $out;
    }

    public function length(): int
    {
        return (int) $this->redis->xlen($this->streamKey);
    }

    public function trimMaxlen(int $maxlen): int
    {
        return (int) $this->redis->xtrim($this->streamKey, ['MAXLEN', '~'], $maxlen);
    }

    public function trimMinid(string $minid): int
    {
        return (int) $this->redis->xtrim($this->streamKey, ['MINID', '~'], $minid);
    }

    // ------------------------------------------------------------------
    // Inspection
    // ------------------------------------------------------------------

    /**
     * @return array<string,mixed>
     */
    public function infoStream(): array
    {
        try {
            $raw = $this->redis->xinfo('STREAM', $this->streamKey);
        } catch (ServerException $exc) {
            return [
                'length' => 0,
                'last_generated_id' => null,
                'first_entry_id' => null,
                'last_entry_id' => null,
            ];
        }
        $first = $raw['first-entry'] ?? null;
        $last = $raw['last-entry'] ?? null;
        return [
            'length' => (int) ($raw['length'] ?? 0),
            'last_generated_id' => $raw['last-generated-id'] ?? null,
            'first_entry_id' => is_array($first) && isset($first[0]) ? (string) $first[0] : null,
            'last_entry_id' => is_array($last) && isset($last[0]) ? (string) $last[0] : null,
        ];
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function infoGroups(): array
    {
        try {
            $rows = $this->redis->xinfo('GROUPS', $this->streamKey);
        } catch (ServerException $exc) {
            return [];
        }
        $out = [];
        foreach ((array) $rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $out[] = [
                'name' => (string) ($row['name'] ?? ''),
                'consumers' => (int) ($row['consumers'] ?? 0),
                'pending' => (int) ($row['pending'] ?? 0),
                'last_delivered_id' => $row['last-delivered-id'] ?? null,
                'lag' => isset($row['lag']) ? (int) $row['lag'] : null,
            ];
        }
        return $out;
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function infoConsumers(string $group): array
    {
        try {
            $rows = $this->redis->xinfo('CONSUMERS', $this->streamKey, $group);
        } catch (ServerException $exc) {
            return [];
        }
        $out = [];
        foreach ((array) $rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $out[] = [
                'name' => (string) ($row['name'] ?? ''),
                'pending' => (int) ($row['pending'] ?? 0),
                'idle_ms' => (int) ($row['idle'] ?? 0),
            ];
        }
        return $out;
    }

    /**
     * Per-entry PEL view (id, consumer, idle, deliveries).
     *
     * @return list<array<string,mixed>>
     */
    public function pendingDetail(string $group, int $count = 20): array
    {
        try {
            $rows = $this->redis->xpending(
                $this->streamKey,
                $group,
                null,
                '-',
                '+',
                $count
            );
        } catch (ServerException $exc) {
            return [];
        }
        $out = [];
        foreach ((array) $rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $out[] = [
                'id' => (string) ($row[0] ?? ''),
                'consumer' => (string) ($row[1] ?? ''),
                'idle_ms' => (int) ($row[2] ?? 0),
                'deliveries' => (int) ($row[3] ?? 0),
            ];
        }
        return $out;
    }

    /**
     * Counters from Redis hash `demo:streaming:stats` plus the
     * per-consumer `processed`/`reaped`/`crashed_drops` sums.
     *
     * @return array<string,int>
     */
    public function stats(): array
    {
        $raw = $this->redis->hgetall(self::STATS_KEY);
        if (!is_array($raw)) {
            $raw = [];
        }
        return [
            'produced_total' => (int) ($raw['produced_total'] ?? 0),
            'acked_total' => (int) ($raw['acked_total'] ?? 0),
            'claimed_total' => (int) ($raw['claimed_total'] ?? 0),
        ];
    }

    public function resetStats(): void
    {
        $this->redis->del([self::STATS_KEY]);
    }

    /**
     * Drop the stream key entirely. Used by the demo's reset path.
     */
    public function deleteStream(): void
    {
        $this->redis->del([$this->streamKey]);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    /**
     * Flatten an XREADGROUP reply into a list of (id, fields_dict).
     *
     * The Predis wire shape is:
     *   [ [streamKey, [ [id, [k,v,k,v,...]], ... ]], ... ]
     *
     * @return list<array{0:string,1:array<string,string>}>
     */
    private static function flattenReadGroup($raw): array
    {
        if (!is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $perStream) {
            if (!is_array($perStream) || !isset($perStream[1])) {
                continue;
            }
            foreach ($perStream[1] as $entry) {
                if (!is_array($entry) || !isset($entry[0])) {
                    continue;
                }
                $id = (string) $entry[0];
                $fields = self::pairsToDict(is_array($entry[1] ?? null) ? $entry[1] : []);
                $out[] = [$id, $fields];
            }
        }
        return $out;
    }

    /**
     * Convert a flat [k,v,k,v,...] array (the wire shape of stream
     * entry fields) into an associative dict.
     *
     * @param array<int,mixed> $pairs
     * @return array<string,string>
     */
    private static function pairsToDict(array $pairs): array
    {
        $out = [];
        $count = count($pairs);
        for ($i = 0; $i + 1 < $count; $i += 2) {
            $out[(string) $pairs[$i]] = (string) $pairs[$i + 1];
        }
        return $out;
    }

    public static function nowMs(): int
    {
        return (int) round(microtime(true) * 1000);
    }

    // ------------------------------------------------------------------
    // Worker-state keys (used by ConsumerWorker + demo server)
    // ------------------------------------------------------------------

    public static function workerKey(string $group, string $name, string $suffix): string
    {
        return self::WORKER_KEY_PREFIX . ':' . $group . ':' . $name . ':' . $suffix;
    }
}
