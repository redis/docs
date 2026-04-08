import { readFileSync } from "fs";
import { resolve } from "path";
import {
  ExtractSignaturesInputSchema,
  ExtractSignaturesOutput,
  SignatureSchema,
} from "./schemas.js";
import { parsePythonSignatures } from "../parsers/python-parser.js";
import { parsePythonDocComments } from "../parsers/python-doc-parser.js";
import { parseJavaSignatures, parseJavaDocComments } from "../parsers/java-parser.js";
import { parseGoSignatures, parseGoDocComments } from "../parsers/go-parser.js";
import { parseTypeScriptSignatures, parseTypeScriptDocComments } from "../parsers/typescript-parser.js";
import { parseRustSignatures, parseRustDocComments } from "../parsers/rust-parser.js";
import { parseCSharpSignatures, parseCSharpDocComments } from "../parsers/csharp-parser.js";
import { parsePHPSignatures, parsePHPDocComments } from "../parsers/php-parser.js";
import { getClientById } from "../data/components-access.js";

/**
 * External source configuration for fetching files from external repositories
 */
interface ExternalSource {
  git_uri: string;
  paths: string[];
}

/**
 * Client source file configuration
 */
interface ClientSourceConfig {
  paths: string[];
  language: string;
  /** External repositories to also fetch source files from */
  externalSources?: ExternalSource[];
}

/**
 * Mapping of client IDs to their source file paths in their GitHub repos.
 * These are the files containing the Redis command method definitions.
 * Some clients have commands split across multiple files, so we use an array.
 *
 * For clients that depend on external libraries (like NRedisStack depending on
 * StackExchange.Redis), use the `externalSources` field to specify additional
 * repositories to fetch from.
 */
