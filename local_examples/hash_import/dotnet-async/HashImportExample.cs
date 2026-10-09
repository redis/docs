// EXAMPLE: hash_import
// HIDE_START
using StackExchange.Redis;
// HIDE_END
// REMOVE_START
using NRedisStack.Tests;

namespace Doc;

[Collection("DocsTests")]
// REMOVE_END

// HIDE_START
public class AsyncHashImportExample
// REMOVE_START
    : AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public AsyncHashImportExample(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public async Task Run()
    {
        // REMOVE_START
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        // REMOVE_END
        var muxer = await ConnectionMultiplexer.ConnectAsync("localhost:6379");
        var db = muxer.GetDatabase();
        // REMOVE_START
        RedisKey[] userKeys = Enumerable.Range(1, 1000)
            .Select(i => (RedisKey)$"user:{i}").ToArray();
        await db.KeyDeleteAsync(userKeys);
        // REMOVE_END
        // HIDE_END

        // STEP_START himport_basic
        // Declare the field names once.
        await using var fields = HashImport.Create("name", "email", "age");

        // Create each hash by sending only its values.
        await db.HashImportAsync("user:1", fields, new RedisValue[] { "Alice", "alice@example.com", "34" });
        await db.HashImportAsync("user:2", fields, new RedisValue[] { "Bob", "bob@example.com", "41" });
        await db.HashImportAsync("user:3", fields, new RedisValue[] { "Carol", "carol@example.com", "29" });

        // The result is an ordinary hash.
        HashEntry[] res1 = await db.HashGetAllAsync("user:2");
        Console.WriteLine(string.Join(", ", res1.Select(h => $"{h.Name}: {h.Value}")));
        // >>> age: 41, name: Bob, email: bob@example.com
        // STEP_END

        // REMOVE_START
        var res1Dict = res1.ToDictionary(h => h.Name.ToString(), h => h.Value.ToString());
        Assert.Equal(3, res1Dict.Count);
        Assert.Equal("Bob", res1Dict["name"]);
        Assert.Equal("bob@example.com", res1Dict["email"]);
        Assert.Equal("41", res1Dict["age"]);
        // REMOVE_END

        // STEP_START himport_pipeline
        await using var bulkFields = HashImport.Create("name", "email", "age");

        // Start many imports without awaiting each one, so they share round trips.
        var imports = new List<Task>();

        for (int i = 1; i <= 1000; i++)
        {
            imports.Add(db.HashImportAsync(
                $"user:{i}",
                bulkFields,
                new RedisValue[] { $"user{i}", $"user{i}@example.com", (20 + i % 50).ToString() }
            ));
        }

        await Task.WhenAll(imports);

        int res2 = imports.Count(t => t.Status == TaskStatus.RanToCompletion);
        Console.WriteLine(res2);    // >>> 1000

        RedisValue res3 = await db.HashGetAsync("user:1000", "email");
        Console.WriteLine(res3);    // >>> user1000@example.com
        // STEP_END

        // REMOVE_START
        Assert.Equal(1000, res2);
        Assert.Equal("user1000@example.com", res3);
        await db.KeyDeleteAsync(userKeys);
        // REMOVE_END

        // HIDE_START
        await muxer.CloseAsync();
    }
}
// HIDE_END
