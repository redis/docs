// EXAMPLE: cmds_hash
using StackExchange.Redis;
using Xunit;

namespace Doc;

public class CmdsHashExample
{
    [Fact]
    public void Run()
    {
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
        // Clear any keys here before using them in tests.
        db.KeyDelete("myhash");

        // STEP_START hdel
        bool hdelRes1 = db.HashSet("myhash", "field1", "foo");

        RedisValue hdelRes2 = db.HashDelete("myhash", "field1");
        Console.WriteLine(hdelRes2);    // >>> 1

        RedisValue hdelRes3 = db.HashDelete("myhash", "field1");
        Console.WriteLine(hdelRes3);    // >>> 0

        // STEP_END
        Assert.True(hdelRes1);
        Assert.Equal(1, hdelRes2);
        Assert.Equal(0, hdelRes3);
        db.KeyDelete("myhash");

        // STEP_START hget
        bool hgetRes1 = db.HashSet("myhash", "field1", "foo");

        RedisValue hgetRes2 = db.HashGet("myhash", "field1");
        Console.WriteLine(hgetRes2);    // >>> foo

        RedisValue hgetRes3 = db.HashGet("myhash", "field2");
        Console.WriteLine(hgetRes3);    // >>> Null

        // STEP_END
        Assert.True(hgetRes1);
        Assert.Equal("foo", hgetRes2);
        Assert.Equal(RedisValue.Null, hgetRes3);
        db.KeyDelete("myhash");

        // STEP_START hset
        bool hsetRes1 = db.HashSet("myhash", "field1", "Hello");
        RedisValue hsetRes2 = db.HashGet("myhash", "field1");
        Console.WriteLine(hsetRes2);    // >>> Hello

        db.HashSet(
            "myhash",
            [
                new("field2", "Hi"),
                new("field3", "World")
            ]
        );

        RedisValue hsetRes3 = db.HashGet("myhash", "field2");
        Console.WriteLine(hsetRes3);    // >>> Hi

        RedisValue hsetRes4 = db.HashGet("myhash", "field3");
        Console.WriteLine(hsetRes4);    // >>> World

        HashEntry[] hsetRes5 = db.HashGetAll("myhash");
        Console.WriteLine($"{string.Join(", ", hsetRes5.Select(h => $"{h.Name}: {h.Value}"))}");
        // >>> field1: Hello, field2: Hi, field3: World

        // STEP_END
        Assert.True(hsetRes1);
        Assert.Equal("Hello", hsetRes2);
        Assert.Equal("Hi", hsetRes3);
        Assert.Equal("World", hsetRes4);
        Assert.Equal(
            "field1: Hello, field2: Hi, field3: World",
            string.Join(", ", hsetRes5.Select(h => $"{h.Name}: {h.Value}"))
        );
        db.KeyDelete("myhash");

        // STEP_START hgetall
        db.HashSet("myhash",
            [
                new("field1", "Hello"),
                new("field2", "World")
            ]
        );

        HashEntry[] hGetAllResult = db.HashGetAll("myhash");
        Array.Sort(hGetAllResult, (a1, a2) => a1.Name.CompareTo(a2.Name));
        Console.WriteLine(
            string.Join(", ", hGetAllResult.Select(e => $"{e.Name}: {e.Value}"))
        );
        // >>> field1: Hello, field2: World
        // STEP_END
        Assert.Equal("field1: Hello, field2: World", string.Join(", ", hGetAllResult.Select(e => $"{e.Name}: {e.Value}")));
        db.KeyDelete("myhash");

        // STEP_START hvals
        db.HashSet("myhash",
            [
                new("field1", "Hello"),
                new("field2", "World")
            ]
        );

        RedisValue[] hValsResult = db.HashValues("myhash");
        Array.Sort(hValsResult);
        Console.WriteLine(string.Join(", ", hValsResult));
        // >>> Hello, World
        // STEP_END
        Assert.Equal("Hello, World", string.Join(", ", hValsResult));
    }
}
