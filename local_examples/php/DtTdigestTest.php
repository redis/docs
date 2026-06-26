// EXAMPLE: tdigest_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtTdigestTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtTdigest() {
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

        // STEP_START tdig_start
        $res1 = $r->tdigestcreate('bikes:sales', 100);
        echo $res1 . PHP_EOL;
        // >>> OK

        $res2 = $r->tdigestadd('bikes:sales', 21);
        echo $res2 . PHP_EOL;
        // >>> OK

        $res3 = $r->tdigestadd('bikes:sales', 150, 95, 75, 34);
        echo $res3 . PHP_EOL;
        // >>> OK
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals('OK', $res2);
        $this->assertEquals('OK', $res3);
        // REMOVE_END

        // STEP_START tdig_cdf
        $res4 = $r->tdigestcreate('racer_ages');
        echo $res4 . PHP_EOL;
        // >>> OK

        $res5 = $r->tdigestadd(
            'racer_ages',
            45.88,
            44.2,
            58.03,
            19.76,
            39.84,
            69.28,
            50.97,
            25.41,
            19.27,
            85.71,
            42.63
        );
        echo $res5 . PHP_EOL;
        // >>> OK

        $res6 = $r->tdigestrank('racer_ages', 50);
        echo json_encode($res6) . PHP_EOL;
        // >>> [7]

        $res7 = $r->tdigestrank('racer_ages', 50, 40);
        echo json_encode($res7) . PHP_EOL;
        // >>> [7,4]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res4);
        $this->assertEquals('OK', $res5);
        $this->assertEquals([7], $res6);
        $this->assertEquals([7, 4], $res7);
        // REMOVE_END

        // STEP_START tdig_quant
        $res8 = $r->tdigestquantile('racer_ages', 0.5);
        echo json_encode($res8) . PHP_EOL;
        // >>> ["44.2"]

        $res9 = $r->tdigestbyrank('racer_ages', 4);
        echo json_encode($res9) . PHP_EOL;
        // >>> ["42.63"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['44.2'], $res8);
        $this->assertEquals(['42.63'], $res9);
        // REMOVE_END

        // STEP_START tdig_min
        $res10 = $r->tdigestmin('racer_ages');
        echo $res10 . PHP_EOL;
        // >>> 19.27

        $res11 = $r->tdigestmax('racer_ages');
        echo $res11 . PHP_EOL;
        // >>> 85.71
        // STEP_END
        // REMOVE_START
        $this->assertEquals('19.27', $res10);
        $this->assertEquals('85.71', $res11);
        // REMOVE_END

        // STEP_START tdig_reset
        $res12 = $r->tdigestreset('racer_ages');
        echo $res12 . PHP_EOL;
        // >>> OK
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res12);
        // REMOVE_END
    }
}

