// EXAMPLE: hash_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtHashTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtHash() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);
        // REMOVE_START
        $r->flushall();
        // REMOVE_END

        // STEP_START set_get_all
        $res1 = $r->hmset('bike:1', [
            'model' => 'Deimos',
            'brand' => 'Ergonom',
            'type' => 'Enduro bikes',
            'price' => 4972,
        ]);

        echo $res1 . PHP_EOL;
        // >>> 4

        $res2 = $r->hget('bike:1', 'model');
        echo $res2 . PHP_EOL;
        // >>> Deimos

        $res3 = $r->hget('bike:1', 'price');
        echo $res3 . PHP_EOL;
        // >>> 4972

        $res4 = $r->hgetall('bike:1');
        echo json_encode($res3) . PHP_EOL;
        // >>> {"name":"Deimos","brand":"Ergonom","type":"Enduro bikes","price":"4972"}
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals('Deimos', $res2);
        $this->assertEquals('4972', $res3);
        $this->assertEquals(
            ['model' => 'Deimos', 'brand' => 'Ergonom', 'type' => 'Enduro bikes', 'price' => '4972'],
            $res4
        );
        // REMOVE_END

        // STEP_START hmget
        $res5 = $r->hmget('bike:1', ['model', 'price']);
        echo json_encode($res5) . PHP_EOL;
        // >>> ["Deimos","4972"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['Deimos', '4972'], $res5);
        // REMOVE_END

        // STEP_START hincrby
        $res6 = $r->hincrby('bike:1', 'price', 100);
        echo $res6 . PHP_EOL;
        // >>> 5072

        $res7 = $r->hincrby('bike:1', 'price', -100);
        echo $res7 . PHP_EOL;
        // >>> 4972
        // STEP_END
        // REMOVE_START
        $this->assertEquals(5072, $res6);
        $this->assertEquals(4972, $res7);
        // REMOVE_END

        // STEP_START incrby_get_mget
        $res8 = $r->hincrby('bike:1:stats', 'rides', 1);
        echo $res8 . PHP_EOL;
        // >>> 1

        $res9 = $r->hincrby('bike:1:stats', 'rides', 1);
        echo $res9 . PHP_EOL;
        // >>> 2

        $res10 = $r->hincrby('bike:1:stats', 'rides', 1);
        echo $res10 . PHP_EOL;
        // >>> 3

        $res11 = $r->hincrby('bike:1:stats', 'crashes', 1);
        echo $res11 . PHP_EOL;
        // >>> 1

        $res12 = $r->hincrby('bike:1:stats', 'owners', 1);
        echo $res12 . PHP_EOL;
        // >>> 1

        $res13 = $r->hget('bike:1:stats', 'rides');
        echo $res13 . PHP_EOL;
        // >>> 3

        $res14 = $r->hmget('bike:1:stats', ['crashes', 'owners']);
        echo json_encode($res14) . PHP_EOL;
        // >>> ["1","1"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res8);
        $this->assertEquals(2, $res9);
        $this->assertEquals(3, $res10);
        $this->assertEquals(1, $res11);
        $this->assertEquals(1, $res12);
        $this->assertEquals(3, $res13);
        $this->assertEquals([1, 1], $res14);
        // REMOVE_END
    }
}
