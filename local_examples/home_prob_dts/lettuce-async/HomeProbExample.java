// EXAMPLE: home_prob_dts
package io.redis.examples.async;

// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.probabilistic.IncrementPair;
import io.lettuce.core.probabilistic.arguments.TopKReserveArgs;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class HomeProbExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // HIDE_END

            // REMOVE_START
            asyncCommands.del("recorded_users", "other_users",
                    "group:1", "group:2", "both_groups",
                    "items_sold", "male_heights", "female_heights", "all_heights",
                    "top_3_songs").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START bloom
            CompletableFuture<Void> bloomExample = asyncCommands
                    .bfMAdd("recorded_users", "andy", "cameron", "david", "michelle")
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> [true, true, true, true]
                        // REMOVE_START
                        assertThat(res1.toString()).isEqualTo("[true, true, true, true]");
                        // REMOVE_END
                        return asyncCommands.bfExists("recorded_users", "cameron");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> true
                        // REMOVE_START
                        assertThat(res2).isTrue();
                        // REMOVE_END
                        return asyncCommands.bfExists("recorded_users", "kaitlyn");
                    })
                    .thenAccept(res3 -> {
                        System.out.println(res3);
                        // >>> false
                        // REMOVE_START
                        assertThat(res3).isFalse();
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            bloomExample.join();
            // STEP_END

            // STEP_START cuckoo
            CompletableFuture<Void> cuckooExample = asyncCommands
                    .cfAdd("other_users", "paolo")
                    .thenCompose(res4 -> {
                        System.out.println(res4);
                        // >>> true
                        // REMOVE_START
                        assertThat(res4).isTrue();
                        // REMOVE_END
                        return asyncCommands.cfAdd("other_users", "kaitlyn");
                    })
                    .thenCompose(res5 -> {
                        System.out.println(res5);
                        // >>> true
                        // REMOVE_START
                        assertThat(res5).isTrue();
                        // REMOVE_END
                        return asyncCommands.cfAdd("other_users", "rachel");
                    })
                    .thenCompose(res6 -> {
                        System.out.println(res6);
                        // >>> true
                        // REMOVE_START
                        assertThat(res6).isTrue();
                        // REMOVE_END
                        return asyncCommands.cfMExists("other_users", "paolo", "rachel", "andy");
                    })
                    .thenCompose(res7 -> {
                        System.out.println(res7);
                        // >>> [true, true, false]
                        // REMOVE_START
                        assertThat(res7.toString()).isEqualTo("[true, true, false]");
                        // REMOVE_END
                        return asyncCommands.cfDel("other_users", "paolo");
                    })
                    .thenCompose(res8 -> {
                        System.out.println(res8);
                        // >>> true
                        // REMOVE_START
                        assertThat(res8).isTrue();
                        // REMOVE_END
                        return asyncCommands.cfExists("other_users", "paolo");
                    })
                    .thenAccept(res9 -> {
                        System.out.println(res9);
                        // >>> false
                        // REMOVE_START
                        assertThat(res9).isFalse();
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            cuckooExample.join();
            // STEP_END

            // STEP_START hyperloglog
            CompletableFuture<Void> hllExample = asyncCommands
                    .pfadd("group:1", "andy", "cameron", "david")
                    .thenCompose(res10 -> {
                        System.out.println(res10);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res10).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.pfcount("group:1");
                    })
                    .thenCompose(res11 -> {
                        System.out.println(res11);
                        // >>> 3
                        // REMOVE_START
                        assertThat(res11).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.pfadd("group:2", "kaitlyn", "michelle", "paolo", "rachel");
                    })
                    .thenCompose(res12 -> {
                        System.out.println(res12);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res12).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.pfcount("group:2");
                    })
                    .thenCompose(res13 -> {
                        System.out.println(res13);
                        // >>> 4
                        // REMOVE_START
                        assertThat(res13).isEqualTo(4L);
                        // REMOVE_END
                        return asyncCommands.pfmerge("both_groups", "group:1", "group:2");
                    })
                    .thenCompose(res14 -> {
                        System.out.println(res14);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res14).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.pfcount("both_groups");
                    })
                    .thenAccept(res15 -> {
                        System.out.println(res15);
                        // >>> 7
                        // REMOVE_START
                        assertThat(res15).isEqualTo(7L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            hllExample.join();
            // STEP_END

            // STEP_START cms
            CompletableFuture<Void> cmsExample = asyncCommands
                    // Specify that you want to keep the counts within 0.01
                    // (1%) of the true value with a 0.005 (0.5%) chance
                    // of going outside this limit.
                    .cmsInitByProb("items_sold", 0.01, 0.005)
                    .thenCompose(res16 -> {
                        System.out.println(res16);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res16).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.cmsIncrBy("items_sold",
                                IncrementPair.of("bread", 300L),
                                IncrementPair.of("tea", 200L),
                                IncrementPair.of("coffee", 200L),
                                IncrementPair.of("beer", 100L));
                    })
                    .thenCompose(res17 -> {
                        List<Long> sorted17 = new ArrayList<>(res17);
                        sorted17.sort(null);
                        System.out.println(sorted17);
                        // >>> [100, 200, 200, 300]
                        // REMOVE_START
                        assertThat(sorted17.toString()).isEqualTo("[100, 200, 200, 300]");
                        // REMOVE_END
                        return asyncCommands.cmsIncrBy("items_sold",
                                IncrementPair.of("bread", 100L),
                                IncrementPair.of("coffee", 150L));
                    })
                    .thenCompose(res18 -> {
                        List<Long> sorted18 = new ArrayList<>(res18);
                        sorted18.sort(null);
                        System.out.println(sorted18);
                        // >>> [350, 400]
                        // REMOVE_START
                        assertThat(sorted18.toString()).isEqualTo("[350, 400]");
                        // REMOVE_END
                        return asyncCommands.cmsQuery("items_sold", "bread", "tea", "coffee", "beer");
                    })
                    .thenAccept(res19 -> {
                        List<Long> sorted19 = new ArrayList<>(res19);
                        sorted19.sort(null);
                        System.out.println(sorted19);
                        // >>> [100, 200, 350, 400]
                        // REMOVE_START
                        assertThat(sorted19.toString()).isEqualTo("[100, 200, 350, 400]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            cmsExample.join();
            // STEP_END

            // STEP_START tdigest
            CompletableFuture<Void> tdigestExample = asyncCommands
                    .tdigestCreate("male_heights")
                    .thenCompose(res20 -> {
                        System.out.println(res20);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res20).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestAdd("male_heights",
                                "175.5", "181", "160.8", "152", "177", "196", "164");
                    })
                    .thenCompose(res21 -> {
                        System.out.println(res21);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res21).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestMin("male_heights");
                    })
                    .thenCompose(res22 -> {
                        System.out.println(res22);
                        // >>> 152.0
                        // REMOVE_START
                        assertThat(res22).isEqualTo(152.0);
                        // REMOVE_END
                        return asyncCommands.tdigestMax("male_heights");
                    })
                    .thenCompose(res23 -> {
                        System.out.println(res23);
                        // >>> 196.0
                        // REMOVE_START
                        assertThat(res23).isEqualTo(196.0);
                        // REMOVE_END
                        return asyncCommands.tdigestQuantile("male_heights", 0.75);
                    })
                    .thenCompose(res24 -> {
                        System.out.println(res24);
                        // >>> [181.0]
                        // REMOVE_START
                        assertThat(res24.toString()).isEqualTo("[181.0]");
                        // REMOVE_END
                        // Note that the CDF value for 181 is not exactly 0.75.
                        // Both values are estimates.
                        return asyncCommands.tdigestCDF("male_heights", "181");
                    })
                    .thenCompose(res25 -> {
                        System.out.println(res25);
                        // >>> [0.7857142857142857]
                        return asyncCommands.tdigestCreate("female_heights");
                    })
                    .thenCompose(res26 -> {
                        System.out.println(res26);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res26).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestAdd("female_heights",
                                "155.5", "161", "168.5", "170", "157.5", "163", "171");
                    })
                    .thenCompose(res27 -> {
                        System.out.println(res27);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res27).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestQuantile("female_heights", 0.75);
                    })
                    .thenCompose(res28 -> {
                        System.out.println(res28);
                        // >>> [170.0]
                        // REMOVE_START
                        assertThat(res28.toString()).isEqualTo("[170.0]");
                        // REMOVE_END
                        return asyncCommands.tdigestMerge("all_heights", "male_heights", "female_heights");
                    })
                    .thenCompose(res29 -> {
                        System.out.println(res29);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res29).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestQuantile("all_heights", 0.75);
                    })
                    .thenAccept(res30 -> {
                        System.out.println(res30);
                        // >>> [175.5]
                        // REMOVE_START
                        assertThat(res30.toString()).isEqualTo("[175.5]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            tdigestExample.join();
            // STEP_END

            // STEP_START topk
            CompletableFuture<Void> topkExample = asyncCommands
                    .topKReserve("top_3_songs", 3L,
                            TopKReserveArgs.Builder.width(2000L).depth(7L).decay(0.925))
                    .thenCompose(res31 -> {
                        System.out.println(res31);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res31).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.topKIncrBy("top_3_songs",
                                IncrementPair.of("Starfish Trooper", 3000L),
                                IncrementPair.of("Only one more time", 1850L),
                                IncrementPair.of("Rock me, Handel", 1325L),
                                IncrementPair.of("How will anyone know?", 3890L),
                                IncrementPair.of("Average lover", 4098L),
                                IncrementPair.of("Road to everywhere", 770L));
                    })
                    .thenCompose(res32 -> {
                        System.out.println(res32);
                        // >>> [null, null, null, null, null, Rock me, Handel]
                        return asyncCommands.topKList("top_3_songs");
                    })
                    .thenCompose(res33 -> {
                        System.out.println(res33);
                        // >>> [Average lover, How will anyone know?, Starfish Trooper]
                        // REMOVE_START
                        assertThat(res33).contains("Average lover", "How will anyone know?", "Starfish Trooper");
                        // REMOVE_END
                        return asyncCommands.topKQuery("top_3_songs", "Starfish Trooper", "Road to everywhere");
                    })
                    .thenAccept(res34 -> {
                        System.out.println(res34);
                        // >>> [true, false]
                        // REMOVE_START
                        assertThat(res34.toString()).isEqualTo("[true, false]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            topkExample.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("recorded_users", "other_users",
                    "group:1", "group:2", "both_groups",
                    "items_sold", "male_heights", "female_heights", "all_heights",
                    "top_3_songs").toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
