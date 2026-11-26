// EXAMPLE: cmds_set_expiration
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
// REMOVE_END

import java.util.List;
import java.util.Set;

// HIDE_START
import redis.clients.jedis.RedisClient;
import redis.clients.jedis.args.ExpiryOption;
import redis.clients.jedis.params.SAddExParams;
// HIDE_END

// HIDE_START
public class CmdsSetExpirationExample {

    @Test
    public void run() {
        RedisClient jedis = RedisClient.create("redis://localhost:6379");
// HIDE_END

        // STEP_START saddex
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long saddexResult1 = jedis.saddex("myset", SAddExParams.sAddExParams().ex(300), "member1", "member2");
        System.out.println(saddexResult1);    // >>> 1

        List<Long> saddexResult2 = jedis.sttl("myset", "member1", "member2");
        System.out.println(saddexResult2);    // >>> [300, 300]

        long saddexResult3 = jedis.saddex("myset", SAddExParams.sAddExParams().ex(60).mnx(), "member2", "member3");
        System.out.println(saddexResult3);    // >>> 0

        long saddexResult4 = jedis.saddex("myset", SAddExParams.sAddExParams().keepTtl(), "member1", "member3");
        System.out.println(saddexResult4);    // >>> 1

        List<Long> saddexResult5 = jedis.sttl("myset", "member1", "member2", "member3");
        System.out.println(saddexResult5);    // >>> [300, 300, -1]
        // STEP_END
        // REMOVE_START
        assertEquals(1, saddexResult1);
        assertEquals(List.of(300L, 300L), saddexResult2);
        assertEquals(0, saddexResult3);
        assertEquals(1, saddexResult4);
        assertEquals(List.of(300L, 300L, -1L), saddexResult5);
        jedis.del("myset");
        // REMOVE_END

        // STEP_START sexpire
        // REMOVE_START
        jedis.del("myset", "no-key");
        // REMOVE_END
        List<Long> sexpireResult1 = jedis.sexpire("no-key", 20, ExpiryOption.NX, "member1", "member2");
        System.out.println(sexpireResult1);    // >>> [-2, -2]

        long sexpireResult2 = jedis.sadd("myset", "member1", "member2");
        System.out.println(sexpireResult2);    // >>> 2

        List<Long> sexpireResult3 = jedis.sexpire("myset", 10, "member1", "member2", "member3");
        System.out.println(sexpireResult3);    // >>> [1, 1, -2]

        long sexpireResult4 = jedis.sexpire("myset", 20, ExpiryOption.NX, "member1");
        System.out.println(sexpireResult4);    // >>> 0

        long sexpireResult5 = jedis.sexpire("myset", 20, ExpiryOption.GT, "member1");
        System.out.println(sexpireResult5);    // >>> 1

        List<Long> sexpireResult6 = jedis.sttl("myset", "member1", "member2");
        System.out.println(sexpireResult6);    // >>> [20, 10]
        // STEP_END
        // REMOVE_START
        assertEquals(List.of(-2L, -2L), sexpireResult1);
        assertEquals(2, sexpireResult2);
        assertEquals(List.of(1L, 1L, -2L), sexpireResult3);
        assertEquals(0, sexpireResult4);
        assertEquals(1, sexpireResult5);
        assertEquals(List.of(20L, 10L), sexpireResult6);
        jedis.del("myset");
        // REMOVE_END

        // STEP_START spexpire
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long spexpireResult1 = jedis.sadd("myset", "member1", "member2");
        System.out.println(spexpireResult1);    // >>> 2

        List<Long> spexpireResult2 = jedis.spexpire("myset", 2000, "member1", "member2");
        System.out.println(spexpireResult2);    // >>> [1, 1]

        long spexpireResult3 = jedis.spexpire("myset", 500, ExpiryOption.LT, "member1");
        System.out.println(spexpireResult3);    // >>> 1

        List<Long> spexpireResult4 = jedis.spttl("myset", "member1", "member2");
        System.out.println(spexpireResult4);    // >>> [491, 1982] (for example)
        // STEP_END
        // REMOVE_START
        assertEquals(2, spexpireResult1);
        assertEquals(List.of(1L, 1L), spexpireResult2);
        assertEquals(1, spexpireResult3);
        assertTrue(spexpireResult4.get(0) > 0 && spexpireResult4.get(0) <= 500);
        assertTrue(spexpireResult4.get(1) > 500 && spexpireResult4.get(1) <= 2000);
        jedis.del("myset");
        // REMOVE_END

        // STEP_START sexpireat
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long sexpireatResult1 = jedis.sadd("myset", "member1", "member2");
        System.out.println(sexpireatResult1);    // >>> 2

        long sexpireatResult2 = jedis.sexpireAt("myset", 4102444800L, "member1");
        System.out.println(sexpireatResult2);    // >>> 1

        List<Long> sexpireatResult3 = jedis.sexpireTime("myset", "member1", "member2");
        System.out.println(sexpireatResult3);    // >>> [4102444800, -1]

        // A timestamp in the past deletes the member immediately.
        long sexpireatResult4 = jedis.sexpireAt("myset", 1L, "member2");
        System.out.println(sexpireatResult4);    // >>> 2

        Set<String> sexpireatResult5 = jedis.smembers("myset");
        System.out.println(sexpireatResult5);    // >>> [member1]
        // STEP_END
        // REMOVE_START
        assertEquals(2, sexpireatResult1);
        assertEquals(1, sexpireatResult2);
        assertEquals(List.of(4102444800L, -1L), sexpireatResult3);
        assertEquals(2, sexpireatResult4);
        assertEquals(Set.of("member1"), sexpireatResult5);
        jedis.del("myset");
        // REMOVE_END

        // STEP_START spexpireat
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long spexpireatResult1 = jedis.sadd("myset", "member1", "member2");
        System.out.println(spexpireatResult1);    // >>> 2

        long spexpireatResult2 = jedis.spexpireAt("myset", 4102444800000L, "member1");
        System.out.println(spexpireatResult2);    // >>> 1

        long spexpireatResult3 = jedis.spexpireAt("myset", 4102444800000L, ExpiryOption.XX, "member2");
        System.out.println(spexpireatResult3);    // >>> 0

        List<Long> spexpireatResult4 = jedis.spexpireTime("myset", "member1", "member2");
        System.out.println(spexpireatResult4);    // >>> [4102444800000, -1]
        // STEP_END
        // REMOVE_START
        assertEquals(2, spexpireatResult1);
        assertEquals(1, spexpireatResult2);
        assertEquals(0, spexpireatResult3);
        assertEquals(List.of(4102444800000L, -1L), spexpireatResult4);
        jedis.del("myset");
        // REMOVE_END

        // STEP_START sexpiretime
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long sexpiretimeResult1 = jedis.sadd("myset", "member1", "member2");
        System.out.println(sexpiretimeResult1);    // >>> 2

        long sexpiretimeResult2 = jedis.sexpire("myset", 300, "member1");
        System.out.println(sexpiretimeResult2);    // >>> 1

        List<Long> sexpiretimeResult3 = jedis.sexpireTime("myset", "member1", "member2", "member3");
        System.out.println(sexpiretimeResult3);    // >>> [1792684428, -1, -2] (for example)
        // STEP_END
        // REMOVE_START
        assertEquals(2, sexpiretimeResult1);
        assertEquals(1, sexpiretimeResult2);
        assertTrue(Math.abs(sexpiretimeResult3.get(0) - (System.currentTimeMillis() / 1000 + 300)) < 5);
        assertEquals(List.of(-1L, -2L), sexpiretimeResult3.subList(1, 3));
        jedis.del("myset");
        // REMOVE_END

        // STEP_START spexpiretime
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long spexpiretimeResult1 = jedis.sadd("myset", "member1", "member2");
        System.out.println(spexpiretimeResult1);    // >>> 2

        long spexpiretimeResult2 = jedis.spexpire("myset", 300000, "member1");
        System.out.println(spexpiretimeResult2);    // >>> 1

        List<Long> spexpiretimeResult3 = jedis.spexpireTime("myset", "member1", "member2", "member3");
        System.out.println(spexpiretimeResult3);    // >>> [1792684427589, -1, -2] (for example)
        // STEP_END
        // REMOVE_START
        assertEquals(2, spexpiretimeResult1);
        assertEquals(1, spexpiretimeResult2);
        assertTrue(Math.abs(spexpiretimeResult3.get(0) - (System.currentTimeMillis() + 300000)) < 5000);
        assertEquals(List.of(-1L, -2L), spexpiretimeResult3.subList(1, 3));
        jedis.del("myset");
        // REMOVE_END

        // STEP_START sttl
        // REMOVE_START
        jedis.del("myset", "no-key");
        // REMOVE_END
        List<Long> sttlResult1 = jedis.sttl("no-key", "member1", "member2");
        System.out.println(sttlResult1);    // >>> [-2, -2]

        long sttlResult2 = jedis.sadd("myset", "member1", "member2");
        System.out.println(sttlResult2);    // >>> 2

        List<Long> sttlResult3 = jedis.sexpire("myset", 300, "member1", "member3");
        System.out.println(sttlResult3);    // >>> [1, -2]

        List<Long> sttlResult4 = jedis.sttl("myset", "member1", "member2", "member3");
        System.out.println(sttlResult4);    // >>> [300, -1, -2]
        // STEP_END
        // REMOVE_START
        assertEquals(List.of(-2L, -2L), sttlResult1);
        assertEquals(2, sttlResult2);
        assertEquals(List.of(1L, -2L), sttlResult3);
        assertEquals(List.of(300L, -1L, -2L), sttlResult4);
        jedis.del("myset");
        // REMOVE_END

        // STEP_START spttl
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long spttlResult1 = jedis.sadd("myset", "member1", "member2");
        System.out.println(spttlResult1);    // >>> 2

        long spttlResult2 = jedis.spexpire("myset", 300000, "member1");
        System.out.println(spttlResult2);    // >>> 1

        List<Long> spttlResult3 = jedis.spttl("myset", "member1", "member2", "member3");
        System.out.println(spttlResult3);    // >>> [299993, -1, -2] (for example)
        // STEP_END
        // REMOVE_START
        assertEquals(2, spttlResult1);
        assertEquals(1, spttlResult2);
        assertTrue(spttlResult3.get(0) > 295000 && spttlResult3.get(0) <= 300000);
        assertEquals(List.of(-1L, -2L), spttlResult3.subList(1, 3));
        jedis.del("myset");
        // REMOVE_END

        // STEP_START spersist
        // REMOVE_START
        jedis.del("myset");
        // REMOVE_END
        long spersistResult1 = jedis.sadd("myset", "member1", "member2");
        System.out.println(spersistResult1);    // >>> 2

        List<Long> spersistResult2 = jedis.sexpire("myset", 300, "member1", "member2");
        System.out.println(spersistResult2);    // >>> [1, 1]

        long spersistResult3 = jedis.spersist("myset", "member2");
        System.out.println(spersistResult3);    // >>> 1

        List<Long> spersistResult4 = jedis.sttl("myset", "member1", "member2");
        System.out.println(spersistResult4);    // >>> [300, -1]

        List<Long> spersistResult5 = jedis.spersist("myset", "member2", "member3");
        System.out.println(spersistResult5);    // >>> [-1, -2]
        // STEP_END
        // REMOVE_START
        assertEquals(2, spersistResult1);
        assertEquals(List.of(1L, 1L), spersistResult2);
        assertEquals(1, spersistResult3);
        assertEquals(List.of(300L, -1L), spersistResult4);
        assertEquals(List.of(-1L, -2L), spersistResult5);
        jedis.del("myset");
        // REMOVE_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END
