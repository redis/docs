// EXAMPLE: hash_import
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import java.util.stream.IntStream;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;

public class HashImportExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            String[] userKeys = IntStream.rangeClosed(1, 1000)
                    .mapToObj(i -> "user:" + i).toArray(String[]::new);
            reactiveCommands.del(userKeys).block();
            // REMOVE_END

            // STEP_START himport_basic
            // Declare the field names once.
            try (HashImport<String> fieldset = HashImport.of("name", "email", "age")) {
                // Create each hash by sending only its values.
                Mono<String> import1 = reactiveCommands
                    .himportSet("user:1", fieldset, "Alice", "alice@example.com", "34")
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    });

                Mono<String> import2 = reactiveCommands
                    .himportSet("user:2", fieldset, "Bob", "bob@example.com", "41");
                Mono<String> import3 = reactiveCommands
                    .himportSet("user:3", fieldset, "Carol", "carol@example.com", "29");

                // Subscribe before the fieldset closes.
                Mono.when(import1, import2, import3).block();
            }

            // The result is an ordinary hash.
            Mono<List<KeyValue<String, String>>> getAll = reactiveCommands.hgetall("user:2")
                .collectList()
                .doOnNext(res2 -> {
                    System.out.println(res2);
                    // >>> [KeyValue[age, 41], KeyValue[name, Bob], KeyValue[email, bob@example.com]]
                    // REMOVE_START
                    assertThat(res2).containsExactlyInAnyOrder(
                            KeyValue.just("name", "Bob"), KeyValue.just("email", "bob@example.com"),
                            KeyValue.just("age", "41"));
                    // REMOVE_END
                });

            getAll.block();
            // STEP_END

            // STEP_START himport_pipeline
            List<String> res3;

            // Issue many imports without waiting for each reply.
            try (HashImport<String> fieldset = HashImport.of("name", "email", "age")) {
                res3 = Flux.range(1, 1000)
                    .flatMap(i -> reactiveCommands.himportSet("user:" + i, fieldset,
                            "user" + i, "user" + i + "@example.com", String.valueOf(20 + i % 50)))
                    .collectList()
                    .block();
            }

            boolean allOk = res3.stream().allMatch("OK"::equals);
            System.out.println(res3.size() + " " + allOk); // >>> 1000 true

            Mono<String> getEmail = reactiveCommands.hget("user:1000", "email").doOnNext(res4 -> {
                System.out.println(res4); // >>> user1000@example.com
                // REMOVE_START
                assertThat(res4).isEqualTo("user1000@example.com");
                // REMOVE_END
            });

            getEmail.block();
            // STEP_END

            // REMOVE_START
            assertThat(res3).hasSize(1000);
            assertThat(allOk).isTrue();
            reactiveCommands.del(userKeys).block();
            // REMOVE_END
        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
