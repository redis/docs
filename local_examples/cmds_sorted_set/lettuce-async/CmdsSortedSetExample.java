// EXAMPLE: cmds_sorted_set
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsSortedSetExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START zadd
            CompletableFuture<Void> zAddExample = asyncCommands.zadd("myzset", ScoredValue.just(1d, "one"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> 1
                        // REMOVE_START
                        assertThat(res1).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.zadd("myzset", ScoredValue.just(1d, "uno"));
                    }).thenCompose(res2 -> {
                        System.out.println(res2); // >>> 1
                        // REMOVE_START
                        assertThat(res2).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.zadd("myzset",
                                ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three"));
                    }).thenCompose(res3 -> {
                        System.out.println(res3); // >>> 2
                        // REMOVE_START
                        assertThat(res3).isEqualTo(2L);
                        // REMOVE_END
                        return asyncCommands.zrangeWithScores("myzset", 0, -1);
                    }).thenAccept(res4 -> {
                        System.out.println(res4);
                        // >>> [ScoredValue[1.000000, one], ScoredValue[1.000000, uno],
                        // >>>  ScoredValue[2.000000, two], ScoredValue[3.000000, three]]
                        // REMOVE_START
                        assertThat(res4.stream().map(ScoredValue::getValue).collect(Collectors.toList()))
                                .containsExactly("one", "uno", "two", "three");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            zAddExample.join();
            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START zrange1
            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> zRange1Example = asyncCommands.zadd("myzset",
                    ScoredValue.just(1d, "one"), ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three"))
                    .thenCompose(res5 -> {
                        System.out.println(res5); // >>> 3
                        // REMOVE_START
                        assertThat(res5).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.zrange("myzset", 0, -1);
                    }).thenCompose(res6 -> {
                        System.out.println(res6); // >>> [one, two, three]
                        // REMOVE_START
                        assertThat(res6).containsExactly("one", "two", "three");
                        // REMOVE_END
                        return asyncCommands.zrange("myzset", 2, 3);
                    }).thenCompose(res7 -> {
                        System.out.println(res7); // >>> [three]
                        // REMOVE_START
                        assertThat(res7).containsExactly("three");
                        // REMOVE_END
                        return asyncCommands.zrange("myzset", -2, -1);
                    }).thenAccept(res8 -> {
                        System.out.println(res8); // >>> [two, three]
                        // REMOVE_START
                        assertThat(res8).containsExactly("two", "three");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            zRange1Example.join();
            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START zrange2
            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> zRange2Example = asyncCommands.zadd("myzset",
                    ScoredValue.just(1d, "one"), ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three"))
                    .thenCompose(res9 -> {
                        // REMOVE_START
                        assertThat(res9).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.zrangeWithScores("myzset", 0, 1);
                    }).thenAccept(res10 -> {
                        System.out.println(res10);
                        // >>> [ScoredValue[1.000000, one], ScoredValue[2.000000, two]]
                        // REMOVE_START
                        assertThat(res10.stream().map(ScoredValue::getValue).collect(Collectors.toList()))
                                .containsExactly("one", "two");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            zRange2Example.join();
            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START zrange3
            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> zRange3Example = asyncCommands.zadd("myzset",
                    ScoredValue.just(1d, "one"), ScoredValue.just(2d, "two"), ScoredValue.just(3d, "three"))
                    .thenCompose(res11 -> {
                        // REMOVE_START
                        assertThat(res11).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.zrangebyscore("myzset",
                                Range.from(Range.Boundary.excluding(1d), Range.Boundary.unbounded()),
                                Limit.create(1, 1));
                    }).thenAccept(res12 -> {
                        System.out.println(res12); // >>> [three]
                        // REMOVE_START
                        assertThat(res12).containsExactly("three");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            zRange3Example.join();
            // REMOVE_START
            asyncCommands.del("myzset").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
