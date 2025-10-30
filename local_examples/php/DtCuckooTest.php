// EXAMPLE: cuckoo_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtCuckooTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtCuckoo() {
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

        // STEP_START cuckoo
        $res1 = $r->cfreserve('bikes:models', 1000000);
        echo $res1 . PHP_EOL;
        // >>> OK

        $res2 = $r->cfadd('bikes:models', 'Smoky Mountain Striker');
        echo $res2 . PHP_EOL;
        // >>> 1

        $res3 = $r->cfexists('bikes:models', 'Smoky Mountain Striker');
        echo $res3 . PHP_EOL;
        // >>> 1

        $res4 = $r->cfexists('bikes:models', 'Terrible Bike Name');
        echo $res4 . PHP_EOL;
        // >>> 0

        $res5 = $r->cfdel('bikes:models', 'Smoky Mountain Striker');
        echo $res5 . PHP_EOL;
        // >>> 1
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(1, $res3);
        $this->assertEquals(0, $res4);
        $this->assertEquals(1, $res5);
        // REMOVE_END
    }
}

