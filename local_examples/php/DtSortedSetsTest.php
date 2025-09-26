// EXAMPLE: ss_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtSortedSetsTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtSortedSet() {
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

        // STEP_START zadd
        $res1 = $r->zadd('racer_scores', ['Norem' => 10]);
        echo $res1 . PHP_EOL;
        // >>> 1

        $res2 = $r->zadd('racer_scores', ['Castilla' => 12]);
        echo $res2 . PHP_EOL;
        // >>> 1

        $res3 = $r->zadd('racer_scores', [
            'Sam-Bodden' => 8,
            'Royce' => 10,
            'Ford' => 6,
            'Prickett' => 14,
            'Castilla' => 12,
        ]);
        echo $res3 . PHP_EOL;
        // >>> 4
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(4, $res3);
        // REMOVE_END

        // STEP_START zrange
        $res4 = $r->zrange('racer_scores', 0, -1);
        echo json_encode($res4) . PHP_EOL;
        // >>> ["Ford","Sam-Bodden","Norem","Royce","Castilla","Prickett"]

        $res5 = $r->zrevrange('racer_scores', 0, -1);
        echo json_encode($res5) . PHP_EOL;
        // >>> ["Prickett","Castilla","Royce","Norem","Sam-Bodden","Ford"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['Ford', 'Sam-Bodden', 'Norem', 'Royce', 'Castilla', 'Prickett'], $res4);
        $this->assertEquals(['Prickett', 'Castilla', 'Royce', 'Norem', 'Sam-Bodden', 'Ford'], $res5);
        // REMOVE_END

        // STEP_START zrange_withscores
        $res6 = $r->zrange('racer_scores', 0, -1,[
            'withscores' => true,
        ]);
        echo json_encode($res6) . PHP_EOL;
        // >>> {"Ford":"6","Sam-Bodden":"8","Norem":"10","Royce":"10","Castilla":"12","Prickett":"14"}
        // STEP_END
        // REMOVE_START
        $this->assertEquals(
            ['Ford' => 6, 'Sam-Bodden' => 8, 'Norem' => 10, 'Royce' => 10, 'Castilla' => 12, 'Prickett' => 14],
            $res6
        );
        // REMOVE_END

        // STEP_START zrangebyscore
        $res7 = $r->zrangebyscore('racer_scores', '-inf', 10);
        echo json_encode($res7) . PHP_EOL;
        // >>> ["Ford","Sam-Bodden","Norem","Royce"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['Ford', 'Sam-Bodden', 'Norem', 'Royce'], $res7);
        // REMOVE_END

        // STEP_START zremrangebyscore
        $res8 = $r->zrem('racer_scores', 'Castilla');
        echo $res8 . PHP_EOL;
        // >>> 1

        $res9 = $r->zremrangebyscore('racer_scores', '-inf', 9);
        echo $res9 . PHP_EOL;
        // >>> 2

        $res10 = $r->zrange('racer_scores', 0, -1);
        echo json_encode($res10) . PHP_EOL;
        // >>> ["Norem","Royce","Prickett"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res8);
        $this->assertEquals(2, $res9);
        $this->assertEquals(['Norem', 'Royce', 'Prickett'], $res10);
        // REMOVE_END

        // STEP_START zrank
        $res11 = $r->zrank('racer_scores', 'Norem');
        echo $res11 . PHP_EOL;
        // >>> 0

        $res12 = $r->zrevrank('racer_scores', 'Norem');
        echo $res12 . PHP_EOL;
        // >>> 2
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0, $res11);
        $this->assertEquals(2, $res12);
        // REMOVE_END

        // STEP_START zadd_lex
        $res13 = $r->zadd('racer_scores', [
            'Norem' => 0,
            'Sam-Bodden' => 0,
            'Royce' => 0,
            'Ford' => 0,
            'Prickett' => 0,
            'Castilla' => 0,
        ]);
        echo $res13 . PHP_EOL;
        // >>> 3

        $res14 = $r->zrange('racer_scores', 0, -1);
        echo json_encode($res14) . PHP_EOL;
        // >>> ["Castilla","Ford","Norem","Prickett","Royce","Sam-Bodden"]

        $res15 = $r->zrangebylex('racer_scores', '[A', '[L');
        echo json_encode($res15) . PHP_EOL;
        // >>> ["Castilla","Ford"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(3, $res13);
        $this->assertEquals(['Castilla', 'Ford', 'Norem', 'Prickett', 'Royce', 'Sam-Bodden'], $res14);
        $this->assertEquals(['Castilla', 'Ford'], $res15);
        // REMOVE_END

        // STEP_START leaderboard
        $res16 = $r->zadd('racer_scores', ['Wood' => 100]);
        echo $res16 . PHP_EOL;
        // >>> 1

        $res17 = $r->zadd('racer_scores', ['Henshaw' => 100]);
        echo $res17 . PHP_EOL;
        // >>> 1

        $res18 = $r->zadd('racer_scores', ['Henshaw' => 150]);
        echo $res18 . PHP_EOL;
        // >>> 0

        $res19 = $r->zincrby('racer_scores', 50, 'Wood');
        echo $res19 . PHP_EOL;
        // >>> 150

        $res20 = $r->zincrby('racer_scores', 50, 'Henshaw');
        echo $res20 . PHP_EOL;
        // >>> 200
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res16);
        $this->assertEquals(1, $res17);
        $this->assertEquals(0, $res18);
        $this->assertEquals(150, $res19);
        $this->assertEquals(200, $res20);
        // REMOVE_END
    }
}