// EXAMPLE: cmds_servermgmt
package io.redis.examples.async;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsServerMgmtExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // STEP_START flushall
            CompletableFuture<Void> flushallExample = asyncCommands.flushall()
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.keys("*");
                    }).thenAccept(res2 -> {
                        System.out.println(res2); // >>> []
                        // REMOVE_START
                        assertThat(res2).isEmpty();
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            flushallExample.join();

            // STEP_START info
            CompletableFuture<Void> infoExample = asyncCommands.info()
                    .thenAccept(res3 -> {
                        System.out.println(res3);
                        // >>> # Server
                        // >>> redis_version:7.4.0
                        // >>> ...
                        // REMOVE_START
                        assertThat(res3).contains("redis_version");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            infoExample.join();
        } finally {
            redisClient.shutdown();
        }
    }
}
