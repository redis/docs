/**
 * Extract method signatures from client libraries for all string and hash commands
 * Generates data/command-api-mapping.json with the same schema as extracted-real-signatures.json
 */

import { extractSignatures } from './tools/extract-signatures.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface SignatureObject {
  signature: string;
  params?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  returns?: {
    type: string;
    description: string;
  };
}

interface CommandMapping {
  [commandName: string]: {
    api_calls: {
      [clientId: string]: SignatureObject[];
    };
  };
}

/**
 * All string and hash commands from commands_core.json
 */
const STRING_HASH_COMMANDS = [
  // String commands
  'APPEND', 'DECR', 'DECRBY', 'DELEX', 'DIGEST', 'GET', 'GETDEL', 'GETEX',
  'GETRANGE', 'GETSET', 'INCR', 'INCRBY', 'INCRBYFLOAT', 'LCS', 'MGET', 'MSET',
  'MSETEX', 'MSETNX', 'PSETEX', 'SET', 'SETEX', 'SETNX', 'SETRANGE', 'STRLEN', 'SUBSTR',
  // Hash commands
  'HDEL', 'HEXISTS', 'HEXPIRE', 'HEXPIREAT', 'HEXPIRETIME', 'HGET', 'HGETALL',
  'HGETDEL', 'HGETEX', 'HINCRBY', 'HINCRBYFLOAT', 'HKEYS', 'HLEN', 'HMGET', 'HMSET',
  'HPERSIST', 'HPEXPIRE', 'HPEXPIREAT', 'HPEXPIRETIME', 'HPTTL', 'HRANDFIELD', 'HSCAN',
  'HSET', 'HSETEX', 'HSETNX', 'HSTRLEN', 'HTTL', 'HVALS',
];

/**
 * All list commands from commands_core.json (group: "list")
 */
const LIST_COMMANDS = [
  'BLMOVE', 'BLMPOP', 'BLPOP', 'BRPOP', 'BRPOPLPUSH',
  'LINDEX', 'LINSERT', 'LLEN', 'LMOVE', 'LMPOP',
  'LPOP', 'LPOS', 'LPUSH', 'LPUSHX', 'LRANGE', 'LREM', 'LSET', 'LTRIM',
  'RPOP', 'RPOPLPUSH', 'RPUSH', 'RPUSHX',
];

/**
 * All JSON commands from commands_redisjson.json
 */
const JSON_COMMANDS = [
  'JSON.SET', 'JSON.GET', 'JSON.DEL', 'JSON.MGET', 'JSON.MSET', 'JSON.MERGE',
  'JSON.TOGGLE', 'JSON.CLEAR', 'JSON.FORGET',
  'JSON.ARRAPPEND', 'JSON.ARRINDEX', 'JSON.ARRINSERT', 'JSON.ARRLEN', 'JSON.ARRPOP', 'JSON.ARRTRIM',
  'JSON.OBJKEYS', 'JSON.OBJLEN', 'JSON.TYPE',
  'JSON.STRAPPEND', 'JSON.STRLEN', 'JSON.NUMINCRBY',
  'JSON.DEBUG MEMORY', 'JSON.RESP',
];

/**
 * Combined list of all commands to extract
 */
const ALL_COMMANDS = [...STRING_HASH_COMMANDS, ...LIST_COMMANDS, ...JSON_COMMANDS];

/**
 * Clients to extract signatures from
 */
const CLIENT_CONFIGS = [
  { id: 'redis_py', language: 'python' },
  { id: 'jedis', language: 'java' },
  { id: 'lettuce_sync', language: 'java' },
  { id: 'lettuce_async', language: 'java' },
  { id: 'lettuce_reactive', language: 'java' },
  { id: 'go-redis', language: 'go' },
  { id: 'node_redis', language: 'typescript' },
  { id: 'ioredis', language: 'typescript' },
  { id: 'redis_rs_sync', language: 'rust' },
  { id: 'redis_rs_async', language: 'rust' },
  { id: 'nredisstack_sync', language: 'csharp' },
  { id: 'nredisstack_async', language: 'csharp' },
  { id: 'php', language: 'php' },
];

