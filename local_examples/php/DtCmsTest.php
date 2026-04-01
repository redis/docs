// EXAMPLE: cms_tutorial
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

class DtCmsTest
// REMOVE_START
extends PredisTestCase
// REMOVE_END
{
    public function testDtCms() {
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

        // STEP_START cms
        $res1 = $r->cmsinitbyprob('bikes:profit', 0.001, 0.002);
        echo $res1 . PHP_EOL;
        // >>> OK

        $res2 = $r->cmsincrby('bikes:profit', 'Smoky Mountain Striker', 100);
        echo json_encode($res2) . PHP_EOL;
        // >>> [100]

        $res3 = $r->cmsincrby(
            'bikes:profit',
            'Rocky Mountain Racer', 200,
            'Cloudy City Cruiser', 150
        );
        echo json_encode($res3) . PHP_EOL;
        // >>> [200,150]

        $res4 = $r->cmsquery('bikes:profit', 'Smoky Mountain Striker');
        echo json_encode($res4) . PHP_EOL;
        // >>> [100]

        $res5 = $r->cmsinfo('bikes:profit');
        echo $res5['width'] . ' ' . $res5['depth'] . ' ' . $res5['count'] . PHP_EOL;
        // >>> 2000 9 450
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals([100], $res2);
        $this->assertEquals([200, 150], $res3);
        $this->assertEquals([100], $res4);
        $this->assertEquals(2000, $res5['width']);
        $this->assertEquals(9, $res5['depth']);
        $this->assertEquals(450, $res5['count']);
        // REMOVE_END
    }
}

