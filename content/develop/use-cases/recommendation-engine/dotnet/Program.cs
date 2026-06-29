// Entry point. Picks between ``build-catalog`` and ``demo`` (default)
// based on the first command-line argument so the .csproj only needs
// one assembly.

namespace RecommendationDemo;

public static class Program
{
    public static int Main(string[] args)
    {
        if (args.Length > 0 && args[0] == "build-catalog")
        {
            return BuildCatalog.Run(args.Skip(1).ToArray());
        }
        return DemoServer.Run(args);
    }
}
