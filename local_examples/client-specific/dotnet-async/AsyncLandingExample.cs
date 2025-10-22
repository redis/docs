// EXAMPLE: landing
// BINDER_ID netasync-landing
// STEP_START import
using NRedisStack;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;
// STEP_END
// REMOVE_START
using NRedisStack.Tests;
using System.Threading.Tasks;

namespace Doc;

[Collection("DocsTests")]
// REMOVE_END

public class AsyncLandingExample
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public AsyncLandingExample(EndpointsFixture fixture) : base(fixture) { }

    [SkippableFact]
    // REMOVE_END
    public async Task Run()
    {
        //REMOVE_START
        // This is needed because we're constructing ConfigurationOptions in the test before calling GetConnection
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        // STEP_START connect
        var muxer = await ConnectionMultiplexer.ConnectAsync("localhost:6379");
        var db = muxer.GetDatabase();
        // STEP_END
        //REMOVE_START
        // Clear any keys here before using them in tests.
        await db.KeyDeleteAsync(new RedisKey[] { "bike:1", "foo", "user-session:123" });
        //REMOVE_END

        // STEP_START set_get_string
        await db.StringSetAsync("foo", "bar");
        string? fooResult = await db.StringGetAsync("foo");
        Console.WriteLine(fooResult); // >>> bar
        // STEP_END

        // STEP_START set_get_hash
        var hash = new HashEntry[] { 
            new HashEntry("name", "John"), 
            new HashEntry("surname", "Smith"),
            new HashEntry("company", "Redis"),
            new HashEntry("age", "29"),
            };
        await db.HashSetAsync("user-session:123", hash);

        var hashFields = await db.HashGetAllAsync("user-session:123");
        Console.WriteLine(String.Join("; ", hashFields));
        // >>> name: John; surname: Smith; company: Redis; age: 29
        // STEP_END
    }
}

