// EXAMPLE: cmds_sorted_set
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.*;
import java.util.stream.Collectors;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

public class CmdsSortedSetExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            reactiveCommands.del("myzset").block();
            // REMOVE_END

            // STEP_START zadd
            Mono<Void> zAddExample = reactiveCommands.zadd("myzset", ScoredValue.just(1d, "one"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> 1
                        // REMOVE_START
                        assertThat(res1).isEqualTo(1L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.zadd("myzset", ScoredValue.just(1d, "uno")))
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> 1
                        // REMOVE_START
                        assertThat(res2).isEqualTo(1L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.zadd("myzset",
                            ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three")))
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> 2
                        // REMOVE_START
                        assertThat(res3).isEqualTo(2L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.zrangeWithScores("myzset", 0, -1).collectList())
                    .doOnNext(res4 -> {
                        System.out.println(res4);
                        // >>> [ScoredValue[1.000000, one], ScoredValue[1.000000, uno],
                        // >>>  ScoredValue[2.000000, two], ScoredValue[3.000000, three]]
                        // REMOVE_START
                        assertThat(res4.stream().map(ScoredValue::getValue).collect(Collectors.toList()))
                                .containsExactly("one", "uno", "two", "three");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            zAddExample.block();
            // REMOVE_START
            reactiveCommands.del("myzset").block();
            // REMOVE_END

            // STEP_START zrange1
            Mono<Void> zRange1Example = reactiveCommands.zadd("myzset",
                    ScoredValue.just(1d, "one"), ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three"))
                    .doOnNext(res5 -> {
                        System.out.println(res5); // >>> 3
                        // REMOVE_START
                        assertThat(res5).isEqualTo(3L);
                        // REMOVE_END
                    })
                    .then(reactiveCommands.zrange("myzset", 0, -1).collectList())
                    .doOnNext(res6 -> {
                        System.out.println(res6); // >>> [one, two, three]
                        // REMOVE_START
                        assertThat(res6).containsExactly("one", "two", "three");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.zrange("myzset", 2, 3).collectList())
                    .doOnNext(res7 -> {
                        System.out.println(res7); // >>> [three]
                        // REMOVE_START
                        assertThat(res7).containsExactly("three");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.zrange("myzset", -2, -1).collectList())
                    .doOnNext(res8 -> {
                        System.out.println(res8); // >>> [two, three]
                        // REMOVE_START
                        assertThat(res8).containsExactly("two", "three");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            zRange1Example.block();
            // REMOVE_START
            reactiveCommands.del("myzset").block();
            // REMOVE_END

            // STEP_START zrange2
            Mono<Void> zRange2Example = reactiveCommands.zadd("myzset",
                    ScoredValue.just(1d, "one"), ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three"))
                    .then(reactiveCommands.zrangeWithScores("myzset", 0, 1).collectList())
                    .doOnNext(res9 -> {
                        System.out.println(res9);
                        // >>> [ScoredValue[1.000000, one], ScoredValue[2.000000, two]]
                        // REMOVE_START
                        assertThat(res9.stream().map(ScoredValue::getValue).collect(Collectors.toList()))
                                .containsExactly("one", "two");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            zRange2Example.block();
            // REMOVE_START
            reactiveCommands.del("myzset").block();
            // REMOVE_END

            // STEP_START zrange3
            Mono<Void> zRange3Example = reactiveCommands.zadd("myzset",
                    ScoredValue.just(1d, "one"), ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three"))
                    .then(reactiveCommands.zrangebyscore("myzset",
                            Range.from(Range.Boundary.excluding(1d), Range.Boundary.unbounded()),
                            Limit.create(1, 1)).collectList())
                    .doOnNext(res10 -> {
                        System.out.println(res10); // >>> [three]
                        // REMOVE_START
                        assertThat(res10).containsExactly("three");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            zRange3Example.block();
            // REMOVE_START
            reactiveCommands.del("myzset").block();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
