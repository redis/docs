// EXAMPLE: cmds_stream
<?php
// BINDER_ID php-cmds-stream

use PHPUnit\Framework\TestCase;
use Predis\Client as PredisClient;

class CmdStreamTest
// REMOVE_START
extends TestCase
// REMOVE_END
{
    public function testXadd1(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('mystream');
        // REMOVE_END

        // STEP_START xadd1
        $res1 = $redis->xadd('mystream', ['name' => 'Sara', 'surname' => 'OConnor']);
        echo $res1 . PHP_EOL; // >>> 1726055713866-0

        $res2 = $redis->xadd('mystream', ['field1' => 'value1', 'field2' => 'value2', 'field3' => 'value3']);
        echo $res2 . PHP_EOL; // >>> 1726055713866-1

        $res3 = $redis->xlen('mystream');
        echo $res3 . PHP_EOL; // >>> 2

        $res4 = $redis->xrange('mystream', '-', '+');
        foreach ($res4 as $id => $fields) {
            echo $id . ' -> ' . json_encode($fields) . PHP_EOL;
        }
        // >>> 1726055713866-0 -> {"name":"Sara","surname":"OConnor"}
        // >>> 1726055713866-1 -> {"field1":"value1","field2":"value2","field3":"value3"}
        // STEP_END

        // REMOVE_START
        $this->assertEquals(2, $res3);
        $this->assertCount(2, $res4);
        $redis->del('mystream');
        // REMOVE_END
    }

    public function testXadd2(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('mystream');
        // REMOVE_END

        // STEP_START xadd2
        $res5 = $redis->xadd('mystream', ['field' => 'value'], '*', ['idmp' => ['producer1', 'msg1']]);
        echo $res5 . PHP_EOL; // >>> 1726055713867-0

        // Attempting to add the same message again with IDMP returns the original entry ID
        $res6 = $redis->xadd('mystream', ['field' => 'different_value'], '*', ['idmp' => ['producer1', 'msg1']]);
        echo $res6 . PHP_EOL; // >>> 1726055713867-0 (same ID as res5, message was deduplicated)

        $res7 = $redis->xadd('mystream', ['field' => 'value'], '*', ['idmpauto' => 'producer2']);
        echo $res7 . PHP_EOL; // >>> 1726055713867-1

        // Auto-generated idempotent ID prevents duplicates for same producer+content
        $res8 = $redis->xadd('mystream', ['field' => 'value'], '*', ['idmpauto' => 'producer2']);
        echo $res8 . PHP_EOL; // >>> 1726055713867-1 (same ID as res7, duplicate detected)

        // Configure idempotent message processing settings
        $res9 = $redis->xcfgset('mystream', 300, 1000);
        echo $res9 . PHP_EOL; // >>> OK
        // STEP_END

        // REMOVE_START
        $this->assertNotNull($res5);
        $redis->del('mystream');
        // REMOVE_END
    }
}

