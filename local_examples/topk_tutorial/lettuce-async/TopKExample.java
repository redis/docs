// EXAMPLE: topk_tutorial
package io.redis.examples.async;

// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.probabilistic.arguments.TopKReserveArgs;

import java.util.List;
import java.util.concurrent.CompletableFuture;

// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class TopKExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // HIDE_END

            // STEP_START topk
            // REMOVE_START
            asyncCommands.del("bikes:keywords").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> topKExample = asyncCommands
                    .topKReserve("bikes:keywords", 5L,
                            TopKReserveArgs.Builder.width(2000L).depth(7L).decay(0.925))
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.topKAdd("bikes:keywords",
                                "store", "seat", "handlebars", "handles", "pedals",
                                "tires", "store", "seat");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> [null, null, null, null, null, handlebars, null, null]
                        // REMOVE_START
                        assertThat(res2.size()).isEqualTo(8);
                        // REMOVE_END
                        return asyncCommands.topKList("bikes:keywords");
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> [store, seat, pedals, tires, handles]
                        // REMOVE_START
                        assertThat(res3.size()).isEqualTo(5);
                        assertThat(res3).contains("store", "seat");
                        // REMOVE_END
                        return asyncCommands.topKQuery("bikes:keywords", "store", "handlebars");
                    })
                    .thenAccept(res4 -> {
                        System.out.println(res4);
                        // >>> [true, false]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[true, false]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            topKExample.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("bikes:keywords").toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
