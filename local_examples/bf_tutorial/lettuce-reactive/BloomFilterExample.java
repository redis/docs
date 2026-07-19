// EXAMPLE: bf_tutorial
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.Value;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;
// HIDE_END

public class BloomFilterExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // STEP_START bloom
            // REMOVE_START
            reactiveCommands.del("bikes:models").block();
            // REMOVE_END
            Mono<Void> bloomExample = reactiveCommands
                    .bfReserve("bikes:models", 0.01, 1000)
                    .doOnNext(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.bfAdd("bikes:models", "Smoky Mountain Striker"))
                    .doOnNext(res2 -> {
                        System.out.println(res2);
                        // >>> true
                        // REMOVE_START
                        assertThat(res2).isTrue();
                        // REMOVE_END
                    })
                    .then(reactiveCommands.bfExists("bikes:models", "Smoky Mountain Striker"))
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> true
                        // REMOVE_START
                        assertThat(res3).isTrue();
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.bfMAdd("bikes:models",
                            "Rocky Mountain Racer",
                            "Cloudy City Cruiser",
                            "Windy City Wippet"))
                    .map(Value::getValue)
                    .collectList()
                    .doOnNext(res4 -> {
                        System.out.println(res4);
                        // >>> [true, true, true]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[true, true, true]");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.bfMExists("bikes:models",
                            "Rocky Mountain Racer",
                            "Cloudy City Cruiser",
                            "Windy City Wippet"))
                    .collectList()
                    .doOnNext(res5 -> {
                        System.out.println(res5);
                        // >>> [true, true, true]
                        // REMOVE_START
                        assertThat(res5.toString()).isEqualTo("[true, true, true]");
                        // REMOVE_END
                    })
                    .then();

            bloomExample.block();
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("bikes:models").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
