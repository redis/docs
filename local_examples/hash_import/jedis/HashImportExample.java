// EXAMPLE: hash_import
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;

import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
// REMOVE_END

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import redis.clients.jedis.HashImport;
import redis.clients.jedis.Pipeline;
import redis.clients.jedis.Response;

// HIDE_START
import redis.clients.jedis.RedisClient;
// HIDE_END

// HIDE_START
public class HashImportExample {

    @Test
    public void run() {
        RedisClient jedis = RedisClient.create("redis://localhost:6379");

        // REMOVE_START
        String[] userKeys = IntStream.rangeClosed(1, 1000)
                .mapToObj(i -> "user:" + i).toArray(String[]::new);
        jedis.del(userKeys);
        // REMOVE_END
// HIDE_END

        // STEP_START himport_basic
        // Declare the field names once.
        try (HashImport fields = HashImport.of("name", "email", "age")) {
            // Create each hash by sending only its values.
            String res1 = jedis.himportSet("user:1", fields, "Alice", "alice@example.com", "34");
            System.out.println(res1); // >>> OK
            // REMOVE_START
            assertEquals("OK", res1);
            // REMOVE_END

            jedis.himportSet("user:2", fields, "Bob", "bob@example.com", "41");
            jedis.himportSet("user:3", fields, "Carol", "carol@example.com", "29");
        }

        // The result is an ordinary hash.
        Map<String, String> res2 = jedis.hgetAll("user:2");
        System.out.println(res2);
        // >>> {name=Bob, age=41, email=bob@example.com}
        // STEP_END
        // REMOVE_START
        assertEquals(Map.of("name", "Bob", "email", "bob@example.com", "age", "41"), res2);
        // REMOVE_END

        // STEP_START himport_pipeline
        List<Response<String>> res3 = new ArrayList<>();

        // Queue many imports and send them in one round trip.
        try (HashImport fields = HashImport.of("name", "email", "age");
                Pipeline pipeline = jedis.pipelined()) {
            for (int i = 1; i <= 1000; i++) {
                res3.add(pipeline.himportSet("user:" + i, fields,
                        "user" + i, "user" + i + "@example.com", String.valueOf(20 + i % 50)));
            }
            pipeline.sync();
        }

        boolean allOk = res3.stream().allMatch(r -> "OK".equals(r.get()));
        System.out.println(res3.size() + " " + allOk); // >>> 1000 true

        String res4 = jedis.hget("user:1000", "email");
        System.out.println(res4); // >>> user1000@example.com
        // STEP_END
        // REMOVE_START
        assertEquals(1000, res3.size());
        assertTrue(allOk);
        assertEquals("user1000@example.com", res4);
        jedis.del(userKeys);
        // REMOVE_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END
