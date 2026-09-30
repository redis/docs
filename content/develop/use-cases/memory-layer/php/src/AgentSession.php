<?php
// Working-memory store for an agent session, backed by a Redis Hash.
//
// Each session is one Hash document at `agent:session:{thread_id}`.
// The hash holds the running scratchpad, the current goal, a rolling
// window of recent turns (serialized as a JSON list to fit in one
// field), and a few audit fields. One `HGETALL` returns the whole
// session in a single round trip on every step of the agent loop.
//
// Every write refreshes the key's TTL with `EXPIRE`, so idle sessions
// fall off without a separate cleanup job and active sessions stay
// alive as long as the agent keeps touching them. A separate
// `LongTermMemory` (see `LongTermMemory.php`) is what survives
// beyond a session's TTL.
//
// The turn window is bounded to `maxTurns` in application code; the
// hash itself doesn't grow, so the working set per thread stays
// constant regardless of how long the agent has been running.

declare(strict_types=1);

namespace Redis\AgentMemory;

use Predis\Client;

class AgentSession
{
    public const MAX_TURNS = 20;

    public readonly Client $client;
    public readonly string $keyPrefix;
    public readonly int $defaultTtlSeconds;
    public readonly int $maxTurns;

    public function __construct(
        Client $client,
        string $keyPrefix = 'agent:session:',
        int $defaultTtlSeconds = 3600,
        int $maxTurns = self::MAX_TURNS,
    ) {
        $this->client = $client;
        $this->keyPrefix = $keyPrefix;
        $this->defaultTtlSeconds = $defaultTtlSeconds;
        $this->maxTurns = $maxTurns;
    }

    public function sessionKey(string $threadId): string
    {
        return $this->keyPrefix . $threadId;
    }

    public function newThreadId(): string
    {
        return substr(bin2hex(random_bytes(6)), 0, 12);
    }

    /**
     * Create a fresh working memory for a thread. Overwrites any
     * existing session at the same key. The agent normally calls
     * this once per thread at the first turn and relies on `load` /
     * `appendTurn` for subsequent steps.
     *
     * @return array<string,mixed>
     */
    public function start(
        string $threadId,
        string $user = 'default',
        string $agent = 'default',
        string $goal = '',
        ?int $ttlSeconds = null,
    ): array {
        $ttl = $ttlSeconds ?? $this->defaultTtlSeconds;
        $now = microtime(true);
        $state = [
            'thread_id' => $threadId,
            'user' => $user,
            'agent' => $agent,
            'goal' => $goal,
            'scratchpad' => '',
            'turn_count' => 0,
            'created_ts' => $now,
            'last_active_ts' => $now,
            'recent_turns' => [],
            'ttl_seconds' => $ttl,
        ];
        $this->write($state, $ttl);
        return $state;
    }

    /**
     * Return the session state, or `null` if it has expired.
     *
     * @return array<string,mixed>|null
     */
    public function load(string $threadId): ?array
    {
        $key = $this->sessionKey($threadId);
        $raw = $this->client->hgetall($key);
        if (!$raw) {
            return null;
        }
        $ttl = (int) $this->client->ttl($key);
        $turnsBlob = $raw['recent_turns'] ?? '[]';
        $turns = json_decode($turnsBlob, true);
        if (!is_array($turns)) {
            $turns = [];
        }
        return [
            'thread_id' => $threadId,
            'user' => $raw['user'] ?? 'default',
            'agent' => $raw['agent'] ?? 'default',
            'goal' => $raw['goal'] ?? '',
            'scratchpad' => $raw['scratchpad'] ?? '',
            'turn_count' => (int) ($raw['turn_count'] ?? 0),
            'created_ts' => (float) ($raw['created_ts'] ?? 0),
            'last_active_ts' => (float) ($raw['last_active_ts'] ?? 0),
            'recent_turns' => $turns,
            'ttl_seconds' => $ttl > 0 ? $ttl : 0,
        ];
    }

