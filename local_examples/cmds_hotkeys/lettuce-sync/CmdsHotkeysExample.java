// EXAMPLE: cmds_hotkeys
// HIDE_START
package io.redis.examples.sync;

import io.lettuce.core.*;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.*;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsHotkeysExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();
            // HIDE_END

            // REMOVE_START
            syncCommands.hotkeysStop();
            syncCommands.hotkeysReset();
            syncCommands.del("product:1", "product:2", "product:3");
            Map<String, String> products = new HashMap<>();
            products.put("product:1", "Laptop");
            products.put("product:2", "Phone");
            products.put("product:3", "Tablet");
            syncCommands.mset(products);
            // REMOVE_END

            // STEP_START hotkeys
            // Track the 10 hottest keys by CPU time and network bytes.
            String res1 = syncCommands.hotkeysStart(
                    HotkeysArgs.Builder.metrics(HotkeysArgs.Metric.CPU, HotkeysArgs.Metric.NET).count(10));
            System.out.println(res1); // >>> OK

            // Generate some traffic. In production, this is your application's workload.
            for (int i = 0; i < 100; i++) {
                syncCommands.get("product:1");
            }

            for (int i = 0; i < 10; i++) {
                syncCommands.get("product:2");
            }

            syncCommands.get("product:3");

            HotkeysReply res2 = syncCommands.hotkeysGet();
            System.out.println(res2.isTrackingActive()); // >>> true

            Map<String, Long> byNet = res2.getByNetBytes();
            System.out.println(byNet);
            // >>> {product:1=4000, product:2=390, product:3=40}


            String res3 = syncCommands.hotkeysStop();
            System.out.println(res3); // >>> OK

            String res4 = syncCommands.hotkeysReset();
            System.out.println(res4); // >>> OK
            // STEP_END

            // REMOVE_START
            assertThat(res1).isEqualTo("OK");
            assertThat(res2.isTrackingActive()).isTrue();
            assertThat(new ArrayList<>(byNet.keySet())).containsExactly("product:1", "product:2", "product:3");
            assertThat(new ArrayList<>(byNet.values())).containsExactly(4000L, 390L, 40L);
            assertThat(res3).isEqualTo("OK");
            assertThat(res4).isEqualTo("OK");
            assertThat(syncCommands.hotkeysGet()).isNull();
            syncCommands.del("product:1", "product:2", "product:3");
            // REMOVE_END
        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
