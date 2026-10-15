// EXAMPLE: bf_tutorial
package io.redis.examples.async;

// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;

import java.util.List;
import java.util.concurrent.CompletableFuture;

// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class BloomFilterExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // HIDE_END

            // STEP_START bloom
            // REMOVE_START
            asyncCommands.del("bikes:models").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> bloomExample = asyncCommands
                    .bfReserve("bikes:models", 0.01, 1000)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.bfAdd("bikes:models", "Smoky Mountain Striker");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> true
                        // REMOVE_START
                        assertThat(res2).isTrue();
                        // REMOVE_END
                        return asyncCommands.bfExists("bikes:models", "Smoky Mountain Striker");
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> true
                        // REMOVE_START
                        assertThat(res3).isTrue();
                        // REMOVE_END
                        return asyncCommands.bfMAdd("bikes:models",
                                "Rocky Mountain Racer",
                                "Cloudy City Cruiser",
                                "Windy City Wippet");
                    })
                    .thenCompose(res4 -> {
                        System.out.println(res4);
                        // >>> [true, true, true]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[true, true, true]");
                        // REMOVE_END
                        return asyncCommands.bfMExists("bikes:models",
                                "Rocky Mountain Racer",
                                "Cloudy City Cruiser",
                                "Windy City Wippet");
                    })
                    .thenAccept(res5 -> {
                        System.out.println(res5);
                        // >>> [true, true, true]
                        // REMOVE_START
                        assertThat(res5.toString()).isEqualTo("[true, true, true]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            bloomExample.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("bikes:models").toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
