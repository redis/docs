// EXAMPLE: cmds_generic
// HIDE_START
import redis.clients.jedis.UnifiedJedis;
import redis.clients.jedis.args.ExpiryOption;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class CmdsGenericExample {

    public void run() {
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");
// HIDE_END

        // STEP_START del
        String delResult1 = jedis.set("key1", "Hello");
        System.out.println(delResult1); // >>> OK

        String delResult2 = jedis.set("key2", "World");
        System.out.println(delResult2); // >>> OK

        long delResult3 = jedis.del("key1", "key2", "key3");
        System.out.println(delResult3); // >>> 2

        // Tests for 'del' step.
        // STEP_END

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

        // Tests for 'exists' step.
        // STEP_END

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

        // Tests for 'expire' step.
        // STEP_END

        // STEP_START ttl
        String ttlResult1 = jedis.set("mykey", "Hello");
        System.out.println(ttlResult1); // >>> OK

        long ttlResult2 = jedis.expire("mykey", 10);
        System.out.println(ttlResult2); // >>> 1

        long ttlResult3 = jedis.ttl("mykey");
        System.out.println(ttlResult3); // >>> 10

        // Tests for 'ttl' step.
        // STEP_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END
