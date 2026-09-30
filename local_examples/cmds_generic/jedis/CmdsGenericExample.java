// EXAMPLE: cmds_generic
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;
// REMOVE_END

// HIDE_START
import redis.clients.jedis.RedisClient;
import redis.clients.jedis.args.ExpiryOption;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
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

        // STEP_START scan1
        long scan1Result1 = jedis.sadd("myset", "1", "2", "3", "foo", "foobar", "feelsgood");
        System.out.println(scan1Result1); // >>> 6

        ScanResult<String> scan1Result2 = jedis.sscan(
                "myset", "0", new ScanParams().match("f*")
        );
        ArrayList<String> scan1Members = new ArrayList<>(scan1Result2.getResult());
        Collections.sort(scan1Members);
        System.out.println(scan1Members); // >>> [feelsgood, foo, foobar]
        // STEP_END

        // REMOVE_START
        assertEquals(6, scan1Result1);
        assertEquals(3, scan1Members.size());
        jedis.del("myset");
        // REMOVE_END

        // STEP_START scan2
        // REMOVE_START
        for (int i = 1; i <= 1000; i++) {
            jedis.set("key:" + i, String.valueOf(i));
        }
        // REMOVE_END

        // MATCH is applied after elements are fetched, so with the default COUNT most
        // iterations return few keys or none at all.
        String scan2Cursor = "0";
        ScanResult<String> scan2Result;
        int scan2Total = 0;

        for (int i = 0; i < 4; i++) {
            scan2Result = jedis.scan(scan2Cursor, new ScanParams().match("*11*"));
            scan2Cursor = scan2Result.getCursor();
            scan2Total += scan2Result.getResult().size();
            System.out.println(scan2Result.getResult().size());
        }

        // A larger COUNT forces more scanning in a single iteration, so the remaining
        // matches arrive together. This continues from the cursor reached above.
        scan2Result = jedis.scan(scan2Cursor, new ScanParams().match("*11*").count(1000));
        scan2Total += scan2Result.getResult().size();
        System.out.println(scan2Result.getResult().size());

        // The per-call split isn't guaranteed, but the cumulative total is.
        System.out.println(scan2Total); // >>> 19
        // STEP_END

        // REMOVE_START
        assertEquals(19, scan2Total);
        jedis.flushDB();
        // REMOVE_END

        // STEP_START scan3
        long scan3Result1 = jedis.geoadd("geokey", 0, 0, "value");
        System.out.println(scan3Result1); // >>> 1

        long scan3Result2 = jedis.zadd("zkey", 1000, "value");
        System.out.println(scan3Result2); // >>> 1

        System.out.println(jedis.type("geokey")); // >>> zset
        System.out.println(jedis.type("zkey")); // >>> zset

        // A single call isn't guaranteed to find every match, so loop until the cursor
        // returns to "0", accumulating matches from every call.
        String scan3Cursor = "0";
        ArrayList<String> scan3Keys = new ArrayList<>();
        do {
            ScanResult<String> scan3Result3 = jedis.scan(scan3Cursor, new ScanParams(), "zset");
            scan3Cursor = scan3Result3.getCursor();
            scan3Keys.addAll(scan3Result3.getResult());
        } while (!scan3Cursor.equals("0"));
        Collections.sort(scan3Keys);
        System.out.println(scan3Keys); // >>> [geokey, zkey]
        // STEP_END

        // REMOVE_START
        assertEquals(2, scan3Keys.size());
        jedis.del("geokey", "zkey");
        // REMOVE_END

        // STEP_START scan4
        long scan4Result1 = jedis.hset("myhash", Map.of("a", "1", "b", "2"));
        System.out.println(scan4Result1); // >>> 2

        ScanResult<Map.Entry<String, String>> scan4Result2 = jedis.hscan(
                "myhash", "0", new ScanParams()
        );
        ArrayList<String> scan4Pairs = new ArrayList<>();
        for (Map.Entry<String, String> entry : scan4Result2.getResult()) {
            scan4Pairs.add(entry.getKey() + "=" + entry.getValue());
        }
        Collections.sort(scan4Pairs);
        System.out.println(scan4Pairs); // >>> [a=1, b=2]

        ScanResult<String> scan4Result3 = jedis.hscanNoValues(
                "myhash", "0", new ScanParams()
        );
        ArrayList<String> scan4Fields = new ArrayList<>(scan4Result3.getResult());
        Collections.sort(scan4Fields);
        System.out.println(scan4Fields); // >>> [a, b]
        // STEP_END

        // REMOVE_START
        assertEquals(2, scan4Result1);
        assertEquals(2, scan4Pairs.size());
        assertEquals(2, scan4Fields.size());
        jedis.del("myhash");
        // REMOVE_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END
