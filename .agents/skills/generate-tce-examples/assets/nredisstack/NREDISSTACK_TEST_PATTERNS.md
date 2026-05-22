# NRedisStack Test File Patterns

This document describes the conventions used in NRedisStack documentation test files.

## Purpose

These test files serve dual purposes:
1. **Executable xUnit tests** - Validate code snippets work correctly
2. **Documentation source** - Code is extracted for redis.io documentation

## File Locations

- **Original tests**: `/path/to/NRedisStack/tests/Doc/*.cs`
- **Sample template**: `nredisstack_sample_test.cs` (in this directory)

## Marker Reference

| Marker | Purpose |
|--------|---------|
| `// EXAMPLE: <name>` | Identifies example name (matches docs folder) |
| `// BINDER_ID <id>` | Optional identifier for online code runners |
| `// HIDE_START` / `// HIDE_END` | Code hidden from docs but still executed |
| `// REMOVE_START` / `// REMOVE_END` | Code completely removed from docs |
| `// STEP_START <name>` / `// STEP_END` | Named section for targeted doc inclusion |

## Class Structure Template

```csharp
// EXAMPLE: example_name
// BINDER_ID netsync-example_name

// Imports shown in documentation go here
using NRedisStack.RedisStackCommands;
using NRedisStack.Search;
using NRedisStack.Search.Aggregation;
using NRedisStack.Search.Literals.Enums;
using NRedisStack.Tests;
using StackExchange.Redis;

// REMOVE_START
namespace Doc;

[Collection("DocsTests")]
// REMOVE_END
public class ExampleClassName
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public ExampleClassName(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        // This is needed because we're constructing ConfigurationOptions in the test before calling GetConnection
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        // STEP_START connect
        // Get module command interfaces (hidden from docs)
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
        var ft = db.FT();      // Search/Query commands
        var json = db.JSON();  // JSON commands
        var bf = db.BF();      // Bloom filter commands
        // STEP_END

        // REMOVE_START
        // Test setup/cleanup (completely removed from docs)
        db.KeyDelete(["mykey", "user:1", "user:2"]);
        try { ft.DropIndex("idx:users"); } catch { }
        // REMOVE_END

        // STEP_START basic_string_ops
        bool setResult = db.StringSet("mykey", "Hello");
        Console.WriteLine(setResult);  // >>> True

        var getValue = db.StringGet("mykey");
        Console.WriteLine(getValue);   // >>> Hello
        // STEP_END

        // REMOVE_START
        Assert.True(setResult);
        Assert.Equal("Hello", getValue.ToString());
        // REMOVE_END

        // HIDE_START
        muxer.Close();
    }
}
```

## Module Command Interfaces

```csharp
var ft = db.FT();      // Search/Query (FT.* commands)
var json = db.JSON();  // JSON (JSON.* commands)
var bf = db.BF();      // Bloom filter
var cms = db.CMS();    // Count-min sketch
var cf = db.CF();      // Cuckoo filter
var tdigest = db.TDIGEST();
var ts = db.TS();      // Time series
var topk = db.TOPK();
```

## Key Patterns

### 1. Assertions (Always in REMOVE blocks)
```csharp
// REMOVE_START
Assert.True(result);
Assert.Equal("expected", actual);
Assert.Equal(3, collection.Length);
// REMOVE_END
```

### 2. Console Output Comments
Always include expected output as comments:
```csharp
Console.WriteLine(result);  // >>> True
Console.WriteLine(name);    // >>> Alice
```

### 3. Connection Setup
```csharp
var muxer = ConnectionMultiplexer.Connect("localhost:6379");
var db = muxer.GetDatabase();
```

### 4. Cleanup Before Tests
```csharp
db.KeyDelete(["mykey", "user:1"]);
try { ft.DropIndex("idx:users"); } catch { }
```

## Common Imports

```csharp
using NRedisStack.RedisStackCommands;
using NRedisStack.Search;
using NRedisStack.Search.Aggregation;
using NRedisStack.Search.Literals.Enums;
using NRedisStack.Tests;
using StackExchange.Redis;
```

Note: `Xunit` and test-specific imports are wrapped in `REMOVE_START/REMOVE_END` blocks.

## Project Setup (csproj)

```xml
<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFramework>net8.0</TargetFramework>
        <ImplicitUsings>enable</ImplicitUsings>
        <Nullable>enable</Nullable>
        <IsPackable>false</IsPackable>
        <IsTestProject>true</IsTestProject>
    </PropertyGroup>
    <ItemGroup>
        <PackageReference Include="NRedisStack" Version="1.3.0" />
        <PackageReference Include="StackExchange.Redis" Version="2.9.17" />
        <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.1" />
        <PackageReference Include="xunit" Version="2.9.2" />
        <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2">
            <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
            <PrivateAssets>all</PrivateAssets>
        </PackageReference>
    </ItemGroup>
</Project>
```

## Directory Structure

.NET requires test files to be in a project with a `.csproj` file:

```
examples/nredisstack/
├── nredisstack-examples.csproj
├── NREDISSTACK_TEST_PATTERNS.md
└── nredisstack_sample_test.cs
```

## Setup

### Prerequisites

- **.NET SDK 8.0+**: Download from [dotnet.microsoft.com](https://dotnet.microsoft.com/download)
- **Redis Stack**: Running on `localhost:6379`

### Quick Start

The project includes a pre-configured `.csproj` with all dependencies:

```bash
cd examples/nredisstack
dotnet restore
dotnet test
```

### Starting From Scratch

If creating a new standalone project:

```bash
# Create new xUnit test project
dotnet new xunit -n nredisstack-examples -f net8.0

# Add required packages
dotnet add package NRedisStack
dotnet add package StackExchange.Redis
```

## Running Tests

```bash
cd examples/nredisstack

# Run all tests (restores packages automatically if needed)
dotnet test

# Run tests with verbose output
dotnet test -v n

# Run a specific test class
dotnet test --filter "FullyQualifiedName~ExampleClassName"

# Run a specific test method
dotnet test --filter "FullyQualifiedName~ExampleClassName.Run"

# Run and see console output
dotnet test -v n --logger "console;verbosity=detailed"
```

### After Deleting bin/obj Directories

Simply run:

```bash
dotnet test
```

This automatically restores packages and rebuilds before running tests.

### Running Within the NRedisStack Repository

If working within the main NRedisStack repository:

```bash
cd clients/NRedisStack

# Run all doc tests
dotnet test -f net8.0 --filter "FullyQualifiedName~Doc"

# Run a specific example
dotnet test -f net8.0 --filter "FullyQualifiedName~Doc.CmdsHashExample"
```

## Test Class Inheritance

When running within the NRedisStack repository, test classes inherit from `AbstractNRedisStackTest`:

```csharp
// REMOVE_START
namespace Doc;

[Collection("DocsTests")]
// REMOVE_END
public class ExampleClassName
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public ExampleClassName(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        // ... actual test code
    }
}
```

This pattern ensures:
- Test infrastructure is hidden from documentation
- The `Run()` method appears as a simple standalone function in docs
- Connection setup and cleanup are handled by the test framework

## See Also

- Sample template: `examples/nredisstack/nredisstack_sample_test.cs`
- Hash example: `/path/to/NRedisStack/tests/Doc/CmdsHashExample.cs`
- String example: `/path/to/NRedisStack/tests/Doc/CmdsStringExample.cs`
