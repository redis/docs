// EXAMPLE: cmds_generic
// HIDE_START
using NRedisStack.Tests;
using StackExchange.Redis;

public class CmdsGenericExample
{
    public void Run()
    {
        var muxer = ConnectionMultiplexer.Connect("localhost:6379");
        var db = muxer.GetDatabase();
// HIDE_END

        // Tests for 'copy' step.

        // STEP_START del
        bool delResult1 = db.StringSet("key1", "Hello");
        Console.WriteLine(delResult1);  // >>> true

        bool delResult2 = db.StringSet("key2", "World");
        Console.WriteLine(delResult2);  // >>> true

        long delResult3 = db.KeyDelete(["key1", "key2", "key3"]);
        Console.WriteLine(delResult3);  // >>> 2

        // Tests for 'del' step.
        // STEP_END

        // Tests for 'dump' step.

        // STEP_START exists
        bool existsResult1 = db.StringSet("key1", "Hello");
        Console.WriteLine(existsResult1);  // >>> true

        bool existsResult2 = db.KeyExists("key1");
        Console.WriteLine(existsResult2);  // >>> true

        bool existsResult3 = db.KeyExists("nosuchkey");
        Console.WriteLine(existsResult3);  // >>> false

        bool existsResult4 = db.StringSet("key2", "World");
        Console.WriteLine(existsResult4);  // >>> true

        long existsResult5 = db.KeyExists(["key1", "key2", "nosuchkey"]);
        Console.WriteLine(existsResult5);  // >>> 2

        // Tests for 'exists' step.
        // STEP_END

        // STEP_START expire
        bool expireResult1 = db.StringSet("mykey", "Hello");
        Console.WriteLine(expireResult1);   // >>> true

        bool expireResult2 = db.KeyExpire("mykey", new TimeSpan(0, 0, 10));
        Console.WriteLine(expireResult2);   // >>> true

        TimeSpan expireResult3 = db.KeyTimeToLive("mykey") ?? TimeSpan.Zero;
        Console.WriteLine(Math.Round(expireResult3.TotalSeconds));   // >>> 10

        bool expireResult4 = db.StringSet("mykey", "Hello World");
        Console.WriteLine(expireResult4);   // >>> true

        TimeSpan expireResult5 = db.KeyTimeToLive("mykey") ?? TimeSpan.Zero;
        Console.WriteLine(Math.Round(expireResult5.TotalSeconds).ToString());   // >>> 0

        bool expireResult6 = db.KeyExpire("mykey", new TimeSpan(0, 0, 10), ExpireWhen.HasExpiry);
        Console.WriteLine(expireResult6);   // >>> false

        TimeSpan expireResult7 = db.KeyTimeToLive("mykey") ?? TimeSpan.Zero;
        Console.WriteLine(Math.Round(expireResult7.TotalSeconds));   // >>> 0

        bool expireResult8 = db.KeyExpire("mykey", new TimeSpan(0, 0, 10), ExpireWhen.HasNoExpiry);
        Console.WriteLine(expireResult8);   // >>> true

        TimeSpan expireResult9 = db.KeyTimeToLive("mykey") ?? TimeSpan.Zero;
        Console.WriteLine(Math.Round(expireResult9.TotalSeconds));   // >>> 10

        // Tests for 'expire' step.
        // STEP_END

        // Tests for 'expireat' step.

        // Tests for 'expiretime' step.

        // Tests for 'keys' step.

        // Tests for 'migrate' step.

        // Tests for 'move' step.

        // Tests for 'object_encoding' step.

        // Tests for 'object_freq' step.

        // Tests for 'object_idletime' step.

        // Tests for 'object_refcount' step.

        // Tests for 'persist' step.

        // Tests for 'pexpire' step.

        // Tests for 'pexpireat' step.

        // Tests for 'pexpiretime' step.

        // Tests for 'pttl' step.

        // Tests for 'randomkey' step.

        // Tests for 'rename' step.

        // Tests for 'renamenx' step.

        // Tests for 'restore' step.

        // Tests for 'scan1' step.

        // Tests for 'scan2' step.

        // Tests for 'scan3' step.

        // Tests for 'scan4' step.

        // Tests for 'sort' step.

        // Tests for 'sort_ro' step.

        // Tests for 'touch' step.

        // STEP_START ttl
        bool ttlResult1 = db.StringSet("mykey", "Hello");
        Console.WriteLine(ttlResult1);  // >>> true

        bool ttlResult2 = db.KeyExpire("mykey", new TimeSpan(0, 0, 10));
        Console.WriteLine(ttlResult2);

        TimeSpan ttlResult3 = db.KeyTimeToLive("mykey") ?? TimeSpan.Zero;
        string ttlRes = Math.Round(ttlResult3.TotalSeconds).ToString();
        Console.WriteLine(Math.Round(ttlResult3.TotalSeconds)); // >>> 10

        // Tests for 'ttl' step.
        // STEP_END

        // Tests for 'type' step.

        // Tests for 'unlink' step.

        // Tests for 'wait' step.

        // Tests for 'waitaof' step.

// HIDE_START
    }
}
// HIDE_END
