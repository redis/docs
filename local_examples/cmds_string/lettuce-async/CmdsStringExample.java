// EXAMPLE: cmds_string
package io.redis.examples.async;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;

// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
import java.util.concurrent.CompletableFuture;
// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsStringExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // REMOVE_START
            asyncCommands.del("key1", "key2", "nonexisting").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START mget
            CompletableFuture<Void> mgetExample = asyncCommands.set("key1", "Hello")
                    .thenCompose(res1 -> asyncCommands.set("key2", "World"))
                    .thenCompose(res2 -> asyncCommands.mget("key1", "key2", "nonexisting"))
                    .thenAccept(res3 -> {
                        System.out.println(res3);
                        // >>> [KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting, null]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo(
                                "[KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting, null]]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();
            // STEP_END

            mgetExample.join();
            // REMOVE_START
            asyncCommands.del("key1", "key2", "nonexisting").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
