// =============================================================================
// CANONICAL LETTUCE ASYNC TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for Lettuce async
// documentation test files. These tests serve dual purposes:
// 1. Executable tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// Lettuce async uses CompletableFuture chains with thenCompose()
// RUN: mvn test -Dtest=SampleTest
// =============================================================================

// EXAMPLE: sample_example
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
import java.util.*;
import java.util.concurrent.CompletableFuture;
// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class SampleTest {

    @Test
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // REMOVE_START
            CompletableFuture<Long> delResult = asyncCommands.del(
                "mykey", "myhash", "bike:1", "bike:1:stats"
            ).toCompletableFuture();
            // REMOVE_END

            // STEP_START string_ops
            // Basic string SET/GET operations using CompletableFuture chains
            CompletableFuture<Void> stringOps = asyncCommands.set("mykey", "Hello")
                .thenCompose(res1 -> {
                    System.out.println(res1); // >>> OK
                    // REMOVE_START
                    assertThat(res1).isEqualTo("OK");
                    // REMOVE_END
                    return asyncCommands.get("mykey");
                })
                .thenAccept(res2 -> {
                    System.out.println(res2); // >>> Hello
                    // REMOVE_START
                    assertThat(res2).isEqualTo("Hello");
                    // REMOVE_END
                })
                .toCompletableFuture();
            // STEP_END

            // STEP_START hash_ops
            // Hash operations using async commands
            Map<String, String> hashFields = new HashMap<>();
            hashFields.put("field1", "value1");
            hashFields.put("field2", "value2");
            hashFields.put("field3", "value3");

            CompletableFuture<Void> hashOps = stringOps.thenCompose(v ->
                asyncCommands.hset("myhash", hashFields)
            ).thenCompose(res3 -> {
                System.out.println(res3); // >>> 3
                // REMOVE_START
                assertThat(res3).isEqualTo(3);
                // REMOVE_END
                return asyncCommands.hget("myhash", "field1");
            }).thenCompose(res4 -> {
                System.out.println(res4); // >>> value1
                // REMOVE_START
                assertThat(res4).isEqualTo("value1");
                // REMOVE_END
                return asyncCommands.hgetall("myhash");
            })
            // REMOVE_START
            .thenApply(res -> {
                assertThat(res.get("field1")).isEqualTo("value1");
                return res;
            })
            // REMOVE_END
            .thenAccept(System.out::println)
            // >>> {field1=value1, field2=value2, field3=value3}
            .toCompletableFuture();
            // STEP_END

            // STEP_START hash_tutorial
            // Tutorial-style example with bike data
            Map<String, String> bike1 = new HashMap<>();
            bike1.put("model", "Deimos");
            bike1.put("brand", "Ergonom");
            bike1.put("type", "Enduro bikes");
            bike1.put("price", "4972");

            CompletableFuture<Void> bikeTutorial = hashOps.thenCompose(v ->
                asyncCommands.hset("bike:1", bike1)
            ).thenCompose(res5 -> {
                System.out.println(res5); // >>> 4
                // REMOVE_START
                assertThat(res5).isEqualTo(4);
                // REMOVE_END
                return asyncCommands.hget("bike:1", "model");
            }).thenCompose(res6 -> {
                System.out.println(res6); // >>> Deimos
                // REMOVE_START
                assertThat(res6).isEqualTo("Deimos");
                // REMOVE_END
                return asyncCommands.hget("bike:1", "price");
            }).thenAccept(res7 -> {
                System.out.println(res7); // >>> 4972
                // REMOVE_START
                assertThat(res7).isEqualTo("4972");
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            // STEP_START hincrby
            // Numeric operations on hash fields
            CompletableFuture<Void> incrOps = bikeTutorial.thenCompose(v ->
                asyncCommands.hincrby("bike:1:stats", "rides", 1)
            ).thenCompose(res8 -> {
                System.out.println(res8); // >>> 1
                // REMOVE_START
                assertThat(res8).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.hincrby("bike:1:stats", "rides", 1);
            }).thenCompose(res9 -> {
                System.out.println(res9); // >>> 2
                // REMOVE_START
                assertThat(res9).isEqualTo(2L);
                // REMOVE_END
                return asyncCommands.hincrby("bike:1:stats", "crashes", 1);
            }).thenAccept(res10 -> {
                System.out.println(res10); // >>> 1
                // REMOVE_START
                assertThat(res10).isEqualTo(1L);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            CompletableFuture.allOf(
                // REMOVE_START
                delResult,
                // REMOVE_END
                incrOps
            ).join();

        } finally {
            redisClient.shutdown();
        }
    }
}

