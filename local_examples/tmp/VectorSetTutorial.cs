// EXAMPLE: vecset_tutorial
using StackExchange.Redis;
// REMOVE_START
using NRedisStack.Tests;

#pragma warning disable SER001 // Experimental StackExchange.Redis API usage is expected in doc samples

namespace Doc;
[Collection("DocsTests")]
// REMOVE_END

public class VectorSetTutorial
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public VectorSetTutorial(EndpointsFixture fixture) : base(fixture) { }

    [SkippableFact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        // This is needed because we're constructing ConfigurationOptions in the test before calling GetConnection
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        ConnectionMultiplexer muxer = ConnectionMultiplexer.Connect("localhost:6379");
        IDatabase db = muxer.GetDatabase();
        // REMOVE_START
        db.KeyDelete(new RedisKey[] { "points", "quantSetQ8", "quantSetNoQ", "quantSetBin", "setNotReduced", "setReduced" });
        // REMOVE_END

        // STEP_START vadd
        bool r1 = db.VectorSetAdd("points", VectorSetAddRequest.Member("pt:A", new float[] { 1f, 1f }, null));
        Console.WriteLine(r1); // >>> True

        bool r2 = db.VectorSetAdd("points", VectorSetAddRequest.Member("pt:B", new float[] { -1f, -1f }, null));
        Console.WriteLine(r2); // >>> True

        bool r3 = db.VectorSetAdd("points", VectorSetAddRequest.Member("pt:C", new float[] { -1f, 1f }, null));
        Console.WriteLine(r3); // >>> True

        bool r4 = db.VectorSetAdd("points", VectorSetAddRequest.Member("pt:D", new float[] { 1f, -1f }, null));
        Console.WriteLine(r4); // >>> True

        bool r5 = db.VectorSetAdd("points", VectorSetAddRequest.Member("pt:E", new float[] { 1f, 0f }, null));
        Console.WriteLine(r5); // >>> True
        // STEP_END
        // REMOVE_START
        Assert.True(r1 && r2 && r3 && r4 && r5);
        // REMOVE_END

        // STEP_START vcardvdim
        long card = db.VectorSetLength("points");
        Console.WriteLine(card); // >>> 5

        int dim = db.VectorSetDimension("points");
        Console.WriteLine(dim); // >>> 2
        // STEP_END
        // REMOVE_START
        Assert.Equal(5, card);
        Assert.Equal(2, dim);
        // REMOVE_END

        // STEP_START vemb
        using (Lease<float>? eA = db.VectorSetGetApproximateVector("points", "pt:A"))
        {
            Span<float> a = eA!.Span;
            Console.WriteLine($"[{a[0]}, {a[1]}]"); // >>> [0.9999999403953552, 0.9999999403953552]
            // REMOVE_START
            Assert.True(Math.Abs(1 - a[0]) < 0.001);
            Assert.True(Math.Abs(1 - a[1]) < 0.001);
            // REMOVE_END
        }
        using (Lease<float>? eB = db.VectorSetGetApproximateVector("points", "pt:B"))
        {
            Span<float> b = eB!.Span;
            Console.WriteLine($"[{b[0]}, {b[1]}]"); // >>> [-0.9999999403953552, -0.9999999403953552]
            // REMOVE_START
            Assert.True(Math.Abs(1 + b[0]) < 0.001);
            Assert.True(Math.Abs(1 + b[1]) < 0.001);
            // REMOVE_END
        }
        using (Lease<float>? eC = db.VectorSetGetApproximateVector("points", "pt:C"))
        {
            Span<float> c = eC!.Span;
            Console.WriteLine($"[{c[0]}, {c[1]}]"); // >>> [-0.9999999403953552, 0.9999999403953552]
            // REMOVE_START
            Assert.True(Math.Abs(1 + c[0]) < 0.001);
            Assert.True(Math.Abs(1 - c[1]) < 0.001);
            // REMOVE_END
        }
        using (Lease<float>? eD = db.VectorSetGetApproximateVector("points", "pt:D"))
        {
            Span<float> d = eD!.Span;
            Console.WriteLine($"[{d[0]}, {d[1]}]"); // >>> [0.9999999403953552, -0.9999999403953552]
            // REMOVE_START
            Assert.True(Math.Abs(1 - d[0]) < 0.001);
            Assert.True(Math.Abs(1 + d[1]) < 0.001);
            // REMOVE_END
        }
        using (Lease<float>? eE = db.VectorSetGetApproximateVector("points", "pt:E"))
        {
            Span<float> e = eE!.Span;
            Console.WriteLine($"[{e[0]}, {e[1]}]"); // >>> [1, 0]
            // REMOVE_START
            Assert.True(Math.Abs(1 - e[0]) < 0.001 && Math.Abs(0 - e[1]) < 0.001);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START attr
        string attrJson = "{\"name\":\"Point A\",\"description\":\"First point added\"}";
        bool setAttr1 = db.VectorSetSetAttributesJson("points", "pt:A", attrJson);
        Console.WriteLine(setAttr1); // >>> True

        string? getAttr1 = db.VectorSetGetAttributesJson("points", "pt:A");
        Console.WriteLine(getAttr1); // >>> {"name":"Point A","description":"First point added"}

        bool clearAttr = db.VectorSetSetAttributesJson("points", "pt:A", "");
        Console.WriteLine(clearAttr); // >>> True

        string? getAttr2 = db.VectorSetGetAttributesJson("points", "pt:A");
        Console.WriteLine(getAttr2 is null ? "None" : getAttr2); // >>> None
        // STEP_END
        // REMOVE_START
        Assert.True(setAttr1);
        Assert.Contains("Point A", getAttr1);
        Assert.True(clearAttr);
        Assert.True(getAttr2 is null);
        // REMOVE_END

        // STEP_START vrem
        bool addF = db.VectorSetAdd("points", VectorSetAddRequest.Member("pt:F", new float[] { 0f, 0f }, null));
        Console.WriteLine(addF); // >>> True

        long card1 = db.VectorSetLength("points");
        Console.WriteLine(card1); // >>> 6

        bool remF = db.VectorSetRemove("points", "pt:F");
        Console.WriteLine(remF); // >>> True

        long card2 = db.VectorSetLength("points");
        Console.WriteLine(card2); // >>> 5
        // STEP_END
        // REMOVE_START
        Assert.True(addF);
        Assert.Equal(6, card1);
        Assert.True(remF);
        Assert.Equal(5, card2);
        // REMOVE_END

        // STEP_START vsim_basic
        VectorSetSimilaritySearchRequest qBasic = VectorSetSimilaritySearchRequest.ByVector(new float[] { 0.9f, 0.1f });
        using (Lease<VectorSetSimilaritySearchResult>? res = db.VectorSetSimilaritySearch("points", qBasic))
        {
            VectorSetSimilaritySearchResult[] items = res!.Span.ToArray();
            string[] ordered = items.Select(x => (string?)x.Member).Where(s => s is not null).Select(s => s!).ToArray();
            Console.WriteLine("[" + string.Join(", ", ordered.Select(s => $"'{s}'")) + "]");
            // >>> ['pt:E', 'pt:A', 'pt:D', 'pt:C', 'pt:B']
            // REMOVE_START
            Assert.Equal(new[] { "pt:E", "pt:A", "pt:D", "pt:C", "pt:B" }, ordered);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START vsim_options
        VectorSetSimilaritySearchRequest qOpts = VectorSetSimilaritySearchRequest.ByMember("pt:A");
        qOpts.WithScores = true;
        qOpts.Count = 4;
        using (Lease<VectorSetSimilaritySearchResult>? res = db.VectorSetSimilaritySearch("points", qOpts))
        {
            VectorSetSimilaritySearchResult[] items = res!.Span.ToArray();
            Dictionary<string, double> dict = items
                .Select(i => new { Key = (string?)i.Member, i.Score })
                .Where(x => x.Key is not null)
                .ToDictionary(x => x.Key!, x => x.Score);
            Console.WriteLine("{" + string.Join(", ", dict.Select(kv => $"'{kv.Key}': {kv.Value}")) + "}");
            // >>> {'pt:A': 1.0, 'pt:E': 0.8535534143447876, 'pt:D': 0.5, 'pt:C': 0.5}
            // REMOVE_START
            Assert.Equal(1.0, dict["pt:A"]);
            Assert.Equal(0.5, dict["pt:C"]);
            Assert.Equal(0.5, dict["pt:D"]);
            Assert.True(Math.Abs(dict["pt:E"] - 0.85) < 0.005);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START vsim_filter
        bool okA = db.VectorSetSetAttributesJson("points", "pt:A", "{\"size\":\"large\",\"price\":18.99}");
        Console.WriteLine(okA); // >>> True
        bool okB = db.VectorSetSetAttributesJson("points", "pt:B", "{\"size\":\"large\",\"price\":35.99}");
        Console.WriteLine(okB); // >>> True
        bool okC = db.VectorSetSetAttributesJson("points", "pt:C", "{\"size\":\"large\",\"price\":25.99}");
        Console.WriteLine(okC); // >>> True
        bool okD = db.VectorSetSetAttributesJson("points", "pt:D", "{\"size\":\"small\",\"price\":21.00}");
        Console.WriteLine(okD); // >>> True
        bool okE = db.VectorSetSetAttributesJson("points", "pt:E", "{\"size\":\"small\",\"price\":17.75}");
        Console.WriteLine(okE); // >>> True
        // REMOVE_START
        Assert.True(okA && okB && okC && okD && okE);
        // REMOVE_END

        VectorSetSimilaritySearchRequest qFilt1 = VectorSetSimilaritySearchRequest.ByMember("pt:A");
        qFilt1.FilterExpression = ".size == \"large\"";
        using (Lease<VectorSetSimilaritySearchResult>? res = db.VectorSetSimilaritySearch("points", qFilt1))
        {
            string[] ids = res!.Span.ToArray()
                .Select(i => (string?)i.Member)
                .Where(s => s is not null)
                .Select(s => s!)
                .ToArray();
            Console.WriteLine("[" + string.Join(", ", ids.Select(s => $"'{s}'")) + "]");
            // >>> ['pt:A', 'pt:C', 'pt:B']
            // REMOVE_START
            Assert.Equal(new[] { "pt:A", "pt:C", "pt:B" }, ids);
            // REMOVE_END

        }

        VectorSetSimilaritySearchRequest qFilt2 = VectorSetSimilaritySearchRequest.ByMember("pt:A");
        qFilt2.FilterExpression = ".size == \"large\" && .price > 20.00";
        using (Lease<VectorSetSimilaritySearchResult>? res = db.VectorSetSimilaritySearch("points", qFilt2))
        {
            string[] ids = res!.Span.ToArray()
                .Select(i => (string?)i.Member)
                .Where(s => s is not null)
                .Select(s => s!)
                .ToArray();
            Console.WriteLine("[" + string.Join(", ", ids.Select(s => $"'{s}'")) + "]");
            // >>> ['pt:C', 'pt:B']
            // REMOVE_START
            Assert.Equal(new[] { "pt:C", "pt:B" }, ids);
            // REMOVE_END
        }
        // STEP_END

        // STEP_START add_quant
        VectorSetAddRequest addInt8 = VectorSetAddRequest.Member("quantElement", new float[] { 1.262185f, 1.958231f }, null);
        addInt8.Quantization = VectorSetQuantization.Int8;
        bool q8Added = db.VectorSetAdd("quantSetQ8", addInt8);
        Console.WriteLine(q8Added); // >>> True
        using (Lease<float>? eInt8 = db.VectorSetGetApproximateVector("quantSetQ8", "quantElement"))
        {
            Span<float> v = eInt8!.Span;
            Console.WriteLine($"Q8: [{v[0]}, {v[1]}]");
            // >>> Q8: [1.2643694877624512, 1.958230972290039]
        }

        VectorSetAddRequest addNone = VectorSetAddRequest.Member("quantElement", new float[] { 1.262185f, 1.958231f }, null);
        addNone.Quantization = VectorSetQuantization.None;
        bool noQuantAdded = db.VectorSetAdd("quantSetNoQ", addNone);
        Console.WriteLine(noQuantAdded); // >>> True
        using (Lease<float>? eNone = db.VectorSetGetApproximateVector("quantSetNoQ", "quantElement"))
        {
            Span<float> v = eNone!.Span;
            Console.WriteLine($"NOQUANT: [{v[0]}, {v[1]}]");
            // >>> NOQUANT: [1.262184977531433, 1.958230972290039]
        }

        VectorSetAddRequest addBinary = VectorSetAddRequest.Member("quantElement", new float[] { 1.262185f, 1.958231f }, null);
        addBinary.Quantization = VectorSetQuantization.Binary;
        bool binAdded = db.VectorSetAdd("quantSetBin", addBinary);
        Console.WriteLine(binAdded); // >>> True
        using (Lease<float>? eBinary = db.VectorSetGetApproximateVector("quantSetBin", "quantElement"))
        {
            Span<float> v = eBinary!.Span;
            Console.WriteLine($"BIN: [{v[0]}, {v[1]}]");
            // >>> BIN: [1, 1]
        }
        // REMOVE_START
        Assert.True(q8Added);
        Assert.True(noQuantAdded);
        Assert.True(binAdded);
        // REMOVE_END
        // STEP_END

        // STEP_START add_reduce
        float[] values = Enumerable.Range(0, 300).Select(x => (float)(x / 299.0)).ToArray();
        bool addedNotReduced = db.VectorSetAdd("setNotReduced", VectorSetAddRequest.Member("element", values, null));
        Console.WriteLine(addedNotReduced); // >>> True
        Console.WriteLine(db.VectorSetDimension("setNotReduced")); // >>> 300
        // REMOVE_START
        Assert.True(addedNotReduced);
        Assert.Equal(300, db.VectorSetDimension("setNotReduced"));
        // REMOVE_END

        VectorSetAddRequest addReduced = VectorSetAddRequest.Member("element", values, null);
        addReduced.ReducedDimensions = 100;
        bool addedReduced = db.VectorSetAdd("setReduced", addReduced);
        Console.WriteLine(addedReduced); // >>> True
        Console.WriteLine(db.VectorSetDimension("setReduced")); // >>> 100
        // REMOVE_START
        Assert.True(addedReduced);
        Assert.Equal(100, db.VectorSetDimension("setReduced"));
        // REMOVE_END
        // STEP_END

    }
}

