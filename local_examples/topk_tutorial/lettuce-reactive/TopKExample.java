// EXAMPLE: topk_tutorial
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.probabilistic.arguments.TopKReserveArgs;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

import java.util.List;
// HIDE_END

public class TopKExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // STEP_START topk
            // REMOVE_START
            reactiveCommands.del("bikes:keywords").block();
            // REMOVE_END
            Mono<Void> topKExample = reactiveCommands
                    .topKReserve("bikes:keywords", 5L,
                            TopKReserveArgs.Builder.width(2000L).depth(7L).decay(0.925))
                    .doOnNext(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.topKAdd("bikes:keywords",
                            "store", "seat", "handlebars", "handles", "pedals",
                            "tires", "store", "seat"))
                    .map(v -> v.getValueOrElse(null))
                    .collectList()
                    .doOnNext(res2 -> {
                        System.out.println(res2);
                        // >>> [null, null, null, null, null, handlebars, null, null]
                        // REMOVE_START
                        assertThat(res2.size()).isEqualTo(8);
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.topKList("bikes:keywords"))
                    .collectList()
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> [store, seat, pedals, tires, handles]
                        // REMOVE_START
                        assertThat(res3.size()).isEqualTo(5);
                        assertThat(res3).contains("store", "seat");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.topKQuery("bikes:keywords", "store", "handlebars"))
                    .collectList()
                    .doOnNext(res4 -> {
                        System.out.println(res4);
                        // >>> [true, false]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[true, false]");
                        // REMOVE_END
                    })
                    .then();

            topKExample.block();
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("bikes:keywords").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
