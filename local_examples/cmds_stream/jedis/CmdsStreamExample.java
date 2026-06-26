// EXAMPLE: cmds_stream
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;
// REMOVE_END

import java.util.HashMap;
import java.util.List;
import java.util.Map;

// HIDE_START
import redis.clients.jedis.JedisPooled;
import redis.clients.jedis.StreamEntryID;
import redis.clients.jedis.params.XAddParams;
import redis.clients.jedis.params.XCfgSetParams;
import redis.clients.jedis.resps.StreamEntry;
// HIDE_END

import static org.junit.jupiter.api.Assertions.*;

// HIDE_START
public class CmdsStreamExample {

    @Test
    public void run() {
        JedisPooled jedis = new JedisPooled("localhost", 6379);

        // REMOVE_START
        jedis.del("mystream");
        // REMOVE_END
// HIDE_END

        // STEP_START xadd1
        Map<String, String> entry1 = new HashMap<>();
        entry1.put("name", "Sara");
        entry1.put("surname", "OConnor");
        StreamEntryID res1 = jedis.xadd("mystream", entry1, XAddParams.xAddParams());
        System.out.println(res1); // >>> 1726055713866-0

        Map<String, String> entry2 = new HashMap<>();
        entry2.put("field1", "value1");
        entry2.put("field2", "value2");
        entry2.put("field3", "value3");
        StreamEntryID res2 = jedis.xadd("mystream", entry2, XAddParams.xAddParams());
        System.out.println(res2); // >>> 1726055713866-1

        long res3 = jedis.xlen("mystream");
        System.out.println(res3); // >>> 2

        List<StreamEntry> res4 = jedis.xrange("mystream", "-", "+");
        for (StreamEntry entry : res4) {
            System.out.println(entry.getID() + " -> " + entry.getFields());
        }
        // >>> 1726055713866-0 -> {name=Sara, surname=OConnor}
        // >>> 1726055713866-1 -> {field1=value1, field2=value2, field3=value3}
        // STEP_END
        // REMOVE_START
        assertEquals(2, res3);
        assertEquals(2, res4.size());
        jedis.del("mystream");
        // REMOVE_END

        // STEP_START xadd2
        Map<String, String> idmpEntry1 = new HashMap<>();
        idmpEntry1.put("field", "value");
        StreamEntryID res5 = jedis.xadd("mystream", idmpEntry1, 
            XAddParams.xAddParams().idmp("producer1", "msg1"));
        System.out.println(res5); // >>> 1726055713867-0

        // Attempting to add the same message again with IDMP returns the original entry ID
        Map<String, String> idmpEntry2 = new HashMap<>();
        idmpEntry2.put("field", "different_value");
        StreamEntryID res6 = jedis.xadd("mystream", idmpEntry2,
            XAddParams.xAddParams().idmp("producer1", "msg1"));
        System.out.println(res6); // >>> 1726055713867-0 (same ID as res5, message was deduplicated)

        Map<String, String> idmpAutoEntry1 = new HashMap<>();
        idmpAutoEntry1.put("field", "value");
        StreamEntryID res7 = jedis.xadd("mystream", idmpAutoEntry1,
            XAddParams.xAddParams().idmpAuto("producer2"));
        System.out.println(res7); // >>> 1726055713867-1

        // Auto-generated idempotent ID prevents duplicates for same producer+content
        Map<String, String> idmpAutoEntry2 = new HashMap<>();
        idmpAutoEntry2.put("field", "value");
        StreamEntryID res8 = jedis.xadd("mystream", idmpAutoEntry2,
            XAddParams.xAddParams().idmpAuto("producer2"));
        System.out.println(res8); // >>> 1726055713867-1 (same ID as res7, duplicate detected)

        // Configure idempotent message processing settings
        String res9 = jedis.xcfgset("mystream",
            XCfgSetParams.xCfgSetParams().idmpDuration(300).idmpMaxsize(1000));
        System.out.println(res9); // >>> OK
        // STEP_END
        // REMOVE_START
        assertNotNull(res5);
        jedis.del("mystream");
        // REMOVE_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END

