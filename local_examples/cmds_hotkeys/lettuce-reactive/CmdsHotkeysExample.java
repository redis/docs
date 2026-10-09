// EXAMPLE: cmds_hotkeys
package io.redis.examples.reactive;

// HIDE_START
import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.*;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
// HIDE_END

public class CmdsHotkeysExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // REMOVE_START
            Map<String, String> products = new HashMap<>();
            products.put("product:1", "Laptop");
            products.put("product:2", "Phone");
            products.put("product:3", "Tablet");
            reactiveCommands.hotkeysStop()
                    .then(reactiveCommands.hotkeysReset())
                    .then(reactiveCommands.del("product:1", "product:2", "product:3"))
                    .then(reactiveCommands.mset(products))
                    .block();
            // REMOVE_END

            // STEP_START hotkeys
            // Track the 10 hottest keys by CPU time and network bytes.
            Mono<Void> hotkeysExample = reactiveCommands.hotkeysStart(
                    HotkeysArgs.Builder.metrics(HotkeysArgs.Metric.CPU, HotkeysArgs.Metric.NET).count(10))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    // Generate some traffic. In production, this is your application's workload.
                    .thenMany(Flux.range(0, 100).flatMap(i -> reactiveCommands.get("product:1")))
                    .thenMany(Flux.range(0, 10).flatMap(i -> reactiveCommands.get("product:2")))
                    .then(reactiveCommands.get("product:3"))
                    .then(reactiveCommands.hotkeysGet())
                    .doOnNext(res2 -> {
                        System.out.println(res2.isTrackingActive()); // >>> true

                        System.out.println(res2.getByNetBytes());
                        // >>> {product:1=4000, product:2=390, product:3=40}

                        // REMOVE_START
                        assertThat(res2.isTrackingActive()).isTrue();
                        assertThat(new ArrayList<>(res2.getByNetBytes().keySet()))
                                .containsExactly("product:1", "product:2", "product:3");
                        assertThat(new ArrayList<>(res2.getByNetBytes().values())).containsExactly(4000L, 390L, 40L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.hotkeysStop())
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.hotkeysReset())
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> OK
                        // REMOVE_START
                        assertThat(res4).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then();

            hotkeysExample.block();
            // STEP_END

            // REMOVE_START
            assertThat(reactiveCommands.hotkeysGet().block()).isNull();
            reactiveCommands.del("product:1", "product:2", "product:3").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
