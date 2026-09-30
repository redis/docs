// EXAMPLE: set_and_get
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

public class SetGetExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            reactiveCommands.del("bike:1").block();
            // REMOVE_END

            Mono<Void> setGetExample = reactiveCommands.set("bike:1", "Process 134")
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.get("bike:1"))
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> Process 134
                        // REMOVE_START
                        assertThat(res2).isEqualTo("Process 134");
                        // REMOVE_END
                    })
                    .then();

            setGetExample.block();
            // REMOVE_START
            reactiveCommands.del("bike:1").block();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
