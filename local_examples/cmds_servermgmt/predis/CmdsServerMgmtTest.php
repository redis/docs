// EXAMPLE: cmds_servermgmt
<?php
use Predis\Client as PredisClient;

class CmdsServerMgmtTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdsServerMgmt() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // STEP_START flushall
        $res1 = $r->flushall();
        echo $res1 . PHP_EOL; // >>> OK

        $res2 = $r->keys('*');
        echo json_encode($res2) . PHP_EOL; // >>> []
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals([], $res2);
        // REMOVE_END

        // STEP_START info
        $res3 = $r->info();
        echo $res3['Server']['redis_version'] . PHP_EOL;
        // >>> 7.4.0
        // STEP_END

        // REMOVE_START
        $this->assertTrue(isset($res3['Server']['redis_version']));
        // REMOVE_END
    }
}
