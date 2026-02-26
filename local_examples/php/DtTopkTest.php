// EXAMPLE: topk_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtTopkTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtTopk() {
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

        // STEP_START topk
        $res1 = $r->topkreserve('bikes:keywords', 5, 2000, 7, 0.925);
        echo $res1 . PHP_EOL;
        // >>> OK

        $res2 = $r->topkadd(
            'bikes:keywords',
            'store',
            'seat',
            'handlebars',
            'handles',
            'pedals',
            'tires',
            'store',
            'seat',
        );
        echo json_encode($res2) . PHP_EOL;
        // >>> [null,null,null,null,null,"handlebars",null,null]

        $res3 = $r->topklist('bikes:keywords');
        echo json_encode($res3) . PHP_EOL;
        // >>> ["store","seat","pedals","tires","handles"]

        $res4 = $r->topkquery('bikes:keywords', 'store', 'handlebars');
        echo json_encode($res4) . PHP_EOL;
        // >>> [1,0]
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals([null, null, null, null, null, 'handlebars', null, null], $res2);
        $this->assertEquals(['store','seat','pedals','tires','handles'], $res3);
        $this->assertEquals([1,0], $res4);
        // REMOVE_END
    }
}

