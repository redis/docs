// Minimal stand-ins for NRedisStack's own test fixtures, so a docs example
// file (which extends AbstractNRedisStackTest and uses [SkippableFact]) runs
// under plain xunit + StackExchange.Redis. The example creates its own
// ConnectionMultiplexer, so the fixture helpers can be no-ops.
using StackExchange.Redis;

namespace NRedisStack.Tests
{
    public class EndpointsFixture
    {
        public enum Env { Standalone }
    }

    public class AbstractNRedisStackTest : IDisposable
    {
        protected AbstractNRedisStackTest(EndpointsFixture fixture) { }
        protected void SkipIfTargetConnectionDoesNotExist(EndpointsFixture.Env env) { }
        protected IDatabase GetCleanDatabase(EndpointsFixture.Env env)
        {
            var muxer = ConnectionMultiplexer.Connect("localhost:6379");
            return muxer.GetDatabase();
        }
        public void Dispose() { }
    }

    // The examples annotate the test method [SkippableFact]; make it a plain Fact.
    public class SkippableFactAttribute : FactAttribute { }
}

// Satisfy [Collection("DocsTests")] + constructor injection of EndpointsFixture.
[CollectionDefinition("DocsTests")]
public class DocsTestsCollection : ICollectionFixture<NRedisStack.Tests.EndpointsFixture> { }
