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
        // STEP_START hdel
        $hDelResult1 = $this->redis->hset('myhash', 'field1', 'foo');
        echo "HSET myhash field1 foo: " . $hDelResult1 . "\n"; // >>> 1

        $hDelResult2 = $this->redis->hdel('myhash', 'field1');
        echo "HDEL myhash field1: " . $hDelResult2 . "\n"; // >>> 1

        $hDelResult3 = $this->redis->hdel('myhash', 'field2');
        echo "HDEL myhash field2: " . $hDelResult3 . "\n"; // >>> 0
        // STEP_END

        // REMOVE_START
        $this->assertEquals(1, $hDelResult1);
        $this->assertEquals(1, $hDelResult2);
        $this->assertEquals(0, $hDelResult3);
        // REMOVE_END

        // STEP_START hget
        $hGetResult1 = $this->redis->hset('myhash', 'field1', 'foo');
        echo "HSET myhash field1 foo: " . $hGetResult1 . "\n"; // >>> 1

        $hGetResult2 = $this->redis->hget('myhash', 'field1');
        echo "HGET myhash field1: " . ($hGetResult2 ?? 'null') . "\n"; // >>> foo

        $hGetResult3 = $this->redis->hget('myhash', 'field2');
        echo "HGET myhash field2: " . ($hGetResult3 ?? 'null') . "\n"; // >>> null
        // STEP_END

        // REMOVE_START
        $this->assertEquals(1, $hGetResult1);
        $this->assertEquals('foo', $hGetResult2);
        $this->assertNull($hGetResult3);
        // REMOVE_END

        // STEP_START hgetall
        $hGetAllResult1 = $this->redis->hmset('myhash', ['field1' => 'Hello', 'field2' => 'World']);
        echo "HMSET myhash field1 Hello field2 World: " . ($hGetAllResult1 ? 'OK' : 'FAIL') . "\n"; // >>> OK

        $hGetAllResult2 = $this->redis->hgetall('myhash');
        echo "HGETALL myhash: " . json_encode($hGetAllResult2) . "\n"; // >>> {"field1":"Hello","field2":"World"}
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $hGetAllResult1);
        $this->assertEquals(['field1' => 'Hello', 'field2' => 'World'], $hGetAllResult2);
        // REMOVE_END

        // STEP_START hset
        // REMOVE_START
        $this->redis->del('myhash');
        // REMOVE_END

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

        // REMOVE_START
        $this->assertEquals(1, $hSetResult1);
        $this->assertEquals('Hello', $hSetResult2);
        $this->assertEquals('OK', $hSetResult3);
        $this->assertEquals('Hi', $hSetResult4);
        $this->assertEquals('World', $hSetResult5);
        $this->assertEquals(['field1' => 'Hello', 'field2' => 'Hi', 'field3' => 'World'], $hSetResult6);
        // REMOVE_END

        // STEP_START hvals
        // REMOVE_START
        $this->redis->del('myhash');
        // REMOVE_END

        $hValsResult1 = $this->redis->hmset('myhash', ['field1' => 'Hello', 'field2' => 'World']);
        echo "HMSET myhash field1 Hello field2 World: " . ($hValsResult1 ? 'OK' : 'FAIL') . "\n"; // >>> OK

        $hValsResult2 = $this->redis->hvals('myhash');
        echo "HVALS myhash: " . json_encode($hValsResult2) . "\n"; // >>> ["Hello","World"]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $hValsResult1);
        $this->assertEquals(['Hello', 'World'], $hValsResult2);
        // REMOVE_END

        // STEP_START hexpire
        // REMOVE_START
        $this->redis->del('myhash');
        // REMOVE_END

        // Set up hash with fields
        $hExpireResult1 = $this->redis->hmset('myhash', ['field1' => 'Hello', 'field2' => 'World']);
        echo "HMSET myhash field1 Hello field2 World: " . ($hExpireResult1 ? 'OK' : 'FAIL') . "\n"; // >>> OK

        // Set expiration on hash fields
        $hExpireResult2 = $this->redis->hexpire('myhash', 10, ['field1', 'field2']);
        echo "HEXPIRE myhash 10 FIELDS field1 field2: " . json_encode($hExpireResult2) . "\n"; // >>> [1,1]

        // Check TTL of the fields
        $hExpireResult3 = $this->redis->httl('myhash', ['field1', 'field2']);
        echo "HTTL myhash FIELDS field1 field2 count: " . count($hExpireResult3) . "\n"; // >>> 2

        // Try to set expiration on non-existent field
        $hExpireResult4 = $this->redis->hexpire('myhash', 10, ['nonexistent']);
        echo "HEXPIRE myhash 10 FIELDS nonexistent: " . json_encode($hExpireResult4) . "\n"; // >>> [-2]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $hExpireResult1);
        $this->assertEquals([1, 1], $hExpireResult2);
        $this->assertEquals(2, count($hExpireResult3));
        $this->assertTrue(array_reduce($hExpireResult3, function($carry, $ttl) { return $carry && $ttl > 0; }, true)); // TTL should be positive
        $this->assertEquals([-2], $hExpireResult4);
        // REMOVE_END
    }

    protected function tearDown(): void
    {
        // Clean up after each test
        $this->redis->flushall();
        $this->redis->disconnect();
    }
}
