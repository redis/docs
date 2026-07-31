// EXAMPLE: cmds_servermgmt
using System;
using System.Linq;
using StackExchange.Redis;

public class CmdsServerMgmt
{
    public void Run()
    {
        // FLUSHALL and INFO are server-admin commands, so connect with
        // allowAdmin=true and issue them through the IServer object.
        var muxer = ConnectionMultiplexer.Connect("localhost:6379,allowAdmin=true");
        var server = muxer.GetServer("localhost:6379");

        // STEP_START flushall
        server.FlushAllDatabases();

        var res2 = server.Keys(pattern: "*").ToArray();
        Console.WriteLine(res2.Length); // >>> 0
        // STEP_END

        // STEP_START info
        var res3 = server.Info();
        Console.WriteLine(res3.Length > 0); // >>> True
        // STEP_END
    }
}
