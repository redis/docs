package leaderboard

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

// Config holds the RedisLeaderboard configuration.
type Config struct {
	Client     *redis.Client
	Key        string
	MaxEntries int
}

// Entry is a hydrated leaderboard entry with rank, score, and metadata.
type Entry struct {
	Rank           int               `json:"rank"`
	UserID         string            `json:"user_id"`
	Score          float64           `json:"score"`
	Metadata       map[string]string `json:"metadata"`
	TrimmedUserIDs []string          `json:"trimmed_user_ids,omitempty"`
}

// RedisLeaderboard stores leaderboard data in a sorted set and user metadata in hashes.
type RedisLeaderboard struct {
	client     *redis.Client
	key        string
	maxEntries int
}

// NewRedisLeaderboard creates a leaderboard with sane defaults.
func NewRedisLeaderboard(cfg Config) *RedisLeaderboard {
	key := cfg.Key
	if key == "" {
		key = "leaderboard:demo"
	}

	maxEntries := cfg.MaxEntries
	if maxEntries == 0 {
		maxEntries = 100
	}

	return &RedisLeaderboard{
		client:     cfg.Client,
		key:        key,
		maxEntries: maxEntries,
	}
}

func normalizePositiveInt(value int, fieldName string) (int, error) {
	if value < 1 {
		return 0, fmt.Errorf("%s must be at least 1", fieldName)
	}
	return value, nil
}

func max(a int, b int) int {
	if a > b {
		return a
	}
	return b
}

func (lb *RedisLeaderboard) metadataKey(userID string) string {
	return fmt.Sprintf("%s:user:%s", lb.key, userID)
}

func (lb *RedisLeaderboard) coerceMetadata(metadata map[string]string) map[string]string {
	if metadata == nil {
		return map[string]string{}
	}

	payload := make(map[string]string, len(metadata))
	for field, value := range metadata {
		payload[field] = value
	}
	return payload
}

func (lb *RedisLeaderboard) metadataPayload(metadata map[string]string) map[string]any {
	payload := make(map[string]any, len(metadata))
	for field, value := range metadata {
		payload[field] = value
	}
	return payload
}

func (lb *RedisLeaderboard) deleteMetadataForUsers(ctx context.Context, userIDs []string) error {
	if len(userIDs) == 0 {
		return nil
	}

	keys := make([]string, 0, len(userIDs))
	for _, userID := range userIDs {
		keys = append(keys, lb.metadataKey(userID))
	}

	return lb.client.Del(ctx, keys...).Err()
}

func (lb *RedisLeaderboard) hydrateEntries(
	ctx context.Context,
	entries []redis.Z,
	startRank int,
) ([]Entry, error) {
	if len(entries) == 0 {
		return []Entry{}, nil
	}

	pipe := lb.client.Pipeline()
	metadataCommands := make([]*redis.MapStringStringCmd, 0, len(entries))
	for _, entry := range entries {
		userID, _ := entry.Member.(string)
		metadataCommands = append(metadataCommands, pipe.HGetAll(ctx, lb.metadataKey(userID)))
	}

	if _, err := pipe.Exec(ctx); err != nil {
		return nil, fmt.Errorf("failed to load leaderboard metadata: %w", err)
	}

	hydratedEntries := make([]Entry, 0, len(entries))
	for index, entry := range entries {
		userID, _ := entry.Member.(string)
		metadata, err := metadataCommands[index].Result()
		if err != nil {
			return nil, fmt.Errorf("failed to read metadata for %s: %w", userID, err)
		}

		hydratedEntries = append(hydratedEntries, Entry{
			Rank:     startRank + index,
			UserID:   userID,
			Score:    entry.Score,
			Metadata: metadata,
		})
	}

	return hydratedEntries, nil
}

func (lb *RedisLeaderboard) trimToMaxEntries(ctx context.Context) ([]string, error) {
	size, err := lb.client.ZCard(ctx, lb.key).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard size: %w", err)
	}

	overflow := int(size) - lb.maxEntries
	if overflow <= 0 {
		return []string{}, nil
	}

	trimmedUserIDs, err := lb.client.ZRange(ctx, lb.key, 0, int64(overflow-1)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch trimmed user ids: %w", err)
	}
	if len(trimmedUserIDs) == 0 {
		return []string{}, nil
	}

	if err := lb.client.ZRemRangeByRank(ctx, lb.key, 0, int64(overflow-1)).Err(); err != nil {
		return nil, fmt.Errorf("failed to trim leaderboard: %w", err)
	}

	if err := lb.deleteMetadataForUsers(ctx, trimmedUserIDs); err != nil {
		return nil, err
	}

	return trimmedUserIDs, nil
}

