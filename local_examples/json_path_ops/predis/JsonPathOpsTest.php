// EXAMPLE: json_path_ops
<?php

use PHPUnit\Framework\TestCase;
use Predis\Client as PredisClient;

class JsonPathOpsTest extends TestCase
{
    private PredisClient $redis;

    protected function setUp(): void
    {
        $this->redis = new PredisClient([
            'scheme'   => 'tcp',
            'host'     => '127.0.0.1',
            'port'     => 6379,
            'password' => '',
            'database' => 0,
        ]);

        // Clean up before each test
        $this->redis->flushall();
    }

    public function testJsonPathOps(): void
    {
        // STEP_START filter_negation
        $res1 = $this->redis->jsonset('doc', '$', json_encode(
            [["a" => 1, "b" => 1], ["b" => 2], ["a" => 1], ["c" => 3]]
        ));
        echo $res1 . PHP_EOL; // >>> OK

        $res2 = $this->redis->jsonget('doc', '', '', '', '$[?!@.a]');
        echo $res2 . PHP_EOL; // >>> [{"b":2},{"c":3}]

        $res3 = $this->redis->jsonget('doc', '', '', '', '$[?!(@.a==1)]');
        echo $res3 . PHP_EOL; // >>> [{"b":2},{"c":3}]

        $res4 = $this->redis->jsonget('doc', '', '', '', '$[?!@.a && @.b]');
        echo $res4 . PHP_EOL; // >>> [{"b":2}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res1);
        $this->assertEquals('[{"b":2},{"c":3}]', $res2);
        $this->assertEquals('[{"b":2},{"c":3}]', $res3);
        $this->assertEquals('[{"b":2}]', $res4);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START filter_literal_eq
        $res5 = $this->redis->jsonset('doc', '$', json_encode([
            "arrs" => [[1], [2], [1, 2], [1, [2]]],
            "objs" => [["x" => 1], ["x" => 2], ["y" => 1]],
        ]));
        echo $res5 . PHP_EOL; // >>> OK

        $res6 = $this->redis->jsonget('doc', '', '', '', '$.arrs[?(@ == [1])]');
        echo $res6 . PHP_EOL; // >>> [[1]]

        $res7 = $this->redis->jsonget('doc', '', '', '', '$.arrs[?(@ == [1,[2]])]');
        echo $res7 . PHP_EOL; // >>> [[1,[2]]]

        $res8 = $this->redis->jsonget('doc', '', '', '', '$.objs[?(@ == {"x":1})]');
        echo $res8 . PHP_EOL; // >>> [{"x":1}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res5);
        $this->assertEquals('[[1]]', $res6);
        $this->assertEquals('[[1,[2]]]', $res7);
        $this->assertEquals('[{"x":1}]', $res8);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START filter_arithmetic
        $res9 = $this->redis->jsonset('doc', '$', json_encode(
            [["a" => 2, "b" => 3], ["a" => 5, "b" => 2]]
        ));
        echo $res9 . PHP_EOL; // >>> OK

        $res10 = $this->redis->jsonget('doc', '', '', '', '$[?@.a + 1 == 3]');
        echo $res10 . PHP_EOL; // >>> [{"a":2,"b":3}]

        $res11 = $this->redis->jsonget('doc', '', '', '', '$[?@.a + @.b * 2 == 8]');
        echo $res11 . PHP_EOL; // >>> [{"a":2,"b":3}]

        $res12 = $this->redis->jsonget('doc', '', '', '', '$[?(@.a + @.b) * 2 == 10]');
        echo $res12 . PHP_EOL; // >>> [{"a":2,"b":3}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res9);
        $this->assertEquals('[{"a":2,"b":3}]', $res10);
        $this->assertEquals('[{"a":2,"b":3}]', $res11);
        $this->assertEquals('[{"a":2,"b":3}]', $res12);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START filter_membership
        $res13 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [1, 2, 3, 4], "allow" => [2, 3]]
        ));
        echo $res13 . PHP_EOL; // >>> OK

        $res14 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ in [2,4]]');
        echo $res14 . PHP_EOL; // >>> [2,4]

        $res15 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ nin [2,4]]');
        echo $res15 . PHP_EOL; // >>> [1,3]

        $res16 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ in $.allow]');
        echo $res16 . PHP_EOL; // >>> [2,3]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res13);
        $this->assertEquals('[2,4]', $res14);
        $this->assertEquals('[1,3]', $res15);
        $this->assertEquals('[2,3]', $res16);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START filter_set_relations
        $res17 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [[1, 2], [1, 5], []]]
        ));
        echo $res17 . PHP_EOL; // >>> OK

        $res18 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ subsetof [1,2,3]]');
        echo $res18 . PHP_EOL; // >>> [[1,2],[]]

        $res19 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [[1, 9], [8, 9], []]]
        ));
        echo $res19 . PHP_EOL; // >>> OK

        $res20 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ anyof [1,2,3]]');
        echo $res20 . PHP_EOL; // >>> [[1,9]]

        $res21 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [[4, 5], [1, 9], []]]
        ));
        echo $res21 . PHP_EOL; // >>> OK

        $res22 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ noneof [1,2,3]]');
        echo $res22 . PHP_EOL; // >>> [[4,5],[]]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res17);
        $this->assertEquals('[[1,2],[]]', $res18);
        $this->assertEquals('OK', $res19);
        $this->assertEquals('[[1,9]]', $res20);
        $this->assertEquals('OK', $res21);
        $this->assertEquals('[[4,5],[]]', $res22);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START filter_size_empty
        $res23 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [[4, 5], [1], [7, 8, 9]]]
        ));
        echo $res23 . PHP_EOL; // >>> OK

        $res24 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ sizeof 2]');
        echo $res24 . PHP_EOL; // >>> [[4,5]]

        $res25 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [[], [1], "", [2, 3], new \stdClass(), ["k" => 1]]]
        ));
        echo $res25 . PHP_EOL; // >>> OK

        $res26 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ empty true]');
        echo $res26 . PHP_EOL; // >>> [[],"",{}]

        $res27 = $this->redis->jsonget('doc', '', '', '', '$.a[?@ empty false]');
        echo $res27 . PHP_EOL; // >>> [[1],[2,3],{"k":1}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res23);
        $this->assertEquals('[[4,5]]', $res24);
        $this->assertEquals('OK', $res25);
        $this->assertEquals('[[],"",{}]', $res26);
        $this->assertEquals('[[1],[2,3],{"k":1}]', $res27);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START filter_getkeys
        $res28 = $this->redis->jsonset('doc', '$', json_encode([
            "obj" => ["x" => 1, "y" => 2],
            "books" => [["t" => "a"], ["t" => "b"]],
        ]));
        echo $res28 . PHP_EOL; // >>> OK

        $res29 = $this->redis->jsonget('doc', '', '', '', '$.obj~');
        echo $res29 . PHP_EOL; // >>> ["x","y"]

        $res30 = $this->redis->jsonget('doc', '', '', '', '$~');
        echo $res30 . PHP_EOL; // >>> ["obj","books"]

        $res31 = $this->redis->jsonget('doc', '', '', '', '$.books~');
        echo $res31 . PHP_EOL; // >>> []
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res28);
        $this->assertEquals('["x","y"]', $res29);
        $this->assertEquals('["obj","books"]', $res30);
        $this->assertEquals('[]', $res31);
        $this->redis->del('doc');
        // REMOVE_END

    }

    protected function tearDown(): void
    {
        // Clean up after each test
        $this->redis->flushall();
        $this->redis->disconnect();
    }
}
