// EXAMPLE: json_path_ops
// HIDE_START

using System.Text.Json;
using NRedisStack;
using NRedisStack.RedisStackCommands;
using NRedisStack.Tests;
using StackExchange.Redis;

// HIDE_END

// REMOVE_START
namespace Doc;

[Collection("DocsTests")]
// REMOVE_END

// HIDE_START
public class JsonPathOpsExample
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public JsonPathOpsExample(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        // This is needed because we're constructing ConfigurationOptions in the test before calling GetConnection
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
        // REMOVE_START
        // Clear any keys here before using them in tests.
        db.KeyDelete("doc");
        // REMOVE_END
        // HIDE_END

        // STEP_START filter_negation
        bool res1 = db.JSON().Set("doc", "$", "[{\"a\":1,\"b\":1},{\"b\":2},{\"a\":1},{\"c\":3}]");
        Console.WriteLine(res1);    // >>> True

        RedisResult res2 = db.JSON().Get("doc", path: "$[?!@.a]");
        Console.WriteLine(res2);    // >>> [{"b":2},{"c":3}]

        RedisResult res3 = db.JSON().Get("doc", path: "$[?!(@.a==1)]");
        Console.WriteLine(res3);    // >>> [{"b":2},{"c":3}]

        RedisResult res4 = db.JSON().Get("doc", path: "$[?!@.a && @.b]");
        Console.WriteLine(res4);    // >>> [{"b":2}]
        // STEP_END

        // REMOVE_START
        Assert.True(res1);
        Assert.Equal("[{\"b\":2},{\"c\":3}]", (string?)res2);
        Assert.Equal("[{\"b\":2},{\"c\":3}]", (string?)res3);
        Assert.Equal("[{\"b\":2}]", (string?)res4);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START filter_literal_eq
        bool res5 = db.JSON().Set(
            "doc",
            "$",
            "{\"arrs\":[[1],[2],[1,2],[1,[2]]],\"objs\":[{\"x\":1},{\"x\":2},{\"y\":1}]}"
        );
        Console.WriteLine(res5);    // >>> True

        RedisResult res6 = db.JSON().Get("doc", path: "$.arrs[?(@ == [1])]");
        Console.WriteLine(res6);    // >>> [[1]]

        RedisResult res7 = db.JSON().Get("doc", path: "$.arrs[?(@ == [1,[2]])]");
        Console.WriteLine(res7);    // >>> [[1,[2]]]

        RedisResult res8 = db.JSON().Get("doc", path: "$.objs[?(@ == {\"x\":1})]");
        Console.WriteLine(res8);    // >>> [{"x":1}]
        // STEP_END

        // REMOVE_START
        Assert.True(res5);
        Assert.Equal("[[1]]", (string?)res6);
        Assert.Equal("[[1,[2]]]", (string?)res7);
        Assert.Equal("[{\"x\":1}]", (string?)res8);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START filter_arithmetic
        bool res9 = db.JSON().Set("doc", "$", "[{\"a\":2,\"b\":3},{\"a\":5,\"b\":2}]");
        Console.WriteLine(res9);    // >>> True

        RedisResult res10 = db.JSON().Get("doc", path: "$[?@.a + 1 == 3]");
        Console.WriteLine(res10);   // >>> [{"a":2,"b":3}]

        RedisResult res11 = db.JSON().Get("doc", path: "$[?@.a + @.b * 2 == 8]");
        Console.WriteLine(res11);   // >>> [{"a":2,"b":3}]

        RedisResult res12 = db.JSON().Get("doc", path: "$[?(@.a + @.b) * 2 == 10]");
        Console.WriteLine(res12);   // >>> [{"a":2,"b":3}]
        // STEP_END

        // REMOVE_START
        Assert.True(res9);
        Assert.Equal("[{\"a\":2,\"b\":3}]", (string?)res10);
        Assert.Equal("[{\"a\":2,\"b\":3}]", (string?)res11);
        Assert.Equal("[{\"a\":2,\"b\":3}]", (string?)res12);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START filter_membership
        bool res13 = db.JSON().Set("doc", "$", "{\"a\":[1,2,3,4],\"allow\":[2,3]}");
        Console.WriteLine(res13);   // >>> True

        RedisResult res14 = db.JSON().Get("doc", path: "$.a[?@ in [2,4]]");
        Console.WriteLine(res14);   // >>> [2,4]

        RedisResult res15 = db.JSON().Get("doc", path: "$.a[?@ nin [2,4]]");
        Console.WriteLine(res15);   // >>> [1,3]

        RedisResult res16 = db.JSON().Get("doc", path: "$.a[?@ in $.allow]");
        Console.WriteLine(res16);   // >>> [2,3]
        // STEP_END

        // REMOVE_START
        Assert.True(res13);
        Assert.Equal("[2,4]", (string?)res14);
        Assert.Equal("[1,3]", (string?)res15);
        Assert.Equal("[2,3]", (string?)res16);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START filter_set_relations
        bool res17 = db.JSON().Set("doc", "$", "{\"a\":[[1,2],[1,5],[]]}");
        Console.WriteLine(res17);   // >>> True

        RedisResult res18 = db.JSON().Get("doc", path: "$.a[?@ subsetof [1,2,3]]");
        Console.WriteLine(res18);   // >>> [[1,2],[]]

        bool res19 = db.JSON().Set("doc", "$", "{\"a\":[[1,9],[8,9],[]]}");
        Console.WriteLine(res19);   // >>> True

        RedisResult res20 = db.JSON().Get("doc", path: "$.a[?@ anyof [1,2,3]]");
        Console.WriteLine(res20);   // >>> [[1,9]]

        bool res21 = db.JSON().Set("doc", "$", "{\"a\":[[4,5],[1,9],[]]}");
        Console.WriteLine(res21);   // >>> True

        RedisResult res22 = db.JSON().Get("doc", path: "$.a[?@ noneof [1,2,3]]");
        Console.WriteLine(res22);   // >>> [[4,5],[]]
        // STEP_END

        // REMOVE_START
        Assert.True(res17);
        Assert.Equal("[[1,2],[]]", (string?)res18);
        Assert.True(res19);
        Assert.Equal("[[1,9]]", (string?)res20);
        Assert.True(res21);
        Assert.Equal("[[4,5],[]]", (string?)res22);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START filter_size_empty
        bool res23 = db.JSON().Set("doc", "$", "{\"a\":[[4,5],[1],[7,8,9]]}");
        Console.WriteLine(res23);   // >>> True

        RedisResult res24 = db.JSON().Get("doc", path: "$.a[?@ sizeof 2]");
        Console.WriteLine(res24);   // >>> [[4,5]]

        bool res25 = db.JSON().Set("doc", "$", "{\"a\":[[],[1],\"\",[2,3],{},{\"k\":1}]}");
        Console.WriteLine(res25);   // >>> True

        RedisResult res26 = db.JSON().Get("doc", path: "$.a[?@ empty true]");
        Console.WriteLine(res26);   // >>> [[],"",{}]

        RedisResult res27 = db.JSON().Get("doc", path: "$.a[?@ empty false]");
        Console.WriteLine(res27);   // >>> [[1],[2,3],{"k":1}]
        // STEP_END

        // REMOVE_START
        Assert.True(res23);
        Assert.Equal("[[4,5]]", (string?)res24);
        Assert.True(res25);
        Assert.Equal("[[],\"\",{}]", (string?)res26);
        Assert.Equal("[[1],[2,3],{\"k\":1}]", (string?)res27);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START filter_getkeys
        bool res28 = db.JSON().Set(
            "doc",
            "$",
            "{\"obj\":{\"x\":1,\"y\":2},\"books\":[{\"t\":\"a\"},{\"t\":\"b\"}]}"
        );
        Console.WriteLine(res28);   // >>> True

        RedisResult res29 = db.JSON().Get("doc", path: "$.obj~");
        Console.WriteLine(res29);   // >>> ["x","y"]

        RedisResult res30 = db.JSON().Get("doc", path: "$~");
        Console.WriteLine(res30);   // >>> ["obj","books"]

        RedisResult res31 = db.JSON().Get("doc", path: "$.books~");
        Console.WriteLine(res31);   // >>> []
        // STEP_END

        // REMOVE_START
        Assert.True(res28);
        Assert.Equal("[\"x\",\"y\"]", (string?)res29);
        Assert.Equal("[\"obj\",\"books\"]", (string?)res30);
        Assert.Equal("[]", (string?)res31);
        db.KeyDelete("doc");
        // REMOVE_END


        // HIDE_START
    }
}
// HIDE_END
