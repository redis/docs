// EXAMPLE: cmds_generic
<?php
use PHPUnit\Framework\TestCase;
use Predis\Client as PredisClient;

class CmdsGenericTest
// REMOVE_START
extends TestCase
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
        $r->del('key1', 'key2');
        // REMOVE_END

        // STEP_START keys
        $keysResult1 = $r->mset(['firstname' => 'Jack', 'lastname' => 'Stuntman', 'age' => '35']);
        echo $keysResult1 . PHP_EOL; // >>> OK

        $keysResult2 = $r->keys('*name*');
        sort($keysResult2);
        echo implode(', ', $keysResult2) . PHP_EOL; // >>> firstname, lastname

        $keysResult3 = $r->keys('a??');
        echo implode(', ', $keysResult3) . PHP_EOL; // >>> age

        $keysResult4 = $r->keys('*');
        sort($keysResult4);
        echo implode(', ', $keysResult4) . PHP_EOL; // >>> age, firstname, lastname
        // STEP_END
        // REMOVE_START
        $this->assertEquals('OK', $keysResult1);
        $this->assertEquals(['firstname', 'lastname'], $keysResult2);
        $this->assertEquals(['age'], $keysResult3);
        $this->assertEquals(['age', 'firstname', 'lastname'], $keysResult4);
        $r->del('firstname', 'lastname', 'age');
        // REMOVE_END

    }
}
