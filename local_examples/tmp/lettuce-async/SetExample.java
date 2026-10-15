// EXAMPLE: sets_tutorial
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import java.util.*;
import java.util.concurrent.CompletableFuture;

public class SetExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // REMOVE_START
            // Clean up any existing data
            asyncCommands.del("bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy")
                    .toCompletableFuture().join();
            // REMOVE_END

            // STEP_START sadd
            CompletableFuture<Void> sAdd = asyncCommands.sadd("bikes:racing:france", "bike:1").thenCompose(res1 -> {
                System.out.println(res1); // >>> 1
                // REMOVE_START
                assertThat(res1).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.sadd("bikes:racing:france", "bike:1");
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> 0
                // REMOVE_START
                assertThat(res2).isEqualTo(0L);
                // REMOVE_END
                return asyncCommands.sadd("bikes:racing:france", "bike:2", "bike:3");
            }).thenCompose(res3 -> {
                System.out.println(res3); // >>> 2
                // REMOVE_START
                assertThat(res3).isEqualTo(2L);
                // REMOVE_END
                return asyncCommands.sadd("bikes:racing:usa", "bike:1", "bike:4");
            }).thenAccept(res4 -> {
                System.out.println(res4); // >>> 2
                // REMOVE_START
                assertThat(res4).isEqualTo(2L);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END
            sAdd.join();

            // STEP_START sismember
            CompletableFuture<Void> sIsMember = asyncCommands.sismember("bikes:racing:usa", "bike:1").thenCompose(res5 -> {
                System.out.println(res5); // >>> true
                // REMOVE_START
                assertThat(res5).isTrue();
                // REMOVE_END
                return asyncCommands.sismember("bikes:racing:usa", "bike:2");
            }).thenAccept(res6 -> {
                System.out.println(res6); // >>> false
                // REMOVE_START
                assertThat(res6).isFalse();
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            // STEP_START sinter
            CompletableFuture<Void> sInter = asyncCommands.sinter("bikes:racing:france", "bikes:racing:usa")
                    .thenAccept(res7 -> {
                        System.out.println(res7); // >>> [bike:1]
                        // REMOVE_START
                        assertThat(res7).containsExactly("bike:1");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END

            // STEP_START scard
            CompletableFuture<Void> sCard = asyncCommands.scard("bikes:racing:france").thenAccept(res8 -> {
                System.out.println(res8); // >>> 3
                // REMOVE_START
                assertThat(res8).isEqualTo(3L);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            CompletableFuture.allOf(sIsMember, sInter, sCard).join();

            // STEP_START sadd_smembers
            CompletableFuture<Void> sAddSMembers = asyncCommands.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
                    .thenCompose(res9 -> {
                        System.out.println(res9); // >>> 3
                        // REMOVE_START
                        assertThat(res9).isEqualTo(0L);
                        // REMOVE_END
                        return asyncCommands.smembers("bikes:racing:france");
                    }).thenAccept(res10 -> {
                        System.out.println(res10); // >>> [bike:1, bike:2, bike:3]
                        // REMOVE_START
                        assertThat(res10).containsExactlyInAnyOrder("bike:1", "bike:2", "bike:3");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            sAddSMembers.join();

            // STEP_START smismember
            // Recreate the set so this example runs on its own. The chain is
            // ordered, so the DEL + SADD complete before the reads below.
            CompletableFuture<Void> sMIsMember = asyncCommands.del("bikes:racing:france")
                    .thenCompose(d -> asyncCommands.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3"))
                    .thenCompose(a -> asyncCommands.sismember("bikes:racing:france", "bike:1")).thenCompose(res11 -> {
                        System.out.println(res11); // >>> true
                        // REMOVE_START
                        assertThat(res11).isTrue();
                        // REMOVE_END
                        return asyncCommands.smismember("bikes:racing:france", "bike:2", "bike:3", "bike:4");
                    }).thenAccept(res12 -> {
                        System.out.println(res12); // >>> [true, true, false]
                        // REMOVE_START
                        assertThat(res12).containsExactly(true, true, false);
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            sMIsMember.join();

            // STEP_START sdiff
            CompletableFuture<Void> sDiff = asyncCommands.sdiff("bikes:racing:france", "bikes:racing:usa")
                    .thenAccept(res13 -> {
                        System.out.println(res13); // >>> [bike:2, bike:3]
                        // REMOVE_START
                        assertThat(res13).containsExactlyInAnyOrder("bike:2", "bike:3");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            sDiff.join();

            // STEP_START multisets
            CompletableFuture<Void> multisets = asyncCommands.sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3")
                    .thenCompose(res14 -> {
                        System.out.println(res14); // >>> 0
                        // REMOVE_START
                        assertThat(res14).isEqualTo(0L);
                        // REMOVE_END
                        return asyncCommands.sadd("bikes:racing:usa", "bike:1", "bike:4");
                    }).thenCompose(res15 -> {
                        System.out.println(res15); // >>> 0
                        // REMOVE_START
                        assertThat(res15).isEqualTo(0L);
                        // REMOVE_END
                        return asyncCommands.sadd("bikes:racing:italy", "bike:1", "bike:2", "bike:3", "bike:4");
                    }).thenCompose(res16 -> {
                        System.out.println(res16); // >>> 4
                        // REMOVE_START
                        assertThat(res16).isEqualTo(4L);
                        // REMOVE_END
                        return asyncCommands.sinter("bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy");
                    }).thenCompose(res17 -> {
                        System.out.println(res17); // >>> [bike:1]
                        // REMOVE_START
                        assertThat(res17).containsExactly("bike:1");
                        // REMOVE_END
                        return asyncCommands.sunion("bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy");
                    }).thenCompose(res18 -> {
                        System.out.println(res18); // >>> [bike:1, bike:2, bike:3, bike:4]
                        // REMOVE_START
                        assertThat(res18).containsExactlyInAnyOrder("bike:1", "bike:2", "bike:3", "bike:4");
                        // REMOVE_END
                        return asyncCommands.sdiff("bikes:racing:france", "bikes:racing:usa", "bikes:racing:italy");
                    }).thenCompose(res19 -> {
                        System.out.println(res19); // >>> []
                        // REMOVE_START
                        assertThat(res19).isEmpty();
                        // REMOVE_END
                        return asyncCommands.sdiff("bikes:racing:usa", "bikes:racing:france");
                    }).thenCompose(res20 -> {
                        System.out.println(res20); // >>> [bike:4]
                        // REMOVE_START
                        assertThat(res20).containsExactly("bike:4");
                        // REMOVE_END
                        return asyncCommands.sdiff("bikes:racing:france", "bikes:racing:usa");
                    }).thenAccept(res21 -> {
                        System.out.println(res21); // >>> [bike:2, bike:3]
                        // REMOVE_START
                        assertThat(res21).containsExactlyInAnyOrder("bike:2", "bike:3");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            multisets.join();

            // STEP_START srem
            CompletableFuture<Void> sRem = asyncCommands
                    .sadd("bikes:racing:france", "bike:1", "bike:2", "bike:3", "bike:4", "bike:5").thenCompose(res22 -> {
                        System.out.println(res22); // >>> 2
                        // REMOVE_START
                        assertThat(res22).isEqualTo(2L);
                        // REMOVE_END
                        return asyncCommands.srem("bikes:racing:france", "bike:1");
                    }).thenCompose(res23 -> {
                        System.out.println(res23); // >>> 1
                        // REMOVE_START
                        assertThat(res23).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.spop("bikes:racing:france");
                    }).thenCompose(res24 -> {
                        System.out.println(res24); // >>> bike:3 (for example)
                        return asyncCommands.smembers("bikes:racing:france");
                    }).thenCompose(res25 -> {
                        System.out.println(res25); // >>> [bike:2, bike:4, bike:5] (for example)
                        return asyncCommands.srandmember("bikes:racing:france");
                    }).thenAccept(res26 -> {
                        System.out.println(res26); // >>> bike:4 (for example)
                    }).toCompletableFuture();
            // STEP_END
            sRem.join();
        } finally {
            redisClient.shutdown();
        }
    }

}
