// EXAMPLE: cmds_string
<?php
use PHPUnit\Framework\TestCase;
use Predis\Client as PredisClient;

class CmdsStringTest
// REMOVE_START
extends TestCase
// REMOVE_END
{
    public function testCmdsString() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // REMOVE_START
        $r->del('key1', 'key2', 'mykey', 'nonexisting');
        // REMOVE_END

        // STEP_START mget
        $r->set('key1', 'Hello');
        $r->set('key2', 'World');

        $mgetResult = $r->mget(['key1', 'key2', 'nonexisting']);
        echo json_encode($mgetResult) . PHP_EOL; // >>> ["Hello","World",null]
        // STEP_END

        // REMOVE_START
        $this->assertEquals(['Hello', 'World', null], $mgetResult);
        $r->del('key1', 'key2', 'nonexisting');
        // REMOVE_END

        // STEP_START incr
        $incrResult1 = $r->set('mykey', '10');
        echo $incrResult1 . PHP_EOL;        // >>> OK

        $incrResult2 = $r->incr('mykey');
        echo $incrResult2 . PHP_EOL;        // >>> 11

        $incrResult3 = $r->get('mykey');
        echo $incrResult3 . PHP_EOL;        // >>> 11
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', (string) $incrResult1);
        $this->assertEquals(11, $incrResult2);
        $this->assertEquals('11', $incrResult3);
        $r->del('mykey');
        // REMOVE_END
    }
}
