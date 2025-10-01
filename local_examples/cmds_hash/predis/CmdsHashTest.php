// EXAMPLE: cmds_hash
<?php

require_once __DIR__ . '/../vendor/autoload.php';

use PHPUnit\Framework\TestCase;
use Predis\Client as PredisClient;

class CmdsHashTest extends TestCase
{
    private PredisClient $redis;

    protected function setUp(): void
    {
        $this->redis = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);
        
        // Clean up before each test
        $this->redis->flushall();
    }

    public function testCmdsHash(): void
    {
        echo "\n=== Testing Redis Hash Commands ===\n";

        // STEP_START hdel
        echo "\n--- HDEL Command ---\n";
        $hDelResult1 = $this->redis->hset('myhash', 'field1', 'foo');
        echo "HSET myhash field1 foo: " . $hDelResult1 . "\n"; // >>> 1

        $hDelResult2 = $this->redis->hdel('myhash', 'field1');
        echo "HDEL myhash field1: " . $hDelResult2 . "\n"; // >>> 1

        $hDelResult3 = $this->redis->hdel('myhash', 'field2');
        echo "HDEL myhash field2: " . $hDelResult3 . "\n"; // >>> 0
        // STEP_END

        $this->assertEquals(1, $hDelResult1);
        $this->assertEquals(1, $hDelResult2);
        $this->assertEquals(0, $hDelResult3);

        // STEP_START hget
        echo "\n--- HGET Command ---\n";
        $hGetResult1 = $this->redis->hset('myhash', 'field1', 'foo');
        echo "HSET myhash field1 foo: " . $hGetResult1 . "\n"; // >>> 1

        $hGetResult2 = $this->redis->hget('myhash', 'field1');
        echo "HGET myhash field1: " . ($hGetResult2 ?? 'null') . "\n"; // >>> foo

        $hGetResult3 = $this->redis->hget('myhash', 'field2');
        echo "HGET myhash field2: " . ($hGetResult3 ?? 'null') . "\n"; // >>> null
        // STEP_END

        $this->assertEquals(1, $hGetResult1);
        $this->assertEquals('foo', $hGetResult2);
        $this->assertNull($hGetResult3);

        // STEP_START hgetall
        echo "\n--- HGETALL Command ---\n";
        $hGetAllResult1 = $this->redis->hmset('myhash', ['field1' => 'Hello', 'field2' => 'World']);
        echo "HMSET myhash field1 Hello field2 World: " . ($hGetAllResult1 ? 'OK' : 'FAIL') . "\n"; // >>> OK

        $hGetAllResult2 = $this->redis->hgetall('myhash');
        echo "HGETALL myhash: " . json_encode($hGetAllResult2) . "\n"; // >>> {"field1":"Hello","field2":"World"}
        // STEP_END

        $this->assertEquals('OK', $hGetAllResult1);
        $this->assertEquals(['field1' => 'Hello', 'field2' => 'World'], $hGetAllResult2);

        // STEP_START hset
        echo "\n--- HSET Command ---\n";
        // Clean up first
        $this->redis->del('myhash');

        $hSetResult1 = $this->redis->hset('myhash', 'field1', 'Hello');
        echo "HSET myhash field1 Hello: " . $hSetResult1 . "\n"; // >>> 1

        $hSetResult2 = $this->redis->hget('myhash', 'field1');
        echo "HGET myhash field1: " . $hSetResult2 . "\n"; // >>> Hello

        $hSetResult3 = $this->redis->hmset('myhash', ['field2' => 'Hi', 'field3' => 'World']);
        echo "HMSET myhash field2 Hi field3 World: " . ($hSetResult3 ? 'OK' : 'FAIL') . "\n"; // >>> OK

        $hSetResult4 = $this->redis->hget('myhash', 'field2');
        echo "HGET myhash field2: " . $hSetResult4 . "\n"; // >>> Hi

        $hSetResult5 = $this->redis->hget('myhash', 'field3');
        echo "HGET myhash field3: " . $hSetResult5 . "\n"; // >>> World

        $hSetResult6 = $this->redis->hgetall('myhash');
        echo "HGETALL myhash: ";
        foreach ($hSetResult6 as $key => $value) {
            echo "Key: $key, Value: $value; ";
        }
        echo "\n";
        // STEP_END

        $this->assertEquals(1, $hSetResult1);
        $this->assertEquals('Hello', $hSetResult2);
        $this->assertEquals('OK', $hSetResult3);
        $this->assertEquals('Hi', $hSetResult4);
        $this->assertEquals('World', $hSetResult5);
        $this->assertEquals(['field1' => 'Hello', 'field2' => 'Hi', 'field3' => 'World'], $hSetResult6);

        // STEP_START hvals
        echo "\n--- HVALS Command ---\n";
        // Clean up first
        $this->redis->del('myhash');

        $hValsResult1 = $this->redis->hmset('myhash', ['field1' => 'Hello', 'field2' => 'World']);
        echo "HMSET myhash field1 Hello field2 World: " . ($hValsResult1 ? 'OK' : 'FAIL') . "\n"; // >>> OK

        $hValsResult2 = $this->redis->hvals('myhash');
        echo "HVALS myhash: " . json_encode($hValsResult2) . "\n"; // >>> ["Hello","World"]
        // STEP_END

        $this->assertEquals('OK', $hValsResult1);
        $this->assertEquals(['Hello', 'World'], $hValsResult2);

        echo "\n=== All Hash Commands Tests Passed! ===\n";
    }

    protected function tearDown(): void
    {
        // Clean up after each test
        $this->redis->flushall();
        $this->redis->disconnect();
    }
}
