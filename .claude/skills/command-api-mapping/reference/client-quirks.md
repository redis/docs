# Client quirks — turning source into a mapping row

Per-client rules for the judgment steps a parser can't do: the public method name, the real
return type, which params to drop, and whether descriptions even exist.

## node_redis (TypeScript) — the trickiest, read this first

Command files look like:

```ts
export default {
  IS_READ_ONLY: true,
  parseCommand(parser: CommandParser, key: RedisArgument, index: number | string) {
    parser.push('ARGET'); parser.pushKey(key); parser.push(index.toString());
  },
  transformReply: undefined as unknown as () => BlobStringReply | NullReply
} as const satisfies Command;
```

Translation rules:
- **Method name = camelCase of the filename**, not `parseCommand`. `ARGET.ts` → `arGet`,
  `ARGETRANGE.ts` → `arGetRange`, `ARSET.ts` → `arSet`. (node-redis generates the public
  method from the filename.)
- **Drop the first `parser: CommandParser` param** — it's internal.
- **Keep the remaining params** with their types (`key: RedisArgument`, `index: number | string`).
  These RESP types (`RedisArgument`, `RedisVariadicArgument`) are what users effectively pass;
  keep them as-is.
- **Return type comes from `transformReply`**, not a return annotation. The type after
  `() =>` is the reply (`NumberReply`, `BlobStringReply | NullReply`, …). Render the signature
  return as `Promise<...>` of that reply where it reads naturally.
- **No doc comments exist** — all `description` fields are `""`.
- Suffix-variant files (`ARGREP_WITHVALUES.ts`) are overloads/options of the base command;
  decide whether they're a separate row or fold into the base.

## redis_py (Python)
- snake_case methods (`ar_set`, `ar_get`). Signature without the `def`/`self`.
- Google-style docstrings when present → param/return descriptions. Many core methods have none.
- Module commands live in separate mixins (json/search/timeseries/vectorset).

## go-redis (Go)
- PascalCase methods, usually `AR`-prefixed mirroring the command (`ARSet`, `ARGet`); confirm
  against source. Drop the `ctx context.Context` first param from `params` (it's context).
- Return type is a `*XxxCmd` wrapper (`*StringCmd`, `*IntCmd`); keep it as the return type.
- Doc comments are sparse `//` lines; often empty descriptions.

## jedis (Java, sync)
- camelCase methods. Signature is `ReturnType methodName(Type param)`. Strip `final` modifiers.
- JavaDoc present on many methods → descriptions; clean `{@link}`/`{@code}`/`<code>` markup to
  plain text.
- Often multiple overloads (with/without optional args) — include the meaningful ones, skip
  byte[]-vs-String duplicates.

## lettuce_sync / lettuce_async / lettuce_reactive (Java)
- Same method names and params across the three; **only the return wrapper differs**:
  sync `V`, async `RedisFuture<V>`, reactive `Mono<V>`/`Flux<V>`.
- Read the sync interface, then mechanically wrap the return type for the other two.
- JavaDoc present → descriptions (often shared across variants).

## nredisstack_sync / nredisstack_async (C#)
- PascalCase methods; async variants end in `Async` and return `Task<T>`.
- **Core commands aren't in NRedisStack** — they're in StackExchange.Redis (`IDatabase.cs` /
  `IDatabaseAsync.cs`). Module commands (JSON/Search/TimeSeries) are in NRedisStack.
- XML doc comments (`<summary>`, `<param>`, `<returns>`) → descriptions; strip `<see cref=…>`.
- Drop trailing `CommandFlags flags = CommandFlags.None` optional param or note it.

## php (predis)
- camelCase methods. Most signatures come from `@method` docblocks in `ClientInterface.php`
  rather than concrete methods. Container commands (XGROUP/XINFO) expose subcommands via
  `@method` entries in `src/Command/Container/`.
- PHPDoc descriptions when present.

## redis_rs_sync / redis_rs_async (Rust)
- snake_case methods inside the `implement_commands!` macro. Drop `&self`/`&mut self`.
- Return type is generally `RedisResult<T>` (sync) / a future of it (async).
- `///` doc comments → descriptions when present.

## General
- **Never invent descriptions.** Empty string beats a plausible-but-unverified sentence.
- **Confirm the command exists** in the client before adding it; preview commands may be
  master-only or absent. Omit absent clients.
- When you discover a new quirk, add it here.
