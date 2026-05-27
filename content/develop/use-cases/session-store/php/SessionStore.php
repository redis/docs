<?php

use Predis\Client as PredisClient;

class RedisSessionStore
{
    private const RESERVED_SESSION_FIELDS = [
        'created_at',
        'last_accessed_at',
        'session_ttl',
    ];

    private PredisClient $redis;
    private string $prefix;
    private int $ttl;

    public function __construct(
        ?PredisClient $redis = null,
        string $prefix = 'session:',
        int $ttl = 1800
    ) {
        $this->redis = $redis ?? new PredisClient([
            'host' => '127.0.0.1',
            'port' => 6379,
        ]);
        $this->prefix = $prefix !== '' ? $prefix : 'session:';
        $this->ttl = $this->normalizeTtl($ttl);
    }

    public function createSession(array $data = [], ?int $ttl = null): string
    {
        $sessionId = $this->createSessionId();
        $key = $this->sessionKey($sessionId);
        $now = $this->timestamp();
        $sessionTtl = $this->normalizeTtl($ttl);

        $payload = [];
        foreach ($data as $field => $value) {
            if (!in_array($field, self::RESERVED_SESSION_FIELDS, true)) {
                $payload[$field] = (string) $value;
            }
        }

        $payload['created_at'] = $now;
        $payload['last_accessed_at'] = $now;
        $payload['session_ttl'] = (string) $sessionTtl;

        $this->redis->pipeline(function ($pipe) use ($key, $payload, $sessionTtl): void {
            $pipe->hset($key, $payload);
            $pipe->expire($key, $sessionTtl);
        });

        return $sessionId;
    }

    public function getConfiguredTtl(string $sessionId): ?int
    {
        $storedTtl = $this->redis->hget($this->sessionKey($sessionId), 'session_ttl');
        if ($storedTtl === null) {
            return null;
        }

        return $this->normalizeTtl((int) $storedTtl);
    }

    public function getSession(string $sessionId, bool $refreshTtl = true): ?array
    {
        $key = $this->sessionKey($sessionId);
        $session = $this->redis->hgetall($key);
        if (!$this->isValidSession($session)) {
            return null;
        }

        if (!$refreshTtl) {
            return $session;
        }

        $sessionTtl = $this->normalizeTtl((int) $session['session_ttl']);
        $result = $this->redis->pipeline(function ($pipe) use ($key, $sessionTtl): void {
            $pipe->hset($key, 'last_accessed_at', $this->timestamp());
            $pipe->expire($key, $sessionTtl);
            $pipe->hgetall($key);
        });

        $refreshed = $result[2] ?? [];
        return $this->isValidSession($refreshed) ? $refreshed : null;
    }

    public function updateSession(string $sessionId, array $data): bool
    {
        $key = $this->sessionKey($sessionId);
        $session = $this->redis->hgetall($key);
        if (!$this->isValidSession($session)) {
            return false;
        }

        $payload = [];
        foreach ($data as $field => $value) {
            if (!in_array($field, self::RESERVED_SESSION_FIELDS, true)) {
                $payload[$field] = (string) $value;
            }
        }

        if ($payload === []) {
            return true;
        }

        $sessionTtl = $this->normalizeTtl((int) $session['session_ttl']);
        $payload['last_accessed_at'] = $this->timestamp();

        $this->redis->pipeline(function ($pipe) use ($key, $payload, $sessionTtl): void {
            $pipe->hset($key, $payload);
            $pipe->expire($key, $sessionTtl);
        });

        return true;
    }

    public function incrementField(string $sessionId, string $field, int $amount = 1): ?int
    {
        $key = $this->sessionKey($sessionId);
        $session = $this->redis->hgetall($key);
        if (!$this->isValidSession($session)) {
            return null;
        }

        $sessionTtl = $this->normalizeTtl((int) $session['session_ttl']);
        $result = $this->redis->pipeline(function ($pipe) use ($key, $field, $amount, $sessionTtl): void {
            $pipe->hincrby($key, $field, $amount);
            $pipe->hset($key, 'last_accessed_at', $this->timestamp());
            $pipe->expire($key, $sessionTtl);
        });

        return isset($result[0]) ? (int) $result[0] : null;
    }

    public function setSessionTtl(string $sessionId, int $ttl): bool
    {
        $key = $this->sessionKey($sessionId);
        $session = $this->redis->hgetall($key);
        if (!$this->isValidSession($session)) {
            return false;
        }

        $sessionTtl = $this->normalizeTtl($ttl);

        $this->redis->pipeline(function ($pipe) use ($key, $sessionTtl): void {
            $pipe->hset($key, [
                'session_ttl' => (string) $sessionTtl,
                'last_accessed_at' => $this->timestamp(),
            ]);
            $pipe->expire($key, $sessionTtl);
        });

        return true;
    }

    public function deleteSession(string $sessionId): bool
    {
        return (int) $this->redis->del([$this->sessionKey($sessionId)]) === 1;
    }

    public function getTtl(string $sessionId): int
    {
        return (int) $this->redis->ttl($this->sessionKey($sessionId));
    }

    private function normalizeTtl(?int $ttl): int
    {
        $value = $ttl ?? $this->ttl;
        if ($value < 1) {
            throw new InvalidArgumentException('TTL must be at least 1 second');
        }

        return $value;
    }

    private function sessionKey(string $sessionId): string
    {
        return $this->prefix . $sessionId;
    }

    private function timestamp(): string
    {
        return gmdate('Y-m-d\TH:i:s+00:00');
    }

    private function createSessionId(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    private function isValidSession(array $session): bool
    {
        if ($session === []) {
            return false;
        }

        foreach (self::RESERVED_SESSION_FIELDS as $field) {
            if (!array_key_exists($field, $session)) {
                return false;
            }
        }

        return true;
    }
}
