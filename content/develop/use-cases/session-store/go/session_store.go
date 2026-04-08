// Package sessionstore provides a Redis-backed session store for Go web applications.
//
// It stores session data in Redis hashes and uses key expiration to remove
// inactive sessions automatically.
package sessionstore

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

var reservedSessionFields = map[string]bool{
	"created_at":       true,
	"last_accessed_at": true,
	"session_ttl":      true,
}

// SessionStoreConfig holds Redis session store configuration.
type SessionStoreConfig struct {
	// Client is the Redis client to use. Required.
	Client *redis.Client

	// Prefix is the key prefix used for session keys. Default: "session:"
	Prefix string

	// TTL is the default session TTL in seconds. Default: 1800
	TTL int
}

// RedisSessionStore stores session data in Redis hashes.
type RedisSessionStore struct {
	client *redis.Client
	prefix string
	ttl    int
}

// NewRedisSessionStore creates a new RedisSessionStore.
func NewRedisSessionStore(cfg SessionStoreConfig) *RedisSessionStore {
	if cfg.Client == nil {
		panic("sessionstore: Client is required")
	}
	if cfg.Prefix == "" {
		cfg.Prefix = "session:"
	}
	if cfg.TTL == 0 {
		cfg.TTL = 1800
	}

	store := &RedisSessionStore{
		client: cfg.Client,
		prefix: cfg.Prefix,
		ttl:    cfg.TTL,
	}

	if _, err := store.normalizeTTL(cfg.TTL); err != nil {
		panic(err)
	}

	return store
}

func (s *RedisSessionStore) normalizeTTL(ttl int) (int, error) {
	value := ttl
	if value == 0 {
		value = s.ttl
	}
	if value < 1 {
		return 0, errors.New("TTL must be at least 1 second")
	}
	return value, nil
}

func (s *RedisSessionStore) normalizeTTLString(value string) (int, error) {
	ttl, err := strconv.Atoi(value)
	if err != nil {
		return 0, err
	}
	return s.normalizeTTL(ttl)
}

func (s *RedisSessionStore) sessionKey(sessionID string) string {
	return s.prefix + sessionID
}

func (s *RedisSessionStore) timestamp() string {
	return time.Now().UTC().Format("2006-01-02T15:04:05+00:00")
}

func isValidSession(session map[string]string) bool {
	if len(session) == 0 {
		return false
	}

	for field := range reservedSessionFields {
		if _, ok := session[field]; !ok {
			return false
		}
	}

	return true
}

func randomSessionID() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

// CreateSession creates a new session and returns its opaque session ID.
func (s *RedisSessionStore) CreateSession(
	ctx context.Context,
	data map[string]string,
	ttl int,
) (string, error) {
	sessionID, err := randomSessionID()
	if err != nil {
		return "", err
	}

	key := s.sessionKey(sessionID)
	now := s.timestamp()
	sessionTTL, err := s.normalizeTTL(ttl)
	if err != nil {
		return "", err
	}

	payload := map[string]string{
		"created_at":       now,
		"last_accessed_at": now,
		"session_ttl":      strconv.Itoa(sessionTTL),
	}

	for field, value := range data {
		if !reservedSessionFields[field] {
			payload[field] = value
		}
	}

	pipe := s.client.TxPipeline()
	pipe.HSet(ctx, key, payload)
	pipe.Expire(ctx, key, time.Duration(sessionTTL)*time.Second)
	_, err = pipe.Exec(ctx)
	if err != nil {
		return "", err
	}

	return sessionID, nil
}

// GetConfiguredTTL returns the configured TTL for a session.
func (s *RedisSessionStore) GetConfiguredTTL(
	ctx context.Context,
	sessionID string,
) (int, bool, error) {
	storedTTL, err := s.client.HGet(ctx, s.sessionKey(sessionID), "session_ttl").Result()
	if err == redis.Nil {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}

	ttl, err := s.normalizeTTLString(storedTTL)
	if err != nil {
		return 0, false, err
	}

	return ttl, true, nil
}

