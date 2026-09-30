// EXAMPLE: hll_tutorial
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

public class HyperLogLogExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // STEP_START pfadd
            // REMOVE_START
            reactiveCommands.del("bikes", "commuter_bikes", "all_bikes").block();
            // REMOVE_END
            Mono<Void> pfaddExample = reactiveCommands
                    .pfadd("bikes", "Hyperion", "Deimos", "Phoebe", "Quaoar")
                    .doOnNext(res1 -> {
                        System.out.println(res1);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res1).isEqualTo(1L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.pfcount("bikes"))
                    .doOnNext(res2 -> {
                        System.out.println(res2);
                        // >>> 4
                        // REMOVE_START
                        assertThat(res2).isEqualTo(4L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.pfadd("commuter_bikes", "Salacia", "Mimas", "Quaoar"))
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res3).isEqualTo(1L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.pfmerge("all_bikes", "bikes", "commuter_bikes"))
                    .doOnNext(res4 -> {
                        System.out.println(res4);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res4).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.pfcount("all_bikes"))
                    .doOnNext(res5 -> {
                        System.out.println(res5);
                        // >>> 6
                        // REMOVE_START
                        assertThat(res5).isEqualTo(6L);
                        // REMOVE_END
                    })
                    .then();

            pfaddExample.block();
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("bikes", "commuter_bikes", "all_bikes").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
