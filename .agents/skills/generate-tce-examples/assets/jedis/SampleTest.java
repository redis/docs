// =============================================================================
// CANONICAL JEDIS TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for Jedis
// documentation test files. These tests serve dual purposes:
// 1. Executable tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// RUN: mvn test -Dtest=SampleTest
// =============================================================================

// EXAMPLE: sample_example
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;
// REMOVE_END

import java.util.HashMap;
import java.util.Map;

// HIDE_START
import redis.clients.jedis.RedisClient;
// HIDE_END

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

// HIDE_START
public class SampleTest {

    @Test
    public void run() {
        RedisClient jedis = RedisClient.create("redis://localhost:6379");

        // REMOVE_START
        // Clean up any existing data before tests
        jedis.del("mykey", "myhash", "bike:1", "bike:1:stats");
        // REMOVE_END
// HIDE_END

        // STEP_START string_ops
        // Basic string SET/GET operations
        String res1 = jedis.set("mykey", "Hello");
        System.out.println(res1);    // >>> OK

        String res2 = jedis.get("mykey");
        System.out.println(res2);    // >>> Hello
        // STEP_END
        // REMOVE_START
        assertEquals("OK", res1);
        assertEquals("Hello", res2);
        jedis.del("mykey");
        // REMOVE_END

        // STEP_START hash_ops
        // Hash operations: HSET, HGET, HGETALL
        Map<String, String> hashFields = new HashMap<>();
        hashFields.put("field1", "value1");

        long res3 = jedis.hset("myhash", hashFields);
        System.out.println(res3);    // >>> 1

        hashFields.clear();
        hashFields.put("field2", "value2");
        hashFields.put("field3", "value3");

        long res4 = jedis.hset("myhash", hashFields);
        System.out.println(res4);    // >>> 2

        String res5 = jedis.hget("myhash", "field1");
        System.out.println(res5);    // >>> value1

        Map<String, String> res6 = jedis.hgetAll("myhash");
        System.out.println(res6.get("field1"));    // >>> value1
        // STEP_END
        // REMOVE_START
        assertEquals(1, res3);
        assertEquals(2, res4);
        assertEquals("value1", res5);
        assertEquals("value1", res6.get("field1"));
        jedis.del("myhash");
        // REMOVE_END

        // STEP_START hash_tutorial
        // Tutorial-style example with bike data
        Map<String, String> bike1 = new HashMap<>();
        bike1.put("model", "Deimos");
        bike1.put("brand", "Ergonom");
        bike1.put("type", "Enduro bikes");
        bike1.put("price", "4972");

        long res7 = jedis.hset("bike:1", bike1);
        System.out.println(res7);    // >>> 4

        String res8 = jedis.hget("bike:1", "model");
        System.out.println(res8);    // >>> Deimos

        String res9 = jedis.hget("bike:1", "price");
        System.out.println(res9);    // >>> 4972

        Map<String, String> res10 = jedis.hgetAll("bike:1");
        System.out.println(res10.get("model"));    // >>> Deimos
        // STEP_END
        // REMOVE_START
        assertEquals(4, res7);
        assertEquals("Deimos", res8);
        assertEquals("4972", res9);
        assertEquals("Deimos", res10.get("model"));
        jedis.del("bike:1");
        // REMOVE_END

        // STEP_START hincrby
        // Numeric operations on hash fields
        jedis.hset("bike:1:stats", "rides", "0");

        long res11 = jedis.hincrBy("bike:1:stats", "rides", 1);
        System.out.println(res11);    // >>> 1

        long res12 = jedis.hincrBy("bike:1:stats", "rides", 1);
        System.out.println(res12);    // >>> 2

        long res13 = jedis.hincrBy("bike:1:stats", "crashes", 1);
        System.out.println(res13);    // >>> 1
        // STEP_END
        // REMOVE_START
        assertEquals(1, res11);
        assertEquals(2, res12);
        assertEquals(1, res13);
        jedis.del("bike:1:stats");
        // REMOVE_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END