/**
 * Command aliases for exact matching across different client naming conventions
 * Covers: redis-py (snake_case), Jedis/Lettuce (camelCase), NRedisStack (PascalCase with prefixes),
 * go-redis (PascalCase), ioredis (camelCase), Rust (snake_case), PHP (camelCase)
 */
const COMMAND_ALIASES: { [key: string]: string[] } = {
  // String commands
  'append': ['append', 'stringappend'],
  'decr': ['decr', 'decrby', 'stringdecrement'],  // redis-py uses decrby for DECR too
  'decrby': ['decrby', 'decr', 'stringdecrement'],  // Rust uses decr for both DECR and DECRBY
  'delex': ['delex', 'delexargs', 'stringdelete'],  // NRedisStack: StringDelete, go-redis: DelExArgs
  'digest': ['digest', 'stringdigest'],  // NRedisStack: StringDigest
  'get': ['get', 'stringget'],
  'getdel': ['getdel', 'get_del', 'stringgetdelete'],  // Rust: get_del
  'getex': ['getex', 'get_ex', 'stringgetsetexpiry'],  // Rust: get_ex, NRedisStack: StringGetSetExpiry
  'getrange': ['getrange', 'stringgetrange'],
  'getset': ['getset', 'stringgetset'],
  'incr': ['incr', 'incrby', 'stringincrement'],  // redis-py uses incrby for INCR too
  'incrby': ['incrby', 'incr', 'stringincrement'],  // Rust uses incr for both INCR and INCRBY
  'incrbyfloat': ['incrbyfloat', 'stringincrement'],
  'lcs': ['lcs', 'stralgo'],  // Some clients use STRALGO for LCS
  'mget': ['mget'],
  'mset': ['mset'],
  'msetex': ['msetex', 'mset_ex'],  // Rust: mset_ex
  'msetnx': ['msetnx', 'mset_nx'],  // Rust: mset_nx
  'psetex': ['psetex', 'pset_ex'],  // Rust: pset_ex
  'set': ['set', 'stringset'],
  'setex': ['setex', 'set_ex'],  // Rust might use set_ex (though most use SET with EX option)
  'setnx': ['setnx', 'set_nx'],  // Rust: set_nx
  'setrange': ['setrange', 'stringsetrange'],
  'strlen': ['strlen', 'stringlength', 'hashstringlength'],  // NRedisStack: HashStringLength also
  'substr': ['substr', 'getrange'],  // SUBSTR is deprecated alias for GETRANGE
  // Hash commands
  'hdel': ['hdel', 'hashdelete'],
  'hexists': ['hexists', 'hashexists'],
  'hexpire': ['hexpire', 'hexpire_at', 'hashfieldexpire'],  // Rust: hexpire, NRedisStack: HashFieldExpire
  'hexpireat': ['hexpireat', 'hexpire_at', 'hashfieldexpire'],  // Rust: hexpire_at
  'hexpiretime': ['hexpiretime', 'hexpire_time', 'hashfieldgetexpiredatetime'],  // NRedisStack: HashFieldGetExpireDateTime
  'hget': ['hget', 'hashget'],
  'hgetall': ['hgetall', 'hashgetall'],
  'hgetdel': ['hgetdel', 'hget_del', 'hashfieldgetanddelete'],  // Rust: hget_del, NRedisStack: HashFieldGetAndDelete
  'hgetex': ['hgetex', 'hget_ex', 'hashfieldgetandsetexpiry'],  // Rust: hget_ex, NRedisStack: HashFieldGetAndSetExpiry
  'hincrby': ['hincrby', 'hincr', 'hashincrement', 'hashdecrement'],  // Rust: hincr, NRedisStack: HashIncrement/HashDecrement
  'hincrbyfloat': ['hincrbyfloat', 'hashincrement'],
  'hkeys': ['hkeys', 'hashkeys'],
  'hlen': ['hlen', 'hashlength'],
  'hmget': ['hmget', 'hashget'],
  'hmset': ['hmset', 'hashset', 'hset_multiple'],  // Rust: hset_multiple
  'hpersist': ['hpersist', 'hashfieldpersist'],  // NRedisStack: HashFieldPersist
  'hpexpire': ['hpexpire', 'hpexpire_at', 'hashfieldexpire'],  // Rust: hpexpire
  'hpexpireat': ['hpexpireat', 'hpexpire_at'],
  'hpexpiretime': ['hpexpiretime', 'hpexpire_time'],
  'hpttl': ['hpttl', 'hashfieldgettimetolive'],  // NRedisStack: HashFieldGetTimeToLive
  'hrandfield': ['hrandfield', 'hashrandomfield'],
  'hscan': ['hscan', 'hashscan', 'hscannovalues'],  // Jedis: hscanNoValues
  'hset': ['hset', 'hashset'],
  'hsetex': ['hsetex', 'hset_ex'],  // Rust: hset_ex
  'hsetnx': ['hsetnx', 'hset_nx', 'hashsetnx', 'hashsetnotexists'],  // Rust: hset_nx
  'hstrlen': ['hstrlen', 'hashstringlength'],
  'httl': ['httl', 'hashfieldgettimetolive'],  // NRedisStack: HashFieldGetTimeToLive
  'hvals': ['hvals', 'hashvalues'],
  // List commands
  'blmove': ['blmove', 'bl_move', 'listmove'],  // Rust: bl_move, NRedisStack: ListMove (blocking variant)
  'blmpop': ['blmpop', 'bl_mpop'],  // Rust: bl_mpop
  'blpop': ['blpop', 'bl_pop'],  // Rust: bl_pop
  'brpop': ['brpop', 'br_pop'],  // Rust: br_pop
  'brpoplpush': ['brpoplpush', 'brpop_lpush'],  // Rust: brpop_lpush (deprecated)
  'lindex': ['lindex', 'listgetbyindex'],  // NRedisStack: ListGetByIndex
  'linsert': ['linsert', 'listinsertbefore', 'listinsertafter', 'linsert_before', 'linsert_after'],  // NRedisStack: ListInsertBefore/After, Rust: linsert_before/linsert_after
  'llen': ['llen', 'listlength'],  // NRedisStack: ListLength
  'lmove': ['lmove', 'l_move', 'listmove'],  // Rust: l_move, NRedisStack: ListMove
  'lmpop': ['lmpop', 'l_mpop'],  // Rust: l_mpop
  'lpop': ['lpop', 'listleftpop'],  // NRedisStack: ListLeftPop
  'lpos': ['lpos', 'listposition', 'listpositions'],  // NRedisStack: ListPosition/ListPositions
  'lpush': ['lpush', 'listleftpush'],  // NRedisStack: ListLeftPush
  'lpushx': ['lpushx', 'listleftpushifpresent', 'lpush_exists'],  // NRedisStack: ListLeftPushIfPresent, Rust: lpush_exists
  'lrange': ['lrange', 'listrange'],  // NRedisStack: ListRange
  'lrem': ['lrem', 'listremove'],  // NRedisStack: ListRemove
  'lset': ['lset', 'listsetbyindex'],  // NRedisStack: ListSetByIndex
  'ltrim': ['ltrim', 'listtrim'],  // NRedisStack: ListTrim
  'rpop': ['rpop', 'listrightpop'],  // NRedisStack: ListRightPop
  'rpoplpush': ['rpoplpush', 'rpop_lpush'],  // Rust: rpop_lpush (deprecated)
  'rpush': ['rpush', 'listrightpush'],  // NRedisStack: ListRightPush
  'rpushx': ['rpushx', 'listrightpushifpresent', 'rpush_exists'],  // NRedisStack: ListRightPushIfPresent, Rust: rpush_exists
  // JSON commands - Clients use various naming: jsonSet/json_set/JsonSet/JSONSet
  // For aliases, we include both JSON-prefixed names AND non-prefixed names.
  // The source_context filtering will ensure non-prefixed names only match from JSON source files.
  // redis-py: r.json().set() -> extracted as 'set' from JSON module (handled by source file context)
  // Jedis: jedis.jsonSet(), go-redis: JSONSet, NRedisStack: db.JSON().Set()
  'json.set': ['jsonset', 'json_set', 'set'],
  'json.get': ['jsonget', 'json_get', 'get'],
  'json.del': ['jsondel', 'json_del', 'jsondelete', 'json_delete', 'del', 'delete'],
  'json.mget': ['jsonmget', 'json_mget', 'mget'],
  'json.mset': ['jsonmset', 'json_mset', 'mset'],
  'json.merge': ['jsonmerge', 'json_merge', 'merge'],
  'json.toggle': ['jsontoggle', 'json_toggle', 'toggle'],
  'json.clear': ['jsonclear', 'json_clear', 'clear'],
  'json.forget': ['jsonforget', 'json_forget', 'forget'],
  'json.arrappend': ['jsonarrappend', 'json_arrappend', 'json_arr_append', 'arrappend'],
  'json.arrindex': ['jsonarrindex', 'json_arrindex', 'json_arr_index', 'arrindex'],
  'json.arrinsert': ['jsonarrinsert', 'json_arrinsert', 'json_arr_insert', 'arrinsert'],
  'json.arrlen': ['jsonarrlen', 'json_arrlen', 'json_arr_len', 'arrlen'],
  'json.arrpop': ['jsonarrpop', 'json_arrpop', 'json_arr_pop', 'arrpop'],
  'json.arrtrim': ['jsonarrtrim', 'json_arrtrim', 'json_arr_trim', 'arrtrim'],
  'json.objkeys': ['jsonobjkeys', 'json_objkeys', 'json_obj_keys', 'objkeys'],
  'json.objlen': ['jsonobjlen', 'json_objlen', 'json_obj_len', 'objlen'],
  'json.type': ['jsontype', 'json_type', 'type'],
  'json.strappend': ['jsonstrappend', 'json_strappend', 'json_str_append', 'strappend'],
  'json.strlen': ['jsonstrlen', 'json_strlen', 'json_str_len', 'strlen'],
  'json.numincrby': ['jsonnumincrby', 'json_numincrby', 'json_num_incr_by', 'numincrby'],
  'json.debug memory': ['jsondebugmemory', 'json_debug_memory', 'debugmemory'],
  'json.resp': ['jsonresp', 'json_resp', 'resp'],
};

