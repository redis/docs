// EXAMPLE: cms_tutorial
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.probabilistic.CMSInfoValue;
import io.lettuce.core.probabilistic.IncrementPair;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

import java.util.List;
// HIDE_END

public class CMSExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // STEP_START cms
            // REMOVE_START
            reactiveCommands.del("bikes:profit").block();
            // REMOVE_END
            Mono<Void> cmsExample = reactiveCommands
                    .cmsInitByProb("bikes:profit", 0.001, 0.002)
                    .doOnNext(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.cmsIncrBy("bikes:profit",
                            IncrementPair.of("Smoky Mountain Striker", 100L)))
                    .collectList()
                    .doOnNext(res2 -> {
                        System.out.println(res2);
                        // >>> [100]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[100]");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.cmsIncrBy("bikes:profit",
                            IncrementPair.of("Rocky Mountain Racer", 200L),
                            IncrementPair.of("Cloudy City Cruiser", 150L)))
                    .collectList()
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> [200, 150]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo("[200, 150]");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.cmsQuery("bikes:profit", "Smoky Mountain Striker"))
                    .collectList()
                    .doOnNext(res4 -> {
                        System.out.println(res4);
                        // >>> [100]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[100]");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.cmsInfo("bikes:profit"))
                    .doOnNext(res5 -> {
                        System.out.println(res5.getWidth() + " " + res5.getDepth() + " " + res5.getCount());
                        // >>> 2000 9 450
                        // REMOVE_START
                        assertThat(res5.getWidth()).isEqualTo(2000L);
                        assertThat(res5.getDepth()).isEqualTo(9L);
                        assertThat(res5.getCount()).isEqualTo(450L);
                        // REMOVE_END
                    })
                    .then();

            cmsExample.block();
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("bikes:profit").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
