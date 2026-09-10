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

        // STEP_START func_length
        $res32 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [[1, 2, 3], [1], "abcd", "x"]]
        ));
        echo $res32 . PHP_EOL; // >>> OK

        $res33 = $this->redis->jsonget('doc', '', '', '', '$.a[?length(@) > 2]');
        echo $res33 . PHP_EOL; // >>> [[1,2,3],"abcd"]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res32);
        $this->assertEquals('[[1,2,3],"abcd"]', $res33);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_count
        $res34 = $this->redis->jsonset('doc', '$', json_encode(
            [["a" => 1, "b" => 2, "c" => 3], ["a" => 1]]
        ));
        echo $res34 . PHP_EOL; // >>> OK

        $res35 = $this->redis->jsonget('doc', '', '', '', '$[?count(@.*) == 3]');
        echo $res35 . PHP_EOL; // >>> [{"a":1,"b":2,"c":3}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res34);
        $this->assertEquals('[{"a":1,"b":2,"c":3}]', $res35);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_value
        $res36 = $this->redis->jsonset('doc', '$', json_encode(
            [["a" => 1], ["a" => 2]]
        ));
        echo $res36 . PHP_EOL; // >>> OK

        $res37 = $this->redis->jsonget('doc', '', '', '', '$[?value(@.a) == 1]');
        echo $res37 . PHP_EOL; // >>> [{"a":1}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res36);
        $this->assertEquals('[{"a":1}]', $res37);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_keys
        $res38 = $this->redis->jsonset('doc', '$', json_encode(
            ["obj" => ["x" => 1, "y" => 2]]
        ));
        echo $res38 . PHP_EOL; // >>> OK

        $res39 = $this->redis->jsonget('doc', '', '', '', '$.obj.keys()');
        echo $res39 . PHP_EOL; // >>> ["x","y"]

        $res40 = $this->redis->jsonget('doc', '', '', '', '$.obj.keys().count()');
        echo $res40 . PHP_EOL; // >>> [2]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res38);
        $this->assertEquals('["x","y"]', $res39);
        $this->assertEquals('[2]', $res40);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_match_search
        $res41 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => ["abc", "xabc", "a", "b"]]
        ));
        echo $res41 . PHP_EOL; // >>> OK

        $res42 = $this->redis->jsonget('doc', '', '', '', '$.a[?match(@, "a.*")]');
        echo $res42 . PHP_EOL; // >>> ["abc","a"]

        $res43 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => ["abc", "xyz", "b"]]
        ));
        echo $res43 . PHP_EOL; // >>> OK

        $res44 = $this->redis->jsonget('doc', '', '', '', '$.a[?search(@, "b")]');
        echo $res44 . PHP_EOL; // >>> ["abc","b"]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res41);
        $this->assertEquals('["abc","a"]', $res42);
        $this->assertEquals('OK', $res43);
        $this->assertEquals('["abc","b"]', $res44);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_concat
        $res45 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [["x" => "a", "y" => "b"], ["x" => "a", "y" => "c"]]]
        ));
        echo $res45 . PHP_EOL; // >>> OK

        $res46 = $this->redis->jsonget('doc', '', '', '', '$.a[?concat(@.x, @.y) == "ab"]');
        echo $res46 . PHP_EOL; // >>> [{"x":"a","y":"b"}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res45);
        $this->assertEquals('[{"x":"a","y":"b"}]', $res46);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_math
        $res47 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [2.1, 3.9, 1.0]]
        ));
        echo $res47 . PHP_EOL; // >>> OK

        $res48 = $this->redis->jsonget('doc', '', '', '', '$.a[?ceiling(@) == 3]');
        echo $res48 . PHP_EOL; // >>> [2.1]

        $res49 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [2.1, 2.9, 3.5]]
        ));
        echo $res49 . PHP_EOL; // >>> OK

        $res50 = $this->redis->jsonget('doc', '', '', '', '$.a[?floor(@) == 2]');
        echo $res50 . PHP_EOL; // >>> [2.1,2.9]

        $res51 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [["n" => -5], ["n" => 5], ["n" => -3]]]
        ));
        echo $res51 . PHP_EOL; // >>> OK

        $res52 = $this->redis->jsonget('doc', '', '', '', '$.a[?abs(@.n) == 5]');
        echo $res52 . PHP_EOL; // >>> [{"n":-5},{"n":5}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res47);
        $this->assertEquals('[2.1]', $res48);
        $this->assertEquals('OK', $res49);
        $this->assertEquals('[2.1,2.9]', $res50);
        $this->assertEquals('OK', $res51);
        $this->assertEquals('[{"n":-5},{"n":5}]', $res52);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_array_access
        $res53 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [["n" => [1, 2]], ["n" => [9, 8]]]]
        ));
        echo $res53 . PHP_EOL; // >>> OK

        $res54 = $this->redis->jsonget('doc', '', '', '', '$.a[?first(@.n) == 1]');
        echo $res54 . PHP_EOL; // >>> [{"n":[1,2]}]

        $res55 = $this->redis->jsonget('doc', '', '', '', '$.a[?last(@.n) == 8]');
        echo $res55 . PHP_EOL; // >>> [{"n":[9,8]}]

        $res56 = $this->redis->jsonget('doc', '', '', '', '$.a[?index(@.n, -1) == 2]');
        echo $res56 . PHP_EOL; // >>> [{"n":[1,2]}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res53);
        $this->assertEquals('[{"n":[1,2]}]', $res54);
        $this->assertEquals('[{"n":[9,8]}]', $res55);
        $this->assertEquals('[{"n":[1,2]}]', $res56);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_aggregate
        $res57 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => [["n" => [3, 1, 2]], ["n" => [5, 6]]]]
        ));
        echo $res57 . PHP_EOL; // >>> OK

        $res58 = $this->redis->jsonget('doc', '', '', '', '$.a[?sum(@.n) == 6]');
        echo $res58 . PHP_EOL; // >>> [{"n":[3,1,2]}]

        $res59 = $this->redis->jsonget('doc', '', '', '', '$.a[?avg(@.n) == 2]');
        echo $res59 . PHP_EOL; // >>> [{"n":[3,1,2]}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res57);
        $this->assertEquals('[{"n":[3,1,2]}]', $res58);
        $this->assertEquals('[{"n":[3,1,2]}]', $res59);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START func_append
        $res60 = $this->redis->jsonset('doc', '$', json_encode(
            ["arr" => [1, 2, 3]]
        ));
        echo $res60 . PHP_EOL; // >>> OK

        $res61 = $this->redis->jsonget('doc', '', '', '', '$.arr.append(9)');
        echo $res61 . PHP_EOL; // >>> [1,2,3,9]

        $res62 = $this->redis->jsonset('doc', '$', json_encode(
            ["books" => [["t" => "a", "price" => 30], ["t" => "b", "price" => 5]]]
        ));
        echo $res62 . PHP_EOL; // >>> OK

        $res63 = $this->redis->jsonget('doc', '', '', '', '$.books[?(@.price >= 10)].append({"t":"X"})');
        echo $res63 . PHP_EOL; // >>> [{"t":"a","price":30},{"t":"X"}]
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res60);
        $this->assertEquals('[1,2,3,9]', $res61);
        $this->assertEquals('OK', $res62);
        $this->assertEquals('[{"t":"a","price":30},{"t":"X"}]', $res63);
        $this->redis->del('doc');
        // REMOVE_END

        // STEP_START proj_basic
        $res64 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => 2, "b" => 4, "arr" => [1, 2, 3]]
        ));
        echo $res64 . PHP_EOL; // >>> OK

        $res65 = $this->redis->jsonget('doc', '', '', '', '$.a + 1');
        echo $res65 . PHP_EOL; // >>> [3]

        $res66 = $this->redis->jsonget('doc', '', '', '', '$.a * $.b');
        echo $res66 . PHP_EOL; // >>> [8]

        $res67 = $this->redis->jsonget('doc', '', '', '', '($.a + $.b) / 2');
        echo $res67 . PHP_EOL; // >>> [3.0]

        $res68 = $this->redis->jsonget('doc', '', '', '', '$.arr.length()');
        echo $res68 . PHP_EOL; // >>> [3]

        $res69 = $this->redis->jsonget('doc', '', '', '', '$.a / 0');
        echo $res69 . PHP_EOL; // >>> []
        // STEP_END

        // REMOVE_START
        $this->assertEquals('OK', $res64);
        $this->assertEquals('[3]', $res65);
        $this->assertEquals('[8]', $res66);
        $this->assertEquals('[3.0]', $res67);
        $this->assertEquals('[3]', $res68);
        $this->assertEquals('[]', $res69);
        // REMOVE_END

        // STEP_START proj_multipath
        $res70 = $this->redis->jsonset('doc', '$', json_encode(
            ["a" => 2, "b" => 4, "arr" => [1, 2, 3]]
        ));
        echo $res70 . PHP_EOL; // >>> OK

        $res71 = $this->redis->jsonget('doc', '', '', '', '$.a + 1', '$.b');
        // The reply is a JSON object keyed by path; key order is not guaranteed.
        echo $res71 . PHP_EOL; // >>> {"$.a + 1":[3],"$.b":[4]} (key order not guaranteed)
        // STEP_END

        // REMOVE_START
        $decoded71 = json_decode($res71, true);
        $this->assertEquals(['$.a + 1' => [3], '$.b' => [4]], $decoded71);
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