async function extractCommandApiMapping() {
  console.log('🔍 Extracting Method Signatures for String, Hash, List & JSON Commands...\n');
  console.log(`📋 Commands to extract: ${ALL_COMMANDS.length} (${STRING_HASH_COMMANDS.length} string/hash + ${LIST_COMMANDS.length} list + ${JSON_COMMANDS.length} JSON)`);
  console.log(`📦 Clients to process: ${CLIENT_CONFIGS.length}\n`);

  const mapping: CommandMapping = {};

  // Initialize mapping structure
  for (const cmd of ALL_COMMANDS) {
    mapping[cmd] = { api_calls: {} };
  }

  // Extract signatures for each client
  for (const clientConfig of CLIENT_CONFIGS) {
    console.log(`\n📦 Extracting from ${clientConfig.id} (${clientConfig.language})...`);

    try {
      const result = await extractSignatures({
        client_id: clientConfig.id,
        language: clientConfig.language,
      });

      console.log(`   ✓ Total signatures available: ${result.total_count}`);

      // Map signatures to commands
      let foundCount = 0;
      for (const cmd of ALL_COMMANDS) {
        const cmdLower = cmd.toLowerCase();
        const aliases = COMMAND_ALIASES[cmdLower] || [cmdLower];

        // Determine expected source context based on command type
        const isJsonCommand = cmd.startsWith('JSON.');

        let sigs = result.signatures.filter(s => {
          const methodLower = s.method_name.toLowerCase();
          // First check method name matches
          if (!aliases.includes(methodLower)) {
            return false;
          }

          const sigContext = (s as any).source_context || 'core';
          const isJsonPrefixedMethod = methodLower.startsWith('json');

          if (isJsonCommand) {
            // For JSON commands:
            // - JSON-prefixed methods (jsonSet, JSONGet, etc.) can come from ANY source context
            // - Non-prefixed methods (set, get, etc.) must come from JSON source context
            if (!isJsonPrefixedMethod && sigContext !== 'json') {
              return false;
            }
          } else {
            // For core commands:
            // - Never accept from JSON source context (to avoid string SET matching json set)
            if (sigContext === 'json') {
              return false;
            }
          }

          return true;
        });

        // Filter out signatures from wrong class contexts (e.g., BitFieldOperation.set vs Redis.set)
        // Bitfield operations have 'fmt' as first param and use BitfieldOffsetT type
        sigs = sigs.filter(s => {
          const params = s.parameters || [];
          if (params.length === 0) return true;

          const firstParam = params[0];
          const firstParamName = typeof firstParam === 'string'
            ? firstParam.split(':')[0].trim().toLowerCase()
            : (firstParam.name || '').toLowerCase();
          const firstParamType = typeof firstParam === 'string'
            ? (firstParam.split(':')[1] || '').trim().toLowerCase()
            : (firstParam.type || '').toLowerCase();

          // Exclude bitfield-specific signatures (first param is 'fmt' with BitfieldOffsetT type nearby)
          if (firstParamName === 'fmt' && params.some(p => {
            const pType = typeof p === 'string'
              ? (p.split(':')[1] || '').trim().toLowerCase()
              : (p.type || '').toLowerCase();
            return pType.includes('bitfieldoffset');
          })) {
            return false;
          }

          return true;
        });

        if (sigs.length > 0) {
          foundCount++;
          mapping[cmd].api_calls[clientConfig.id] = sigs.slice(0, 5).map(sig => ({
            signature: sig.signature,
            params: sig.parameters?.map((p: any) => ({
              name: typeof p === 'string' ? p.split(':')[0].trim() : (p.name || ''),
              type: typeof p === 'string' ? (p.split(':')[1]?.trim() || 'any') : (p.type || 'any'),
              description: typeof p === 'object' ? (p.description || '') : ''
            })) || [],
            returns: sig.return_type ? {
              type: sig.return_type,
              description: (sig as any).return_description || ''
            } : undefined
          }));
        }
      }
      console.log(`   📊 Commands matched: ${foundCount}/${ALL_COMMANDS.length}`);
    } catch (error) {
      console.log(`   ⚠ Error extracting from ${clientConfig.id}: ${error}`);
    }
  }

  // Save to data/command-api-mapping.json (relative to workspace root)
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  // From src/ we need to go up to mcp-server/node, then to mcp-server, then to command_api_mapping, then to build, then to workspace root
  const outputPath = path.resolve(currentDir, '../../../../../data/command-api-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 EXTRACTION SUMMARY');
  console.log('='.repeat(60));
  let totalWithClients = 0;
  for (const cmd of ALL_COMMANDS) {
    const clientCount = Object.keys(mapping[cmd].api_calls).length;
    if (clientCount > 0) totalWithClients++;
    const status = clientCount > 0 ? '✓' : '✗';
    console.log(`${status} ${cmd.padEnd(20)} - ${clientCount} clients`);
  }
  console.log('='.repeat(60));
  console.log(`\n✅ Extracted ${totalWithClients}/${ALL_COMMANDS.length} commands`);
  console.log(`📁 Saved to: ${outputPath}`);
}

extractCommandApiMapping();

