// Runs one command, or one MULTI/EXEC block, through StackExchange.Redis and prints what it returns or throws.
// Arguments: api port user password mode payload...  (see _common.py for the format)
using StackExchange.Redis;

string api = args[0]; int port = int.Parse(args[1]); string user = args[2], pass = args[3], mode = args[4];
string One(string s) => (s ?? "").Replace("\r", " ").Replace("\n", " ");
object[] Tokens(string p) => p.Split('\u0001').Skip(1).Select(s => s.StartsWith("hex:")
    ? (object)Convert.FromHexString(s.Substring(4)) : s).ToArray();
string Name(string p) => p.Split('\u0001')[0];
string Describe(Exception e) =>
    $"EXC\t{e.GetType().FullName}\t{One(e.Message)}" + (e.InnerException != null ? $" [inner {e.InnerException.GetType().FullName}: {One(e.InnerException.Message)}]" : "");

var o = new ConfigurationOptions { ConnectTimeout = 5000, SyncTimeout = 5000, AsyncTimeout = 5000, AbortOnConnectFail = true };
o.EndPoints.Add("127.0.0.1", port);
if (user != "") o.User = user;
if (pass != "") o.Password = pass;
try {
    using var mux = api == "sync" ? ConnectionMultiplexer.Connect(o) : await ConnectionMultiplexer.ConnectAsync(o);
    var db = mux.GetDatabase();
    if (mode == "cmd") {
        var p = args[5];
        var r = api == "sync" ? db.Execute(Name(p), Tokens(p)) : await db.ExecuteAsync(Name(p), Tokens(p));
        Console.WriteLine("OK\t" + One(r.ToString()));
    } else {
        var tx = db.CreateTransaction();
        var tasks = args.Skip(5).Select(p => tx.ExecuteAsync(Name(p), Tokens(p))).ToList();
        bool committed = api == "sync" ? tx.Execute() : await tx.ExecuteAsync();
        var errs = new List<string>();
        foreach (var t in tasks) { try { await t; } catch (Exception e) { errs.Add(e.GetType().Name + ": " + One(e.Message)); } }
        Console.WriteLine($"OK\tcommitted={committed}" + (errs.Count > 0 ? " [command errors: " + string.Join("; ", errs) + "]" : ""));
    }
} catch (Exception e) {
    Console.WriteLine(Describe(e));
}
