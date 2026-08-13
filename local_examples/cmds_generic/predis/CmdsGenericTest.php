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

        // STEP_START scan1
        $scan1Result1 = $r->sadd('myset', ['1', '2', '3', 'foo', 'foobar', 'feelsgood']);
        echo $scan1Result1 . PHP_EOL;                       // >>> 6

        [$scan1Cursor, $scan1Members] = $r->sscan('myset', 0, ['MATCH' => 'f*']);
        sort($scan1Members);
        echo implode(', ', $scan1Members) . PHP_EOL;         // >>> feelsgood, foo, foobar
        // STEP_END

        // REMOVE_START
        $this->assertEquals(6, $scan1Result1);
        $this->assertEquals(['feelsgood', 'foo', 'foobar'], $scan1Members);
        $r->del('myset');
        // REMOVE_END

        // STEP_START scan2
        // REMOVE_START
        for ($i = 1; $i <= 1000; $i++) {
            $r->set("key:$i", $i);
        }
        // REMOVE_END

        // MATCH is applied after elements are fetched, so with the default COUNT most
        // iterations return few keys or none at all.
        $scan2Cursor = 0;

        for ($i = 0; $i < 4; $i++) {
            [$scan2Cursor, $scan2Keys] = $r->scan($scan2Cursor, ['MATCH' => '*11*']);
            echo count($scan2Keys) . PHP_EOL;
        }

        // A larger COUNT forces more scanning in a single iteration, so the remaining
        // matches arrive together. This continues from the cursor reached above.
        [$scan2Cursor, $scan2Keys] = $r->scan($scan2Cursor, ['MATCH' => '*11*', 'COUNT' => 1000]);
        echo count($scan2Keys) . PHP_EOL;                    // >>> 18
        // STEP_END

        // REMOVE_START
        $this->assertEquals(18, count($scan2Keys));
        $r->flushdb();
        // REMOVE_END

        // STEP_START scan4
        $scan4Result1 = $r->hset('myhash', 'a', 1, 'b', 2);
        echo $scan4Result1 . PHP_EOL;                        // >>> 2

        [$scan4Cursor, $scan4Pairs] = $r->hscan('myhash', 0);
        echo json_encode($scan4Pairs) . PHP_EOL;             // >>> {"a":"1","b":"2"}

        [$scan4Cursor, $scan4Fields] = $r->hscan('myhash', 0, ['NOVALUES' => true]);
        echo implode(', ', $scan4Fields) . PHP_EOL;          // >>> a, b
        // STEP_END

        // REMOVE_START
        $this->assertEquals(2, $scan4Result1);
        $this->assertEquals(['a' => '1', 'b' => '2'], $scan4Pairs);
        $this->assertEquals(['a', 'b'], $scan4Fields);
        $r->del('myhash');
        // REMOVE_END

    }
}
