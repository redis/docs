// EXAMPLE: hll_tutorial
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

public class HyperLogLogExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // HIDE_END

            // STEP_START pfadd
            // REMOVE_START
            asyncCommands.del("bikes", "commuter_bikes", "all_bikes").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> pfaddExample = asyncCommands
                    .pfadd("bikes", "Hyperion", "Deimos", "Phoebe", "Quaoar")
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res1).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.pfcount("bikes");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> 4
                        // REMOVE_START
                        assertThat(res2).isEqualTo(4L);
                        // REMOVE_END
                        return asyncCommands.pfadd("commuter_bikes", "Salacia", "Mimas", "Quaoar");
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res3).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.pfmerge("all_bikes", "bikes", "commuter_bikes");
                    })
                    .thenCompose(res4 -> {
                        System.out.println(res4);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res4).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.pfcount("all_bikes");
                    })
                    .thenAccept(res5 -> {
                        System.out.println(res5);
                        // >>> 6
                        // REMOVE_START
                        assertThat(res5).isEqualTo(6L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            pfaddExample.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("bikes", "commuter_bikes", "all_bikes").toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
