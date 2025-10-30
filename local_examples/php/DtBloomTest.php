// EXAMPLE: bf_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtBloomTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtBloom() {
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

        // STEP_START bloom
        $res1 = $r->bfreserve('bikes:models', 0.01, 1000);
        echo $res1 . PHP_EOL;
        // >>> OK

        $res2 = $r->bfadd('bikes:models', 'Smoky Mountain Striker');
        echo $res2 . PHP_EOL;
        // >>> 1

        $res3 = $r->bfexists('bikes:models', 'Smoky Mountain Striker');
        echo $res3 . PHP_EOL;
        // >>> 1

        $res4 = $r->bfmadd(
            'bikes:models',
            'Rocky Mountain Racer',
            'Cloudy City Cruiser',
            'Windy City Wippet'
        );
        echo json_encode($res4) . PHP_EOL;
        // >>> [1,1,1]

        $res5 = $r->bfmexists(
            'bikes:models',
            'Rocky Mountain Racer',
            'Cloudy City Cruiser',
            'Windy City Wippet'
        );
        echo json_encode($res5) . PHP_EOL;
        // >>> [1,1,1]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(1, $res3);
        $this->assertEquals([1,1,1], $res4);
        $this->assertEquals([1,1,1], $res5);
        // REMOVE_END
    }
}