const CLIENT_SOURCE_FILES: Record<string, ClientSourceConfig> = {
  // Python - includes JSON, Search, TimeSeries, and VectorSet module commands
  'redis_py': {
    paths: [
      'redis/commands/core.py',
      'redis/commands/json/commands.py',  // JSON commands
      'redis/commands/search/commands.py',  // Search/FT commands
      'redis/commands/vectorset/commands.py',  // Vector set commands
      'redis/commands/timeseries/commands.py',  // Time series commands
    ],
    language: 'python'
  },
  'redisvl': { paths: ['redisvl/redis/connection.py'], language: 'python' },

  // Java - Jedis has commands split across interface files
  'jedis': {
    paths: [
      'src/main/java/redis/clients/jedis/Jedis.java',
      'src/main/java/redis/clients/jedis/commands/ListCommands.java',  // List commands interface
      'src/main/java/redis/clients/jedis/commands/StreamCommands.java',  // Stream commands interface
      'src/main/java/redis/clients/jedis/commands/VectorSetCommands.java',  // Vector set commands interface
      'src/main/java/redis/clients/jedis/commands/GeoCommands.java',  // Geo commands interface
      'src/main/java/redis/clients/jedis/json/commands/RedisJsonV1Commands.java',  // JSON V1 interface
      'src/main/java/redis/clients/jedis/json/commands/RedisJsonV2Commands.java',  // JSON V2 interface
      'src/main/java/redis/clients/jedis/search/RediSearchCommands.java',  // Search/FT commands interface
      'src/main/java/redis/clients/jedis/timeseries/RedisTimeSeriesCommands.java',  // Time series commands
    ],
    language: 'java'
  },
  'lettuce_sync': {
    paths: [
      'src/main/java/io/lettuce/core/api/sync/RedisStringCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisKeyCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisListCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisHashCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisSetCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisSortedSetCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisGeoCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisHLLCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisStreamCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisScriptingCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisServerCommands.java',
      'src/main/java/io/lettuce/core/api/sync/RedisJsonCommands.java',  // JSON commands
      'src/main/java/io/lettuce/core/api/sync/RedisSearchCommands.java',  // Search/FT commands
      'src/main/java/io/lettuce/core/api/sync/RedisVectorSetCommands.java',  // Vector set commands
      'src/main/java/io/lettuce/core/AbstractRedisAsyncCommands.java',  // Cluster commands
    ],
    language: 'java',
  },
  'lettuce_async': {
    paths: [
      'src/main/java/io/lettuce/core/api/async/RedisStringAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisKeyAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisListAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisHashAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisSetAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisSortedSetAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisGeoAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisHLLAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisStreamAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisScriptingAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisServerAsyncCommands.java',
      'src/main/java/io/lettuce/core/api/async/RedisJsonAsyncCommands.java',  // JSON commands
      'src/main/java/io/lettuce/core/api/async/RedisSearchAsyncCommands.java',  // Search/FT commands
      'src/main/java/io/lettuce/core/api/async/RedisVectorSetAsyncCommands.java',  // Vector set commands
      'src/main/java/io/lettuce/core/AbstractRedisAsyncCommands.java',  // Cluster commands
    ],
    language: 'java',
  },
  'lettuce_reactive': {
    paths: [
      'src/main/java/io/lettuce/core/api/reactive/RedisStringReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisKeyReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisListReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisHashReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisSetReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisSortedSetReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisGeoReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisHLLReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisStreamReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisScriptingReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisServerReactiveCommands.java',
      'src/main/java/io/lettuce/core/api/reactive/RedisJsonReactiveCommands.java',  // JSON commands
      'src/main/java/io/lettuce/core/api/reactive/RedisSearchReactiveCommands.java',  // Search/FT commands
      'src/main/java/io/lettuce/core/api/reactive/RedisVectorSetReactiveCommands.java',  // Vector set commands
      'src/main/java/io/lettuce/core/AbstractRedisAsyncCommands.java',  // Cluster commands
    ],
    language: 'java',
  },

  // Go - commands are split across multiple files
  'go-redis': {
    paths: [
      'string_commands.go',
      'list_commands.go',
      'set_commands.go',
      'hash_commands.go',
      'sortedset_commands.go',
      'generic_commands.go',
      'stream_commands.go',
      'geo_commands.go',
      'bitmap_commands.go',
      'cluster_commands.go',
      'pubsub_commands.go',
      'scripting_commands.go',
      'json.go',  // JSON commands
      'search_commands.go',  // Search/FT commands
      'vectorset_commands.go',  // Vector set commands
      'timeseries_commands.go',  // Time series commands
    ],
    language: 'go'
  },

  // TypeScript/Node.js - node-redis has each command in separate files
  'node_redis': {
    paths: [
      // String commands
      'packages/client/lib/commands/APPEND.ts',
      'packages/client/lib/commands/DECR.ts',
      'packages/client/lib/commands/DECRBY.ts',
      'packages/client/lib/commands/GET.ts',
      'packages/client/lib/commands/GETDEL.ts',
      'packages/client/lib/commands/GETEX.ts',
      'packages/client/lib/commands/GETRANGE.ts',
      'packages/client/lib/commands/GETSET.ts',
      'packages/client/lib/commands/INCR.ts',
      'packages/client/lib/commands/INCRBY.ts',
      'packages/client/lib/commands/INCRBYFLOAT.ts',
      'packages/client/lib/commands/LCS.ts',
      'packages/client/lib/commands/MGET.ts',
      'packages/client/lib/commands/MSET.ts',
      'packages/client/lib/commands/MSETNX.ts',
      'packages/client/lib/commands/PSETEX.ts',
      'packages/client/lib/commands/SET.ts',
      'packages/client/lib/commands/SETEX.ts',
      'packages/client/lib/commands/SETNX.ts',
      'packages/client/lib/commands/SETRANGE.ts',
      'packages/client/lib/commands/STRLEN.ts',
      // Hash commands
      'packages/client/lib/commands/HDEL.ts',
      'packages/client/lib/commands/HEXISTS.ts',
      'packages/client/lib/commands/HEXPIRE.ts',
      'packages/client/lib/commands/HEXPIREAT.ts',
      'packages/client/lib/commands/HEXPIRETIME.ts',
      'packages/client/lib/commands/HGET.ts',
      'packages/client/lib/commands/HGETALL.ts',
      'packages/client/lib/commands/HINCRBY.ts',
      'packages/client/lib/commands/HINCRBYFLOAT.ts',
      'packages/client/lib/commands/HKEYS.ts',
      'packages/client/lib/commands/HLEN.ts',
      'packages/client/lib/commands/HMGET.ts',
      'packages/client/lib/commands/HPERSIST.ts',
      'packages/client/lib/commands/HPEXPIRE.ts',
      'packages/client/lib/commands/HPEXPIREAT.ts',
      'packages/client/lib/commands/HPEXPIRETIME.ts',
      'packages/client/lib/commands/HPTTL.ts',
      'packages/client/lib/commands/HRANDFIELD.ts',
      'packages/client/lib/commands/HSCAN.ts',
      'packages/client/lib/commands/HSET.ts',
      'packages/client/lib/commands/HSETNX.ts',
      'packages/client/lib/commands/HSTRLEN.ts',
      'packages/client/lib/commands/HTTL.ts',
      'packages/client/lib/commands/HVALS.ts',
      // Other commonly used commands
      'packages/client/lib/commands/DEL.ts',
      'packages/client/lib/commands/DUMP.ts',
      'packages/client/lib/commands/EXISTS.ts',
      'packages/client/lib/commands/EXPIRE.ts',
      'packages/client/lib/commands/EXPIREAT.ts',
      'packages/client/lib/commands/EXPIRETIME.ts',
      'packages/client/lib/commands/KEYS.ts',
      'packages/client/lib/commands/MIGRATE.ts',
      'packages/client/lib/commands/MOVE.ts',
      'packages/client/lib/commands/PERSIST.ts',
      'packages/client/lib/commands/PEXPIRE.ts',
      'packages/client/lib/commands/PEXPIREAT.ts',
      'packages/client/lib/commands/PEXPIRETIME.ts',
      'packages/client/lib/commands/PING.ts',
      'packages/client/lib/commands/PTTL.ts',
      'packages/client/lib/commands/RANDOMKEY.ts',
      'packages/client/lib/commands/RENAME.ts',
      'packages/client/lib/commands/RENAMENX.ts',
      'packages/client/lib/commands/RESTORE.ts',
      'packages/client/lib/commands/SCAN.ts',
      'packages/client/lib/commands/SORT.ts',
      'packages/client/lib/commands/SORT_RO.ts',
      'packages/client/lib/commands/TOUCH.ts',
      'packages/client/lib/commands/TTL.ts',
      'packages/client/lib/commands/TYPE.ts',
      'packages/client/lib/commands/UNLINK.ts',
      'packages/client/lib/commands/WAIT.ts',
      // Cluster commands
      'packages/client/lib/commands/ASKING.ts',
      'packages/client/lib/commands/CLUSTER_ADDSLOTS.ts',
      'packages/client/lib/commands/CLUSTER_ADDSLOTSRANGE.ts',
      'packages/client/lib/commands/CLUSTER_BUMPEPOCH.ts',
      'packages/client/lib/commands/CLUSTER_COUNT-FAILURE-REPORTS.ts',
      'packages/client/lib/commands/CLUSTER_COUNTKEYSINSLOT.ts',
      'packages/client/lib/commands/CLUSTER_DELSLOTS.ts',
      'packages/client/lib/commands/CLUSTER_DELSLOTSRANGE.ts',
      'packages/client/lib/commands/CLUSTER_FAILOVER.ts',
      'packages/client/lib/commands/CLUSTER_FLUSHSLOTS.ts',
      'packages/client/lib/commands/CLUSTER_FORGET.ts',
      'packages/client/lib/commands/CLUSTER_GETKEYSINSLOT.ts',
      'packages/client/lib/commands/CLUSTER_INFO.ts',
      'packages/client/lib/commands/CLUSTER_KEYSLOT.ts',
      'packages/client/lib/commands/CLUSTER_LINKS.ts',
      'packages/client/lib/commands/CLUSTER_MEET.ts',
      'packages/client/lib/commands/CLUSTER_MYID.ts',
      'packages/client/lib/commands/CLUSTER_MYSHARDID.ts',
      'packages/client/lib/commands/CLUSTER_NODES.ts',
      'packages/client/lib/commands/CLUSTER_REPLICAS.ts',
      'packages/client/lib/commands/CLUSTER_REPLICATE.ts',
      'packages/client/lib/commands/CLUSTER_RESET.ts',
      'packages/client/lib/commands/CLUSTER_SAVECONFIG.ts',
      'packages/client/lib/commands/CLUSTER_SET-CONFIG-EPOCH.ts',
      'packages/client/lib/commands/CLUSTER_SETSLOT.ts',
      'packages/client/lib/commands/CLUSTER_SLOTS.ts',
      'packages/client/lib/commands/READONLY.ts',
      'packages/client/lib/commands/READWRITE.ts',
      // List commands
      'packages/client/lib/commands/LPUSH.ts',
      'packages/client/lib/commands/RPUSH.ts',
      'packages/client/lib/commands/LPOP.ts',
      'packages/client/lib/commands/RPOP.ts',
      'packages/client/lib/commands/LRANGE.ts',
      'packages/client/lib/commands/LLEN.ts',
      // Set commands
      'packages/client/lib/commands/SADD.ts',
      'packages/client/lib/commands/SCARD.ts',
      'packages/client/lib/commands/SDIFF.ts',
      'packages/client/lib/commands/SDIFFSTORE.ts',
      'packages/client/lib/commands/SINTER.ts',
      'packages/client/lib/commands/SINTERCARD.ts',
      'packages/client/lib/commands/SINTERSTORE.ts',
      'packages/client/lib/commands/SISMEMBER.ts',
      'packages/client/lib/commands/SMEMBERS.ts',
      'packages/client/lib/commands/SMISMEMBER.ts',
      'packages/client/lib/commands/SMOVE.ts',
      'packages/client/lib/commands/SPOP.ts',
      'packages/client/lib/commands/SRANDMEMBER.ts',
      'packages/client/lib/commands/SREM.ts',
      'packages/client/lib/commands/SSCAN.ts',
      'packages/client/lib/commands/SUNION.ts',
      'packages/client/lib/commands/SUNIONSTORE.ts',
      // Sorted set commands
      'packages/client/lib/commands/BZMPOP.ts',
      'packages/client/lib/commands/BZPOPMAX.ts',
      'packages/client/lib/commands/BZPOPMIN.ts',
      'packages/client/lib/commands/ZADD.ts',
      'packages/client/lib/commands/ZCARD.ts',
      'packages/client/lib/commands/ZCOUNT.ts',
      'packages/client/lib/commands/ZDIFF.ts',
      'packages/client/lib/commands/ZDIFFSTORE.ts',
      'packages/client/lib/commands/ZINCRBY.ts',
      'packages/client/lib/commands/ZINTER.ts',
      'packages/client/lib/commands/ZINTERCARD.ts',
      'packages/client/lib/commands/ZINTERSTORE.ts',
      'packages/client/lib/commands/ZLEXCOUNT.ts',
      'packages/client/lib/commands/ZMPOP.ts',
      'packages/client/lib/commands/ZMSCORE.ts',
      'packages/client/lib/commands/ZPOPMAX.ts',
      'packages/client/lib/commands/ZPOPMIN.ts',
      'packages/client/lib/commands/ZRANDMEMBER.ts',
      'packages/client/lib/commands/ZRANGE.ts',
      'packages/client/lib/commands/ZRANGE_WITHSCORES.ts',
      'packages/client/lib/commands/ZRANGEBYLEX.ts',
      'packages/client/lib/commands/ZRANGEBYSCORE.ts',
      'packages/client/lib/commands/ZRANGEBYSCORE_WITHSCORES.ts',
      'packages/client/lib/commands/ZRANGESTORE.ts',
      'packages/client/lib/commands/ZRANK.ts',
      'packages/client/lib/commands/ZREM.ts',
      'packages/client/lib/commands/ZREMRANGEBYLEX.ts',
      'packages/client/lib/commands/ZREMRANGEBYRANK.ts',
      'packages/client/lib/commands/ZREMRANGEBYSCORE.ts',
      'packages/client/lib/commands/ZREVRANGE.ts',
      'packages/client/lib/commands/ZREVRANGEBYLEX.ts',
      'packages/client/lib/commands/ZREVRANGEBYSCORE.ts',
      'packages/client/lib/commands/ZREVRANK.ts',
      'packages/client/lib/commands/ZSCAN.ts',
      'packages/client/lib/commands/ZSCORE.ts',
      'packages/client/lib/commands/ZUNION.ts',
      'packages/client/lib/commands/ZUNIONSTORE.ts',
      // Stream commands
      'packages/client/lib/commands/XACK.ts',
      'packages/client/lib/commands/XACKDEL.ts',
      'packages/client/lib/commands/XADD.ts',
      'packages/client/lib/commands/XADD_NOMKSTREAM.ts',
      'packages/client/lib/commands/XAUTOCLAIM.ts',
      'packages/client/lib/commands/XAUTOCLAIM_JUSTID.ts',
      'packages/client/lib/commands/XCFGSET.ts',
      'packages/client/lib/commands/XCLAIM.ts',
      'packages/client/lib/commands/XCLAIM_JUSTID.ts',
      'packages/client/lib/commands/XDEL.ts',
      'packages/client/lib/commands/XDELEX.ts',
      'packages/client/lib/commands/XGROUP_CREATE.ts',
      'packages/client/lib/commands/XGROUP_CREATECONSUMER.ts',
      'packages/client/lib/commands/XGROUP_DELCONSUMER.ts',
      'packages/client/lib/commands/XGROUP_DESTROY.ts',
      'packages/client/lib/commands/XGROUP_SETID.ts',
      'packages/client/lib/commands/XINFO_CONSUMERS.ts',
      'packages/client/lib/commands/XINFO_GROUPS.ts',
      'packages/client/lib/commands/XINFO_STREAM.ts',
      'packages/client/lib/commands/XLEN.ts',
      'packages/client/lib/commands/XPENDING.ts',
      'packages/client/lib/commands/XPENDING_RANGE.ts',
      'packages/client/lib/commands/XRANGE.ts',
      'packages/client/lib/commands/XREAD.ts',
      'packages/client/lib/commands/XREADGROUP.ts',
      'packages/client/lib/commands/XREVRANGE.ts',
      'packages/client/lib/commands/XSETID.ts',
      'packages/client/lib/commands/XTRIM.ts',
      // JSON commands
      'packages/json/lib/commands/SET.ts',
      'packages/json/lib/commands/GET.ts',
      'packages/json/lib/commands/DEL.ts',
      'packages/json/lib/commands/MGET.ts',
      'packages/json/lib/commands/MSET.ts',
      'packages/json/lib/commands/MERGE.ts',
      'packages/json/lib/commands/TOGGLE.ts',
      'packages/json/lib/commands/CLEAR.ts',
      'packages/json/lib/commands/ARRAPPEND.ts',
      'packages/json/lib/commands/ARRINDEX.ts',
      'packages/json/lib/commands/ARRINSERT.ts',
      'packages/json/lib/commands/ARRLEN.ts',
      'packages/json/lib/commands/ARRPOP.ts',
      'packages/json/lib/commands/ARRTRIM.ts',
      'packages/json/lib/commands/OBJKEYS.ts',
      'packages/json/lib/commands/OBJLEN.ts',
      'packages/json/lib/commands/TYPE.ts',
      'packages/json/lib/commands/STRAPPEND.ts',
      'packages/json/lib/commands/STRLEN.ts',
      'packages/json/lib/commands/NUMINCRBY.ts',
      // Search/FT commands
      'packages/search/lib/commands/CREATE.ts',
      'packages/search/lib/commands/SEARCH.ts',
      'packages/search/lib/commands/AGGREGATE.ts',
      'packages/search/lib/commands/INFO.ts',
      'packages/search/lib/commands/DROPINDEX.ts',
      'packages/search/lib/commands/ALTER.ts',
      'packages/search/lib/commands/ALIASADD.ts',
      'packages/search/lib/commands/ALIASDEL.ts',
      'packages/search/lib/commands/ALIASUPDATE.ts',
      'packages/search/lib/commands/CONFIG_GET.ts',
      'packages/search/lib/commands/CONFIG_SET.ts',
      'packages/search/lib/commands/DICTADD.ts',
      'packages/search/lib/commands/DICTDEL.ts',
      'packages/search/lib/commands/DICTDUMP.ts',
      'packages/search/lib/commands/EXPLAIN.ts',
      'packages/search/lib/commands/EXPLAINCLI.ts',
      'packages/search/lib/commands/PROFILE.ts',
      'packages/search/lib/commands/SPELLCHECK.ts',
      'packages/search/lib/commands/SUGADD.ts',
      'packages/search/lib/commands/SUGDEL.ts',
      'packages/search/lib/commands/SUGGET.ts',
      'packages/search/lib/commands/SUGLEN.ts',
      'packages/search/lib/commands/SYNDUMP.ts',
      'packages/search/lib/commands/SYNUPDATE.ts',
      'packages/search/lib/commands/TAGVALS.ts',
      'packages/search/lib/commands/_LIST.ts',
      // Vector set commands (note: VISMEMBER, VLINKS_WITHSCORES, VSIM_WITHSCORES don't exist in node-redis)
      'packages/client/lib/commands/VADD.ts',
      'packages/client/lib/commands/VCARD.ts',
      'packages/client/lib/commands/VDIM.ts',
      'packages/client/lib/commands/VEMB.ts',
      'packages/client/lib/commands/VEMB_RAW.ts',
      'packages/client/lib/commands/VGETATTR.ts',
      'packages/client/lib/commands/VINFO.ts',
      'packages/client/lib/commands/VLINKS.ts',
      'packages/client/lib/commands/VRANDMEMBER.ts',
      'packages/client/lib/commands/VRANGE.ts',
      'packages/client/lib/commands/VREM.ts',
      'packages/client/lib/commands/VSETATTR.ts',
      'packages/client/lib/commands/VSIM.ts',
      // Geo commands
      'packages/client/lib/commands/GEOADD.ts',
      'packages/client/lib/commands/GEODIST.ts',
      'packages/client/lib/commands/GEOHASH.ts',
      'packages/client/lib/commands/GEOPOS.ts',
      'packages/client/lib/commands/GEORADIUS.ts',
      'packages/client/lib/commands/GEORADIUSBYMEMBER.ts',
      'packages/client/lib/commands/GEORADIUSBYMEMBER_RO.ts',
      'packages/client/lib/commands/GEORADIUS_RO.ts',
      'packages/client/lib/commands/GEOSEARCH.ts',
      'packages/client/lib/commands/GEOSEARCHSTORE.ts',
      // Bitmap commands
      'packages/client/lib/commands/BITCOUNT.ts',
      'packages/client/lib/commands/BITFIELD.ts',
      'packages/client/lib/commands/BITFIELD_RO.ts',
      'packages/client/lib/commands/BITOP.ts',
      'packages/client/lib/commands/BITPOS.ts',
      'packages/client/lib/commands/GETBIT.ts',
      'packages/client/lib/commands/SETBIT.ts',
      // Time series commands
      'packages/time-series/lib/commands/ADD.ts',
      'packages/time-series/lib/commands/ALTER.ts',
      'packages/time-series/lib/commands/CREATE.ts',
      'packages/time-series/lib/commands/CREATERULE.ts',
      'packages/time-series/lib/commands/DECRBY.ts',
      'packages/time-series/lib/commands/DEL.ts',
      'packages/time-series/lib/commands/DELETERULE.ts',
      'packages/time-series/lib/commands/GET.ts',
      'packages/time-series/lib/commands/INCRBY.ts',
      'packages/time-series/lib/commands/INFO.ts',
      'packages/time-series/lib/commands/MADD.ts',
      'packages/time-series/lib/commands/MGET.ts',
      'packages/time-series/lib/commands/MRANGE.ts',
      'packages/time-series/lib/commands/MREVRANGE.ts',
      'packages/time-series/lib/commands/QUERYINDEX.ts',
      'packages/time-series/lib/commands/RANGE.ts',
      'packages/time-series/lib/commands/REVRANGE.ts',
    ],
    language: 'typescript'
  },
  'ioredis': { paths: ['lib/utils/RedisCommander.ts'], language: 'typescript' },

  // Rust
  'redis_rs_sync': { paths: ['redis/src/commands/mod.rs'], language: 'rust' },
  'redis_rs_async': { paths: ['redis/src/commands/mod.rs'], language: 'rust' },

  // C# - NRedisStack builds on StackExchange.Redis for core commands
  // Core Redis commands (StringGet, StringSet, etc.) are in StackExchange.Redis
  // Module commands (JSON, Search, TimeSeries, etc.) are in NRedisStack
  'nredisstack_sync': {
    paths: [
      'src/NRedisStack/CoreCommands/CoreCommands.cs',
      'src/NRedisStack/Json/JsonCommands.cs',  // JSON commands
      'src/NRedisStack/Search/SearchCommands.cs',  // Search/FT commands
      'src/NRedisStack/TimeSeries/TimeSeriesCommands.cs',  // Time series commands
    ],
    language: 'csharp',
    externalSources: [
      {
        git_uri: 'https://github.com/StackExchange/StackExchange.Redis',
        paths: [
          'src/StackExchange.Redis/Interfaces/IDatabase.cs',
          'src/StackExchange.Redis/Interfaces/IDatabaseAsync.cs',
          'src/StackExchange.Redis/Interfaces/IDatabase.VectorSets.cs',  // Vector set commands
          'src/StackExchange.Redis/RedisDatabase.cs',
        ],
      },
    ],
  },
  'nredisstack_async': {
    paths: [
      'src/NRedisStack/CoreCommands/CoreCommandsAsync.cs',
      'src/NRedisStack/Json/JsonCommandsAsync.cs',  // JSON commands async
      'src/NRedisStack/Search/SearchCommandsAsync.cs',  // Search/FT commands async
      'src/NRedisStack/TimeSeries/TimeSeriesCommandsAsync.cs',  // Time series commands async
    ],
    language: 'csharp',
    externalSources: [
      {
        git_uri: 'https://github.com/StackExchange/StackExchange.Redis',
        paths: [
          'src/StackExchange.Redis/Interfaces/IDatabaseAsync.cs',
          'src/StackExchange.Redis/Interfaces/IDatabase.cs',
          'src/StackExchange.Redis/Interfaces/IDatabaseAsync.VectorSets.cs',  // Vector set commands async
          'src/StackExchange.Redis/RedisDatabase.cs',
        ],
      },
    ],
  },

  // PHP - Predis uses ClientInterface for most method signatures
  // Container classes (XGROUP, XINFO) have subcommand methods defined in @method docblocks
  'php': {
    paths: [
      'src/ClientInterface.php',
      'src/Command/Container/XGROUP.php',  // XGROUP subcommands: create, createConsumer, delConsumer, destroy, setId
      'src/Command/Container/XINFO.php',   // XINFO subcommands: consumers, groups, stream
    ],
    language: 'php'
  },
};

