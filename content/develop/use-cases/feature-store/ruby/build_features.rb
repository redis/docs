# Synthesize a small batch of users with realistic-looking features
# and bulk-load them into Redis with a 24-hour key-level TTL.
#
# Stands in for the nightly Spark / Feast materialization job in a
# real deployment. In production the equivalent of this script lives
# in an offline pipeline that reads from the offline store and writes
# the serving-time hashes into Redis via HSET + EXPIRE.

require 'optparse'
require 'redis'
require_relative 'feature_store'

COUNTRY_CHOICES = %w[US GB DE FR IN BR JP AU CA NL].freeze
RISK_SEGMENTS = %w[low medium high].freeze
RISK_WEIGHTS = [70, 25, 5].freeze
CHARGEBACK_BUCKETS = [0, 1, 2, 3].freeze
CHARGEBACK_WEIGHTS = [85, 10, 4, 1].freeze

# Generate `count` synthetic user feature rows. The shape mirrors a
# small fraud-scoring feature set.
def synthesize_users(count, seed = 42)
  rng = Random.new(seed)
  users = {}
  (1..count).each do |i|
    uid = format('u%04d', i)
    users[uid] = {
      'country_iso' => COUNTRY_CHOICES.sample(random: rng),
      'risk_segment' => weighted_str(rng, RISK_SEGMENTS, RISK_WEIGHTS),
      'account_age_days' => rng.rand(7..2400),
      'tx_count_7d' => rng.rand(0..80),
      'avg_amount_30d' => (rng.rand(5.0..350.0) * 100).round / 100.0,
      'chargeback_count_180d' => weighted_int(rng, CHARGEBACK_BUCKETS, CHARGEBACK_WEIGHTS),
    }
  end
  users
end

def weighted_str(rng, items, weights)
  total = weights.sum
  r = rng.rand(total)
  items.each_with_index do |item, i|
    r -= weights[i]
    return item if r < 0
  end
  items.last
end

def weighted_int(rng, items, weights)
  total = weights.sum
  r = rng.rand(total)
  items.each_with_index do |item, i|
    r -= weights[i]
    return item if r < 0
  end
  items.last
end

# CLI entry point.
def build_features_main(argv = ARGV)
  redis_url = 'redis://localhost:6379'
  count = 200
  ttl_seconds = 24 * 60 * 60
  key_prefix = 'fs:user:'
  seed = 42

  OptionParser.new do |opts|
    opts.banner = 'Usage: ruby build_features.rb [options]'
    opts.on('--redis-url URL') { |v| redis_url = v }
    opts.on('--count N', Integer) { |v| count = v }
    opts.on('--ttl-seconds S', Integer) { |v| ttl_seconds = v }
    opts.on('--key-prefix PREFIX') { |v| key_prefix = v }
    opts.on('--seed N', Integer) { |v| seed = v }
    opts.on('-h', '--help') do
      puts opts
      exit
    end
  end.parse!(argv)

  redis = Redis.new(url: redis_url)
  store = FeatureStore.new(redis: redis, key_prefix: key_prefix,
                           batch_ttl_seconds: ttl_seconds)
  rows = synthesize_users(count, seed)
  loaded = store.bulk_load(rows, ttl_seconds: ttl_seconds)
  puts "Materialized #{loaded} users at #{key_prefix}* with a #{ttl_seconds}s key-level TTL."
ensure
  redis&.close
end

build_features_main if $PROGRAM_NAME == __FILE__
