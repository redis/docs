// EXAMPLE: sets_tutorial
// BINDER_ID php-dt-set
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtSetsTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtSet() {
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

        // STEP_START sadd
        $res1 = $r->sadd('bikes:racing:france', ['bike:1']);
        echo $res1 . PHP_EOL;
        // >>> 1

        $res2 = $r->sadd('bikes:racing:france', ['bike:1']);
        echo $res2 . PHP_EOL;
        // >>> 0

        $res3 = $r->sadd('bikes:racing:france', ['bike:2', 'bike:3']);
        echo $res3 . PHP_EOL;
        // >>> 2

        $res4 = $r->sadd('bikes:racing:usa', ['bike:1', 'bike:4']);
        echo $res4 . PHP_EOL;
        // >>> 2
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(0, $res2);
        $this->assertEquals(2, $res3);
        $this->assertEquals(2, $res4);
        // REMOVE_END

        // STEP_START sismember
        $res5 = $r->sismember('bikes:racing:usa', 'bike:1');
        echo $res5 . PHP_EOL;
        // >>> 1

        $res6 = $r->sismember('bikes:racing:usa', 'bike:2');
        echo $res6 . PHP_EOL;
        // >>> 0
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res5);
        $this->assertEquals(0, $res6);
        // REMOVE_END

        // STEP_START sinter
        $res7 = $r->sinter(['bikes:racing:france', 'bikes:racing:usa']);
        echo json_encode($res7) . PHP_EOL;
        // >>> ["bike:1"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['bike:1'], $res7);
        // REMOVE_END

        // STEP_START scard
        $res8 = $r->scard('bikes:racing:france');
        echo $res8 . PHP_EOL;
        // >>> 3
        // STEP_END
        // REMOVE_START
        $this->assertEquals(3, $res8);
        $r->del('bikes:racing:usa');
        // REMOVE_END

        // STEP_START sadd_smembers
        $r->del('bikes:racing:france');

        $res9 = $r->sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3']);
        echo $res9 . PHP_EOL;
        // >>> 3

        $res10 = $r->smembers('bikes:racing:france');
        sort($res10);
        echo json_encode($res10) . PHP_EOL;
        // >>> ["bike:1","bike:2","bike:3"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(3, $res9);
        $this->assertEquals(['bike:1', 'bike:2', 'bike:3'], $res10);
        // REMOVE_END

        // STEP_START smismember
        $res11 = $r->sismember('bikes:racing:france', 'bike:1');
        echo $res11 . PHP_EOL;
        // >>> 1

        $res12 = $r->smismember('bikes:racing:france', 'bike:2', 'bike:3', 'bike:4');
        echo json_encode($res12) . PHP_EOL;
        // >>> [1,1,0]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res11);
        $this->assertEquals([1, 1, 0], $res12);
        // REMOVE_END;

        // STEP_START sdiff
        $r->sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3']);
        $r->sadd('bikes:racing:usa', ['bike:1', 'bike:4']);

        $res13 = $r->sdiff(['bikes:racing:france', 'bikes:racing:usa']);
        sort($res13);
        echo json_encode($res13) . PHP_EOL;
        // >>> ["bike:2","bike:3"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['bike:2', 'bike:3'], $res13);
        // REMOVE_END

        // STEP_START multisets
        $r->del('bikes:racing:france');
        $r->del('bikes:racing:usa');
        $r->del('bikes:racing:italy');
            
        $r->sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3']);
        $r->sadd('bikes:racing:usa', ['bike:1', 'bike:4']);
        $r->sadd('bikes:racing:italy', ['bike:1', 'bike:2', 'bike:3', 'bike:4']);

        $res14 = $r->sinter(['bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy']);
        echo json_encode($res14) . PHP_EOL;
        // >>> ["bike:1"]

        $res15 = $r->sunion(['bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy']);
        sort($res15);
        echo json_encode($res15) . PHP_EOL;
        // >>> ["bike:1","bike:2","bike:3","bike:4"]

        $res16 = $r->sdiff(['bikes:racing:france', 'bikes:racing:usa', 'bikes:racing:italy']);
        echo json_encode($res16) . PHP_EOL;
        // >>> []

        $res17 = $r->sdiff(['bikes:racing:usa', 'bikes:racing:france']);
        echo json_encode($res17) . PHP_EOL;
        // >>> ["bike:4"]

        $res18 = $r->sdiff(['bikes:racing:france', 'bikes:racing:usa']);
        sort($res18);
        echo json_encode($res18) . PHP_EOL;
        // >>> ["bike:2","bike:3"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['bike:1'], $res14);
        $this->assertEquals(['bike:1', 'bike:2', 'bike:3', 'bike:4'], $res15);
        $this->assertEquals([], $res16);
        $this->assertEquals(['bike:4'], $res17);
        $this->assertEquals(['bike:2', 'bike:3'], $res18);
        // REMOVE_END

        // STEP_START srem
        $r->del('bikes:racing:france');

        $r->sadd('bikes:racing:france', ['bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5']);

        $res19 = $r->srem('bikes:racing:france', ['bike:1']);
        echo $res19 . PHP_EOL;
        // >>> 1

        $res20 = $r->spop('bikes:racing:france');
        echo $res20 . PHP_EOL;
        // >>> bike:3 (for example)

        $res21 = $r->smembers('bikes:racing:france');
        sort($res21);
        echo json_encode($res21) . PHP_EOL;
        // >>> ["bike:2","bike:4","bike:5"]

        $res22 = $r->srandmember('bikes:racing:france');
        echo $res22 . PHP_EOL;
        // >>> bike:4 (for example)

        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res19);
        // Other sample outputs are non-deterministic.
        // REMOVE_END
    }
}
