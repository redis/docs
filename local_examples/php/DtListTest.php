// EXAMPLE: list_tutorial
// BINDER_ID php-dt-list
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtListTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtList() {
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

        // STEP_START queue
        $res1 = $r->lpush('bikes:repairs', 'bike:1');
        echo $res1 . PHP_EOL;
        // >>> 1

        $res2 = $r->lpush('bikes:repairs', 'bike:2');
        echo $res2 . PHP_EOL;
        // >>> 2

        $res3 = $r->rpop('bikes:repairs');
        echo $res3 . PHP_EOL;
        // >>> bike:1

        $res4 = $r->rpop('bikes:repairs');
        echo $res4 . PHP_EOL;
        // >>> bike:2
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(2, $res2);
        $this->assertEquals('bike:1', $res3);
        $this->assertEquals('bike:2', $res4);
        // REMOVE_END

        // STEP_START stack
        $res5 = $r->lpush('bikes:repairs', 'bike:1');
        echo $res5 . PHP_EOL;
        // >>> 1

        $res6 = $r->lpush('bikes:repairs', 'bike:2');
        echo $res6 . PHP_EOL;
        // >>> 2

        $res7 = $r->lpop('bikes:repairs');
        echo $res7 . PHP_EOL;
        // >>> bike:2

        $res8 = $r->lpop('bikes:repairs');
        echo $res8 . PHP_EOL;
        // >>> bike:1
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res5);
        $this->assertEquals(2, $res6);
        $this->assertEquals('bike:2', $res7);
        $this->assertEquals('bike:1', $res8);
        // REMOVE_END

        // STEP_START llen
        $res9 = $r->llen('bikes:repairs');
        echo $res9 . PHP_EOL;
        // >>> 0
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0, $res9);
        // REMOVE_END

        // STEP_START lmove_lrange
        $res10 = $r->lpush('bikes:repairs', 'bike:1');
        echo $res10 . PHP_EOL;
        // >>> 1

        $res11 = $r->lpush('bikes:repairs', 'bike:2');
        echo $res11 . PHP_EOL;
        // >>> 2

        $res12 = $r->lmove('bikes:repairs', 'bikes:finished', 'LEFT', 'LEFT');
        echo $res12 . PHP_EOL;
        // >>> 'bike:2'

        $res13 = $r->lrange('bikes:repairs', 0, -1);
        echo json_encode($res13) . PHP_EOL;
        // >>> ['bike:1']

        $res14 = $r->lrange('bikes:finished', 0, -1);
        echo json_encode($res14) . PHP_EOL;
        // >>> ['bike:2']
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res10);
        $this->assertEquals(2, $res11);
        $this->assertEquals('bike:2', $res12);
        $this->assertEquals(['bike:1'], $res13);
        $this->assertEquals(['bike:2'], $res14);
        // REMOVE_END

        // STEP_START lpush_rpush
        $r->del('bikes:repairs');
        
        $res15 = $r->rpush('bikes:repairs', 'bike:1');
        echo $res15 . PHP_EOL;
        // >>> 1

        $res16 = $r->rpush('bikes:repairs', 'bike:2');
        echo $res16 . PHP_EOL;
        // >>> 2

        $res17 = $r->lpush('bikes:repairs', 'bike:important_bike');
        echo $res17 . PHP_EOL;
        // >>> 3

        $res18 = $r->lrange('bikes:repairs', 0, -1);
        echo json_encode($res18) . PHP_EOL;
        // >>> ['bike:important_bike', 'bike:1', 'bike:2']
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res15);
        $this->assertEquals(2, $res16);
        $this->assertEquals(3, $res17);
        $this->assertEquals(['bike:important_bike', 'bike:1', 'bike:2'], $res18);
        // REMOVE_END

        // STEP_START variadic
        $r->del('bikes:repairs');

        $res19 = $r->rpush('bikes:repairs', 'bike:1', 'bike:2', 'bike:3');
        echo $res19 . PHP_EOL;
        // >>> 3

        $res20 = $r->lpush('bikes:repairs', 'bike:important_bike', 'bike:very_important_bike');
        echo $res20 . PHP_EOL;
        // >>> 5

        $res21 = $r->lrange('bikes:repairs', 0, -1);
        echo json_encode($res21) . PHP_EOL;
        // >>> ['bike:very_important_bike', 'bike:important_bike', 'bike:1', ...
        // STEP_END
        // REMOVE_START
        $this->assertEquals(3, $res19);
        $this->assertEquals(5, $res20);
        $this->assertEquals([
            'bike:very_important_bike',
            'bike:important_bike',
            'bike:1',
            'bike:2',
            'bike:3',
        ], $res21);
        // REMOVE_END

        // STEP_START lpop_rpop
        $r->del('bikes:repairs');
        
        $res22 = $r->rpush('bikes:repairs', 'bike:1', 'bike:2', 'bike:3');
        echo $res22 . PHP_EOL;
        // >>> 3

        $res23 = $r->rpop('bikes:repairs');
        echo $res23 . PHP_EOL;
        // >>> 'bike:3'

        $res24 = $r->lpop('bikes:repairs');
        echo $res24 . PHP_EOL;
        // >>> 'bike:1'

        $res25 = $r->rpop('bikes:repairs');
        echo $res25 . PHP_EOL;
        // >>> 'bike:2'

        $res26 = $r->rpop('bikes:repairs');
        echo $res26 . PHP_EOL;
        // >>> None
        // STEP_END
        // REMOVE_START
        $this->assertEquals(3, $res22);
        $this->assertEquals('bike:3', $res23);
        $this->assertEquals('bike:1', $res24);
        $this->assertEquals('bike:2', $res25);
        $this->assertNull($res26);
        // REMOVE_END

        // STEP_START ltrim
        $res27 = $r->rpush('bikes:repairs', 'bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5');
        echo $res27 . PHP_EOL;
        // >>> 5

        $res28 = $r->ltrim('bikes:repairs', 0, 2);
        echo $res28 . PHP_EOL;
        // >>> True

        $res29 = $r->lrange('bikes:repairs', 0, -1);
        echo json_encode($res29) . PHP_EOL;
        // >>> ['bike:1', 'bike:2', 'bike:3']
        // STEP_END
        // REMOVE_START
        $this->assertEquals(5, $res27);
        $this->assertEquals('OK', $res28);
        $this->assertEquals(['bike:1', 'bike:2', 'bike:3'], $res29);
        // REMOVE_END

        // STEP_START ltrim_end_of_list
        $r->del('bikes:repairs');

        $res27 = $r->rpush('bikes:repairs', 'bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5');
        echo $res27 . PHP_EOL;
        // >>> 5

        $res28 = $r->ltrim('bikes:repairs', -3, -1);
        echo $res28 . PHP_EOL;
        // >>> True

        $res29 = $r->lrange('bikes:repairs', 0, -1);
        echo json_encode($res29) . PHP_EOL;
        // >>> ['bike:3', 'bike:4', 'bike:5']
        // STEP_END
        // REMOVE_START
        $this->assertEquals(5, $res27);
        $this->assertEquals('OK', $res28);
        $this->assertEquals(['bike:3', 'bike:4', 'bike:5'], $res29);
        // REMOVE_END

        // STEP_START brpop
        $r->del('bikes:repairs');

        $res31 = $r->rpush('bikes:repairs', 'bike:1', 'bike:2');
        echo $res31 . PHP_EOL;
        // >>> 2

        $res32 = $r->brpop('bikes:repairs', 1);
        echo json_encode($res32) . PHP_EOL;
        // >>> ['bikes:repairs', 'bike:2']

        $res33 = $r->brpop('bikes:repairs', 1);
        echo json_encode($res33) . PHP_EOL;
        // >>> ['bikes:repairs', 'bike:1']

        $res34 = $r->brpop('bikes:repairs', 1);
        echo json_encode($res34) . PHP_EOL;
        // >>> None
        // STEP_END
        // REMOVE_START
        $this->assertEquals(2, $res31);
        $this->assertEquals(['bikes:repairs', 'bike:2'], $res32);
        $this->assertEquals(['bikes:repairs', 'bike:1'], $res33);
        $this->assertNull($res34);
        $r->del('bikes:repairs');
        $r->del('new_bikes');
        // REMOVE_END

        // STEP_START rule_1
        $res35 = $r->del('new_bikes');
        echo $res35 . PHP_EOL;
        // >>> 0

        $res36 = $r->lpush('new_bikes', 'bike:1', 'bike:2', 'bike:3');
        echo $res36 . PHP_EOL;
        // >>> 3
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0, $res35);
        $this->assertEquals(3, $res36);
        // REMOVE_END

        // STEP_START rule_1.1
        $r->del('new_bikes');

        $res37 = $r->set('new_bikes', 'bike:1');
        echo $res37 . PHP_EOL;
        // >>> True

        $res38 = $r->type('new_bikes');
        echo $res38 . PHP_EOL;
        // >>> 'string'

        try {
            $res39 = $r->lpush('new_bikes', 'bike:2', 'bike:3');
            // >>> redis.exceptions.ResponseError:
            // >>> WRONGTYPE Operation against a key holding the wrong kind of value
        } catch (\Predis\Response\ServerException $e) {
            echo $e->getMessage() . PHP_EOL;
        }
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res37);
        $this->assertEquals('string', $res38);
        // We caught an exception for WRONGTYPE above; ensure it's indeed WRONGTYPE
        try {
            $r->lpush('new_bikes', 'bike:2', 'bike:3');
            $this->fail('Expected WRONGTYPE exception was not thrown');
        } catch (\Predis\Response\ServerException $e) {
            $this->assertStringContainsString('wrong kind of value', strtolower($e->getMessage()));
        }
        // REMOVE_END

        // STEP_START rule_2
        $r->del('bikes:repairs');
        $res36 = $r->lpush('bikes:repairs', 'bike:1', 'bike:2', 'bike:3');
        echo $res36 . PHP_EOL;
        // >>> 3

        $res40 = $r->exists('bikes:repairs');
        echo $res40 . PHP_EOL;
        // >>> 1

        $res41 = $r->lpop('bikes:repairs');
        echo $res41 . PHP_EOL;
        // >>> 'bike:3'

        $res42 = $r->lpop('bikes:repairs');
        echo $res42 . PHP_EOL;
        // >>> 'bike:2'

        $res43 = $r->lpop('bikes:repairs');
        echo $res43 . PHP_EOL;
        // >>> 'bike:1'

        $res44 = $r->exists('bikes:repairs');
        echo $res44 . PHP_EOL;
        // >>> False
        // STEP_END
        // REMOVE_START
        $this->assertEquals(3, $res36);
        $this->assertEquals(1, $res40);
        $this->assertEquals('bike:3', $res41);
        $this->assertEquals('bike:2', $res42);
        $this->assertEquals('bike:1', $res43);
        $this->assertEquals(0, $res44);
        $r->del('bikes:repairs');
        // REMOVE_END

        // STEP_START rule_3
        $res45 = $r->del('bikes:repairs');
        echo $res45 . PHP_EOL;
        // >>> 0

        $res46 = $r->llen('bikes:repairs');
        echo $res46 . PHP_EOL;
        // >>> 0

        $res47 = $r->lpop('bikes:repairs');
        echo $res47 . PHP_EOL;
        // >>> None
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0, $res45);
        $this->assertEquals(0, $res46);
        $this->assertNull($res47);
        // REMOVE_END

        // STEP_START ltrim.1
        $res48 = $r->lpush('bikes:repairs', 'bike:1', 'bike:2', 'bike:3', 'bike:4', 'bike:5');
        echo $res48 . PHP_EOL;
        // >>> 5

        $res49 = $r->ltrim('bikes:repairs', 0, 2);
        echo $res49 . PHP_EOL;
        // >>> True

        $res50 = $r->lrange('bikes:repairs', 0, -1);
        echo json_encode($res50) . PHP_EOL;
        // >>> ['bike:5', 'bike:4', 'bike:3']
        // STEP_END
        // REMOVE_START
        $this->assertEquals(5, $res48);
        $this->assertEquals('OK', $res49);
        $this->assertEquals(['bike:5', 'bike:4', 'bike:3'], $res50);
        $r->del('bikes:repairs');
        // REMOVE_END
    }
}

