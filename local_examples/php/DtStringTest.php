// EXAMPLE: set_tutorial
// BINDER_ID php-dt-string
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtStringTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtString() {
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

        // STEP_START set_get
        $res1 = $r->set('bike:1', 'Deimos');
        echo "$res1" . PHP_EOL;
        // >>> OK

        $res2 = $r->get('bike:1');
        echo "$res2" . PHP_EOL;
        // >>> Deimos
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals('Deimos', $res2);
        // REMOVE_END

        // STEP_START setnx_xx
        $res3 = $r->set('bike:1', 'bike', 'nx');
        echo "$res3" . PHP_EOL;
        // >>> (null)
        
        echo $r->get('bike:1') . PHP_EOL;
        // >>> Deimos

        $res4 = $r->set('bike:1', 'bike', 'xx');
        echo "$res4" . PHP_EOL;
        // >>> OK
        // STEP_END
        // REMOVE_START
        $this->assertEquals(null, $res3);
        $this->assertEquals('OK', $res4);
        $this->assertEquals('bike', $r->get('bike:1'));
        // REMOVE_END

        // STEP_START mset
        $res5 = $r->mset([
            'bike:1' => 'Deimos', 'bike:2' => 'Ares', 'bike:3' => 'Vanth'
        ]);
        echo "$res5" . PHP_EOL;
        // >>> OK

        $res6 = $r->mget(['bike:1', 'bike:2', 'bike:3']);
        echo json_encode($res6) . PHP_EOL;
        // >>> ["Deimos","Ares","Vanth"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res5);
        $this->assertEquals(['Deimos', 'Ares', 'Vanth'],  $res6);
        // REMOVE_END

        // STEP_START incr
        $r->set('total_crashes', 0);
        $res7 = $r->incr('total_crashes');
        echo "$res7" . PHP_EOL;
        // >>> 1

        $res8 = $r->incrby('total_crashes', 10);
        echo "$res8" . PHP_EOL;
        // >>> 11
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res7);
        $this->assertEquals(11, $res8);
        // REMOVE_END
    }
}