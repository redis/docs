// EXAMPLE: cmds_stream

using StackExchange.Redis;
// REMOVE_START
using NRedisStack.Tests;
using Xunit;
// REMOVE_END

// REMOVE_START
namespace Doc;

[Collection("DocsTests")]
// REMOVE_END
public class CmdsStreamExample
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public CmdsStreamExample(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        var _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();

        // REMOVE_START
        db.KeyDelete("mystream");
        // REMOVE_END

        // STEP_START xadd1
        var res1 = db.StreamAdd("mystream", new NameValueEntry[] {
            new NameValueEntry("name", "Sara"),
            new NameValueEntry("surname", "OConnor")
        });
        Console.WriteLine(res1);  // >>> 1726055713866-0

        var res2 = db.StreamAdd("mystream", new NameValueEntry[] {
            new NameValueEntry("field1", "value1"),
            new NameValueEntry("field2", "value2"),
            new NameValueEntry("field3", "value3")
        });
        Console.WriteLine(res2);  // >>> 1726055713866-1

        var res3 = db.StreamLength("mystream");
        Console.WriteLine(res3);  // >>> 2

        var res4 = db.StreamRange("mystream", "-", "+");
        foreach (var entry in res4)
        {
            Console.WriteLine($"{entry.Id} -> {string.Join(", ", entry.Values.Select(v => $"{v.Name}={v.Value}"))}");
        }
        // >>> 1726055713866-0 -> name=Sara, surname=OConnor
        // >>> 1726055713866-1 -> field1=value1, field2=value2, field3=value3
        // STEP_END

        // REMOVE_START
        Assert.Equal(2, res3);
        Assert.Equal(2, res4.Length);
        db.KeyDelete("mystream");
        // REMOVE_END

        // STEP_START xadd2
        // Note: IDMP is a Redis 8.6 feature - using Execute for raw command access
        var res5 = db.Execute("XADD", "mystream", "IDMP", "producer1", "msg1", "*", "field", "value");
        Console.WriteLine(res5);  // >>> 1726055713867-0

        // Attempting to add the same message again with IDMP returns the original entry ID
        var res6 = db.Execute("XADD", "mystream", "IDMP", "producer1", "msg1", "*", "field", "different_value");
        Console.WriteLine(res6);  // >>> 1726055713867-0 (same ID as res5, message was deduplicated)

        var res7 = db.Execute("XADD", "mystream", "IDMPAUTO", "producer2", "*", "field", "value");
        Console.WriteLine(res7);  // >>> 1726055713867-1

        // Auto-generated idempotent ID prevents duplicates for same producer+content
        var res8 = db.Execute("XADD", "mystream", "IDMPAUTO", "producer2", "*", "field", "value");
        Console.WriteLine(res8);  // >>> 1726055713867-1 (same ID as res7, duplicate detected)

        // Configure idempotent message processing settings
        var res9 = db.Execute("XCFGSET", "mystream", "IDMP-DURATION", "300", "IDMP-MAXSIZE", "1000");
        Console.WriteLine(res9);  // >>> OK
        // STEP_END

        // REMOVE_START
        Assert.NotNull(res5);
        db.KeyDelete("mystream");
        // REMOVE_END

        // HIDE_START
        muxer.Close();
        // HIDE_END
    }
}

