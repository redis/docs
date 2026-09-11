<?php
// Append-only event log for an agent thread, backed by a Redis Stream.
//
// Each thread gets a stream at `agent:events:{thread_id}`. Every
// action the agent takes (a user turn arriving, a memory being
// recalled, a memory being written, a tool being called) is one
// `XADD` to that stream. Replay with `XREVRANGE` for the most recent
// N events; bound retention with `XADD MAXLEN ~` so the log stays
// cheap regardless of how long the thread has been running.
//
// The stream is independent of the session Hash (`AgentSession.php`)
// and the long-term memory store (`LongTermMemory.php`): it answers
// the "what just happened" question without competing with either of
// those for indexing or memory budget. Consumer groups (not used in
// this demo) would let downstream workers — summarizers,
// consolidators, audit pipelines — replay the log without losing
// position.

declare(strict_types=1);

namespace Redis\AgentMemory;

use Predis\Client;

class AgentEventLog
{
    // Approximate cap on stream length. `MAXLEN ~` lets Redis trim
    // in whole-node units instead of exactly-N units, which is much
    // cheaper at the cost of overshooting the bound by up to a
    // node's worth.
    public const DEFAULT_MAXLEN = 1000;

    public readonly Client $client;
    public readonly string $keyPrefix;
    public readonly int $maxLen;

    public function __construct(
        Client $client,
        string $keyPrefix = 'agent:events:',
        int $maxLen = self::DEFAULT_MAXLEN,
    ) {
        $this->client = $client;
        $this->keyPrefix = $keyPrefix;
        $this->maxLen = $maxLen;
    }

    public function streamKey(string $threadId): string
    {
        return $this->keyPrefix . $threadId;
    }

    /**
     * Append one event and return its stream id.
     *
     * `MAXLEN ~ N` keeps the stream bounded with near-zero overhead;
     * an exact bound (`MAXLEN N` without the tilde) forces a scan
     * and is rarely worth the cost.
     */
    public function record(
        string $threadId,
        string $action,
        string $detail = '',
    ): string {
        return (string) $this->client->xadd(
            $this->streamKey($threadId),
            [
                'action' => $action,
                'detail' => $detail,
                'ts' => (string) microtime(true),
            ],
            '*',
            ['trim' => ['MAXLEN', '~', $this->maxLen]],
        );
    }

    /**
     * Return the most recent events, newest first.
     *
     * @return list<array<string,mixed>>
     */
    public function recent(string $threadId, int $count = 20): array
    {
        $rows = $this->client->xrevrange(
            $this->streamKey($threadId), '+', '-', $count,
        );
        $out = [];
        foreach ($rows as $entryId => $fields) {
            // Predis returns an associative array of [streamId =>
            // [field => value, ...]] for XREVRANGE. Older releases
            // emit the wire-format pair instead; handle either.
            if (is_array($fields) && is_string($entryId)) {
                $data = $fields;
                $id = $entryId;
            } else {
                [$id, $data] = $fields;
            }
            $out[] = [
                'event_id' => $id,
                'thread_id' => $threadId,
                'action' => $data['action'] ?? '',
                'detail' => $data['detail'] ?? '',
                'ts' => (float) ($data['ts'] ?? 0),
            ];
        }
        return $out;
    }

    public function length(string $threadId): int
    {
        return (int) $this->client->xlen($this->streamKey($threadId));
    }

    public function clear(string $threadId): bool
    {
        return ((int) $this->client->del($this->streamKey($threadId))) > 0;
    }
}
