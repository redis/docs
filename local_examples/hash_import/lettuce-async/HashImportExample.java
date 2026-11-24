// EXAMPLE: hash_import
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import java.util.stream.IntStream;
// REMOVE_END
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class HashImportExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // REMOVE_START
            String[] userKeys = IntStream.rangeClosed(1, 1000)
                    .mapToObj(i -> "user:" + i).toArray(String[]::new);
            asyncCommands.del(userKeys).toCompletableFuture().join();
            // REMOVE_END

            // STEP_START himport_basic
            CompletableFuture<Void> basicOps;

            // Declare the field names once.
            try (HashImport<String> fieldset = HashImport.of("name", "email", "age")) {
                // Create each hash by sending only its values.
                RedisFuture<String> import1 = asyncCommands.himportSet(
                        "user:1", fieldset, "Alice", "alice@example.com", "34");
                asyncCommands.himportSet("user:2", fieldset, "Bob", "bob@example.com", "41");
                asyncCommands.himportSet("user:3", fieldset, "Carol", "carol@example.com", "29");

                basicOps = import1.thenCompose(res1 -> {
                    System.out.println(res1); // >>> OK
                    // REMOVE_START
                    assertThat(res1).isEqualTo("OK");
                    // REMOVE_END
                    // The result is an ordinary hash.
                    return asyncCommands.hgetall("user:2");
                }).thenAccept(res2 -> {
                    System.out.println(res2);
                    // >>> {age=41, name=Bob, email=bob@example.com}
                    // REMOVE_START
                    assertThat(res2).containsOnly(
                            Map.entry("name", "Bob"), Map.entry("email", "bob@example.com"), Map.entry("age", "41"));
                    // REMOVE_END
                }).toCompletableFuture();
            }

            basicOps.join();
            // STEP_END

            // STEP_START himport_pipeline
            List<RedisFuture<String>> res3 = new ArrayList<>();

            // Issue many imports without waiting for each reply.
            try (HashImport<String> fieldset = HashImport.of("name", "email", "age")) {
                for (int i = 1; i <= 1000; i++) {
                    res3.add(asyncCommands.himportSet("user:" + i, fieldset,
                            "user" + i, "user" + i + "@example.com", String.valueOf(20 + i % 50)));
                }
            }

            LettuceFutures.awaitAll(5, TimeUnit.SECONDS, res3.toArray(new RedisFuture[0]));

            boolean allOk = res3.stream().allMatch(f -> "OK".equals(f.toCompletableFuture().join()));
            System.out.println(res3.size() + " " + allOk); // >>> 1000 true

            CompletableFuture<Void> getEmail = asyncCommands.hget("user:1000", "email")
                .thenAccept(res4 -> {
                    System.out.println(res4); // >>> user1000@example.com
                    // REMOVE_START
                    assertThat(res4).isEqualTo("user1000@example.com");
                    // REMOVE_END
                })
                .toCompletableFuture();

            getEmail.join();
            // STEP_END

            // REMOVE_START
            assertThat(res3).hasSize(1000);
            assertThat(allOk).isTrue();
            asyncCommands.del(userKeys).toCompletableFuture().join();
            // REMOVE_END
        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