/**
 * Determine source context from a file path.
 * Used to identify if a source file contains JSON, Search, TimeSeries, or other module commands.
 * @param filePath - The path to the source file
 * @returns The source context ('json', 'search', 'timeseries', 'bloom', or 'core')
 */
function getSourceContextFromPath(filePath: string): string {
  const pathLower = filePath.toLowerCase();

  // JSON module files
  if (pathLower.includes('/json/') || pathLower.includes('json.go') ||
      pathLower.includes('jsoncommands') || pathLower.includes('json_commands')) {
    return 'json';
  }

  // Search module files (for future expansion)
  if (pathLower.includes('/search/') || pathLower.includes('search.go') ||
      pathLower.includes('searchcommands') || pathLower.includes('search_commands') ||
      pathLower.includes('redisearch')) {
    return 'search';
  }

  // TimeSeries module files
  if (pathLower.includes('/timeseries/') || pathLower.includes('/time-series/') ||
      pathLower.includes('timeseries.go') || pathLower.includes('timeseries_commands') ||
      pathLower.includes('timeseriescommands') || pathLower.includes('time_series')) {
    return 'timeseries';
  }

  // Bloom module files (for future expansion)
  if (pathLower.includes('/bloom/') || pathLower.includes('bloom.go') ||
      pathLower.includes('bloomcommands') || pathLower.includes('bloom_commands')) {
    return 'bloom';
  }

  // Default to core commands
  return 'core';
}

