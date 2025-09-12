// EXAMPLE: cmds_generic
<?php
require_once 'vendor/autoload.php';

use Predis\Client as PredisClient;

class CmdsGenericTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdsGeneric() {
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

        // STEP_START exists
        $existsResult1 = $r->set('key1', 'Hello');
        echo $existsResult1 . PHP_EOL; // >>> OK

        $existsResult2 = $r->exists('key1');
        echo $existsResult2 . PHP_EOL; // >>> 1

        $existsResult3 = $r->exists('nosuchkey');
        echo $existsResult3 . PHP_EOL; // >>> 0

        $existsResult4 = $r->set('key2', 'World');
        echo $existsResult4 . PHP_EOL; // >>> OK

        $existsResult5 = $r->exists('key1', 'key2', 'nosuchkey');
        echo $existsResult5 . PHP_EOL; // >>> 2
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $existsResult1);
        $this->assertEquals(1, $existsResult2);
        $this->assertEquals(0, $existsResult3);
        $this->assertEquals('OK', $existsResult4);
        $this->assertEquals(2, $existsResult5);
        // REMOVE_END

    }
}