// GetSession returns session data for a session ID.
func (s *RedisSessionStore) GetSession(
	ctx context.Context,
	sessionID string,
	refreshTTL bool,
) (map[string]string, bool, error) {
	key := s.sessionKey(sessionID)
	session, err := s.client.HGetAll(ctx, key).Result()
	if err != nil {
		return nil, false, err
	}
	if !isValidSession(session) {
		return nil, false, nil
	}

	if !refreshTTL {
		return session, true, nil
	}

	sessionTTL, err := s.normalizeTTLString(session["session_ttl"])
	if err != nil {
		return nil, false, err
	}

	pipe := s.client.TxPipeline()
	pipe.HSet(ctx, key, map[string]string{"last_accessed_at": s.timestamp()})
	pipe.Expire(ctx, key, time.Duration(sessionTTL)*time.Second)
	getCmd := pipe.HGetAll(ctx, key)
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, false, err
	}

	refreshed := getCmd.Val()
	if !isValidSession(refreshed) {
		return nil, false, nil
	}

	return refreshed, true, nil
}

// UpdateSession updates session fields and refreshes the TTL.
func (s *RedisSessionStore) UpdateSession(
	ctx context.Context,
	sessionID string,
	data map[string]string,
) (bool, error) {
	key := s.sessionKey(sessionID)
	session, err := s.client.HGetAll(ctx, key).Result()
	if err != nil {
		return false, err
	}
	if !isValidSession(session) {
		return false, nil
	}

	payload := map[string]string{}
	for field, value := range data {
		if !reservedSessionFields[field] {
			payload[field] = value
		}
	}

	if len(payload) == 0 {
		return true, nil
	}

	sessionTTL, err := s.normalizeTTLString(session["session_ttl"])
	if err != nil {
		return false, err
	}
	payload["last_accessed_at"] = s.timestamp()

	pipe := s.client.TxPipeline()
	pipe.HSet(ctx, key, payload)
	pipe.Expire(ctx, key, time.Duration(sessionTTL)*time.Second)
	_, err = pipe.Exec(ctx)
	return err == nil, err
}

// IncrementField increments a numeric session field and refreshes the TTL.
func (s *RedisSessionStore) IncrementField(
	ctx context.Context,
	sessionID, field string,
	amount int64,
) (int64, bool, error) {
	key := s.sessionKey(sessionID)
	session, err := s.client.HGetAll(ctx, key).Result()
	if err != nil {
		return 0, false, err
	}
	if !isValidSession(session) {
		return 0, false, nil
	}

	sessionTTL, err := s.normalizeTTLString(session["session_ttl"])
	if err != nil {
		return 0, false, err
	}

	pipe := s.client.TxPipeline()
	incrCmd := pipe.HIncrBy(ctx, key, field, amount)
	pipe.HSet(ctx, key, map[string]string{"last_accessed_at": s.timestamp()})
	pipe.Expire(ctx, key, time.Duration(sessionTTL)*time.Second)
	if _, err := pipe.Exec(ctx); err != nil {
		return 0, false, err
	}

	return incrCmd.Val(), true, nil
}

// SetSessionTTL updates the configured TTL for a session and applies it immediately.
func (s *RedisSessionStore) SetSessionTTL(
	ctx context.Context,
	sessionID string,
	ttl int,
) (bool, error) {
	key := s.sessionKey(sessionID)
	session, err := s.client.HGetAll(ctx, key).Result()
	if err != nil {
		return false, err
	}
	if !isValidSession(session) {
		return false, nil
	}

	sessionTTL, err := s.normalizeTTL(ttl)
	if err != nil {
		return false, err
	}

	pipe := s.client.TxPipeline()
	pipe.HSet(ctx, key, map[string]string{
		"session_ttl":      strconv.Itoa(sessionTTL),
		"last_accessed_at": s.timestamp(),
	})
	pipe.Expire(ctx, key, time.Duration(sessionTTL)*time.Second)
	_, err = pipe.Exec(ctx)
	return err == nil, err
}

// DeleteSession deletes a session from Redis.
func (s *RedisSessionStore) DeleteSession(
	ctx context.Context,
	sessionID string,
) (bool, error) {
	deleted, err := s.client.Del(ctx, s.sessionKey(sessionID)).Result()
	if err != nil {
		return false, err
	}
	return deleted == 1, nil
}

// GetTTL returns the remaining TTL for a session in whole seconds.
func (s *RedisSessionStore) GetTTL(ctx context.Context, sessionID string) (int, error) {
	ttl, err := s.client.TTL(ctx, s.sessionKey(sessionID)).Result()
	if err != nil {
		return 0, err
	}
	return int(ttl.Seconds()), nil
}
