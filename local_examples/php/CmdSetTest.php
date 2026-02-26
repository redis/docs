// EXAMPLE: cmds_set
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class CmdSetTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdSet() {
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
        $res1 = $r->sadd('myset', ['Hello', 'World']);
        echo $res1 . PHP_EOL;
        // >>> 2

        $res2 = $r->sadd('myset', ['World']);
        echo $res2 . PHP_EOL;
        // >>> 0

        $res3 = $r->smembers('myset');
        sort($res3);
        echo json_encode($res3) . PHP_EOL;
        // >>> ["Hello","World"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(2, $res1);
        $this->assertEquals(0, $res2);
        $this->assertEquals(['Hello', 'World'], $res3);
        $r->del('myset');
        // REMOVE_END

        // STEP_START smembers
        $res4 = $r->sadd('myset', ['Hello', 'World']);
        echo $res4 . PHP_EOL;
        // >>> 2

        $res5 = $r->smembers('myset');
        sort($res5);
        echo json_encode($res5) . PHP_EOL;
        // >>> ["Hello","World"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(2, $res4);
        $this->assertEquals(['Hello', 'World'], $res5);
        $r->del('myset');
        // REMOVE_END
    }
}