// UpsertUser creates or updates a leaderboard entry and associated metadata.
func (lb *RedisLeaderboard) UpsertUser(
	ctx context.Context,
	userID string,
	score float64,
	metadata map[string]string,
) (*Entry, error) {
	payload := lb.coerceMetadata(metadata)

	pipe := lb.client.TxPipeline()
	pipe.ZAdd(ctx, lb.key, redis.Z{
		Score:  score,
		Member: userID,
	})
	if len(payload) > 0 {
		pipe.HSet(ctx, lb.metadataKey(userID), lb.metadataPayload(payload))
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, fmt.Errorf("failed to upsert leaderboard user: %w", err)
	}

	trimmedUserIDs, err := lb.trimToMaxEntries(ctx)
	if err != nil {
		return nil, err
	}

	entry, err := lb.GetUserEntry(ctx, userID)
	if err != nil {
		return nil, err
	}
	if entry == nil {
		return &Entry{
			UserID:         userID,
			Score:          score,
			Metadata:       payload,
			TrimmedUserIDs: trimmedUserIDs,
		}, nil
	}

	entry.TrimmedUserIDs = trimmedUserIDs
	return entry, nil
}

// IncrementScore increments a user's score and optionally updates metadata.
func (lb *RedisLeaderboard) IncrementScore(
	ctx context.Context,
	userID string,
	amount float64,
	metadata map[string]string,
) (*Entry, error) {
	payload := lb.coerceMetadata(metadata)

	pipe := lb.client.TxPipeline()
	incrCmd := pipe.ZIncrBy(ctx, lb.key, amount, userID)
	if len(payload) > 0 {
		pipe.HSet(ctx, lb.metadataKey(userID), lb.metadataPayload(payload))
	}
	if _, err := pipe.Exec(ctx); err != nil {
		return nil, fmt.Errorf("failed to increment leaderboard score: %w", err)
	}

	newScore, err := incrCmd.Result()
	if err != nil {
		return nil, fmt.Errorf("failed to read incremented score: %w", err)
	}

	trimmedUserIDs, err := lb.trimToMaxEntries(ctx)
	if err != nil {
		return nil, err
	}

	entry, err := lb.GetUserEntry(ctx, userID)
	if err != nil {
		return nil, err
	}
	if entry == nil {
		return &Entry{
			UserID:         userID,
			Score:          newScore,
			Metadata:       payload,
			TrimmedUserIDs: trimmedUserIDs,
		}, nil
	}

	entry.TrimmedUserIDs = trimmedUserIDs
	return entry, nil
}

// SetMaxEntries updates the leaderboard limit and trims immediately if needed.
func (lb *RedisLeaderboard) SetMaxEntries(ctx context.Context, maxEntries int) ([]string, error) {
	normalized, err := normalizePositiveInt(maxEntries, "maxEntries")
	if err != nil {
		return nil, err
	}

	lb.maxEntries = normalized
	return lb.trimToMaxEntries(ctx)
}

// GetTop returns the highest-ranked entries.
func (lb *RedisLeaderboard) GetTop(ctx context.Context, count int) ([]Entry, error) {
	normalized, err := normalizePositiveInt(count, "count")
	if err != nil {
		return nil, err
	}

	entries, err := lb.client.ZRevRangeWithScores(ctx, lb.key, 0, int64(normalized-1)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch top leaderboard entries: %w", err)
	}

	return lb.hydrateEntries(ctx, entries, 1)
}

