// EXAMPLE: bitmap_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtBitmapTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtBitmap() {
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

        // STEP_START ping
        $res1 = $r->setbit('pings:2024-01-01-00:00', 123, 1);
        echo $res1 . PHP_EOL;
        // >>> 0

        $res2 = $r->getbit('pings:2024-01-01-00:00', 123);
        echo $res2 . PHP_EOL;
        // >>> 1

        $res3 = $r->getbit('pings:2024-01-01-00:00', 456);
        echo $res3 . PHP_EOL;
        // >>> 0
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0, $res1);
        // REMOVE_END

        // STEP_START bitcount
        // Ensure the bit is set
        $r->setbit('pings:2024-01-01-00:00', 123, 1);
        $res4 = $r->bitcount('pings:2024-01-01-00:00');
        echo $res4 . PHP_EOL;
        // >>> 1
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res4);
        // REMOVE_END

        // STEP_START bitop_setup
        $r->setbit('A', 0, 1);
        $r->setbit('A', 1, 1);
        $r->setbit('A', 3, 1);
        $r->setbit('A', 4, 1);

        $res5 = $r->get('A');
        echo str_pad(decbin(ord($res5)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 11011000

        $r->setbit('B', 3, 1);
        $r->setbit('B', 4, 1);
        $r->setbit('B', 7, 1);

        $res6 = $r->get('B');
        echo str_pad(decbin(ord($res6)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 00011001

        $r->setbit('C', 1, 1);
        $r->setbit('C', 2, 1);
        $r->setbit('C', 4, 1);
        $r->setbit('C', 5, 1);

        $res7 = $r->get('C');
        echo str_pad(decbin(ord($res7)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 01101100
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b11011000, ord($res5));
        $this->assertEquals(0b00011001, ord($res6));
        $this->assertEquals(0b01101100, ord($res7));
        // REMOVE_END

        // STEP_START bitop_and
        $r->bitop('AND', 'R', 'A', 'B', 'C');
        $res8 = $r->get('R');
        echo str_pad(decbin(ord($res8)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 00001000
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b00001000, ord($res8));
        // REMOVE_END

        // STEP_START bitop_or
        $r->bitop('OR', 'R', 'A', 'B', 'C');
        $res9 = $r->get('R');
        echo str_pad(decbin(ord($res9)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 11111101
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b11111101, ord($res9));
        // REMOVE_END

        // STEP_START bitop_xor
        $r->bitop('XOR', 'R', 'A', 'B');
        $res10 = $r->get('R');
        echo str_pad(decbin(ord($res10)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 11000001
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b11000001, ord($res10));
        // REMOVE_END

        // STEP_START bitop_not
        $r->bitop('NOT', 'R', 'A');
        $res11 = $r->get('R');
        echo str_pad(decbin(ord($res11)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 00100111
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b00100111, ord($res11));
        // REMOVE_END

        // STEP_START bitop_diff
        $r->bitop('DIFF', 'R', 'A', 'B', 'C');
        $res12 = $r->get('R');
        echo str_pad(decbin(ord($res12)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 10000000
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b10000000, ord($res12));
        // REMOVE_END

        // STEP_START bitop_diff1
        $r->bitop('DIFF1', 'R', 'A', 'B', 'C');
        $res13 = $r->get('R');
        echo str_pad(decbin(ord($res13)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 00100101
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b00100101, ord($res13));
        // REMOVE_END

        // STEP_START bitop_andor
        $r->bitop('ANDOR', 'R', 'A', 'B', 'C');
        $res14 = $r->get('R');
        echo str_pad(decbin(ord($res14)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 01011000
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b01011000, ord($res14));
        // REMOVE_END

        // STEP_START bitop_one
        $r->bitop('ONE', 'R', 'A', 'B', 'C');
        $res15 = $r->get('R');
        echo str_pad(decbin(ord($res15)), 8, '0', STR_PAD_LEFT) . PHP_EOL;
        // >>> 10100101
        // STEP_END
        // REMOVE_START
        $this->assertEquals(0b10100101, ord($res15));
        // REMOVE_END
    }
}

