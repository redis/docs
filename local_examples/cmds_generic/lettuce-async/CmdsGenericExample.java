// EXAMPLE: cmds_generic
package io.redis.examples.async;

import io.lettuce.core.*;

import io.lettuce.core.api.async.RedisAsyncCommands;

import io.lettuce.core.api.StatefulRedisConnection;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsGenericExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // REMOVE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            asyncCommands.del("key1", "key2", "nosuchkey").toCompletableFuture().join();
            asyncCommands.del("firstname", "lastname", "age").toCompletableFuture().join();
        // REMOVE_END

            // STEP_START exists
            CompletableFuture<Void> existsExample = asyncCommands.set("key1", "Hello").thenCompose(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END

                return asyncCommands.exists("key1");
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1L);
                // REMOVE_END

                return asyncCommands.exists("nosuchkey");
            }).thenCompose(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0L);
                // REMOVE_END

                return asyncCommands.set("key2", "World");
            }).thenCompose(res4 -> {
                System.out.println(res4); // >>> OK
                // REMOVE_START
                assertThat(res4).isEqualTo("OK");
                // REMOVE_END

                return asyncCommands.exists("key1", "key2", "nosuchkey");
            }).thenAccept(res5 -> {
                System.out.println(res5); // >>> 2
                // REMOVE_START
                assertThat(res5).isEqualTo(2L);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END
            existsExample.join();
            // REMOVE_START
            asyncCommands.del("key1", "key2").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START keys
            CompletableFuture<Void> keysExample = asyncCommands.mset(Map.of(
                    "firstname", "Jack",
                    "lastname", "Stuntman",
                    "age", "35"
            )).thenCompose(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END

                return asyncCommands.keys("*name*");
            }).thenCompose(res2 -> {
                Collections.sort(res2);
                System.out.println(res2); // >>> [firstname, lastname]
                // REMOVE_START
                assertThat(res2).hasSize(2);
                // REMOVE_END

                return asyncCommands.keys("a??");
            }).thenCompose(res3 -> {
                System.out.println(res3); // >>> [age]
                // REMOVE_START
                assertThat(res3).containsExactly("age");
                // REMOVE_END

                return asyncCommands.keys("*");
            }).thenAccept(res4 -> {
                Collections.sort(res4);
                System.out.println(res4); // >>> [age, firstname, lastname]
                // REMOVE_START
                assertThat(res4).hasSize(3);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END
            keysExample.join();
            // REMOVE_START
            asyncCommands.del("firstname", "lastname", "age").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
