// EXAMPLE: landing
// BINDER_ID netsync-landing
// STEP_START import
using NRedisStack;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;
// STEP_END
// REMOVE_START
using NRedisStack.Tests;

namespace Doc;

[Collection("DocsTests")]
// REMOVE_END

public class SyncLandingExample
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public SyncLandingExample(EndpointsFixture fixture) : base(fixture) { }

    [SkippableFact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        // This is needed because we're constructing ConfigurationOptions in the test before calling GetConnection
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        // STEP_START connect
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
        // STEP_END
        //REMOVE_START
        // Clear any keys here before using them in tests.
        db.KeyDelete(new RedisKey[] { "bike:1", "foo", "user-session:123" });
        //REMOVE_END

        // STEP_START set_get_string
        db.StringSet("foo", "bar");
        Console.WriteLine(db.StringGet("foo")); // >>> bar
        // STEP_END

        // STEP_START set_get_hash
        var hash = new HashEntry[] {
            new HashEntry("name", "John"),
            new HashEntry("surname", "Smith"),
            new HashEntry("company", "Redis"),
            new HashEntry("age", "29"),
        };
        db.HashSet("user-session:123", hash);

        var hashFields = db.HashGetAll("user-session:123");
        Console.WriteLine(String.Join("; ", hashFields));
        // >>> name: John; surname: Smith; company: Redis; age: 29
        // STEP_END
    }
}

