// =============================================================================
// CANONICAL StackExchange.Redis (SE.Redis) TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for the SE.Redis
// documentation tabs. These tests serve dual purposes:
// 1. Executable xunit tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// CRITICAL — WHICH TAB THIS FEEDS:
// The "C#-Sync (SE.Redis)" and "C#-Sync (NRedisStack)" docs tabs are fed from the
// SAME directory in the NRedisStack repo (tests/Doc). They are separated by a
// content filter on whether the file imports NRedisStack:
//     this file must NOT contain `using NRedisStack`  -> SE.Redis tab
//     a file that DOES import it                      -> NRedisStack tab
// `using NRedisStack.Tests` is excluded from that test — every file has it for the
// test fixtures. Adding an NRedisStack import to this file silently moves the
// finished example into the wrong tab.
//
// RUN: dotnet test tests/Doc --filter FullyQualifiedName~SampleExample
// =============================================================================

// EXAMPLE: sample_example
// HIDE_START
using StackExchange.Redis;
// HIDE_END
// REMOVE_START
using NRedisStack.Tests;

namespace Doc;

[Collection("DocsTests")]
// REMOVE_END

// HIDE_START
public class SampleExample
// REMOVE_START
    : AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public SampleExample(EndpointsFixture fixture) : base(fixture) { }

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
        db.KeyDelete("mykey");
        db.KeyDelete("myhash");
        db.KeyDelete("bike:1:stats");
        // REMOVE_END
        // HIDE_END

        // STEP_START string_ops
        bool res1 = db.StringSet("mykey", "Hello");
        Console.WriteLine(res1);    // >>> True

        RedisValue res2 = db.StringGet("mykey");
        Console.WriteLine(res2);    // >>> Hello
        // STEP_END

        // REMOVE_START
        Assert.True(res1);
        Assert.Equal("Hello", res2);
        db.KeyDelete("mykey");
        // REMOVE_END

        // STEP_START hash_ops
        // HashSet with a single field returns true only when the field is NEW.
        bool res3 = db.HashSet("myhash", "field1", "value1");
        Console.WriteLine(res3);    // >>> True

        // The multi-field overload returns void, not a count.
        db.HashSet("myhash",
            [
                new("field2", "value2"),
                new("field3", "value3")
            ]
        );

        RedisValue res4 = db.HashGet("myhash", "field1");
        Console.WriteLine(res4);    // >>> value1

        // A missing field yields RedisValue.Null, which prints as an empty string.
        RedisValue res5 = db.HashGet("myhash", "nofield");
        Console.WriteLine(res5.IsNull);    // >>> True

        HashEntry[] res6 = db.HashGetAll("myhash");
        Console.WriteLine(string.Join(", ", res6.Select(h => $"{h.Name}: {h.Value}")));
        // >>> field1: value1, field2: value2, field3: value3
        // STEP_END

        // REMOVE_START
        Assert.True(res3);
        Assert.Equal("value1", res4);
        Assert.True(res5.IsNull);
        Assert.Equal(3, res6.Length);
        db.KeyDelete("myhash");
        // REMOVE_END

        // STEP_START numeric_ops
        db.HashSet("bike:1:stats", "rides", 0);
        long res7 = db.HashIncrement("bike:1:stats", "rides", 1);
        Console.WriteLine(res7);    // >>> 1

        long res8 = db.HashIncrement("bike:1:stats", "rides", 1);
        Console.WriteLine(res8);    // >>> 2
        // STEP_END

        // REMOVE_START
        Assert.Equal(1, res7);
        Assert.Equal(2, res8);
        db.KeyDelete("bike:1:stats");
        // REMOVE_END

        // HIDE_START
        muxer.Close();
    }
}
// HIDE_END
