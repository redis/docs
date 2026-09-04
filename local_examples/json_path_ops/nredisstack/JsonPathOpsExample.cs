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

        // STEP_START func_length
        bool res32 = db.JSON().Set("doc", "$", "{\"a\":[[1,2,3],[1],\"abcd\",\"x\"]}");
        Console.WriteLine(res32);   // >>> True

        RedisResult res33 = db.JSON().Get("doc", path: "$.a[?length(@) > 2]");
        Console.WriteLine(res33);   // >>> [[1,2,3],"abcd"]
        // STEP_END

        // REMOVE_START
        Assert.True(res32);
        Assert.Equal("[[1,2,3],\"abcd\"]", (string?)res33);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_count
        bool res34 = db.JSON().Set("doc", "$", "[{\"a\":1,\"b\":2,\"c\":3},{\"a\":1}]");
        Console.WriteLine(res34);   // >>> True

        RedisResult res35 = db.JSON().Get("doc", path: "$[?count(@.*) == 3]");
        Console.WriteLine(res35);   // >>> [{"a":1,"b":2,"c":3}]
        // STEP_END

        // REMOVE_START
        Assert.True(res34);
        Assert.Equal("[{\"a\":1,\"b\":2,\"c\":3}]", (string?)res35);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_value
        bool res36 = db.JSON().Set("doc", "$", "[{\"a\":1},{\"a\":2}]");
        Console.WriteLine(res36);   // >>> True

        RedisResult res37 = db.JSON().Get("doc", path: "$[?value(@.a) == 1]");
        Console.WriteLine(res37);   // >>> [{"a":1}]
        // STEP_END

        // REMOVE_START
        Assert.True(res36);
        Assert.Equal("[{\"a\":1}]", (string?)res37);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_keys
        bool res38 = db.JSON().Set("doc", "$", "{\"obj\":{\"x\":1,\"y\":2}}");
        Console.WriteLine(res38);   // >>> True

        RedisResult res39 = db.JSON().Get("doc", path: "$.obj.keys()");
        Console.WriteLine(res39);   // >>> ["x","y"]

        RedisResult res40 = db.JSON().Get("doc", path: "$.obj.keys().count()");
        Console.WriteLine(res40);   // >>> [2]
        // STEP_END

        // REMOVE_START
        Assert.True(res38);
        Assert.Equal("[\"x\",\"y\"]", (string?)res39);
        Assert.Equal("[2]", (string?)res40);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_match_search
        bool res41 = db.JSON().Set("doc", "$", "{\"a\":[\"abc\",\"xabc\",\"a\",\"b\"]}");
        Console.WriteLine(res41);   // >>> True

        RedisResult res42 = db.JSON().Get("doc", path: "$.a[?match(@, \"a.*\")]");
        Console.WriteLine(res42);   // >>> ["abc","a"]

        bool res43 = db.JSON().Set("doc", "$", "{\"a\":[\"abc\",\"xyz\",\"b\"]}");
        Console.WriteLine(res43);   // >>> True

        RedisResult res44 = db.JSON().Get("doc", path: "$.a[?search(@, \"b\")]");
        Console.WriteLine(res44);   // >>> ["abc","b"]
        // STEP_END

        // REMOVE_START
        Assert.True(res41);
        Assert.Equal("[\"abc\",\"a\"]", (string?)res42);
        Assert.True(res43);
        Assert.Equal("[\"abc\",\"b\"]", (string?)res44);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_concat
        bool res45 = db.JSON().Set("doc", "$", "{\"a\":[{\"x\":\"a\",\"y\":\"b\"},{\"x\":\"a\",\"y\":\"c\"}]}");
        Console.WriteLine(res45);   // >>> True

        RedisResult res46 = db.JSON().Get("doc", path: "$.a[?concat(@.x, @.y) == \"ab\"]");
        Console.WriteLine(res46);   // >>> [{"x":"a","y":"b"}]
        // STEP_END

        // REMOVE_START
        Assert.True(res45);
        Assert.Equal("[{\"x\":\"a\",\"y\":\"b\"}]", (string?)res46);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_math
        bool res47 = db.JSON().Set("doc", "$", "{\"a\":[2.1,3.9,1.0]}");
        Console.WriteLine(res47);   // >>> True

        RedisResult res48 = db.JSON().Get("doc", path: "$.a[?ceiling(@) == 3]");
        Console.WriteLine(res48);   // >>> [2.1]

        bool res49 = db.JSON().Set("doc", "$", "{\"a\":[2.1,2.9,3.5]}");
        Console.WriteLine(res49);   // >>> True

        RedisResult res50 = db.JSON().Get("doc", path: "$.a[?floor(@) == 2]");
        Console.WriteLine(res50);   // >>> [2.1,2.9]

        bool res51 = db.JSON().Set("doc", "$", "{\"a\":[{\"n\":-5},{\"n\":5},{\"n\":-3}]}");
        Console.WriteLine(res51);   // >>> True

        RedisResult res52 = db.JSON().Get("doc", path: "$.a[?abs(@.n) == 5]");
        Console.WriteLine(res52);   // >>> [{"n":-5},{"n":5}]
        // STEP_END

        // REMOVE_START
        Assert.True(res47);
        Assert.Equal("[2.1]", (string?)res48);
        Assert.True(res49);
        Assert.Equal("[2.1,2.9]", (string?)res50);
        Assert.True(res51);
        Assert.Equal("[{\"n\":-5},{\"n\":5}]", (string?)res52);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_array_access
        bool res53 = db.JSON().Set("doc", "$", "{\"a\":[{\"n\":[1,2]},{\"n\":[9,8]}]}");
        Console.WriteLine(res53);   // >>> True

        RedisResult res54 = db.JSON().Get("doc", path: "$.a[?first(@.n) == 1]");
        Console.WriteLine(res54);   // >>> [{"n":[1,2]}]

        RedisResult res55 = db.JSON().Get("doc", path: "$.a[?last(@.n) == 8]");
        Console.WriteLine(res55);   // >>> [{"n":[9,8]}]

        RedisResult res56 = db.JSON().Get("doc", path: "$.a[?index(@.n, -1) == 2]");
        Console.WriteLine(res56);   // >>> [{"n":[1,2]}]
        // STEP_END

        // REMOVE_START
        Assert.True(res53);
        Assert.Equal("[{\"n\":[1,2]}]", (string?)res54);
        Assert.Equal("[{\"n\":[9,8]}]", (string?)res55);
        Assert.Equal("[{\"n\":[1,2]}]", (string?)res56);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_aggregate
        bool res57 = db.JSON().Set("doc", "$", "{\"a\":[{\"n\":[3,1,2]},{\"n\":[5,6]}]}");
        Console.WriteLine(res57);   // >>> True

        RedisResult res58 = db.JSON().Get("doc", path: "$.a[?sum(@.n) == 6]");
        Console.WriteLine(res58);   // >>> [{"n":[3,1,2]}]

        RedisResult res59 = db.JSON().Get("doc", path: "$.a[?avg(@.n) == 2]");
        Console.WriteLine(res59);   // >>> [{"n":[3,1,2]}]
        // STEP_END

        // REMOVE_START
        Assert.True(res57);
        Assert.Equal("[{\"n\":[3,1,2]}]", (string?)res58);
        Assert.Equal("[{\"n\":[3,1,2]}]", (string?)res59);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START func_append
        bool res60 = db.JSON().Set("doc", "$", "{\"arr\":[1,2,3]}");
        Console.WriteLine(res60);   // >>> True

        RedisResult res61 = db.JSON().Get("doc", path: "$.arr.append(9)");
        Console.WriteLine(res61);   // >>> [1,2,3,9]

        bool res62 = db.JSON().Set("doc", "$", "{\"books\":[{\"t\":\"a\",\"price\":30},{\"t\":\"b\",\"price\":5}]}");
        Console.WriteLine(res62);   // >>> True

        RedisResult res63 = db.JSON().Get("doc", path: "$.books[?(@.price >= 10)].append({\"t\":\"X\"})");
        Console.WriteLine(res63);   // >>> [{"t":"a","price":30},{"t":"X"}]
        // STEP_END

        // REMOVE_START
        Assert.True(res60);
        Assert.Equal("[1,2,3,9]", (string?)res61);
        Assert.True(res62);
        Assert.Equal("[{\"t\":\"a\",\"price\":30},{\"t\":\"X\"}]", (string?)res63);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START proj_basic
        bool res64 = db.JSON().Set("doc", "$", "{\"a\":2,\"b\":4,\"arr\":[1,2,3]}");
        Console.WriteLine(res64);   // >>> True

        RedisResult res65 = db.JSON().Get("doc", path: "$.a + 1");
        Console.WriteLine(res65);   // >>> [3]

        RedisResult res66 = db.JSON().Get("doc", path: "$.a * $.b");
        Console.WriteLine(res66);   // >>> [8]

        RedisResult res67 = db.JSON().Get("doc", path: "($.a + $.b) / 2");
        Console.WriteLine(res67);   // >>> [3.0]

        RedisResult res68 = db.JSON().Get("doc", path: "$.arr.length()");
        Console.WriteLine(res68);   // >>> [3]

        RedisResult res69 = db.JSON().Get("doc", path: "$.a / 0");
        Console.WriteLine(res69);   // >>> []
        // STEP_END

        // REMOVE_START
        Assert.True(res64);
        Assert.Equal("[3]", (string?)res65);
        Assert.Equal("[8]", (string?)res66);
        Assert.Equal("[3.0]", (string?)res67);
        Assert.Equal("[3]", (string?)res68);
        Assert.Equal("[]", (string?)res69);
        db.KeyDelete("doc");
        // REMOVE_END

        // STEP_START proj_multipath
        bool res70 = db.JSON().Set("doc", "$", "{\"a\":2,\"b\":4,\"arr\":[1,2,3]}");
        Console.WriteLine(res70);   // >>> True

        RedisResult res71 = db.JSON().Get("doc", paths: new[] { "$.a + 1", "$.b" });
        Console.WriteLine(res71);   // >>> {"$.a + 1":[3],"$.b":[4]}
        // STEP_END

        // REMOVE_START
        Assert.True(res70);
        // The key order of the multi-path JSON.GET reply is not guaranteed,
        // so parse it into a dictionary and compare structurally rather than
        // comparing the raw JSON text.
        var res71Map = JsonSerializer.Deserialize<Dictionary<string, int[]>>((string)res71!);
        Assert.Equal(2, res71Map!.Count);
        Assert.Equal(new[] { 3 }, res71Map["$.a + 1"]);
        Assert.Equal(new[] { 4 }, res71Map["$.b"]);
        db.KeyDelete("doc");
        // REMOVE_END

        // HIDE_START
    }
}
// HIDE_END
