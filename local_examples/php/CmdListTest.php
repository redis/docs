// EXAMPLE: cmds_list
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class CmdListTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdList() {
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

        // STEP_START lpush
        $res1 = $r->lpush('mylist', 'world');
        echo $res1 . PHP_EOL;
        // >>> 1

        $res2 = $r->lpush('mylist', 'hello');
        echo $res2 . PHP_EOL;
        // >>> 2

        $res3 = $r->lrange('mylist', 0, -1);
        echo json_encode($res3) . PHP_EOL;
        // >>> ["hello","world"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(2, $res2);
        $this->assertEquals(["hello", "world"], $res3);
        $r->del('mylist');
        // REMOVE_END

        // STEP_START lrange
        $res4 = $r->rpush('mylist', 'one');
        echo $res4 . PHP_EOL;
        // >>> 1

        $res5 = $r->rpush('mylist', 'two');
        echo $res5 . PHP_EOL;
        // >>> 2

        $res6 = $r->rpush('mylist', 'three');
        echo $res6 . PHP_EOL;
        // >>> 3

        $res7 = $r->lrange('mylist', 0, 0);
        echo json_encode($res7) . PHP_EOL;
        // >>> ["one"]

        $res8 = $r->lrange('mylist', -3, 2);
        echo json_encode($res8) . PHP_EOL;
        // >>> ["one","two","three"]

        $res9 = $r->lrange('mylist', -100, 100);
        echo json_encode($res9) . PHP_EOL;
        // >>> ["one","two","three"]

        $res10 = $r->lrange('mylist', 5, 10);
        echo json_encode($res10) . PHP_EOL;
        // >>> []
        // STEP_END
        // REMOVE_START
        $this->assertEquals(["one"], $res7);
        $this->assertEquals(["one", "two", "three"], $res8);
        $this->assertEquals(["one", "two", "three"], $res9);
        $this->assertEquals([], $res10);
        $r->del('mylist');
        // REMOVE_END

        // STEP_START llen
        $res11 = $r->lpush('mylist', 'World');
        echo $res11 . PHP_EOL;
        // >>> 1

        $res12 = $r->lpush('mylist', 'Hello');
        echo $res12 . PHP_EOL;
        // >>> 2

        $res13 = $r->llen('mylist');
        echo $res13 . PHP_EOL;
        // >>> 2
        // STEP_END
        // REMOVE_START
        $this->assertEquals(2, $res13);
        $r->del('mylist');
        // REMOVE_END

        // STEP_START rpush
        $res14 = $r->rpush('mylist', 'hello');
        echo $res14 . PHP_EOL;
        // >>> 1

        $res15 = $r->rpush('mylist', 'world');
        echo $res15 . PHP_EOL;
        // >>> 2

        $res16 = $r->lrange('mylist', 0, -1);
        echo json_encode($res16) . PHP_EOL;
        // >>> ["hello","world"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(["hello", "world"], $res16);
        $r->del('mylist');
        // REMOVE_END

        // STEP_START lpop
        $res17 = $r->rpush('mylist', 'one', 'two', 'three', 'four', 'five');
        echo $res17 . PHP_EOL;
        // >>> 5

        $res18 = $r->lpop('mylist');
        echo $res18 . PHP_EOL;
        // >>> one

        $res19 = $r->lpop('mylist', 2);
        echo json_encode($res19) . PHP_EOL;
        // >>> ["two","three"]

        $res20 = $r->lrange('mylist', 0, -1);
        echo json_encode($res20) . PHP_EOL;
        // >>> ["four","five"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(5, $res17);
        $this->assertEquals('one', $res18);
        $this->assertEquals(['two', 'three'], $res19);
        $this->assertEquals(['four', 'five'], $res20);
        $r->del('mylist');
        // REMOVE_END

        // STEP_START rpop
        $res21 = $r->rpush('mylist', 'one', 'two', 'three', 'four', 'five');
        echo $res21 . PHP_EOL;
        // >>> 5

        $res22 = $r->rpop('mylist');
        echo $res22 . PHP_EOL;
        // >>> five

        $res23 = $r->rpop('mylist', 2);
        echo json_encode($res23) . PHP_EOL;
        // >>> ["four","three"]

        $res24 = $r->lrange('mylist', 0, -1);
        echo json_encode($res24) . PHP_EOL;
        // >>> ["one","two"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(5, $res21);
        $this->assertEquals('five', $res22);
        $this->assertEquals(['four', 'three'], $res23);
        $this->assertEquals(['one', 'two'], $res24);
        $r->del('mylist');
        // REMOVE_END
    }
}