    /**
     * Append a turn, bound the rolling window, refresh the TTL.
     *
     * `user` and `agent` are only consulted when the session does
     * not yet exist — they seed the auto-created session so the
     * working-memory hash matches the user the caller is operating
     * against. On an existing session they're ignored; the original
     * `start` values stand.
     *
     * Read-modify-write here is last-writer-wins on the turn list if
     * two concurrent turns reach the same thread; the demo never
     * triggers that race in practice (one browser, one turn at a
     * time) but a multi-worker agent that shares a thread id would
     * wrap this in `WATCH` / `MULTI` / `EXEC` or a Lua script that
     * does the append atomically server-side.
     *
     * @return array<string,mixed>
     */
    public function appendTurn(
        string $threadId,
        string $role,
        string $content,
        ?string $user = null,
        ?string $agent = null,
        ?int $ttlSeconds = null,
    ): array {
        $state = $this->load($threadId);
        if ($state === null) {
            $state = $this->start(
                $threadId,
                user: $user ?? 'default',
                agent: $agent ?? 'default',
                ttlSeconds: $ttlSeconds,
            );
        }
        $state['recent_turns'][] = [
            'role' => $role,
            'content' => $content,
            'ts' => microtime(true),
        ];
        if (count($state['recent_turns']) > $this->maxTurns) {
            $state['recent_turns'] = array_slice(
                $state['recent_turns'], -$this->maxTurns,
            );
        }
        $state['turn_count'] = ((int) $state['turn_count']) + 1;
        $state['last_active_ts'] = microtime(true);
        $ttl = $ttlSeconds ?? $this->defaultTtlSeconds;
        $state['ttl_seconds'] = $ttl;
        $this->write($state, $ttl);
        return $state;
    }

    /**
     * Update the agent's running scratchpad and refresh TTL.
     *
     * @return array<string,mixed>|null
     */
    public function setScratchpad(
        string $threadId,
        string $text,
        ?int $ttlSeconds = null,
    ): ?array {
        $state = $this->load($threadId);
        if ($state === null) {
            return null;
        }
        $state['scratchpad'] = $text;
        $state['last_active_ts'] = microtime(true);
        $ttl = $ttlSeconds ?? $this->defaultTtlSeconds;
        $state['ttl_seconds'] = $ttl;
        $this->write($state, $ttl);
        return $state;
    }

    /**
     * Update the goal field without touching turns or the scratchpad.
     *
     * Creates the session if it doesn't exist yet — setting a goal
     * on a fresh thread is a sensible first step in the agent loop,
     * so this method covers both the "rename the goal mid-session"
     * and the "start a thread with this goal" cases.
     *
     * @return array<string,mixed>
     */
    public function setGoal(
        string $threadId,
        string $text,
        ?string $user = null,
        ?string $agent = null,
        ?int $ttlSeconds = null,
    ): array {
        $state = $this->load($threadId);
        if ($state === null) {
            return $this->start(
                $threadId,
                user: $user ?? 'default',
                agent: $agent ?? 'default',
                goal: $text,
                ttlSeconds: $ttlSeconds,
            );
        }
        $state['goal'] = $text;
        $state['last_active_ts'] = microtime(true);
        $ttl = $ttlSeconds ?? $this->defaultTtlSeconds;
        $state['ttl_seconds'] = $ttl;
        $this->write($state, $ttl);
        return $state;
    }

    public function delete(string $threadId): bool
    {
        return ((int) $this->client->del($this->sessionKey($threadId))) > 0;
    }

    /**
     * @param array<string,mixed> $state
     */
    private function write(array $state, int $ttl): void
    {
        $key = $this->sessionKey($state['thread_id']);
        $mapping = [
            'thread_id' => $state['thread_id'],
            'user' => $state['user'],
            'agent' => $state['agent'],
            'goal' => $state['goal'],
            'scratchpad' => $state['scratchpad'],
            'turn_count' => (string) $state['turn_count'],
            'created_ts' => (string) $state['created_ts'],
            'last_active_ts' => (string) $state['last_active_ts'],
            'recent_turns' => json_encode(
                $state['recent_turns'], JSON_UNESCAPED_SLASHES,
            ),
        ];
        // Predis HSET takes positional field/value arguments, not
        // an associative array — flatten the mapping into the order
        // Redis expects on the wire.
        $hsetArgs = [$key];
        foreach ($mapping as $k => $v) {
            $hsetArgs[] = $k;
            $hsetArgs[] = $v;
        }
        // MULTI/EXEC so HSET and EXPIRE either both apply or neither
        // does. A connection drop between the two writes would
        // otherwise leave the session without a TTL.
        $this->client->transaction(
            function ($tx) use ($hsetArgs, $key, $ttl) {
                $tx->hset(...$hsetArgs);
                $tx->expire($key, $ttl);
            },
        );
    }
}
