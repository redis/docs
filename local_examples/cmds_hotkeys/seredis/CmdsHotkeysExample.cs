// EXAMPLE: cmds_hotkeys
// HIDE_START
using StackExchange.Redis;

#pragma warning disable SER003
// HIDE_END
// REMOVE_START
using NRedisStack.Tests;

namespace Doc;

[Collection("DocsTests")]
// REMOVE_END

// HIDE_START
public class CmdsHotkeysExample
// REMOVE_START
    : AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public CmdsHotkeysExample(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        // REMOVE_START
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        // REMOVE_END
        var muxer = ConnectionMultiplexer.Connect("localhost:6379,allowAdmin=true");
        var server = muxer.GetServer("localhost:6379");
        var db = muxer.GetDatabase();
        // REMOVE_START
        server.HotKeysStop();
        server.HotKeysReset();
        db.KeyDelete(["product:1", "product:2", "product:3"]);
        db.StringSet([
            new("product:1", "Laptop"),
            new("product:2", "Phone"),
            new("product:3", "Tablet")
        ]);
        // REMOVE_END
        // HIDE_END

        // STEP_START hotkeys
        // Track the 10 hottest keys by CPU time and network bytes.
        server.HotKeysStart(metrics: HotKeysMetrics.Cpu | HotKeysMetrics.Network, count: 10);

        // Generate some traffic. In production, this is your application's workload.
        for (int i = 0; i < 100; i++)
        {
            db.StringGet("product:1");
        }

        for (int i = 0; i < 10; i++)
        {
            db.StringGet("product:2");
        }

        db.StringGet("product:3");

        HotKeysResult res2 = server.HotKeysGet();
        Console.WriteLine(res2.TrackingActive); // >>> True

        var byNet = res2.NetworkBytesByKey.ToArray();
        Console.WriteLine(string.Join(", ", byNet.Select(k => $"{k.Key}: {k.Bytes}")));
        // >>> product:1: 4000, product:2: 390, product:3: 40

        bool res3 = server.HotKeysStop();
        Console.WriteLine(res3); // >>> True

        server.HotKeysReset();
        // STEP_END

        // REMOVE_START
        Assert.True(res2.TrackingActive);
        Assert.Equal(
            ["product:1: 4000", "product:2: 390", "product:3: 40"],
            byNet.Select(k => $"{k.Key}: {k.Bytes}").ToArray());
        Assert.True(res3);
        Assert.Null(server.HotKeysGet());
        db.KeyDelete(["product:1", "product:2", "product:3"]);
        // REMOVE_END

        // HIDE_START
        muxer.Close();
    }
}
// HIDE_END
