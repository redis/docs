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
- **House-style format (matches existing entries — important):** the `signature` string carries
  **no return-type suffix** (write `arSet(key: RedisArgument, index: number | string, value: RedisVariadicArgument)`,
  not `...): Promise<NumberReply>`), and `returns.type` is the **bare reply type without the
  `Promise<>` wrapper** (`NumberReply`, `ArrayReply<BlobStringReply | NullReply>`). Keep the
  node-redis RESP types verbatim (`RedisArgument`, `NumberReply`, custom option/reply types like
  `ArGrepOptions`, `ArScanReply`).
- **Suffix-variant files fold into the base command, they are not separate command files.**
  `ARGREP_WITHVALUES.ts` is the WITHVALUES form of `ARGREP` (no such Redis command as
  `ARGREP_WITHVALUES`). Put both `arGrep` and `arGrepWithValues` as two signature objects in
  the single `ARGREP.json`. Cross-check the canonical command list in `data/commands*.json`
  before creating a file — if the name isn't there, it's a variant to fold, not a new file.

## redis_py (Python)
- Method names are the command lowercased with **no word separators** (`arset`, `arget`,
  `argetrange`, `arlastitems` — not `ar_set`). Verify against the source; don't assume snake_case
  splits.
- New command families get a `Commands` mixin class in `redis/commands/core.py` (e.g.
  `ArrayCommands`); module commands live in separate mixins under
  `redis/commands/{json,search,timeseries,vectorset}/commands.py`. Methods carry `@overload`
  stubs for sync/async — read the concrete `def` (the implementation), not the overloads.
- House style (matches existing entries): signature = `method(typed params)` with `self`
  stripped and **no return annotation**; varargs keep the star (`*values`, type `FieldT`;
  `**kwargs`, type `Any`). `returns.type` is the **simplified base type** (`list`, `dict`, `int`)
  or a meaningful scalar union (`bytes | str | None`, `int | None`); do **not** carry the
  `X | Awaitable[X]` union — record the plain sync type.
- **Descriptions are left `""`.** redis-py docstrings are prose paragraphs, not structured
  `@param`/`@return` tags, and existing redis_py entries leave descriptions empty — don't
  hand-extract prose into per-param fields.
- redis-py exposes **one method per command**, folding options into params (`argrep` has
  `withvalues`/`nocase` flags; `arop` takes `operation` + optional `value`) — unlike Lettuce,
  which splits these into separate named methods.

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
- New command families get a dedicated interface trio:
  `src/main/java/io/lettuce/core/api/{sync,async,reactive}/Redis<Area>Commands.java`
  (e.g. the array type is `RedisArrayCommands.java` / `RedisArrayAsyncCommands.java` /
  `RedisArrayReactiveCommands.java`). Signature format: `ReturnType methodName(Type param)`
  (return type leads); params are `Type name` (no `$`), varargs type keeps the `...`
  (`V... values` → name `values`, type `V...`).
- **async = `RedisFuture<syncType>`** — a clean mechanical wrap of the sync return.
- **reactive is NOT a mechanical wrap — read the reactive interface.** Scalars become
  `Mono<T>`, but lists vary: a nullable-element list becomes `Flux<Value<V>>` (Lettuce's
  null-safe wrapper, e.g. `armget`, `argetrange`), a non-null list becomes `Flux<V>`
  (`arlastitems`), and typed-pair lists become `Flux<IndexedValue<V>>`. Don't guess these.
- **One Redis command often maps to several Lettuce methods.** Lettuce expands options/modes
  into distinct named methods: `AROP` → `aropAggregate`, `aropBitwise`, `aropCount` (×2);
  `ARGREP` WITHVALUES → `argrepWithValues`; `ARINFO` FULL → `arinfoFull`; plus normal
  varargs/scalar overloads (`arset`, `ardel`, `arinsert`, …). List them all in the command's file.
- **JavaDoc is present and rich** → populate param (`@param`) and return (`@return`)
  descriptions. The description text is **shared verbatim across all three variants** — only the
  `returns.type` differs (sync `V` / async `RedisFuture<V>` / reactive `Mono<V>`).

## nredisstack_sync / nredisstack_async (C#)
- PascalCase methods; async variants end in `Async` and return `Task<T>`.
- **Core commands aren't in NRedisStack** — they're in StackExchange.Redis (`IDatabase.cs` /
  `IDatabaseAsync.cs`). Module commands (JSON/Search/TimeSeries) are in NRedisStack.
- XML doc comments (`<summary>`, `<param>`, `<returns>`) → descriptions; strip `<see cref=…>`.
- Drop trailing `CommandFlags flags = CommandFlags.None` optional param or note it.

## php (predis)
- **`@method` docblocks in `src/ClientInterface.php` are the authoritative, complete source** —
  including for new command families. Each line is `returnType methodname(typed $params...)`,
  e.g. `int arset(string $key, int $index, string ...$value)`. Author directly from these;
  no need to read the command classes under `src/Command/Redis/`.
- House style (matches existing entries): method name **lowercase**; `signature` is
  `methodname(params)` with **no return type**; `params` keep the leading `$`, `type` is the
  declared PHP type with the variadic `...` dropped (`int ...$index` → name `$index`, type `int`),
  untyped params (`$matchValue = null`) → type `mixed`; `returns.type` = the bare `@method`
  return type (`int`, `array`, `string|null`, `mixed`).
- Predis folds option flags into params rather than separate variants (e.g. `argrep` has a
  `bool $withValues` param — no separate WITHVALUES method).
- Container commands (XGROUP/XINFO) expose subcommands via `@method` entries in
  `src/Command/Container/`. PHPDoc descriptions when present.

## redis_rs_sync / redis_rs_async (Rust)
- snake_case methods inside the `implement_commands!` macro. Drop `&self`/`&mut self`.
- Return type is generally `RedisResult<T>` (sync) / a future of it (async).
- `///` doc comments → descriptions when present.

## General
- **Never invent descriptions.** Empty string beats a plausible-but-unverified sentence.
- **Confirm the command exists** in the client before adding it; preview commands may be
  master-only or absent. Omit absent clients.
- When you discover a new quirk, add it here.
