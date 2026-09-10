// EXAMPLE: cuckoo_tutorial
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;
// HIDE_END

public class CuckooFilterExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // STEP_START cuckoo
            // REMOVE_START
            reactiveCommands.del("bikes:models").block();
            // REMOVE_END
            Mono<Void> cuckooExample = reactiveCommands
                    .cfReserve("bikes:models", 1000000L)
                    .doOnNext(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.cfAdd("bikes:models", "Smoky Mountain Striker"))
                    .doOnNext(res2 -> {
                        System.out.println(res2);
                        // >>> true
                        // REMOVE_START
                        assertThat(res2).isTrue();
                        // REMOVE_END
                    })
                    .then(reactiveCommands.cfExists("bikes:models", "Smoky Mountain Striker"))
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> true
                        // REMOVE_START
                        assertThat(res3).isTrue();
                        // REMOVE_END
                    })
                    .then(reactiveCommands.cfExists("bikes:models", "Terrible Bike Name"))
                    .doOnNext(res4 -> {
                        System.out.println(res4);
                        // >>> false
                        // REMOVE_START
                        assertThat(res4).isFalse();
                        // REMOVE_END
                    })
                    .then(reactiveCommands.cfDel("bikes:models", "Smoky Mountain Striker"))
                    .doOnNext(res5 -> {
                        System.out.println(res5);
                        // >>> true
                        // REMOVE_START
                        assertThat(res5).isTrue();
                        // REMOVE_END
                    })
                    .then();

            cuckooExample.block();
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
