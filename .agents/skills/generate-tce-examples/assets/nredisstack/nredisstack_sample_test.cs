// =============================================================================
// CANONICAL NREDISSTACK TEST FILE TEMPLATE (STANDALONE VERSION)
// =============================================================================
// This file demonstrates the structure and conventions used for NRedisStack
// documentation test files. These tests serve dual purposes:
// 1. Executable xUnit tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
// =============================================================================

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

        // STEP_START hash_ops
        db.HashSet("user:1", [
            new("name", "Alice"),
            new("email", "alice@example.com"),
            new("age", 30)
        ]);

        var name = db.HashGet("user:1", "name");
        Console.WriteLine($"Name: {name}");  // >>> Name: Alice

        var allFields = db.HashGetAll("user:1");
        Console.WriteLine(string.Join(", ", allFields.Select(f => $"{f.Name}={f.Value}")));
        // >>> name=Alice, email=alice@example.com, age=30
        // STEP_END

        // REMOVE_START
        Assert.Equal("Alice", name);
        Assert.Equal(3, allFields.Length);
        // REMOVE_END

        // STEP_START json_ops
        var user = new { name = "Bob", email = "bob@example.com", age = 25 };
        bool jsonSet = json.Set("user:2", "$", user);
        Console.WriteLine(jsonSet);  // >>> True

        var jsonGet = json.Get("user:2", path: "$.name");
        Console.WriteLine(jsonGet);  // >>> ["Bob"]
        // STEP_END

        // REMOVE_START
        Assert.True(jsonSet);
        Assert.Equal("[\"Bob\"]", jsonGet.ToString());
        // REMOVE_END

        // STEP_START create_index
        var schema = new Schema()
            .AddTextField(new FieldName("$.name", "name"))
            .AddNumericField(new FieldName("$.age", "age"));

        bool indexCreated = ft.Create(
            "idx:users",
            new FTCreateParams()
                .On(IndexDataType.JSON)
                .Prefix("user:"),
            schema
        );
        // STEP_END

        // REMOVE_START
        Assert.True(indexCreated);
        // REMOVE_END

        // STEP_START search_query
        SearchResult result = ft.Search("idx:users", new Query("Bob"));
        Console.WriteLine($"Found {result.TotalResults} results");
        // >>> Found 1 results

        foreach (Document doc in result.Documents)
        {
            Console.WriteLine($"Key: {doc.Id}, Data: {doc["json"]}");
        }
        // STEP_END

        // REMOVE_START
        Assert.Equal(1, result.TotalResults);
        // REMOVE_END

        // STEP_START aggregation
        var aggRequest = new AggregationRequest("*")
            .GroupBy("@age", Reducers.Count().As("count"));

        AggregationResult aggResult = ft.Aggregate("idx:users", aggRequest);
        Console.WriteLine($"Groups: {aggResult.TotalResults}");
        // STEP_END

        // HIDE_START
        muxer.Close();
    }
}
