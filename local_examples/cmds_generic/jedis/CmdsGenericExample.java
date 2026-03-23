// EXAMPLE: cmds_generic
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;
// REMOVE_END

// HIDE_START
import redis.clients.jedis.RedisClient;
import redis.clients.jedis.args.ExpiryOption;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
// HIDE_END

// HIDE_START
public class CmdsGenericExample {

    @Test
    public void run() {
        RedisClient jedis = RedisClient.create("redis://localhost:6379");

        //REMOVE_START
        // Clear any keys here before using them in tests.
        //REMOVE_END
// HIDE_END

        // STEP_START del
        String delResult1 = jedis.set("key1", "Hello");
        System.out.println(delResult1); // >>> OK

        String delResult2 = jedis.set("key2", "World");
        System.out.println(delResult2); // >>> OK

        long delResult3 = jedis.del("key1", "key2", "key3");
        System.out.println(delResult3); // >>> 2
        // STEP_END

        // Tests for 'del' step.
        // REMOVE_START
        assertEquals("OK", delResult1);
        assertEquals("OK", delResult2);
        assertEquals(2, delResult3);
        // REMOVE_END


        // STEP_START exists
        String existsResult1 = jedis.set("key1", "Hello");
        System.out.println(existsResult1); // >>> OK

        boolean existsResult2 = jedis.exists("key1");
        System.out.println(existsResult2); // >>> true

        boolean existsResult3 = jedis.exists("nosuchkey");
        System.out.println(existsResult3); // >>> false

        String existsResult4 = jedis.set("key2", "World");
        System.out.println(existsResult4); // >>> OK

        long existsResult5 = jedis.exists("key1", "key2", "nosuchkey");
        System.out.println(existsResult5); // >>> 2
        // STEP_END

        // Tests for 'exists' step.
        // REMOVE_START
        assertEquals("OK", existsResult1);
        assertEquals(true, existsResult2);
        assertEquals(false, existsResult3);
        assertEquals("OK", existsResult4);
        assertEquals(2, existsResult5);
        jedis.del("key1", "key2");
        // REMOVE_END


        // STEP_START expire
        String expireResult1 = jedis.set("mykey", "Hello");
        System.out.println(expireResult1);  // >>> OK

        long expireResult2 = jedis.expire("mykey", 10);
        System.out.println(expireResult2);  // >>> 1

        long expireResult3 = jedis.ttl("mykey");
        System.out.println(expireResult3);  // >>> 10

        String expireResult4 = jedis.set("mykey", "Hello World");
        System.out.println(expireResult4);  // >>> OK

        long expireResult5 = jedis.ttl("mykey");
        System.out.println(expireResult5);  // >>> -1

        long expireResult6 = jedis.expire("mykey", 10, ExpiryOption.XX);
        System.out.println(expireResult6);  // >>> 0

        long expireResult7 = jedis.ttl("mykey");
        System.out.println(expireResult7);  // >>> -1

        long expireResult8 = jedis.expire("mykey", 10, ExpiryOption.NX);
        System.out.println(expireResult8);  // >>> 1

        long expireResult9 = jedis.ttl("mykey");
        System.out.println(expireResult9);  // >>> 10
        // STEP_END

        // Tests for 'expire' step.
        // REMOVE_START
        assertEquals("OK", expireResult1);
        assertEquals(1, expireResult2);
        assertEquals(10, expireResult3);
        assertEquals("OK", expireResult4);
        assertEquals(-1, expireResult5);
        assertEquals(0, expireResult6);
        assertEquals(-1, expireResult7);
        assertEquals(1, expireResult8);
        assertEquals(10, expireResult9);
        jedis.del("mykey");
        // REMOVE_END


        // STEP_START ttl
        String ttlResult1 = jedis.set("mykey", "Hello");
        System.out.println(ttlResult1); // >>> OK

        long ttlResult2 = jedis.expire("mykey", 10);
        System.out.println(ttlResult2); // >>> 1

        long ttlResult3 = jedis.ttl("mykey");
        System.out.println(ttlResult3); // >>> 10
        // STEP_END

        // Tests for 'ttl' step.
        // REMOVE_START
        assertEquals("OK", ttlResult1);
        assertEquals(1, ttlResult2);
        assertEquals(10, ttlResult3);
        jedis.del("mykey");
        // REMOVE_END


        // STEP_START keys
        String keysResult1 = jedis.mset("firstname", "Jack", "lastname", "Stuntman", "age", "35");
        System.out.println(keysResult1); // >>> OK

        Set<String> keysResult2 = jedis.keys("*name*");
        ArrayList<String> keysResult2List = new ArrayList<>(keysResult2);
        Collections.sort(keysResult2List);
        System.out.println(keysResult2List); // >>> [firstname, lastname]

        Set<String> keysResult3 = jedis.keys("a??");
        System.out.println(keysResult3); // >>> [age]

        Set<String> keysResult4 = jedis.keys("*");
        ArrayList<String> keysResult4List = new ArrayList<>(keysResult4);
        Collections.sort(keysResult4List);
        System.out.println(keysResult4List); // >>> [age, firstname, lastname]
        // STEP_END

        // Tests for 'keys' step.
        // REMOVE_START
        assertEquals("OK", keysResult1);
        assertEquals(2, keysResult2.size());
        assertEquals(1, keysResult3.size());
        assertEquals(3, keysResult4.size());
        jedis.del("firstname", "lastname", "age");
        // REMOVE_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END
