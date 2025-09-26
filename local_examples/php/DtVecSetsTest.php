// EXAMPLE: vecset_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtVecSetsTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtVecSet() {
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

        // STEP_START vadd
        $res1 = $r->vadd('points', [1.0, 1.0], 'pt:A');
        echo $res1 . PHP_EOL;
        // >>> 1

        $res2 = $r->vadd('points', [-1.0, -1.0], 'pt:B');
        echo $res2 . PHP_EOL;
        // >>> 1

        $res3 = $r->vadd('points', [-1.0, 1.0], 'pt:C');
        echo $res3 . PHP_EOL;
        // >>> 1

        $res4 = $r->vadd('points', [1.0, -1.0], 'pt:D');
        echo $res4 . PHP_EOL;
        // >>> 1

        $res5 = $r->vadd('points', [1.0, 0.0], 'pt:E');
        echo $res5 . PHP_EOL;
        // >>> 1

        $res6 = $r->type('points');
        echo $res6 . PHP_EOL;
        // >>> vectorset
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res1);
        $this->assertEquals(1, $res2);
        $this->assertEquals(1, $res3);
        $this->assertEquals(1, $res4);
        $this->assertEquals(1, $res5);
        $this->assertEquals('vectorset', $res6);
        // REMOVE_END

        // STEP_START vcardvdim
        $res7 = $r->vcard('points');
        echo $res7 . PHP_EOL;
        // >>> 5

        $res8 = $r->vdim('points');
        echo $res8 . PHP_EOL;
        // >>> 2
        // STEP_END
        // REMOVE_START
        $this->assertEquals(5, $res7);
        $this->assertEquals(2, $res8);
        // REMOVE_END

        // STEP_START vemb
        $res9 = $r->vemb('points', 'pt:A');
        echo json_encode($res9) . PHP_EOL;
        // >>> [0.9999999403953552, 0.9999999403953552]

        $res10 = $r->vemb('points', 'pt:B');
        echo json_encode($res10) . PHP_EOL;
        // >>> [-0.9999999403953552, -0.9999999403953552]

        $res11 = $r->vemb('points', 'pt:C');
        echo json_encode($res11) . PHP_EOL;
        // >>> [-0.9999999403953552, 0.9999999403953552]

        $res12 = $r->vemb('points', 'pt:D');
        echo json_encode($res12) . PHP_EOL;
        // >>> [0.9999999403953552, -0.9999999403953552]

        $res13 = $r->vemb('points', 'pt:E');
        echo json_encode($res13) . PHP_EOL;
        // >>> [1,0]
        // STEP_END
        // REMOVE_START
        $this->assertEquals([0.9999999403953552, 0.9999999403953552], $res9);
        $this->assertEquals([-0.9999999403953552, -0.9999999403953552], $res10);
        $this->assertEquals([-0.9999999403953552, 0.9999999403953552], $res11);
        $this->assertEquals([0.9999999403953552, -0.9999999403953552], $res12);
        $this->assertEquals([1.0, 0.0], $res13);
        // REMOVE_END

        // STEP_START attr
        $res14 = $r->vsetattr('points', 'pt:A', '{
            "name": "Point A",
            "description": "First point added"
        }');
        echo $res14 . PHP_EOL;
        // >>> 1

        $res15 = $r->vgetattr('points', 'pt:A');
        echo json_encode($res15) . PHP_EOL;
        // >>> {"name":"Point A","description":"First point added"}

        $res16 = $r->vsetattr('points', 'pt:A', '');
        echo $res16 . PHP_EOL;
        // >>> 1

        $res17 = $r->vgetattr('points', 'pt:A');
        echo json_encode($res17) . PHP_EOL;
        // >>> null
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res14);
        $this->assertEquals(['name' => 'Point A', 'description' => 'First point added'], $res15);
        $this->assertEquals(1, $res16);
        $this->assertEquals(null, $res17);
        // REMOVE_END

        // STEP_START vrem
        $res18 = $r->vadd('points', [0, 0], 'pt:F');
        echo $res18 . PHP_EOL;
        // >>> 1

        $res19 = $r->vcard('points');
        echo $res19 . PHP_EOL;
        // >>> 6

        $res20 = $r->vrem('points', 'pt:F');
        echo $res20 . PHP_EOL;
        // >>> 1

        $res21 = $r->vcard('points');
        echo $res21 . PHP_EOL;
        // >>> 5
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res18);
        $this->assertEquals(6, $res19);
        $this->assertEquals(1, $res20);
        $this->assertEquals(5, $res21);
        // REMOVE_END

        // STEP_START vsim_basic
        $res22 = $r->vsim('points', [0.9, 0.1]);
        echo json_encode($res22) . PHP_EOL;
        // >>> ["pt:E","pt:A","pt:D","pt:C","pt:B"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(['pt:E', 'pt:A', 'pt:D', 'pt:C', 'pt:B'], $res22);
        // REMOVE_END
        
        // STEP_START vsim_options
        // Returns an array of elements with their scores:
        //      ['pt:A' => 1.0, 'pt:E' => 0.8535534143447876,...
        $res23 = $r->vsim(
            'points', 'pt:A', true,true, 4,
        );
        echo json_encode($res23) . PHP_EOL;
        // >>> {'pt:A': 1.0, 'pt:E': 0.8535534143447876, 'pt:D': 0.5, 'pt:C': 0.5}
        // STEP_END
        // REMOVE_START
        //$this->assertEquals(['pt:A' => 1.0, 'pt:E' => 0.8535534143447876, 'pt:D' => 0.5, 'pt:C' => 0.5], $res23);
        // REMOVE_END

        // STEP_START vsim_filter
        $res24 = $r->vsetattr('points', 'pt:A', [
            'size' => 'large',
            'price' => 18.99
        ]);
        echo $res24 . PHP_EOL;
        // >>> 1

        $res25 = $r->vsetattr('points', 'pt:B', [
            'size' => 'large',
            'price' => 35.99
        ]);
        echo $res25 . PHP_EOL;
        // >>> 1

        $res26 = $r->vsetattr('points', 'pt:C', [
            'size' => 'large',
            'price' => 25.99
        ]);
        echo $res26 . PHP_EOL;
        // >>> 1

        $res27 = $r->vsetattr('points', 'pt:D', [
            'size' => 'small',
            'price' => 21.00
        ]);
        echo $res27 . PHP_EOL;
        // >>> 1

        $res28 = $r->vsetattr('points', 'pt:E', [
            'size' => 'small',
            'price' => 17.75
        ]);
        echo $res28 . PHP_EOL;
        // >>> 1

        // Return elements in order of distance from point A whose
        // `size` attribute is `large`.
        $res29 = $r->vsim(
            'points', 'pt:A',true, null, null, null, null,
            '.size == "large"'
        );
        echo json_encode($res29) . PHP_EOL;
        // >>> ["pt:A","pt:C","pt:B"]

        // Return elements in order of distance from point A whose size is
        // `large` and whose price is greater than 20.00.
        $res30 = $r->vsim(
            'points', 'pt:A',true, null, null, null, null,
            '.size == "large" && .price > 20.00'
        );
        echo json_encode($res30) . PHP_EOL;
        // >>> ["pt:C","pt:B"]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res24);
        $this->assertEquals(1, $res25);
        $this->assertEquals(1, $res26);
        $this->assertEquals(1, $res27);
        $this->assertEquals(1, $res28);
        $this->assertEquals(['pt:A', 'pt:C', 'pt:B'], $res29);
        $this->assertEquals(['pt:C', 'pt:B'], $res30);
        // REMOVE_END

        // STEP_START add_quant
        $res31 = $r->vadd('quantSetQ8', [1.262185, 1.958231], 'quantElement', null, false,
            Predis\Command\Redis\VADD::QUANT_Q8
        );
        echo $res31 . PHP_EOL;
        // >>> 1

        $res32 = $r->vemb('quantSetQ8', 'quantElement');
        echo json_encode($res32) . PHP_EOL;
        // >>> [1.2643694877624512, 1.958230972290039]

        $res33 = $r->vadd('quantSetNoQ', [1.262185, 1.958231], 'quantElement', null, false,
            Predis\Command\Redis\VADD::QUANT_NOQUANT
        );
        echo $res33 . PHP_EOL;
        // >>> 1

        $res34 = $r->vemb('quantSetNoQ', 'quantElement');
        echo json_encode($res34) . PHP_EOL;
        // >>> [1.262184977531433, 1.958230972290039]

        $res35 = $r->vadd('quantSetBin', [1.262185, 1.958231], 'quantElement', null, false,
            Predis\Command\Redis\VADD::QUANT_BIN
        );
        echo $res35 . PHP_EOL;
        // >>> 1

        $res36 = $r->vemb('quantSetBin', 'quantElement');
        echo json_encode($res36) . PHP_EOL;
        // >>> [1, 1]
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res31);
        $this->assertEquals([1.2643694877624512, 1.958230972290039], $res32);
        $this->assertEquals(1, $res33);
        $this->assertEquals([1.262184977531433, 1.958230972290039], $res34);
        $this->assertEquals(1, $res35);
        $this->assertEquals([1, 1], $res36);
        // REMOVE_END

        // STEP_START add_reduce
        $values = array();

        for ($i = 0; $i < 300; $i++) {
            $values[] = $i / 299.0;
        }

        $res37 = $r->vadd('setNotReduced', $values, 'element');
        echo $res37 . PHP_EOL;
        // >>> 1

        $res38 = $r->vdim('setNotReduced');
        echo $res38 . PHP_EOL;
        // >>> 300

        $res39 = $r->vadd('setReduced', $values, 'element', 100);
        echo $res39 . PHP_EOL;
        // >>> 1

        $res40 = $r->vdim('setReduced');
        echo $res40 . PHP_EOL;
        // >>> 100
        // STEP_END
        // REMOVE_START
        $this->assertEquals(1, $res37);
        $this->assertEquals(300, $res38);
        $this->assertEquals(1, $res39);
        $this->assertEquals(100, $res40);
        // REMOVE_END
    }
}
