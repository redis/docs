// EXAMPLE: cmds_cnxmgmt
package io.redis.examples.async;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END

public class CmdsCnxmgmtExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // STEP_START auth1
            CompletableFuture<Void> authExample1 = asyncCommands.auth("temp_pass")
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        return asyncCommands.auth("default", "temp_pass");
                    }).thenAccept(res2 -> {
                        System.out.println(res2); // >>> OK
                    }).toCompletableFuture();
            // STEP_END

            authExample1.join();

            // STEP_START auth2
            CompletableFuture<Void> authExample2 = asyncCommands.auth("test-user", "strong_password")
                    .thenAccept(res3 -> {
                        System.out.println(res3); // >>> OK
                    }).toCompletableFuture();
            // STEP_END

            authExample2.join();
        } finally {
            redisClient.shutdown();
        }
    }
}
