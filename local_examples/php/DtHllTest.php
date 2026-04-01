// EXAMPLE: hll_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtHllTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtHll() {
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

        // STEP_START pfadd
        $res1 = $r->pfadd('bikes', ['Hyperion', 'Deimos', 'Phoebe', 'Quaoar']);
        echo $res1 . PHP_EOL;
        // >>> 1

        $res2 = $r->pfcount('bikes');
        echo $res2 . PHP_EOL;
        // >>> 4

        $res3 = $r->pfadd('commuter_bikes', ['Salacia', 'Mimas', 'Quaoar']);
        echo $res3 . PHP_EOL;
        // >>> 1

        $res4 = $r->pfmerge('all_bikes', 'bikes', 'commuter_bikes');
        echo $res4 . PHP_EOL;
        // >>> OK

        $res5 = $r->pfcount('all_bikes');
        echo $res5 . PHP_EOL;
        // >>> 6
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(4, $res2);
        $this->assertEquals(1, $res3);
        $this->assertEquals('OK', $res4);
        $this->assertEquals(6, $res5);
        // REMOVE_END
    }
}

