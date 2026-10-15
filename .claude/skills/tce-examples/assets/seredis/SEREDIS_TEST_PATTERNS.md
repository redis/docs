# StackExchange.Redis (SE.Redis) Test File Patterns

Conventions for the **`C#-Sync (SE.Redis)`** and **`C#-Async (SE.Redis)`** documentation tabs.
For examples that use NRedisStack's module APIs, see `../nredisstack/`.

## The thing to get right first: which tab this feeds

The two C# client families are **not two codebases**. Both are fed from the same directory in
the `NRedisStack` repo (`tests/Doc`), and `data/components/` partitions them with a content
filter on a single import:

| The file… | feeds |
|---|---|
| does **not** contain `using NRedisStack` | the **SE.Redis** tabs |
| **does** contain `using NRedisStack` | the **NRedisStack** tabs |

`using NRedisStack.Tests` is explicitly excluded from that test, because every file in
`tests/Doc` has it for the test fixtures.

So an SE.Redis example is defined by what it *doesn't* import. Adding an NRedisStack import —
even an unused one, even while debugging — silently relocates the finished example to the
other tab. Both flavours share identical test scaffolding, so nothing fails; the example just
appears in the wrong place.

Most command-page C# examples belong here, not in `../nredisstack/`: plain string, hash, list,
set, and sorted-set commands need only SE.Redis. Reach for NRedisStack when the example uses
a module API (JSON, search, time series, probabilistic types).

## File Locations

- **Staging**: `local_examples/<set>/seredis/*.cs`
- **Upstream**: `NRedisStack` repo, `tests/Doc/` (sync) and `tests/Doc/Async/` (async)
- **Sample template**: `sample_test.cs` (in this directory)

> The async component config points at `tests/Doc/Async/`, which does not currently exist in
> the clone. An async example is the first thing that would need that directory created.

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// BINDER_ID <id>` | Optional identifier for online code runners |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## File Structure Template

The scaffolding is fixed — copy it exactly. It is what lets the same file be both a real
xunit test in the NRedisStack repo and a clean snippet on the docs page.

```csharp
// EXAMPLE: cmds_hash
// HIDE_START
using StackExchange.Redis;
// HIDE_END
// REMOVE_START
using NRedisStack.Tests;

namespace Doc;

[Collection("DocsTests")]
// REMOVE_END

// HIDE_START
public class CmdsHashExample
// REMOVE_START
    : AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public CmdsHashExample(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        // REMOVE_START
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        // REMOVE_END
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
        // REMOVE_START
        db.KeyDelete("myhash");
        // REMOVE_END
        // HIDE_END

        // STEP_START hset
        bool res1 = db.HashSet("myhash", "field1", "value1");
        Console.WriteLine(res1);    // >>> True
        // STEP_END

        // REMOVE_START
        Assert.True(res1);
        db.KeyDelete("myhash");
        // REMOVE_END

        // HIDE_START
        muxer.Close();
    }
}
// HIDE_END
```

## Key Patterns

### 1. The fixture API is `EndpointsFixture`, not `RedisFixture`

The current NRedisStack test base takes an `EndpointsFixture` and its helpers take an
`Env` argument:

```csharp
public CmdsHashExample(EndpointsFixture fixture) : base(fixture) { }
...
SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
```

Older docs and older examples show `RedisFixture`, a no-argument
`SkipIfTargetConnectionDoesNotExist()`, and `GetCleanDatabase(muxer)`. Those no longer
compile.

### 2. The example creates its own multiplexer

Even though the fixture can hand you a database, the snippet on the docs page has to show a
reader how to connect. So `GetCleanDatabase(...)` is called and discarded into `var _`, and
the visible code does its own `ConnectionMultiplexer.Connect(...)`.

### 3. The method is `Run()`, capitalised

`[Fact]` sits inside the `REMOVE` block immediately above it, so the docs show a plain method
and the test runner still finds it. If the `[Fact]` ends up removed or commented,
`dotnet test` matches nothing and **still exits 0** — the generated C# wrapper now treats
`No test matches` as a failure for exactly this reason.

### 4. Return types are specific, and not always what you'd guess

```csharp
bool res1 = db.StringSet("mykey", "Hello");        // bool, not "OK"
bool res2 = db.HashSet("myhash", "f", "v");        // true only when the field is NEW
       db.HashSet("myhash", [new("f2","v2")]);     // multi-field overload returns VOID
RedisValue res3 = db.HashGet("myhash", "f");       // RedisValue, not string
long res4 = db.HashIncrement("myhash", "n", 1);    // long
HashEntry[] res5 = db.HashGetAll("myhash");        // HashEntry[], not a dictionary
```

### 5. A missing value is `RedisValue.Null`, which prints as empty

`Console.WriteLine(db.HashGet("myhash", "nofield"))` prints **nothing** — an empty line. That
makes a bare `// >>> ` comment ambiguous for the reader, so print the check instead:

```csharp
RedisValue res = db.HashGet("myhash", "nofield");
Console.WriteLine(res.IsNull);    // >>> True
```

### 6. Collections need explicit formatting

There is no useful `ToString()` for `HashEntry[]` or `RedisValue[]`. Project and join, and
make the `>>>` comment match the joined form exactly:

```csharp
HashEntry[] res = db.HashGetAll("myhash");
Console.WriteLine(string.Join(", ", res.Select(h => $"{h.Name}: {h.Value}")));
// >>> field1: value1, field2: value2, field3: value3
```

### 7. Async flavour

The async tabs use the `*Async` methods and `await`, with the class method as
`public async Task Run()`. Same scaffolding, `namespace Doc;` unchanged, package directory
`tests/Doc/Async/`.

## Running Tests

```bash
# Portable: xunit + SE.Redis 3.0.0, with dotnet/stubs.cs standing in for the fixtures
build/example-test-harness/run.sh cmds_hash seredis

# Fidelity: inside the NRedisStack clone, against its real Doc.csproj and real fixtures
build/example-test-harness/run.sh --fidelity cmds_hash seredis
```

Both C# flavours share the `dotnet` runner — the flavour distinction is about which docs tab
the file feeds, not about how it is tested.

`sample_test.cs` in this directory has been compiled and run against **SE.Redis 3.0.0** on
Redis 8.10 (1 test, passing); its `>>>` comments are the real observed output.

> Portable mode pins SE.Redis 3.0.0 / xunit 2.9.2 / net9.0; the real `Doc.csproj` uses
> SE.Redis 3.0.25 / xunit.v3 / `net8.0;net10.0;net481`. `[Fact]` and `[Collection]` behave the
> same across those, but fidelity mode is the one that proves it.

## See Also

- `../nredisstack/NREDISSTACK_TEST_PATTERNS.md` — the module-API flavour
- `build/example-test-harness/dotnet/stubs.cs` — what portable mode substitutes for the fixtures
- `build/example-test-harness/clients.tsv` — filename convention and paths
- `for-ais-only/tcedocs/SPECIFICATION.md` — full marker semantics
