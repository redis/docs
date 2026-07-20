// EXAMPLE: set_and_get
<?php
use Predis\Client as PredisClient;

class SetGetTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testSetGet() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // REMOVE_START
        $r->del('bike:1');
        // REMOVE_END

        $res1 = $r->set('bike:1', 'Process 134');
        echo $res1 . PHP_EOL; // >>> OK

        $res2 = $r->get('bike:1');
        echo $res2 . PHP_EOL; // >>> Process 134

        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals('Process 134', $res2);
        $r->del('bike:1');
        // REMOVE_END
    }
}
