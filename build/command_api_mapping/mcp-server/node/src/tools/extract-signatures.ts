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
  // Python
  'redis_py': { paths: ['redis/commands/core.py'], language: 'python' },
  'redisvl': { paths: ['redisvl/redis/connection.py'], language: 'python' },

  // Java
  'jedis': { paths: ['src/main/java/redis/clients/jedis/Jedis.java'], language: 'java' },
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
    ],
    language: 'go'
  },

  // TypeScript/Node.js - node-redis has each command in separate files
  'node_redis': {
    paths: [
      'packages/client/lib/commands/GET.ts',
      'packages/client/lib/commands/SET.ts',
      'packages/client/lib/commands/DEL.ts',
      'packages/client/lib/commands/LPUSH.ts',
      'packages/client/lib/commands/RPUSH.ts',
      'packages/client/lib/commands/LPOP.ts',
      'packages/client/lib/commands/RPOP.ts',
      'packages/client/lib/commands/LRANGE.ts',
      'packages/client/lib/commands/LLEN.ts',
      'packages/client/lib/commands/SADD.ts',
      'packages/client/lib/commands/SREM.ts',
      'packages/client/lib/commands/SMEMBERS.ts',
      'packages/client/lib/commands/SISMEMBER.ts',
      'packages/client/lib/commands/HSET.ts',
      'packages/client/lib/commands/HGET.ts',
      'packages/client/lib/commands/HGETALL.ts',
      'packages/client/lib/commands/HDEL.ts',
      'packages/client/lib/commands/ZADD.ts',
      'packages/client/lib/commands/ZRANGE.ts',
      'packages/client/lib/commands/ZREM.ts',
      'packages/client/lib/commands/ZSCORE.ts',
      'packages/client/lib/commands/INCR.ts',
      'packages/client/lib/commands/DECR.ts',
      'packages/client/lib/commands/EXPIRE.ts',
      'packages/client/lib/commands/TTL.ts',
      'packages/client/lib/commands/MGET.ts',
      'packages/client/lib/commands/MSET.ts',
      'packages/client/lib/commands/KEYS.ts',
      'packages/client/lib/commands/SCAN.ts',
      'packages/client/lib/commands/EXISTS.ts',
      'packages/client/lib/commands/TYPE.ts',
      'packages/client/lib/commands/PING.ts',
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
    paths: ['src/NRedisStack/CoreCommands/CoreCommands.cs'],
    language: 'csharp',
    externalSources: [
      {
        git_uri: 'https://github.com/StackExchange/StackExchange.Redis',
        paths: [
          'src/StackExchange.Redis/Interfaces/IDatabase.cs',
          'src/StackExchange.Redis/Interfaces/IDatabaseAsync.cs',
          'src/StackExchange.Redis/RedisDatabase.cs',
        ],
      },
    ],
  },
  'nredisstack_async': {
    paths: ['src/NRedisStack/CoreCommands/CoreCommandsAsync.cs'],
    language: 'csharp',
    externalSources: [
      {
        git_uri: 'https://github.com/StackExchange/StackExchange.Redis',
        paths: [
          'src/StackExchange.Redis/Interfaces/IDatabaseAsync.cs',
          'src/StackExchange.Redis/Interfaces/IDatabase.cs',
          'src/StackExchange.Redis/RedisDatabase.cs',
        ],
      },
    ],
  },

  // PHP - Predis uses ClientInterface for all method signatures
  'php': { paths: ['src/ClientInterface.php'], language: 'php' },
};

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
          // Add a special comment that our TypeScript parser can detect
          return `// __NODE_REDIS_COMMAND__:${commandName}\n${chunk.code}`;
        }).join('\n\n');
      } else {
        // Combine all source code normally
        code = codeChunks.map(c => c.code).join('\n\n');
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

        // Rename parseCommand methods to their command names
        rawSignatures = rawSignatures.map(sig => {
          if (sig.method_name === 'parseCommand' && lineToCommand[sig.line_number]) {
            const commandName = lineToCommand[sig.line_number];
            return {
              ...sig,
              method_name: commandName,
              signature: sig.signature.replace('parseCommand', commandName),
            };
          }
          return sig;
        });

        // Filter out duplicate command names and non-command methods
        const seenCommands = new Set<string>();
        rawSignatures = rawSignatures.filter(sig => {
          // Skip non-command methods (like 'if', 'constructor', etc.)
          if (['parseCommand', 'transformArguments', 'transformReply', 'constructor'].includes(sig.method_name)) {
            return false;
          }
          // Skip duplicates
          if (seenCommands.has(sig.method_name)) {
            return false;
          }
          // Only keep uppercase command names (like GET, SET, etc.)
          if (sig.method_name && /^[A-Z_]+$/.test(sig.method_name)) {
            seenCommands.add(sig.method_name);
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
          // Remove modifiers like "final"
          let cleaned = trimmed.replace(/^(final|readonly|ref|out|in|params)\s+/gi, '');
          // Remove default value assignment (e.g., "= CommandFlags.None")
          cleaned = cleaned.replace(/\s*=\s*[^,]+$/, '');
          const parts = cleaned.split(/\s+/);
          if (parts.length >= 2) {
            const name = parts.pop() || '';
            const type = parts.join(' ');
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
            description: getParamDescription(doc, name),
          };
        }),
        return_type: sig.return_type || "Any",
        return_description: getReturnDescription(doc),
        line_number: sig.line_number,
        is_async: sig.is_async,
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

