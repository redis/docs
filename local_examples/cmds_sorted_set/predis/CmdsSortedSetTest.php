// EXAMPLE: cmds_sorted_set
<?php
use Predis\Client as PredisClient;

class CmdsSortedSetTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdsSortedSet() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // STEP_START zadd
        // REMOVE_START
        $r->del('myzset');
        // REMOVE_END
        $res1 = $r->zadd('myzset', ['one' => 1]);
        echo $res1 . PHP_EOL; // >>> 1

        $res2 = $r->zadd('myzset', ['uno' => 1]);
        echo $res2 . PHP_EOL; // >>> 1

        $res3 = $r->zadd('myzset', ['two' => 2, 'three' => 3]);
        echo $res3 . PHP_EOL; // >>> 2

        $res4 = $r->zrange('myzset', 0, -1, ['withscores' => true]);
        echo json_encode($res4) . PHP_EOL;
        // >>> {"one":"1","uno":"1","two":"2","three":"3"}
        // STEP_END

        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(2, $res3);
        $this->assertEquals(['one' => 1, 'uno' => 1, 'two' => 2, 'three' => 3], $res4);
        $r->del('myzset');
        // REMOVE_END

        // STEP_START zrange1
        // REMOVE_START
        $r->del('myzset');
        // REMOVE_END
        $res5 = $r->zadd('myzset', ['one' => 1, 'two' => 2, 'three' => 3]);
        echo $res5 . PHP_EOL; // >>> 3

        $res6 = $r->zrange('myzset', 0, -1);
        echo json_encode($res6) . PHP_EOL; // >>> ["one","two","three"]

        $res7 = $r->zrange('myzset', 2, 3);
        echo json_encode($res7) . PHP_EOL; // >>> ["three"]

        $res8 = $r->zrange('myzset', -2, -1);
        echo json_encode($res8) . PHP_EOL; // >>> ["two","three"]
        // STEP_END

        // REMOVE_START
        $this->assertEquals(3, $res5);
        $this->assertEquals(['one', 'two', 'three'], $res6);
        $this->assertEquals(['three'], $res7);
        $this->assertEquals(['two', 'three'], $res8);
        $r->del('myzset');
        // REMOVE_END

        // STEP_START zrange2
        // REMOVE_START
        $r->del('myzset');
        // REMOVE_END
        $r->zadd('myzset', ['one' => 1, 'two' => 2, 'three' => 3]);

        $res9 = $r->zrange('myzset', 0, 1, ['withscores' => true]);
        echo json_encode($res9) . PHP_EOL; // >>> {"one":"1","two":"2"}
        // STEP_END

        // REMOVE_START
        $this->assertEquals(['one' => 1, 'two' => 2], $res9);
        $r->del('myzset');
        // REMOVE_END

        // STEP_START zrange3
        // REMOVE_START
        $r->del('myzset');
        // REMOVE_END
        $r->zadd('myzset', ['one' => 1, 'two' => 2, 'three' => 3]);

        $res10 = $r->zrange('myzset', '(1', '+inf', ['byscore' => true, 'limit' => [1, 1]]);
        echo json_encode($res10) . PHP_EOL; // >>> ["three"]
        // STEP_END

        // REMOVE_START
        $this->assertEquals(['three'], $res10);
        $r->del('myzset');
        // REMOVE_END
    }
}