/**
 * Fetch source file content from GitHub raw URL
 * @param gitUri - The GitHub repository URL (e.g., https://github.com/redis/jedis)
 * @param filePath - The path to the file within the repository
 * @returns The file content, or null if fetch fails
 */
async function fetchSourceFileFromGitHub(gitUri: string, filePath: string): Promise<string | null> {
  try {
    // Convert git URI to raw GitHub URL
    const match = gitUri.match(/github\.com\/([^/]+)\/([^/]+?)(\.git)?$/);
    if (!match) {
      console.error(`Invalid GitHub URI: ${gitUri}`);
      return null;
    }

    const owner = match[1];
    const repo = match[2];

    // Try common branch names
    const branches = ['main', 'master', 'develop'];

    for (const branch of branches) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      try {
        const response = await fetch(rawUrl);
        if (response.ok) {
          return await response.text();
        }
      } catch {
        // Try next branch
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching from GitHub: ${error}`);
    return null;
  }
}

/**
 * Extract method signatures from a client library source file.
 *
 * Can fetch source code directly from GitHub when using client_id,
 * or read from a local file when using file_path.
 *
 * @param input - Input parameters (file_path OR client_id, language, optional method_name_filter)
 * @returns Extracted signatures with metadata
 */
export async function extractSignatures(
  input: unknown
): Promise<ExtractSignaturesOutput> {
  // Validate input
  const validatedInput = ExtractSignaturesInputSchema.parse(input);

  try {
    let code: string;
    let language: string;
    let sourcePath: string;

    if (validatedInput.client_id) {
      // Fetch from GitHub using client_id
      const clientInfo = getClientById(validatedInput.client_id);
      if (!clientInfo) {
        throw new Error(`Unknown client_id: ${validatedInput.client_id}`);
      }

      const sourceConfig = CLIENT_SOURCE_FILES[validatedInput.client_id];
      if (!sourceConfig) {
        throw new Error(`No source file mapping for client: ${validatedInput.client_id}`);
      }

      if (!clientInfo.repository?.git_uri) {
        throw new Error(`No repository URL for client: ${validatedInput.client_id}`);
      }

      language = validatedInput.language || sourceConfig.language;

      // Special handling for node_redis: each command is in a separate file
      // and the method is always parseCommand, so we derive the command name from the filename
      const isNodeRedis = validatedInput.client_id === 'node_redis';

      // Fetch all source files and combine their content
      const fetchedPaths: string[] = [];
      const codeChunks: { code: string; filePath: string; source?: string }[] = [];

      // Fetch from primary repository
      for (const filePath of sourceConfig.paths) {
        const fetchedCode = await fetchSourceFileFromGitHub(
          clientInfo.repository.git_uri,
          filePath
        );

        if (fetchedCode) {
          codeChunks.push({ code: fetchedCode, filePath });
          fetchedPaths.push(filePath);
        }
      }

      // Fetch from external sources (e.g., StackExchange.Redis for NRedisStack)
      if (sourceConfig.externalSources) {
        for (const externalSource of sourceConfig.externalSources) {
          for (const filePath of externalSource.paths) {
            const fetchedCode = await fetchSourceFileFromGitHub(
              externalSource.git_uri,
              filePath
            );

            if (fetchedCode) {
              codeChunks.push({
                code: fetchedCode,
                filePath,
                source: externalSource.git_uri,
              });
              fetchedPaths.push(`${externalSource.git_uri}:${filePath}`);
            }
          }
        }
      }

      if (codeChunks.length === 0) {
        throw new Error(
          `Failed to fetch any source files from GitHub for client: ${validatedInput.client_id}`
        );
      }

      // For node_redis, prepend command name markers that we can use later
      if (isNodeRedis) {
        // Add special markers that we'll use to rename parseCommand methods
        code = codeChunks.map(chunk => {
          // Extract command name from filename (e.g., GET.ts -> GET)
          const match = chunk.filePath.match(/\/([A-Z_]+)\.ts$/);
          const commandName = match ? match[1] : '';
          // Determine source context from path (json, search, timeseries, bloom, etc.)
          const sourceContext = getSourceContextFromPath(chunk.filePath);
          // Add special comments that our parser can detect
          return `// __NODE_REDIS_COMMAND__:${commandName}\n// __SOURCE_CONTEXT__:${sourceContext}\n${chunk.code}`;
        }).join('\n\n');
      } else {
        // Add source context markers for all files to track JSON vs core commands
        code = codeChunks.map(chunk => {
          const sourceContext = getSourceContextFromPath(chunk.filePath);
          return `// __SOURCE_CONTEXT__:${sourceContext}\n${chunk.code}`;
        }).join('\n\n');
      }
      sourcePath = `${clientInfo.repository.git_uri} [${fetchedPaths.join(', ')}]`;
    } else if (validatedInput.file_path) {
      // Read from local file
      const filePath = resolve(validatedInput.file_path);
      sourcePath = filePath;
      language = validatedInput.language!; // Required by schema when using file_path

      try {
        code = readFileSync(filePath, "utf-8");
      } catch (error) {
        throw new Error(
          `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      throw new Error("Either file_path or client_id must be provided");
    }

    // Parse based on language
    let rawSignatures: any[] = [];
    let docComments: Record<string, any> = {};
    const errors: string[] = [];
    const isNodeRedis = validatedInput.client_id === 'node_redis';

    if (language === "python") {
      rawSignatures = parsePythonSignatures(code);
      docComments = parsePythonDocComments(code);
    } else if (language === "java") {
      rawSignatures = parseJavaSignatures(code);
      docComments = parseJavaDocComments(code);
    } else if (language === "go") {
      rawSignatures = parseGoSignatures(code);
      docComments = parseGoDocComments(code);
    } else if (language === "typescript") {
      rawSignatures = parseTypeScriptSignatures(code);
      docComments = parseTypeScriptDocComments(code);

      // Special post-processing for node_redis: rename parseCommand to actual command names
      // Note: Deduplication is done AFTER source context is attached (below)
      if (isNodeRedis && rawSignatures.length > 0) {
        const lines = code.split('\n');
        let currentCommand = '';
        const lineToCommand: Record<number, string> = {};

        // Build a map of line numbers to command names
        for (let i = 0; i < lines.length; i++) {
          const match = lines[i].match(/\/\/ __NODE_REDIS_COMMAND__:([A-Z_]+)/);
          if (match) {
            currentCommand = match[1];
          }
          lineToCommand[i + 1] = currentCommand;
        }

        // Rename parseCommand methods and factory functions to their command names
        rawSignatures = rawSignatures.map(sig => {
          const commandName = lineToCommand[sig.line_number];
          if (!commandName) return sig;

          // Rename parseCommand methods to their command names
          if (sig.method_name === 'parseCommand') {
            return {
              ...sig,
              method_name: commandName,
              signature: sig.signature.replace('parseCommand', commandName),
            };
          }

          // Rename factory functions (e.g., createTransformMRangeArguments) to their command names
          // Users call client.ts.mRange(...), not client.createTransformMRangeArguments(...)
          if (sig.method_name.startsWith('create')) {
            return {
              ...sig,
              method_name: commandName,
              signature: sig.signature.replace(sig.method_name, commandName),
            };
          }

          return sig;
        });

        // Filter out non-command methods (but NOT duplicates yet - that happens after source context is added)
        rawSignatures = rawSignatures.filter(sig => {
          // Skip non-command methods (like 'if', 'constructor', etc.)
          if (['parseCommand', 'transformArguments', 'transformReply', 'constructor'].includes(sig.method_name)) {
            return false;
          }
          // Keep uppercase command names (like GET, SET, etc.)
          // This includes renamed parseCommand and factory functions
          if (sig.method_name && /^[A-Z_]+$/.test(sig.method_name)) {
            return true;
          }
          return false;
        });
      }
    } else if (language === "rust") {
      rawSignatures = parseRustSignatures(code);
      docComments = parseRustDocComments(code);
    } else if (language === "csharp") {
      rawSignatures = parseCSharpSignatures(code);
      docComments = parseCSharpDocComments(code);
    } else if (language === "php") {
      rawSignatures = parsePHPSignatures(code);
      docComments = parsePHPDocComments(code);
    } else {
      errors.push(
        `Language '${language}' not yet implemented. Currently Python, Java, Go, TypeScript, Rust, C#, and PHP are supported.`
      );
    }

    // Add source context to signatures based on __SOURCE_CONTEXT__ markers
    const lines = code.split('\n');
    let currentSourceContext = 'core';
    const lineToSourceContext: Record<number, string> = {};

    for (let i = 0; i < lines.length; i++) {
      const contextMatch = lines[i].match(/\/\/ __SOURCE_CONTEXT__:(\w+)/);
      if (contextMatch) {
        currentSourceContext = contextMatch[1];
      }
      lineToSourceContext[i + 1] = currentSourceContext;
    }

    // Attach source_context to each signature based on its line number
    rawSignatures = rawSignatures.map(sig => ({
      ...sig,
      source_context: lineToSourceContext[sig.line_number] || 'core',
    }));

    // For node_redis, deduplicate per source context (e.g., SET from core and SET from json are both valid)
    if (isNodeRedis) {
      const seenCommandsPerContext = new Map<string, Set<string>>();
      rawSignatures = rawSignatures.filter(sig => {
        const context = sig.source_context || 'core';
        if (!seenCommandsPerContext.has(context)) {
          seenCommandsPerContext.set(context, new Set());
        }
        const seenInContext = seenCommandsPerContext.get(context)!;
        if (seenInContext.has(sig.method_name)) {
          return false;
        }
        seenInContext.add(sig.method_name);
        return true;
      });
    }

    // Apply method name filter if provided
    let filteredSignatures = rawSignatures;
    if (validatedInput.method_name_filter.length > 0) {
      filteredSignatures = rawSignatures.filter((sig) =>
        validatedInput.method_name_filter.some((filter) =>
          sig.method_name.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }

    // Helper function to get doc comment for a method
    const getDocComment = (methodName: string): any => {
      // Try exact match first
      if (docComments[methodName]) {
        return docComments[methodName];
      }
      // Try case-insensitive match
      const lowerMethodName = methodName.toLowerCase();
      for (const key of Object.keys(docComments)) {
        if (key.toLowerCase() === lowerMethodName) {
          return docComments[key];
        }
      }
      return null;
    };

    // Helper function to get parameter description from doc comment
    const getParamDescription = (doc: any, paramName: string): string => {
      if (!doc) return '';
      // Handle different doc comment structures
      if (doc.parameters) {
        // Direct lookup
        if (doc.parameters[paramName]) {
          return doc.parameters[paramName];
        }
        // Try without type prefix (e.g., "String key" -> "key")
        const cleanParamName = paramName.split(' ').pop() || paramName;
        if (doc.parameters[cleanParamName]) {
          return doc.parameters[cleanParamName];
        }
      }
      return '';
    };

    // Helper function to get return description from doc comment
    const getReturnDescription = (doc: any): string => {
      if (!doc) return '';
      if (typeof doc.returns === 'string') {
        return doc.returns;
      }
      if (doc.returns?.description) {
        return doc.returns.description;
      }
      return '';
    };

    // Helper function to clean JavaDoc/documentation markup from descriptions
    const cleanDocMarkup = (text: string): string => {
      if (!text) return '';
      let cleaned = text;
      // Remove {@code ...} but keep the content
      cleaned = cleaned.replace(/\{@code\s+([^}]+)\}/g, '$1');
      // Remove {@link ...} but keep the content (may have #method suffix)
      cleaned = cleaned.replace(/\{@link\s+([^}]+)\}/g, '$1');
      // Remove {@literal ...} but keep the content
      cleaned = cleaned.replace(/\{@literal\s+([^}]+)\}/g, '$1');
      // Remove {@value ...} but keep the content
      cleaned = cleaned.replace(/\{@value\s+([^}]+)\}/g, '$1');
      // Remove {@inheritDoc}
      cleaned = cleaned.replace(/\{@inheritDoc\}/g, '');
      // Remove <code>...</code> HTML tags but keep content
      cleaned = cleaned.replace(/<code>([^<]*)<\/code>/gi, '$1');
      // Remove <pre>...</pre> HTML tags but keep content
      cleaned = cleaned.replace(/<pre>([^<]*)<\/pre>/gi, '$1');
      // Remove <p> and </p> tags
      cleaned = cleaned.replace(/<\/?p>/gi, ' ');
      // Remove <see cref="..."/> C# XML doc tags but keep the reference
      cleaned = cleaned.replace(/<see\s+cref="([^"]+)"\s*\/>/gi, '$1');
      // Clean up multiple spaces
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      return cleaned;
    };

    // Helper function to clean up signature based on language
    const cleanupSignature = (sig: string, lang: string): string => {
      let cleaned = sig;

      if (lang === 'python') {
        // Remove "def " prefix
        cleaned = cleaned.replace(/^def\s+/, '');
        // Remove "async def " prefix
        cleaned = cleaned.replace(/^async\s+def\s+/, 'async ');
        // Remove "self, " or "self" from within parameter list
        cleaned = cleaned.replace(/\(self,\s*/, '(');
        cleaned = cleaned.replace(/\(self\)/, '()');
      } else if (lang === 'go') {
        // Remove "func (receiver) " prefix - matches "func (c cmdable) " or similar
        cleaned = cleaned.replace(/^func\s+\([^)]+\)\s*/, '');
      } else if (lang === 'rust') {
        // Remove "fn " prefix
        cleaned = cleaned.replace(/^fn\s+/, '');
        // Remove "&self, " or "&mut self, " or "&self" from within parameter list
        cleaned = cleaned.replace(/\(&self,\s*/, '(');
        cleaned = cleaned.replace(/\(&mut self,\s*/, '(');
        cleaned = cleaned.replace(/\(&self\)/, '()');
        cleaned = cleaned.replace(/\(&mut self\)/, '()');
      } else if (lang === 'typescript') {
        // Remove "parser: CommandParser, " from within parameter list (node-redis internal)
        cleaned = cleaned.replace(/\(parser:\s*CommandParser,\s*/, '(');
        cleaned = cleaned.replace(/\(parser:\s*CommandParser\)/, '()');
      }

      return cleaned;
    };

    // Helper function to filter out self-like parameters based on language
    const filterSelfParams = (params: string[] | undefined, lang: string): string[] => {
      if (!params) return [];

      return params.filter(p => {
        const paramName = p.split(':')[0].trim().toLowerCase();

        if (lang === 'python') {
          // Filter out "self"
          return paramName !== 'self';
        } else if (lang === 'rust') {
          // Filter out "&self", "&mut self", "self"
          return !['&self', '&mut self', 'self'].includes(paramName);
        } else if (lang === 'typescript') {
          // Filter out "parser: CommandParser" (node-redis internal)
          return paramName !== 'parser';
        }

        return true;
      });
    };

    // Convert to schema format with doc comment enrichment
    const signatures = filteredSignatures.map((sig) => {
      const doc = getDocComment(sig.method_name);
      const cleanedSignature = cleanupSignature(sig.signature, language);
      const filteredParams = filterSelfParams(sig.parameters, language);

      // Helper function to parse parameter name and type based on language
      const parseParam = (p: string, lang: string): { name: string; type: string } => {
        const trimmed = p.trim();

        if (lang === 'python' || lang === 'rust' || lang === 'typescript') {
          // Format: name: Type
          if (trimmed.includes(':')) {
            const [name, type] = trimmed.split(':').map(s => s.trim());
            return { name, type: type || 'Any' };
          }
          return { name: trimmed, type: 'Any' };
        } else if (lang === 'go') {
          // Format: name Type (space-separated, last token is type)
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const type = parts.pop() || 'Any';
            const name = parts.join(' ');
            return { name, type };
          }
          return { name: trimmed, type: 'Any' };
        } else if (lang === 'java' || lang === 'csharp') {
          // Format: Type name (or "final Type name" for Java, or "Type name = default" for C#)
          // Handle generic types like "KeyValueStreamingChannel<K, V> channel"
          // Remove modifiers like "final"
          let cleaned = trimmed.replace(/^(final|readonly|ref|out|in|params)\s+/gi, '');
          // Remove default value assignment (e.g., "= CommandFlags.None")
          cleaned = cleaned.replace(/\s*=\s*[^,]+$/, '');

          // For generic types, find the last space that's not inside angle brackets
          // to split type from name
          let bracketDepth = 0;
          let lastSpaceOutsideBrackets = -1;
          for (let i = 0; i < cleaned.length; i++) {
            const char = cleaned[i];
            if (char === '<') bracketDepth++;
            else if (char === '>') bracketDepth--;
            else if (char === ' ' && bracketDepth === 0) {
              lastSpaceOutsideBrackets = i;
            }
          }

          if (lastSpaceOutsideBrackets > 0) {
            const type = cleaned.substring(0, lastSpaceOutsideBrackets).trim();
            const name = cleaned.substring(lastSpaceOutsideBrackets + 1).trim();
            return { name, type };
          }
          return { name: trimmed, type: 'Any' };
        } else if (lang === 'php') {
          // Format: Type $name or just $name
          const match = trimmed.match(/^(.+?)\s*(\$\w+)$/);
          if (match) {
            return { name: match[2], type: match[1].trim() || 'Any' };
          }
          // Just $name
          if (trimmed.startsWith('$')) {
            return { name: trimmed, type: 'Any' };
          }
          return { name: trimmed, type: 'Any' };
        }

        // Default: try colon-separated, then return as-is
        if (trimmed.includes(':')) {
          const [name, type] = trimmed.split(':').map(s => s.trim());
          return { name, type: type || 'Any' };
        }
        return { name: trimmed, type: 'Any' };
      };

      return {
        method_name: sig.method_name,
        signature: cleanedSignature,
        parameters: filteredParams.map((p: string) => {
          const { name, type } = parseParam(p, language);
          return {
            name,
            type,
            description: cleanDocMarkup(getParamDescription(doc, name)),
          };
        }),
        return_type: sig.return_type || "Any",
        return_description: cleanDocMarkup(getReturnDescription(doc)),
        line_number: sig.line_number,
        is_async: sig.is_async,
        source_context: sig.source_context,
      };
    });

    // Validate with schema
    const validatedSignatures = signatures.map((sig) =>
      SignatureSchema.parse(sig)
    );

    return {
      file_path: sourcePath,
      language: language,
      signatures: validatedSignatures,
      total_count: validatedSignatures.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract signatures: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

