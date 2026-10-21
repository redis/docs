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
public class HashImportExample
// REMOVE_START
    : AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public HashImportExample(EndpointsFixture fixture) : base(fixture) { }

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
        RedisKey[] userKeys = Enumerable.Range(1, 1000)
            .Select(i => (RedisKey)$"user:{i}").ToArray();
        db.KeyDelete(userKeys);
        // REMOVE_END
        // HIDE_END

        // STEP_START himport_basic
        // Declare the field names once.
        using var fields = HashImport.Create("name", "email", "age");

        // Create each hash by sending only its values.
        db.HashImport("user:1", fields, new RedisValue[] { "Alice", "alice@example.com", "34" });
        db.HashImport("user:2", fields, new RedisValue[] { "Bob", "bob@example.com", "41" });
        db.HashImport("user:3", fields, new RedisValue[] { "Carol", "carol@example.com", "29" });

        // The result is an ordinary hash.
        HashEntry[] res1 = db.HashGetAll("user:2");
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
        using var bulkFields = HashImport.Create("name", "email", "age");

        // Queue many imports and send them in one round trip.
        var batch = db.CreateBatch();
        var imports = new List<Task>();

        for (int i = 1; i <= 1000; i++)
        {
            imports.Add(batch.HashImportAsync(
                $"user:{i}",
                bulkFields,
                new RedisValue[] { $"user{i}", $"user{i}@example.com", (20 + i % 50).ToString() }
            ));
        }

        batch.Execute();
        Task.WaitAll(imports.ToArray());

        int res2 = imports.Count(t => t.Status == TaskStatus.RanToCompletion);
        Console.WriteLine(res2);    // >>> 1000

        RedisValue res3 = db.HashGet("user:1000", "email");
        Console.WriteLine(res3);    // >>> user1000@example.com
        // STEP_END

        // REMOVE_START
        Assert.Equal(1000, res2);
        Assert.Equal("user1000@example.com", res3);
        db.KeyDelete(userKeys);
        // REMOVE_END

        // HIDE_START
        muxer.Close();
    }
}
// HIDE_END