// GetAroundRank returns entries centered around a 1-based rank.
func (lb *RedisLeaderboard) GetAroundRank(ctx context.Context, rank int, count int) ([]Entry, error) {
	normalizedRank, err := normalizePositiveInt(rank, "rank")
	if err != nil {
		return nil, err
	}
	normalizedCount, err := normalizePositiveInt(count, "count")
	if err != nil {
		return nil, err
	}

	totalEntries, err := lb.GetSize(ctx)
	if err != nil {
		return nil, err
	}
	if totalEntries == 0 {
		return []Entry{}, nil
	}
	if totalEntries <= int64(normalizedCount) {
		return lb.ListAll(ctx)
	}

	halfWindow := normalizedCount / 2
	start := max(0, normalizedRank-1-halfWindow)
	maxStart := int(totalEntries) - normalizedCount
	if start > maxStart {
		start = maxStart
	}
	end := start + normalizedCount - 1

	entries, err := lb.client.ZRevRangeWithScores(ctx, lb.key, int64(start), int64(end)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch leaderboard window: %w", err)
	}

	return lb.hydrateEntries(ctx, entries, start+1)
}

// GetRank returns a user's 1-based rank from the top.
func (lb *RedisLeaderboard) GetRank(ctx context.Context, userID string) (*int64, error) {
	rank, err := lb.client.ZRevRank(ctx, lb.key, userID).Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to fetch leaderboard rank: %w", err)
	}

	normalizedRank := rank + 1
	return &normalizedRank, nil
}

// GetUserMetadata returns stored metadata for a user ID.
func (lb *RedisLeaderboard) GetUserMetadata(ctx context.Context, userID string) (map[string]string, error) {
	metadata, err := lb.client.HGetAll(ctx, lb.metadataKey(userID)).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user metadata: %w", err)
	}
	return metadata, nil
}

// GetUserEntry returns a single leaderboard entry with score, rank, and metadata.
func (lb *RedisLeaderboard) GetUserEntry(ctx context.Context, userID string) (*Entry, error) {
	pipe := lb.client.Pipeline()
	scoreCmd := pipe.ZScore(ctx, lb.key, userID)
	rankCmd := pipe.ZRevRank(ctx, lb.key, userID)
	metadataCmd := pipe.HGetAll(ctx, lb.metadataKey(userID))
	if _, err := pipe.Exec(ctx); err != nil && err != redis.Nil {
		return nil, fmt.Errorf("failed to fetch user entry: %w", err)
	}

	score, err := scoreCmd.Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to read user score: %w", err)
	}

	rank, err := rankCmd.Result()
	if err == redis.Nil {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to read user rank: %w", err)
	}

	metadata, err := metadataCmd.Result()
	if err != nil {
		return nil, fmt.Errorf("failed to read user metadata: %w", err)
	}

	return &Entry{
		Rank:     int(rank) + 1,
		UserID:   userID,
		Score:    score,
		Metadata: metadata,
	}, nil
}

// ListAll returns the full leaderboard from highest to lowest score.
func (lb *RedisLeaderboard) ListAll(ctx context.Context) ([]Entry, error) {
	entries, err := lb.client.ZRevRangeWithScores(ctx, lb.key, 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to list leaderboard: %w", err)
	}

	return lb.hydrateEntries(ctx, entries, 1)
}

// GetSize returns the number of entries currently on the leaderboard.
func (lb *RedisLeaderboard) GetSize(ctx context.Context) (int64, error) {
	size, err := lb.client.ZCard(ctx, lb.key).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to fetch leaderboard size: %w", err)
	}
	return size, nil
}

// DeleteUser removes a user from the leaderboard and deletes their metadata.
func (lb *RedisLeaderboard) DeleteUser(ctx context.Context, userID string) (bool, error) {
	pipe := lb.client.TxPipeline()
	zremCmd := pipe.ZRem(ctx, lb.key, userID)
	pipe.Del(ctx, lb.metadataKey(userID))
	if _, err := pipe.Exec(ctx); err != nil {
		return false, fmt.Errorf("failed to delete leaderboard user: %w", err)
	}

	removedCount, err := zremCmd.Result()
	if err != nil {
		return false, fmt.Errorf("failed to read delete result: %w", err)
	}

	return removedCount == 1, nil
}

// Clear removes all leaderboard scores and metadata for this leaderboard.
func (lb *RedisLeaderboard) Clear(ctx context.Context) error {
	userIDs, err := lb.client.ZRange(ctx, lb.key, 0, -1).Result()
	if err != nil {
		return fmt.Errorf("failed to fetch leaderboard members for clear: %w", err)
	}

	keys := make([]string, 0, len(userIDs)+1)
	keys = append(keys, lb.key)
	for _, userID := range userIDs {
		keys = append(keys, lb.metadataKey(userID))
	}

	return lb.client.Del(ctx, keys...).Err()
}
