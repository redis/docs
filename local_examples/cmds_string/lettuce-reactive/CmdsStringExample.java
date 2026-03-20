// EXAMPLE: cmds_string
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

public class CmdsStringExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            reactiveCommands.del("key1", "key2", "nonexisting").block();
            // REMOVE_END

            // STEP_START mget
            Mono<Void> mgetExample = reactiveCommands.set("key1", "Hello")
                    .flatMap(res1 -> reactiveCommands.set("key2", "World"))
                    .flatMap(res2 -> reactiveCommands.mget("key1", "key2", "nonexisting").collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> [KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting, null]]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo(
                                "[KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting, null]]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            mgetExample.block();
            // REMOVE_START
            reactiveCommands.del("key1", "key2", "nonexisting").block();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
