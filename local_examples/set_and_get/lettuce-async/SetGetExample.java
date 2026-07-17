// EXAMPLE: set_and_get
package io.redis.examples.async;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class SetGetExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // REMOVE_START
            asyncCommands.del("bike:1").toCompletableFuture().join();
            // REMOVE_END

            CompletableFuture<Void> setGetExample = asyncCommands.set("bike:1", "Process 134")
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.get("bike:1");
                    }).thenAccept(res2 -> {
                        System.out.println(res2); // >>> Process 134
                        // REMOVE_START
                        assertThat(res2).isEqualTo("Process 134");
                        // REMOVE_END
                    }).toCompletableFuture();

            setGetExample.join();
            // REMOVE_START
            asyncCommands.del("bike:1").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
