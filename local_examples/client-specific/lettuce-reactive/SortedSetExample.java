// EXAMPLE: ss_tutorial
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

public class SortedSetExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // REMOVE_START
            reactiveCommands.del("racer_scores").block();
            // REMOVE_END

            // STEP_START zadd
            Mono<Void> zadd = reactiveCommands.zadd("racer_scores", ScoredValue.just(10d, "Norem")).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.zadd("racer_scores", ScoredValue.just(12d, "Castilla"))).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.zadd("racer_scores", ScoredValue.just(8d, "Sam-Bodden"),
                    ScoredValue.just(10d, "Royce"), ScoredValue.just(6d, "Ford"),
                    ScoredValue.just(14d, "Prickett"))).doOnNext(result -> {
                        System.out.println(result); // >>> 4
                        // REMOVE_START
                        assertThat(result).isEqualTo(4);
                        // REMOVE_END
                    }).then();
            // STEP_END
            zadd.block();

            // STEP_START zrange
            Mono<Void> zrange = reactiveCommands.zrange("racer_scores", 0, -1).collectList().doOnNext(result -> {
                System.out.println(result);
                // >>> [Ford, Sam-Bodden, Norem, Royce, Castilla, Prickett]
                // REMOVE_START
                assertThat(result.toString()).isEqualTo("[Ford, Sam-Bodden, Norem, Royce, Castilla, Prickett]");
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.zrevrange("racer_scores", 0, -1).collectList()).doOnNext(result -> {
                System.out.println(result);
                // >>> [Prickett, Castilla, Royce, Norem, Sam-Bodden, Ford]
                // REMOVE_START
                assertThat(result.toString()).isEqualTo("[Prickett, Castilla, Royce, Norem, Sam-Bodden, Ford]");
                // REMOVE_END
            }).then();
            // STEP_END
            zrange.block();

            // STEP_START zrange_withscores
            Mono<Void> zrangeWithScores = reactiveCommands.zrangeWithScores("racer_scores", 0, -1).collectList()
                    .doOnNext(result -> {
                        System.out.println(result);
                        // >>> [ScoredValue[6.000000, Ford], ScoredValue[8.000000, Sam-Bodden]...
                        // REMOVE_START
                        assertThat(result.toString())
                                .isEqualTo("[ScoredValue[6.000000, Ford], ScoredValue[8.000000, Sam-Bodden],"
                                        + " ScoredValue[10.000000, Norem], ScoredValue[10.000000, Royce],"
                                        + " ScoredValue[12.000000, Castilla], ScoredValue[14.000000, Prickett]]");
                        // REMOVE_END
                    }).then();
            // STEP_END
            zrangeWithScores.block();

            // STEP_START zrangebyscore
            Mono<Void> zrangebyscore = reactiveCommands
                    .zrangebyscore("racer_scores", Range.create(Double.NEGATIVE_INFINITY, 10)).collectList().doOnNext(result -> {
                        System.out.println(result); // >>> [Ford, Sam-Bodden, Norem, Royce]
                        // REMOVE_START
                        assertThat(result.toString()).isEqualTo("[Ford, Sam-Bodden, Norem, Royce]");
                        // REMOVE_END
                    }).then();
            // STEP_END
            zrangebyscore.block();

            // STEP_START zremrangebyscore
            Mono<Void> zremrangebyscore = reactiveCommands.zrem("racer_scores", "Castilla").doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.zremrangebyscore("racer_scores", Range.create(Double.NEGATIVE_INFINITY, 9)))
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 2
                        // REMOVE_START
                        assertThat(result).isEqualTo(2);
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zrange("racer_scores", 0, -1).collectList()).doOnNext(result -> {
                        System.out.println(result); // >>> [Norem, Royce, Prickett]
                        // REMOVE_START
                        assertThat(result.toString()).isEqualTo("[Norem, Royce, Prickett]");
                        // REMOVE_END
                    }).then();
            // STEP_END
            zremrangebyscore.block();

            // STEP_START zrank
            // Recreate the three remaining racers so this example runs on its own.
            Mono<Void> zrank = reactiveCommands.del("racer_scores")
                    .flatMap(v -> reactiveCommands.zadd("racer_scores", ScoredValue.just(10d, "Norem"),
                            ScoredValue.just(10d, "Royce"), ScoredValue.just(14d, "Prickett")))
                    .flatMap(v -> reactiveCommands.zrank("racer_scores", "Norem")).doOnNext(result -> {
                        System.out.println(result); // >>> 0
                        // REMOVE_START
                        assertThat(result).isZero();
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zrevrank("racer_scores", "Norem")).doOnNext(result -> {
                        System.out.println(result); // >>> 2
                        // REMOVE_START
                        assertThat(result).isEqualTo(2);
                        // REMOVE_END
                    }).then();
            // STEP_END
            zrank.block();

            // STEP_START zadd_lex
            Mono<Void> zaddLex = reactiveCommands
                    .zadd("racer_scores", ScoredValue.just(0d, "Norem"), ScoredValue.just(0d, "Sam-Bodden"),
                            ScoredValue.just(0d, "Royce"), ScoredValue.just(0d, "Castilla"),
                            ScoredValue.just(0d, "Prickett"), ScoredValue.just(0d, "Ford"))
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 3
                        // REMOVE_START
                        assertThat(result).isEqualTo(3);
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zrange("racer_scores", 0, -1).collectList()).doOnNext(result -> {
                        System.out.println(result);
                        // >>> [Castilla, Ford, Norem, Prickett, Royce, Sam-Bodden]
                        // REMOVE_START
                        assertThat(result.toString()).isEqualTo("[Castilla, Ford, Norem, Prickett, Royce, Sam-Bodden]");
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zrangebylex("racer_scores", Range.create("A", "L")).collectList())
                    .doOnNext(result -> {
                        System.out.println(result); // >>> [Castilla, Ford]
                        // REMOVE_START
                        assertThat(result.toString()).isEqualTo("[Castilla, Ford]");
                        // REMOVE_END
                    }).then();
            // STEP_END
            zaddLex.block();

            // STEP_START leaderboard
            Mono<Void> leaderboard = reactiveCommands.zadd("racer_scores", ScoredValue.just(100, "Wood"))
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 1
                        // REMOVE_START
                        assertThat(result).isEqualTo(1);
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zadd("racer_scores", ScoredValue.just(100, "Henshaw")))
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 1
                        // REMOVE_START
                        assertThat(result).isEqualTo(1);
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zadd("racer_scores", ScoredValue.just(150, "Henshaw")))
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 0
                        // REMOVE_START
                        assertThat(result).isZero();
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zincrby("racer_scores", 50, "Wood")).doOnNext(result -> {
                        System.out.println(result); // >>> 150
                        // REMOVE_START
                        assertThat(result).isEqualTo(150);
                        // REMOVE_END
                    }).flatMap(v -> reactiveCommands.zincrby("racer_scores", 50, "Henshaw")).doOnNext(result -> {
                        System.out.println(result); // >>> 200
                        // REMOVE_START
                        assertThat(result).isEqualTo(200);
                        // REMOVE_END
                    }).then();
            // STEP_END
            leaderboard.block();
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
    }

}
// HIDE_END
