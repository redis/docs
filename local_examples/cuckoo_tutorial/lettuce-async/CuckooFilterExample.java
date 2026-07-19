// EXAMPLE: cuckoo_tutorial
package io.redis.examples.async;

// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;

import java.util.concurrent.CompletableFuture;

// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class CuckooFilterExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // HIDE_END

            // STEP_START cuckoo
            // REMOVE_START
            asyncCommands.del("bikes:models").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> cuckooExample = asyncCommands
                    .cfReserve("bikes:models", 1000000L)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.cfAdd("bikes:models", "Smoky Mountain Striker");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> true
                        // REMOVE_START
                        assertThat(res2).isTrue();
                        // REMOVE_END
                        return asyncCommands.cfExists("bikes:models", "Smoky Mountain Striker");
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> true
                        // REMOVE_START
                        assertThat(res3).isTrue();
                        // REMOVE_END
                        return asyncCommands.cfExists("bikes:models", "Terrible Bike Name");
                    })
                    .thenCompose(res4 -> {
                        System.out.println(res4);
                        // >>> false
                        // REMOVE_START
                        assertThat(res4).isFalse();
                        // REMOVE_END
                        return asyncCommands.cfDel("bikes:models", "Smoky Mountain Striker");
                    })
                    .thenAccept(res5 -> {
                        System.out.println(res5);
                        // >>> true
                        // REMOVE_START
                        assertThat(res5).isTrue();
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            cuckooExample.join();
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
