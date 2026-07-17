// EXAMPLE: cmds_cnxmgmt
<?php
use Predis\Client as PredisClient;

class CmdsCnxmgmtTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testCmdsCnxmgmt() {
        $r = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // STEP_START auth1
        $res1 = $r->auth('temp_pass');
        echo $res1 . PHP_EOL; // >>> OK

        $res2 = $r->auth('default', 'temp_pass');
        echo $res2 . PHP_EOL; // >>> OK
        // STEP_END

        // STEP_START auth2
        $res3 = $r->auth('test-user', 'strong_password');
        echo $res3 . PHP_EOL; // >>> OK
        // STEP_END
    }
}
