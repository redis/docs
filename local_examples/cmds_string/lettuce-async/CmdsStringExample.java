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
            asyncCommands.del("key1", "key2", "mykey", "nonexisting").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START mget
            CompletableFuture<Void> mgetExample = asyncCommands.set("key1", "Hello")
                    .thenCompose(res1 -> asyncCommands.set("key2", "World"))
                    .thenCompose(res2 -> asyncCommands.mget("key1", "key2", "nonexisting"))
                    .thenAccept(res3 -> {
                        System.out.println(res3);
                        // >>> [KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting].empty]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo(
                                "[KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting].empty]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();
            // STEP_END

            mgetExample.join();

            // STEP_START incr
            CompletableFuture<Void> incrExample = asyncCommands.set("mykey", "10")
                    .thenCompose(incrResult1 -> {
                        System.out.println(incrResult1);    // >>> OK
                        // REMOVE_START
                        assertThat(incrResult1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.incr("mykey");
                    })
                    .thenCompose(incrResult2 -> {
                        System.out.println(incrResult2);    // >>> 11
                        // REMOVE_START
                        assertThat(incrResult2).isEqualTo(11L);
                        // REMOVE_END
                        return asyncCommands.get("mykey");
                    })
                    .thenAccept(incrResult3 -> {
                        System.out.println(incrResult3);    // >>> 11
                        // REMOVE_START
                        assertThat(incrResult3).isEqualTo("11");
                        // REMOVE_END
                    })
                    .toCompletableFuture();
            // STEP_END

            incrExample.join();
            // REMOVE_START
            asyncCommands.del("key1", "key2", "mykey", "nonexisting").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
