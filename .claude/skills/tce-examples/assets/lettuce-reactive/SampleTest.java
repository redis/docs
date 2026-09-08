// =============================================================================
// CANONICAL LETTUCE REACTIVE TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for Lettuce reactive
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
// Lettuce reactive uses Project Reactor's Mono/Flux with doOnNext(), flatMap(), block()
// RUN: mvn test -Dtest=SampleTest
// =============================================================================

// EXAMPLE: sample_example
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

import java.util.*;

public class SampleTest {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            // Clean up any existing data
            Mono<Void> cleanup = reactiveCommands.del(
                "mykey", "myhash", "bike:1", "bike:1:stats"
            ).then();
            cleanup.block();
            // REMOVE_END

            // STEP_START string_ops
            // Basic string SET/GET operations using reactive streams
            Mono<String> setKey = reactiveCommands.set("mykey", "Hello").doOnNext(result -> {
                System.out.println(result); // >>> OK
                // REMOVE_START
                assertThat(result).isEqualTo("OK");
                // REMOVE_END
            });

            setKey.block();

            Mono<String> getKey = reactiveCommands.get("mykey").doOnNext(result -> {
                System.out.println(result); // >>> Hello
                // REMOVE_START
                assertThat(result).isEqualTo("Hello");
                // REMOVE_END
            });

            getKey.block();
            // STEP_END

            // STEP_START hash_ops
            // Hash operations using reactive commands
            Map<String, String> hashFields = new HashMap<>();
            hashFields.put("field1", "value1");
            hashFields.put("field2", "value2");
            hashFields.put("field3", "value3");

            Mono<Long> setHash = reactiveCommands.hset("myhash", hashFields).doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo(3L);
                // REMOVE_END
            });

            setHash.block();

            Mono<String> getField = reactiveCommands.hget("myhash", "field1").doOnNext(result -> {
                System.out.println(result); // >>> value1
                // REMOVE_START
                assertThat(result).isEqualTo("value1");
                // REMOVE_END
            });

            Mono<List<KeyValue<String, String>>> getAll = reactiveCommands.hgetall("myhash")
                .collectList()
                .doOnNext(result -> {
                    System.out.println(result);
                    // >>> [KeyValue[field1, value1], KeyValue[field2, value2], KeyValue[field3, value3]]
                });

            Mono.when(getField, getAll).block();
            // STEP_END

            // STEP_START hash_tutorial
            // Tutorial-style example with bike data
            Map<String, String> bike1 = new HashMap<>();
            bike1.put("model", "Deimos");
            bike1.put("brand", "Ergonom");
            bike1.put("type", "Enduro bikes");
            bike1.put("price", "4972");

            Mono<Long> setBike = reactiveCommands.hset("bike:1", bike1).doOnNext(result -> {
                System.out.println(result); // >>> 4
                // REMOVE_START
                assertThat(result).isEqualTo(4L);
                // REMOVE_END
            });

            setBike.block();

            Mono<String> getModel = reactiveCommands.hget("bike:1", "model").doOnNext(result -> {
                System.out.println(result); // >>> Deimos
                // REMOVE_START
                assertThat(result).isEqualTo("Deimos");
                // REMOVE_END
            });

            Mono<String> getPrice = reactiveCommands.hget("bike:1", "price").doOnNext(result -> {
                System.out.println(result); // >>> 4972
                // REMOVE_START
                assertThat(result).isEqualTo("4972");
                // REMOVE_END
            });

            Mono.when(getModel, getPrice).block();
            // STEP_END

            // STEP_START hincrby
            // Numeric operations on hash fields using flatMap chains
            Mono<Void> incrOps = reactiveCommands.hincrby("bike:1:stats", "rides", 1)
                .doOnNext(result -> {
                    System.out.println(result); // >>> 1
                    // REMOVE_START
                    assertThat(result).isEqualTo(1L);
                    // REMOVE_END
                })
                .flatMap(v -> reactiveCommands.hincrby("bike:1:stats", "rides", 1))
                .doOnNext(result -> {
                    System.out.println(result); // >>> 2
                    // REMOVE_START
                    assertThat(result).isEqualTo(2L);
                    // REMOVE_END
                })
                .flatMap(v -> reactiveCommands.hincrby("bike:1:stats", "crashes", 1))
                .doOnNext(result -> {
                    System.out.println(result); // >>> 1
                    // REMOVE_START
                    assertThat(result).isEqualTo(1L);
                    // REMOVE_END
                })
                .then();

            incrOps.block();
            // STEP_END

        } finally {
            redisClient.shutdown();
        }
    }
}

