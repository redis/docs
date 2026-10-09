// EXAMPLE: cmds_hotkeys
package io.redis.examples.async;

// HIDE_START
import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.*;
import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class CmdsHotkeysExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // HIDE_END

            // REMOVE_START
            Map<String, String> products = new HashMap<>();
            products.put("product:1", "Laptop");
            products.put("product:2", "Phone");
            products.put("product:3", "Tablet");
            asyncCommands.hotkeysStop()
                    .thenCompose(r -> asyncCommands.hotkeysReset())
                    .thenCompose(r -> asyncCommands.del("product:1", "product:2", "product:3"))
                    .thenCompose(r -> asyncCommands.mset(products))
                    .toCompletableFuture().join();
            // REMOVE_END

            // STEP_START hotkeys
            // Track the 10 hottest keys by CPU time and network bytes.
            CompletableFuture<Void> hotkeysExample = asyncCommands.hotkeysStart(
                    HotkeysArgs.Builder.metrics(HotkeysArgs.Metric.CPU, HotkeysArgs.Metric.NET).count(10))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END

                        // Generate some traffic. In production, this is your application's workload.
                        List<CompletableFuture<String>> traffic = new ArrayList<>();
                        for (int i = 0; i < 100; i++) {
                            traffic.add(asyncCommands.get("product:1").toCompletableFuture());
                        }

                        for (int i = 0; i < 10; i++) {
                            traffic.add(asyncCommands.get("product:2").toCompletableFuture());
                        }

                        traffic.add(asyncCommands.get("product:3").toCompletableFuture());

                        return CompletableFuture.allOf(traffic.toArray(new CompletableFuture[0]));
                    })
                    .thenCompose(v -> asyncCommands.hotkeysGet())
                    .thenCompose(res2 -> {
                        System.out.println(res2.isTrackingActive()); // >>> true

                        System.out.println(res2.getByNetBytes());
                        // >>> {product:1=4000, product:2=390, product:3=40}

                        // REMOVE_START
                        assertThat(res2.isTrackingActive()).isTrue();
                        assertThat(new ArrayList<>(res2.getByNetBytes().keySet()))
                                .containsExactly("product:1", "product:2", "product:3");
                        assertThat(new ArrayList<>(res2.getByNetBytes().values())).containsExactly(4000L, 390L, 40L);
                        // REMOVE_END

                        return asyncCommands.hotkeysStop();
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END

                        return asyncCommands.hotkeysReset();
                    })
                    .thenAccept(res4 -> {
                        System.out.println(res4); // >>> OK
                        // REMOVE_START
                        assertThat(res4).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            hotkeysExample.join();
            // STEP_END

            // REMOVE_START
            assertThat(asyncCommands.hotkeysGet().toCompletableFuture().join()).isNull();
            asyncCommands.del("product:1", "product:2", "product:3").toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
