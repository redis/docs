// EXAMPLE: cmds_hotkeys
// REMOVE_START
package io.redis.examples;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
// REMOVE_END

import java.util.Map;

import redis.clients.jedis.args.HotkeysMetric;
import redis.clients.jedis.params.HotkeysParams;
import redis.clients.jedis.resps.HotkeysInfo;

// HIDE_START
import redis.clients.jedis.RedisClient;
// HIDE_END

// HIDE_START
public class CmdsHotkeysExample {

    @Test
    public void run() {
        RedisClient jedis = RedisClient.create("redis://localhost:6379");

        // REMOVE_START
        jedis.hotkeysStop();
        jedis.hotkeysReset();
        jedis.del("product:1", "product:2", "product:3");
        jedis.mset("product:1", "Laptop", "product:2", "Phone", "product:3", "Tablet");
        // REMOVE_END
// HIDE_END

        // STEP_START hotkeys
        // Track the 10 hottest keys by CPU time and network bytes.
        String res1 = jedis.hotkeysStart(
            HotkeysParams.hotkeysParams()
                .metrics(HotkeysMetric.CPU, HotkeysMetric.NET)
                .count(10)
        );
        System.out.println(res1); // >>> OK

        // Generate some traffic. In production, this is your application's workload.
        for (int i = 0; i < 100; i++) {
            jedis.get("product:1");
        }

        for (int i = 0; i < 10; i++) {
            jedis.get("product:2");
        }

        jedis.get("product:3");

        HotkeysInfo res2 = jedis.hotkeysGet();
        System.out.println(res2.isTrackingActive()); // >>> true

        Map<String, Long> byNet = res2.getByNetBytes();
        System.out.println(byNet);
        // >>> {product:1=4000, product:2=390, product:3=40}

        String res3 = jedis.hotkeysStop();
        System.out.println(res3); // >>> OK

        String res4 = jedis.hotkeysReset();
        System.out.println(res4); // >>> OK
        // STEP_END

        // REMOVE_START
        Map<String, Long> expectedNet = new LinkedHashMap<>();
        expectedNet.put("product:1", 4000L);
        expectedNet.put("product:2", 390L);
        expectedNet.put("product:3", 40L);

        assertEquals("OK", res1);
        assertTrue(res2.isTrackingActive());
        assertEquals(expectedNet.toString(), byNet.toString());
        assertEquals("OK", res3);
        assertEquals("OK", res4);
        assertNull(jedis.hotkeysGet());
        jedis.del("product:1", "product:2", "product:3");
        // REMOVE_END

// HIDE_START
        jedis.close();
    }
}
// HIDE_END
