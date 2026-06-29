// EXAMPLE: pipe_trans_tutorial
using StackExchange.Redis;
//REMOVE_START
using NRedisStack.Tests;

namespace Doc;

[Collection("DocsTests")]
//REMOVE_END
public class PipeTransExample
// REMOVE_START
: AbstractNRedisStackTest, IDisposable
// REMOVE_END
{
    // REMOVE_START
    public PipeTransExample(EndpointsFixture fixture) : base(fixture) { }

    [Fact]
    // REMOVE_END
    public void Run()
    {
        //REMOVE_START
        // This is needed because we're constructing ConfigurationOptions in the test before calling GetConnection
        SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env.Standalone);
        _ = GetCleanDatabase(EndpointsFixture.Env.Standalone);
        //REMOVE_END
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
        // REMOVE_START
        db.KeyDelete([
            "counter:1", "counter:2", "counter:3",
            "seat:0", "seat:1", "seat:2", "seat:3", "seat:4",
            "customer:39182",
            "Details"
        ]);
        // REMOVE_END

        // STEP_START basic_pipe
        var setTasks = new[]
        {
            db.StringSetAsync("seat:0", "#0"),
            db.StringSetAsync("seat:1", "#1"),
            db.StringSetAsync("seat:2", "#2"),
            db.StringSetAsync("seat:3", "#3"),
            db.StringSetAsync("seat:4", "#4")
        };
        foreach (var setTask in setTasks)
        {
            db.Wait(setTask);
        }

        var resp1Task = db.StringGetAsync("seat:0");
        var resp2Task = db.StringGetAsync("seat:3");
        var resp3Task = db.StringGetAsync("seat:4");

        var resp1 = db.Wait(resp1Task);
        Console.WriteLine(resp1); // >>> #0

        var resp2 = db.Wait(resp2Task);
        Console.WriteLine(resp2); // >>> #3

        var resp3 = db.Wait(resp3Task);
        Console.WriteLine(resp3); // >>> #4
        // STEP_END
        // REMOVE_START
        Assert.Equal("#0", resp1);
        Assert.Equal("#3", resp2);
        Assert.Equal("#4", resp3);
        // REMOVE_END

        // STEP_START basic_trans
        var trans = db.CreateTransaction();

        var incr1 = trans.StringIncrementAsync("counter:1", 1);
        var incr2 = trans.StringIncrementAsync("counter:2", 2);
        var incr3 = trans.StringIncrementAsync("counter:3", 3);

        bool committed = db.Wait(trans.ExecuteAsync());

        var resp4 = db.Wait(incr1);
        Console.WriteLine(resp4); // >>> 1

        var resp5 = db.Wait(incr2);
        Console.WriteLine(resp5); // >>> 2

        var resp6 = db.Wait(incr3);
        Console.WriteLine(resp6);  // >>> 3
        // STEP_END
        // REMOVE_START
        Assert.True(committed);
        Assert.Equal(1, resp4);
        Assert.Equal(2, resp5);
        Assert.Equal(3, resp6);
        // REMOVE_END

        // STEP_START trans_watch
        var watchedTrans = db.CreateTransaction();

        watchedTrans.AddCondition(Condition.KeyNotExists("customer:39182"));

        var hashSetTask = watchedTrans.HashSetAsync(
            "customer:39182",
            [
                new("name", "David"),
                new("age", "27")
            ]
        );

        bool succeeded = db.Wait(watchedTrans.ExecuteAsync());
        db.Wait(hashSetTask);
        Console.WriteLine(succeeded); // >>> true
        // STEP_END
        // REMOVE_START
        Assert.True(succeeded);
        // REMOVE_END

        // STEP_START when_condition
        bool resp7 = db.HashSet("Details", "SerialNumber", "12345");
        Console.WriteLine(resp7); // >>> true

        db.HashSet("Details", "SerialNumber", "12345A", When.NotExists);
        string resp8 = db.HashGet("Details", "SerialNumber")!;
        Console.WriteLine(resp8); // >>> 12345

        db.HashSet("Details", "SerialNumber", "12345A");
        string resp9 = db.HashGet("Details", "SerialNumber")!;
        Console.WriteLine(resp9); // >>> 12345A
        // STEP_END
        // REMOVE_START
        Assert.True(resp7);
        Assert.Equal("12345", resp8);
        Assert.Equal("12345A", resp9);
        // REMOVE_END
    }
}
