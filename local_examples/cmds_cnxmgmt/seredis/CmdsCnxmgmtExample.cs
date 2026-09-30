// EXAMPLE: cmds_cnxmgmt
using System;
using StackExchange.Redis;

public class CmdsCnxmgmt
{
    public void Run()
    {
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();

        // Note: StackExchange.Redis has no dedicated AUTH method — you normally
        // supply credentials on the connection (for example
        // ConfigurationOptions.User / ConfigurationOptions.Password). The raw
        // AUTH command is shown here for parity with the other clients.

        // STEP_START auth1
        var res1 = db.Execute("AUTH", "temp_pass");
        Console.WriteLine(res1); // >>> OK

        var res2 = db.Execute("AUTH", "default", "temp_pass");
        Console.WriteLine(res2); // >>> OK
        // STEP_END

        // STEP_START auth2
        var res3 = db.Execute("AUTH", "test-user", "strong_password");
        Console.WriteLine(res3); // >>> OK
        // STEP_END
    }
}
