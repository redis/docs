// EXAMPLE: arrays_tutorial
<?php
// BINDER_ID php-arrays-tutorial

use PHPUnit\Framework\TestCase;
use Predis\Client as PredisClient;

class DtArraysTest
// REMOVE_START
extends TestCase
// REMOVE_END
{
    public function testArsetArget(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('events:1');
        // REMOVE_END

        // STEP_START arset_arget
        $res1 = $redis->arset('events:1', 0, ['login', 'click', 'purchase']);
        echo $res1 . PHP_EOL; // >>> 3

        $res2 = $redis->arget('events:1', 0);
        echo $res2 . PHP_EOL; // >>> login

        $res3 = $redis->arget('events:1', 999);
        echo var_export($res3, true) . PHP_EOL; // >>> NULL
        // STEP_END

        // REMOVE_START
        $this->assertEquals(3, $res1);
        $this->assertEquals('login', $res2);
        $this->assertNull($res3);
        $redis->del('events:1');
        // REMOVE_END
    }

    public function testArmsetArmget(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('metrics');
        // REMOVE_END

        // STEP_START armset_armget
        $res1 = $redis->armset('metrics', [0 => '10', 5 => '20', 100 => '30']);
        echo $res1 . PHP_EOL; // >>> 3

        $res2 = $redis->armget('metrics', [0, 5, 100, 999]);
        echo json_encode($res2) . PHP_EOL; // >>> ["10","20","30",null]
        // STEP_END

        // REMOVE_START
        $this->assertEquals(3, $res1);
        $this->assertEquals(['10', '20', '30', null], $res2);
        $redis->del('metrics');
        // REMOVE_END
    }

    public function testLenCount(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('sparse');
        // REMOVE_END

        // STEP_START len_count
        $res1 = $redis->arset('sparse', 0, 'a');
        echo $res1 . PHP_EOL; // >>> 1

        $res2 = $redis->arset('sparse', 1000000, 'b');
        echo $res2 . PHP_EOL; // >>> 1

        $res3 = $redis->arlen('sparse');
        echo $res3 . PHP_EOL; // >>> 1000001

        $res4 = $redis->arcount('sparse');
        echo $res4 . PHP_EOL; // >>> 2
        // STEP_END

        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(1000001, $res3);
        $this->assertEquals(2, $res4);
        $redis->del('sparse');
        // REMOVE_END
    }

    public function testArgetrange(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('seq');
        // REMOVE_END

        // STEP_START argetrange
        $res1 = $redis->armset('seq', [0 => 'a', 1 => 'b', 3 => 'd']);
        echo $res1 . PHP_EOL; // >>> 3

        $res2 = $redis->argetrange('seq', 0, 3);
        echo json_encode($res2) . PHP_EOL; // >>> ["a","b",null,"d"]
        // STEP_END

        // REMOVE_START
        $this->assertEquals(3, $res1);
        $this->assertEquals(['a', 'b', null, 'd'], $res2);
        $redis->del('seq');
        // REMOVE_END
    }

    public function testArscan(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('seq');
        // REMOVE_END

        // STEP_START arscan
        $res1 = $redis->armset('seq', [0 => 'a', 1 => 'b', 3 => 'd']);
        echo $res1 . PHP_EOL; // >>> 3

        $res2 = $redis->arscan('seq', 0, 3);
        foreach ($res2 as $pair) {
            echo $pair[0] . ' -> ' . $pair[1] . PHP_EOL;
        }
        // >>> 0 -> a
        // >>> 1 -> b
        // >>> 3 -> d
        // STEP_END

        // REMOVE_START
        $this->assertEquals(3, $res1);
        $this->assertEquals('0', $res2[0][0]);
        $this->assertEquals('a', $res2[0][1]);
        $this->assertEquals('3', $res2[2][0]);
        $this->assertEquals('d', $res2[2][1]);
        $redis->del('seq');
        // REMOVE_END
    }

    public function testArinsert(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('log');
        // REMOVE_END

        // STEP_START arinsert
        $res1 = $redis->arinsert('log', 'event1');
        echo $res1 . PHP_EOL; // >>> 0

        $res2 = $redis->arinsert('log', 'event2');
        echo $res2 . PHP_EOL; // >>> 1

        $res3 = $redis->arnext('log');
        echo $res3 . PHP_EOL; // >>> 2

        $res4 = $redis->arseek('log', 10);
        echo $res4 . PHP_EOL; // >>> 1

        $res5 = $redis->arinsert('log', 'event3');
        echo $res5 . PHP_EOL; // >>> 10
        // STEP_END

        // REMOVE_START
        $this->assertEquals(0, $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(2, $res3);
        $this->assertEquals(1, $res4);
        $this->assertEquals(10, $res5);
        $redis->del('log');
        // REMOVE_END
    }

    public function testArring(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('readings');
        // REMOVE_END

        // STEP_START arring
        $res1 = $redis->arring('readings', 3, 'v0');
        echo $res1 . PHP_EOL; // >>> 0

        $res2 = $redis->arring('readings', 3, 'v1');
        echo $res2 . PHP_EOL; // >>> 1

        $res3 = $redis->arring('readings', 3, 'v2');
        echo $res3 . PHP_EOL; // >>> 2

        $res4 = $redis->arring('readings', 3, 'v3');
        echo $res4 . PHP_EOL; // >>> 0

        $res5 = $redis->arget('readings', 0);
        echo $res5 . PHP_EOL; // >>> v3
        // STEP_END

        // REMOVE_START
        $this->assertEquals(0, $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(2, $res3);
        $this->assertEquals(0, $res4);
        $this->assertEquals('v3', $res5);
        $redis->del('readings');
        // REMOVE_END
    }

    public function testArlastitems(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('readings');
        // REMOVE_END

        // STEP_START arlastitems
        $redis->arring('readings', 3, 'v0');
        $redis->arring('readings', 3, 'v1');
        $redis->arring('readings', 3, 'v2');
        $redis->arring('readings', 3, 'v3');

        $res1 = $redis->arlastitems('readings', 3);
        echo json_encode($res1) . PHP_EOL; // >>> ["v1","v2","v3"]

        $res2 = $redis->arlastitems('readings', 3, true);
        echo json_encode($res2) . PHP_EOL; // >>> ["v3","v2","v1"]
        // STEP_END

        // REMOVE_START
        $this->assertEquals(['v1', 'v2', 'v3'], $res1);
        $this->assertEquals(['v3', 'v2', 'v1'], $res2);
        $redis->del('readings');
        // REMOVE_END
    }

    public function testArop(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('scores');
        // REMOVE_END

        // STEP_START arop
        $res1 = $redis->armset('scores', [0 => '10', 1 => '20', 2 => '30']);
        echo $res1 . PHP_EOL; // >>> 3

        $res2 = $redis->arop('scores', 0, 2, 'SUM');
        echo $res2 . PHP_EOL; // >>> 60

        $res3 = $redis->arop('scores', 0, 2, 'MAX');
        echo $res3 . PHP_EOL; // >>> 30

        $res4 = $redis->arop('scores', 0, 2, 'MATCH', '10');
        echo $res4 . PHP_EOL; // >>> 1
        // STEP_END

        // REMOVE_START
        $this->assertEquals(3, $res1);
        $this->assertEquals('60', $res2);
        $this->assertEquals('30', $res3);
        $this->assertEquals(1, $res4);
        $redis->del('scores');
        // REMOVE_END
    }

    public function testArgrep(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('log');
        // REMOVE_END

        // STEP_START argrep
        $res1 = $redis->armset('log', [
            0 => 'boot: ok',
            1 => 'warn: disk',
            2 => 'ERROR: cpu',
            3 => 'info: ready',
            4 => 'error: net',
        ]);
        echo $res1 . PHP_EOL; // >>> 5

        // Predicates are [type, value] pairs. Positional argument order is:
        // (key, start, end, predicates, combinator, limit, withValues, noCase)
        $res2 = $redis->argrep('log', 0, 4, [['MATCH', 'error']], null, null, false, true);
        echo json_encode($res2) . PHP_EOL; // >>> [2,4]

        $res3 = $redis->argrep(
            'log',
            0,
            4,
            [['GLOB', 'warn:*'], ['GLOB', 'error:*']],
            'OR',
            null,
            true
        );
        foreach ($res3 as $pair) {
            echo $pair[0] . ' -> ' . $pair[1] . PHP_EOL;
        }
        // >>> 1 -> warn: disk
        // >>> 4 -> error: net
        // STEP_END

        // REMOVE_START
        $this->assertEquals(5, $res1);
        $this->assertEquals([2, 4], $res2);
        $this->assertEquals('1', $res3[0][0]);
        $this->assertEquals('warn: disk', $res3[0][1]);
        $this->assertEquals('4', $res3[1][0]);
        $this->assertEquals('error: net', $res3[1][1]);
        $redis->del('log');
        // REMOVE_END
    }

    public function testArdel(): void
    {
        $redis = new PredisClient([
            'scheme' => 'tcp',
            'host'   => '127.0.0.1',
            'port'   => 6379,
        ]);
        // REMOVE_START
        $redis->del('scores');
        // REMOVE_END

        // STEP_START ardel
        $res1 = $redis->armset('scores', [0 => '10', 1 => '20', 2 => '30']);
        echo $res1 . PHP_EOL; // >>> 3

        $res2 = $redis->ardel('scores', 1);
        echo $res2 . PHP_EOL; // >>> 1

        $res3 = $redis->ardelrange('scores', 0, 2);
        echo $res3 . PHP_EOL; // >>> 2
        // STEP_END

        // REMOVE_START
        $this->assertEquals(3, $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(2, $res3);
        $redis->del('scores');
        // REMOVE_END
    }
}
