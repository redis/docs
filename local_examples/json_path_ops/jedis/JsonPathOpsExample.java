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


// HIDE_START
        jedis.close();
    }
}
// HIDE_END
