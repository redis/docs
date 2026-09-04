// EXAMPLE: json_path_ops
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
// REMOVE_END

// HIDE_START
import redis.clients.jedis.RedisClient;
import redis.clients.jedis.json.Path;
import redis.clients.jedis.json.Path2;
import org.json.JSONObject;
// HIDE_END

// HIDE_START
public class JsonPathOpsExample {

    @Test
    public void run() {
        RedisClient jedis = RedisClient.create("redis://localhost:6379");

        // REMOVE_START
        jedis.del("doc");
        // REMOVE_END
// HIDE_END

        // STEP_START filter_negation
        String res1 = jedis.jsonSet("doc", new Path2("$"), "[{\"a\":1,\"b\":1},{\"b\":2},{\"a\":1},{\"c\":3}]");
        System.out.println(res1);    // >>> OK

        Object res2 = jedis.jsonGet("doc", new Path2("$[?!@.a]"));
        System.out.println(res2);    // >>> [{"b":2},{"c":3}]

        Object res3 = jedis.jsonGet("doc", new Path2("$[?!(@.a==1)]"));
        System.out.println(res3);    // >>> [{"b":2},{"c":3}]

        Object res4 = jedis.jsonGet("doc", new Path2("$[?!@.a && @.b]"));
        System.out.println(res4);    // >>> [{"b":2}]
        // STEP_END
        // REMOVE_START
        assertEquals("[{\"b\":2},{\"c\":3}]", res2.toString());
        assertEquals("[{\"b\":2},{\"c\":3}]", res3.toString());
        assertEquals("[{\"b\":2}]", res4.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START filter_literal_eq
        String res5 = jedis.jsonSet(
            "doc",
            new Path2("$"),
            "{\"arrs\":[[1],[2],[1,2],[1,[2]]],\"objs\":[{\"x\":1},{\"x\":2},{\"y\":1}]}"
        );
        System.out.println(res5);    // >>> OK

        Object res6 = jedis.jsonGet("doc", new Path2("$.arrs[?(@ == [1])]"));
        System.out.println(res6);    // >>> [[1]]

        Object res7 = jedis.jsonGet("doc", new Path2("$.arrs[?(@ == [1,[2]])]"));
        System.out.println(res7);    // >>> [[1,[2]]]

        Object res8 = jedis.jsonGet("doc", new Path2("$.objs[?(@ == {\"x\":1})]"));
        System.out.println(res8);    // >>> [{"x":1}]
        // STEP_END
        // REMOVE_START
        assertEquals("[[1]]", res6.toString());
        assertEquals("[[1,[2]]]", res7.toString());
        assertEquals("[{\"x\":1}]", res8.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START filter_arithmetic
        String res9 = jedis.jsonSet("doc", new Path2("$"), "[{\"a\":2,\"b\":3},{\"a\":5,\"b\":2}]");
        System.out.println(res9);    // >>> OK

        Object res10 = jedis.jsonGet("doc", new Path2("$[?@.a + 1 == 3]"));
        System.out.println(res10);    // >>> [{"a":2,"b":3}]

        Object res11 = jedis.jsonGet("doc", new Path2("$[?@.a + @.b * 2 == 8]"));
        System.out.println(res11);    // >>> [{"a":2,"b":3}]

        Object res12 = jedis.jsonGet("doc", new Path2("$[?(@.a + @.b) * 2 == 10]"));
        System.out.println(res12);    // >>> [{"a":2,"b":3}]
        // STEP_END
        // REMOVE_START
        assertEquals("[{\"a\":2,\"b\":3}]", res10.toString());
        assertEquals("[{\"a\":2,\"b\":3}]", res11.toString());
        assertEquals("[{\"a\":2,\"b\":3}]", res12.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START filter_membership
        String res13 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[1,2,3,4],\"allow\":[2,3]}");
        System.out.println(res13);    // >>> OK

        Object res14 = jedis.jsonGet("doc", new Path2("$.a[?@ in [2,4]]"));
        System.out.println(res14);    // >>> [2,4]

        Object res15 = jedis.jsonGet("doc", new Path2("$.a[?@ nin [2,4]]"));
        System.out.println(res15);    // >>> [1,3]

        Object res16 = jedis.jsonGet("doc", new Path2("$.a[?@ in $.allow]"));
        System.out.println(res16);    // >>> [2,3]
        // STEP_END
        // REMOVE_START
        assertEquals("[2,4]", res14.toString());
        assertEquals("[1,3]", res15.toString());
        assertEquals("[2,3]", res16.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START filter_set_relations
        String res17 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[[1,2],[1,5],[]]}");
        System.out.println(res17);    // >>> OK

        Object res18 = jedis.jsonGet("doc", new Path2("$.a[?@ subsetof [1,2,3]]"));
        System.out.println(res18);    // >>> [[1,2],[]]

        String res19 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[[1,9],[8,9],[]]}");
        System.out.println(res19);    // >>> OK

        Object res20 = jedis.jsonGet("doc", new Path2("$.a[?@ anyof [1,2,3]]"));
        System.out.println(res20);    // >>> [[1,9]]

        String res21 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[[4,5],[1,9],[]]}");
        System.out.println(res21);    // >>> OK

        Object res22 = jedis.jsonGet("doc", new Path2("$.a[?@ noneof [1,2,3]]"));
        System.out.println(res22);    // >>> [[4,5],[]]
        // STEP_END
        // REMOVE_START
        assertEquals("[[1,2],[]]", res18.toString());
        assertEquals("[[1,9]]", res20.toString());
        assertEquals("[[4,5],[]]", res22.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START filter_size_empty
        String res23 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[[4,5],[1],[7,8,9]]}");
        System.out.println(res23);    // >>> OK

        Object res24 = jedis.jsonGet("doc", new Path2("$.a[?@ sizeof 2]"));
        System.out.println(res24);    // >>> [[4,5]]

        String res25 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[[],[1],\"\",[2,3],{},{\"k\":1}]}");
        System.out.println(res25);    // >>> OK

        Object res26 = jedis.jsonGet("doc", new Path2("$.a[?@ empty true]"));
        System.out.println(res26);    // >>> [[],"",{}]

        Object res27 = jedis.jsonGet("doc", new Path2("$.a[?@ empty false]"));
        System.out.println(res27);    // >>> [[1],[2,3],{"k":1}]
        // STEP_END
        // REMOVE_START
        assertEquals("[[4,5]]", res24.toString());
        assertEquals("[[],\"\",{}]", res26.toString());
        assertEquals("[[1],[2,3],{\"k\":1}]", res27.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START filter_getkeys
        String res28 = jedis.jsonSet(
            "doc",
            new Path2("$"),
            "{\"obj\":{\"x\":1,\"y\":2},\"books\":[{\"t\":\"a\"},{\"t\":\"b\"}]}"
        );
        System.out.println(res28);    // >>> OK

        Object res29 = jedis.jsonGet("doc", new Path2("$.obj~"));
        System.out.println(res29);    // >>> ["x","y"]

        Object res30 = jedis.jsonGet("doc", new Path2("$~"));
        System.out.println(res30);    // >>> ["obj","books"]

        Object res31 = jedis.jsonGet("doc", new Path2("$.books~"));
        System.out.println(res31);    // >>> []
        // STEP_END
        // REMOVE_START
        assertEquals("[\"x\",\"y\"]", res29.toString());
        assertEquals("[\"obj\",\"books\"]", res30.toString());
        assertEquals("[]", res31.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_length
        String res32 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[[1,2,3],[1],\"abcd\",\"x\"]}");
        System.out.println(res32);    // >>> OK

        Object res33 = jedis.jsonGet("doc", new Path2("$.a[?length(@) > 2]"));
        System.out.println(res33);    // >>> [[1,2,3],"abcd"]
        // STEP_END
        // REMOVE_START
        assertEquals("[[1,2,3],\"abcd\"]", res33.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_count
        String res34 = jedis.jsonSet("doc", new Path2("$"), "[{\"a\":1,\"b\":2,\"c\":3},{\"a\":1}]");
        System.out.println(res34);    // >>> OK

        Object res35 = jedis.jsonGet("doc", new Path2("$[?count(@.*) == 3]"));
        System.out.println(res35);    // >>> [{"a":1,"b":2,"c":3}]
        // STEP_END
        // REMOVE_START
        assertEquals("[{\"a\":1,\"b\":2,\"c\":3}]", res35.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_value
        String res36 = jedis.jsonSet("doc", new Path2("$"), "[{\"a\":1},{\"a\":2}]");
        System.out.println(res36);    // >>> OK

        Object res37 = jedis.jsonGet("doc", new Path2("$[?value(@.a) == 1]"));
        System.out.println(res37);    // >>> [{"a":1}]
        // STEP_END
        // REMOVE_START
        assertEquals("[{\"a\":1}]", res37.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_keys
        String res38 = jedis.jsonSet("doc", new Path2("$"), "{\"obj\":{\"x\":1,\"y\":2}}");
        System.out.println(res38);    // >>> OK

        Object res39 = jedis.jsonGet("doc", new Path2("$.obj.keys()"));
        System.out.println(res39);    // >>> ["x","y"]

        Object res40 = jedis.jsonGet("doc", new Path2("$.obj.keys().count()"));
        System.out.println(res40);    // >>> [2]
        // STEP_END
        // REMOVE_START
        assertEquals("[\"x\",\"y\"]", res39.toString());
        assertEquals("[2]", res40.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_match_search
        String res41 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[\"abc\",\"xabc\",\"a\",\"b\"]}");
        System.out.println(res41);    // >>> OK

        Object res42 = jedis.jsonGet("doc", new Path2("$.a[?match(@, \"a.*\")]"));
        System.out.println(res42);    // >>> ["abc","a"]

        String res43 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[\"abc\",\"xyz\",\"b\"]}");
        System.out.println(res43);    // >>> OK

        Object res44 = jedis.jsonGet("doc", new Path2("$.a[?search(@, \"b\")]"));
        System.out.println(res44);    // >>> ["abc","b"]
        // STEP_END
        // REMOVE_START
        assertEquals("[\"abc\",\"a\"]", res42.toString());
        assertEquals("[\"abc\",\"b\"]", res44.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_concat
        String res45 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[{\"x\":\"a\",\"y\":\"b\"},{\"x\":\"a\",\"y\":\"c\"}]}");
        System.out.println(res45);    // >>> OK

        Object res46 = jedis.jsonGet("doc", new Path2("$.a[?concat(@.x, @.y) == \"ab\"]"));
        System.out.println(res46);    // >>> [{"x":"a","y":"b"}]
        // STEP_END
        // REMOVE_START
        assertEquals("[{\"x\":\"a\",\"y\":\"b\"}]", res46.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_math
        String res47 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[2.1,3.9,1.0]}");
        System.out.println(res47);    // >>> OK

        Object res48 = jedis.jsonGet("doc", new Path2("$.a[?ceiling(@) == 3]"));
        System.out.println(res48);    // >>> [2.1]

        String res49 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[2.1,2.9,3.5]}");
        System.out.println(res49);    // >>> OK

        Object res50 = jedis.jsonGet("doc", new Path2("$.a[?floor(@) == 2]"));
        System.out.println(res50);    // >>> [2.1,2.9]

        String res51 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[{\"n\":-5},{\"n\":5},{\"n\":-3}]}");
        System.out.println(res51);    // >>> OK

        Object res52 = jedis.jsonGet("doc", new Path2("$.a[?abs(@.n) == 5]"));
        System.out.println(res52);    // >>> [{"n":-5},{"n":5}]
        // STEP_END
        // REMOVE_START
        assertEquals("[2.1]", res48.toString());
        assertEquals("[2.1,2.9]", res50.toString());
        assertEquals("[{\"n\":-5},{\"n\":5}]", res52.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_array_access
        String res53 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[{\"n\":[1,2]},{\"n\":[9,8]}]}");
        System.out.println(res53);    // >>> OK

        Object res54 = jedis.jsonGet("doc", new Path2("$.a[?first(@.n) == 1]"));
        System.out.println(res54);    // >>> [{"n":[1,2]}]

        Object res55 = jedis.jsonGet("doc", new Path2("$.a[?last(@.n) == 8]"));
        System.out.println(res55);    // >>> [{"n":[9,8]}]

        Object res56 = jedis.jsonGet("doc", new Path2("$.a[?index(@.n, -1) == 2]"));
        System.out.println(res56);    // >>> [{"n":[1,2]}]
        // STEP_END
        // REMOVE_START
        assertEquals("[{\"n\":[1,2]}]", res54.toString());
        assertEquals("[{\"n\":[9,8]}]", res55.toString());
        assertEquals("[{\"n\":[1,2]}]", res56.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_aggregate
        String res57 = jedis.jsonSet("doc", new Path2("$"), "{\"a\":[{\"n\":[3,1,2]},{\"n\":[5,6]}]}");
        System.out.println(res57);    // >>> OK

        Object res58 = jedis.jsonGet("doc", new Path2("$.a[?sum(@.n) == 6]"));
        System.out.println(res58);    // >>> [{"n":[3,1,2]}]

        Object res59 = jedis.jsonGet("doc", new Path2("$.a[?avg(@.n) == 2]"));
        System.out.println(res59);    // >>> [{"n":[3,1,2]}]
        // STEP_END
        // REMOVE_START
        assertEquals("[{\"n\":[3,1,2]}]", res58.toString());
        assertEquals("[{\"n\":[3,1,2]}]", res59.toString());
        jedis.del("doc");
        // REMOVE_END

        // STEP_START func_append
        String res60 = jedis.jsonSet("doc", new Path2("$"), "{\"arr\":[1,2,3]}");
        System.out.println(res60);    // >>> OK

        Object res61 = jedis.jsonGet("doc", new Path2("$.arr.append(9)"));
        System.out.println(res61);    // >>> [1,2,3,9]

        String res62 = jedis.jsonSet("doc", new Path2("$"), "{\"books\":[{\"t\":\"a\",\"price\":30},{\"t\":\"b\",\"price\":5}]}");
        System.out.println(res62);    // >>> OK

        Object res63 = jedis.jsonGet("doc", new Path2("$.books[?(@.price >= 10)].append({\"t\":\"X\"})"));
        System.out.println(res63);    // >>> [{"t":"a","price":30},{"t":"X"}]
        // STEP_END
        // REMOVE_START
        assertEquals("[1,2,3,9]", res61.toString());
        assertEquals("[{\"t\":\"a\",\"price\":30},{\"t\":\"X\"}]", res63.toString());
        jedis.del("doc");
        // REMOVE_END


// HIDE_START
        jedis.close();
    }
}
// HIDE_END
