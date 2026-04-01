// EXAMPLE: cmds_generic
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;
// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.Map;

// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsGenericExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // REMOVE_START
            reactiveCommands.del("key1", "key2", "nosuchkey").block();
            reactiveCommands.del("firstname", "lastname", "age").block();
            // REMOVE_END

            // STEP_START exists
            Mono<Void> existsExample = reactiveCommands.set("key1", "Hello").doOnNext(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.exists("key1")).doOnNext(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1L);
                // REMOVE_END
            }).then(reactiveCommands.exists("nosuchkey")).doOnNext(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0L);
                // REMOVE_END
            }).then(reactiveCommands.set("key2", "World")).doOnNext(res4 -> {
                System.out.println(res4); // >>> OK
                // REMOVE_START
                assertThat(res4).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.exists("key1", "key2", "nosuchkey")).doOnNext(res5 -> {
                System.out.println(res5); // >>> 2
                // REMOVE_START
                assertThat(res5).isEqualTo(2L);
                // REMOVE_END
            }).then();
            // STEP_END

            Mono.when(existsExample).block();
            // REMOVE_START
            reactiveCommands.del("key1", "key2").block();
            // REMOVE_END

            // STEP_START keys
            Mono<Void> keysExample = reactiveCommands.mset(Map.of(
                    "firstname", "Jack",
                    "lastname", "Stuntman",
                    "age", "35"
            )).doOnNext(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.keys("*name*").collectList()).doOnNext(res2 -> {
                Collections.sort(res2);
                System.out.println(res2); // >>> [firstname, lastname]
                // REMOVE_START
                assertThat(res2).hasSize(2);
                // REMOVE_END
            }).then(reactiveCommands.keys("a??").collectList()).doOnNext(res3 -> {
                System.out.println(res3); // >>> [age]
                // REMOVE_START
                assertThat(res3).containsExactly("age");
                // REMOVE_END
            }).then(reactiveCommands.keys("*").collectList()).doOnNext(res4 -> {
                Collections.sort(res4);
                System.out.println(res4); // >>> [age, firstname, lastname]
                // REMOVE_START
                assertThat(res4).hasSize(3);
                // REMOVE_END
            }).then();
            // STEP_END

            Mono.when(keysExample).block();
            // REMOVE_START
            reactiveCommands.del("firstname", "lastname", "age").block();
            // REMOVE_END

        } finally {
            redisClient.shutdown();
        }
    }

}
