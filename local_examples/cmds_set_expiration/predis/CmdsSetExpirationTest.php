// EXAMPLE: cmds_set_expiration
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class CmdsSetExpirationTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdsSetExpiration() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // STEP_START saddex
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->saddex('myset', ['member1', 'member2'], '', 'ex', 300);
        echo $res1 . PHP_EOL; // >>> 1

        $res2 = $r->sttl('myset', ['member1', 'member2']);
        echo json_encode($res2) . PHP_EOL; // >>> [300,300]

        $res3 = $r->saddex('myset', ['member2', 'member3'], 'mnx', 'ex', 60);
        echo $res3 . PHP_EOL; // >>> 0

        $res4 = $r->saddex('myset', ['member1', 'member3'], '', 'keepttl');
        echo $res4 . PHP_EOL; // >>> 1

        $res5 = $r->sttl('myset', ['member1', 'member2', 'member3']);
        echo json_encode($res5) . PHP_EOL; // >>> [300,300,-1]

        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals([300, 300], $res2);
        $this->assertEquals(0, $res3);
        $this->assertEquals(1, $res4);
        $this->assertEquals([300, 300, -1], $res5);
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START sexpire
        // REMOVE_START
        $r->del('myset', 'no-key');
        // REMOVE_END
        $res1 = $r->sexpire('no-key', 20, ['member1', 'member2'], 'nx');
        echo json_encode($res1) . PHP_EOL; // >>> [-2,-2]

        $res2 = $r->sadd('myset', ['member1', 'member2']);
        echo $res2 . PHP_EOL; // >>> 2

        $res3 = $r->sexpire('myset', 10, ['member1', 'member2', 'member3']);
        echo json_encode($res3) . PHP_EOL; // >>> [1,1,-2]

        $res4 = $r->sexpire('myset', 20, ['member1'], 'nx');
        echo json_encode($res4) . PHP_EOL; // >>> [0]

        $res5 = $r->sexpire('myset', 20, ['member1'], 'gt');
        echo json_encode($res5) . PHP_EOL; // >>> [1]

        $res6 = $r->sttl('myset', ['member1', 'member2']);
        echo json_encode($res6) . PHP_EOL; // >>> [20,10]

        // REMOVE_START
        $this->assertEquals([-2, -2], $res1);
        $this->assertEquals(2, $res2);
        $this->assertEquals([1, 1, -2], $res3);
        $this->assertEquals([0], $res4);
        $this->assertEquals([1], $res5);
        $this->assertEquals([20, 10], $res6);
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START spexpire
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->sadd('myset', ['member1', 'member2']);
        echo $res1 . PHP_EOL; // >>> 2

        $res2 = $r->spexpire('myset', 2000, ['member1', 'member2']);
        echo json_encode($res2) . PHP_EOL; // >>> [1,1]

        $res3 = $r->spexpire('myset', 500, ['member1'], 'lt');
        echo json_encode($res3) . PHP_EOL; // >>> [1]

        $res4 = $r->spttl('myset', ['member1', 'member2']);
        echo json_encode($res4) . PHP_EOL; // >>> [491,1982] (for example)

        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals([1, 1], $res2);
        $this->assertEquals([1], $res3);
        $this->assertTrue($res4[0] > 0);
        $this->assertTrue($res4[0] <= 500);
        $this->assertTrue($res4[1] > 500);
        $this->assertTrue($res4[1] <= 2000);
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START sexpireat
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->sadd('myset', ['member1', 'member2']);
        echo $res1 . PHP_EOL; // >>> 2

        $res2 = $r->sexpireat('myset', 4102444800, ['member1']);
        echo json_encode($res2) . PHP_EOL; // >>> [1]

        $res3 = $r->sexpiretime('myset', ['member1', 'member2']);
        echo json_encode($res3) . PHP_EOL; // >>> [4102444800,-1]

        // A timestamp in the past deletes the member immediately.
        $res4 = $r->sexpireat('myset', 1, ['member2']);
        echo json_encode($res4) . PHP_EOL; // >>> [2]

        $res5 = $r->smembers('myset');
        echo json_encode($res5) . PHP_EOL; // >>> ["member1"]

        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals([1], $res2);
        $this->assertEquals([4102444800, -1], $res3);
        $this->assertEquals([2], $res4);
        $this->assertEquals(['member1'], $res5);
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START spexpireat
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->sadd('myset', ['member1', 'member2']);
        echo $res1 . PHP_EOL; // >>> 2

        $res2 = $r->spexpireat('myset', 4102444800000, ['member1']);
        echo json_encode($res2) . PHP_EOL; // >>> [1]

        $res3 = $r->spexpireat('myset', 4102444800000, ['member2'], 'xx');
        echo json_encode($res3) . PHP_EOL; // >>> [0]

        $res4 = $r->spexpiretime('myset', ['member1', 'member2']);
        echo json_encode($res4) . PHP_EOL; // >>> [4102444800000,-1]

        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals([1], $res2);
        $this->assertEquals([0], $res3);
        $this->assertEquals([4102444800000, -1], $res4);
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START sexpiretime
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->sadd('myset', ['member1', 'member2']);
        echo $res1 . PHP_EOL; // >>> 2

        $res2 = $r->sexpire('myset', 300, ['member1']);
        echo json_encode($res2) . PHP_EOL; // >>> [1]

        $res3 = $r->sexpiretime('myset', ['member1', 'member2', 'member3']);
        echo json_encode($res3) . PHP_EOL; // >>> [1792684428,-1,-2] (for example)

        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals([1], $res2);
        $this->assertTrue(abs($res3[0] - (time() + 300)) < 5);
        $this->assertEquals([-1, -2], array_slice($res3, 1));
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START spexpiretime
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->sadd('myset', ['member1', 'member2']);
        echo $res1 . PHP_EOL; // >>> 2

        $res2 = $r->spexpire('myset', 300000, ['member1']);
        echo json_encode($res2) . PHP_EOL; // >>> [1]

        $res3 = $r->spexpiretime('myset', ['member1', 'member2', 'member3']);
        echo json_encode($res3) . PHP_EOL; // >>> [1792684427589,-1,-2] (for example)

        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals([1], $res2);
        $this->assertTrue(abs($res3[0] - (microtime(true) * 1000 + 300000)) < 5000);
        $this->assertEquals([-1, -2], array_slice($res3, 1));
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START sttl
        // REMOVE_START
        $r->del('myset', 'no-key');
        // REMOVE_END
        $res1 = $r->sttl('no-key', ['member1', 'member2']);
        echo json_encode($res1) . PHP_EOL; // >>> [-2,-2]

        $res2 = $r->sadd('myset', ['member1', 'member2']);
        echo $res2 . PHP_EOL; // >>> 2

        $res3 = $r->sexpire('myset', 300, ['member1', 'member3']);
        echo json_encode($res3) . PHP_EOL; // >>> [1,-2]

        $res4 = $r->sttl('myset', ['member1', 'member2', 'member3']);
        echo json_encode($res4) . PHP_EOL; // >>> [300,-1,-2]

        // REMOVE_START
        $this->assertEquals([-2, -2], $res1);
        $this->assertEquals(2, $res2);
        $this->assertEquals([1, -2], $res3);
        $this->assertEquals([300, -1, -2], $res4);
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START spttl
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->sadd('myset', ['member1', 'member2']);
        echo $res1 . PHP_EOL; // >>> 2

        $res2 = $r->spexpire('myset', 300000, ['member1']);
        echo json_encode($res2) . PHP_EOL; // >>> [1]

        $res3 = $r->spttl('myset', ['member1', 'member2', 'member3']);
        echo json_encode($res3) . PHP_EOL; // >>> [299993,-1,-2] (for example)

        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals([1], $res2);
        $this->assertTrue($res3[0] > 295000);
        $this->assertTrue($res3[0] <= 300000);
        $this->assertEquals([-1, -2], array_slice($res3, 1));
        $r->del('myset');
        // REMOVE_END
        // STEP_END

        // STEP_START spersist
        // REMOVE_START
        $r->del('myset');
        // REMOVE_END
        $res1 = $r->sadd('myset', ['member1', 'member2']);
        echo $res1 . PHP_EOL; // >>> 2

        $res2 = $r->sexpire('myset', 300, ['member1', 'member2']);
        echo json_encode($res2) . PHP_EOL; // >>> [1,1]

        $res3 = $r->spersist('myset', ['member2']);
        echo json_encode($res3) . PHP_EOL; // >>> [1]

        $res4 = $r->sttl('myset', ['member1', 'member2']);
        echo json_encode($res4) . PHP_EOL; // >>> [300,-1]

        $res5 = $r->spersist('myset', ['member2', 'member3']);
        echo json_encode($res5) . PHP_EOL; // >>> [-1,-2]

        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals([1, 1], $res2);
        $this->assertEquals([1], $res3);
        $this->assertEquals([300, -1], $res4);
        $this->assertEquals([-1, -2], $res5);
        $r->del('myset');
        // REMOVE_END
        // STEP_END
    }
}
