// EXAMPLE: cmds_hotkeys
<?php
// HIDE_START
use Predis\Client as PredisClient;

class CmdsHotkeysTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdsHotkeys() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);
        // HIDE_END

        // REMOVE_START
        $r->hotkeys->stop();
        $r->hotkeys->reset();
        $r->del('product:1', 'product:2', 'product:3');
        $r->mset(['product:1' => 'Laptop', 'product:2' => 'Phone', 'product:3' => 'Tablet']);
        // REMOVE_END

        // STEP_START hotkeys
        // Track the 10 hottest keys by CPU time and network bytes.
        $res1 = $r->hotkeys->start([\Predis\Command\Container\HOTKEYS::CPU, \Predis\Command\Container\HOTKEYS::NET], 10);
        echo $res1 . PHP_EOL; // >>> OK

        // Generate some traffic. In production, this is your application's workload.
        for ($i = 0; $i < 100; $i++) {
            $r->get('product:1');
        }

        for ($i = 0; $i < 10; $i++) {
            $r->get('product:2');
        }

        $r->get('product:3');

        $res2 = $r->hotkeys->get()[0];
        echo $res2['tracking-active'] . PHP_EOL; // >>> 1

        $byNet = $res2['by-net-bytes'];
        echo json_encode(array_chunk($byNet, 2)) . PHP_EOL;
        // >>> [["product:1",4000],["product:2",390],["product:3",40]]

        $res3 = $r->hotkeys->stop();
        echo $res3 . PHP_EOL; // >>> OK

        $res4 = $r->hotkeys->reset();
        echo $res4 . PHP_EOL; // >>> OK
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals(1, $res2['tracking-active']);
        $this->assertEquals(['product:1', 4000, 'product:2', 390, 'product:3', 40], $byNet);
        $this->assertEquals('OK', $res3);
        $this->assertEquals('OK', $res4);
        $this->assertNull($r->hotkeys->get());
        $r->del('product:1', 'product:2', 'product:3');
        // REMOVE_END
        // HIDE_START
    }
}
// HIDE_END
