// EXAMPLE: home_prob_dts
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.Value;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.probabilistic.IncrementPair;
import io.lettuce.core.probabilistic.arguments.TopKReserveArgs;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import java.util.ArrayList;
import java.util.List;
// HIDE_END

public class HomeProbExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // REMOVE_START
            reactiveCommands.del("recorded_users", "other_users",
                    "group:1", "group:2", "both_groups",
                    "items_sold", "male_heights", "female_heights", "all_heights",
                    "top_3_songs").block();
            // REMOVE_END

            // STEP_START bloom
            List<Boolean> res1 = reactiveCommands
                    .bfMAdd("recorded_users", "andy", "cameron", "david", "michelle")
                    .map(Value::getValue)
                    .collectList()
                    .block();
            System.out.println(res1);
            // >>> [true, true, true, true]
            // REMOVE_START
            assertThat(res1.toString()).isEqualTo("[true, true, true, true]");
            // REMOVE_END

            Boolean res2 = reactiveCommands.bfExists("recorded_users", "cameron").block();
            System.out.println(res2);
            // >>> true
            // REMOVE_START
            assertThat(res2).isTrue();
            // REMOVE_END

            Boolean res3 = reactiveCommands.bfExists("recorded_users", "kaitlyn").block();
            System.out.println(res3);
            // >>> false
            // REMOVE_START
            assertThat(res3).isFalse();
            // REMOVE_END
            // STEP_END

            // STEP_START cuckoo
            Boolean res4 = reactiveCommands.cfAdd("other_users", "paolo").block();
            System.out.println(res4);
            // >>> true
            // REMOVE_START
            assertThat(res4).isTrue();
            // REMOVE_END

            Boolean res5 = reactiveCommands.cfAdd("other_users", "kaitlyn").block();
            System.out.println(res5);
            // >>> true
            // REMOVE_START
            assertThat(res5).isTrue();
            // REMOVE_END

            Boolean res6 = reactiveCommands.cfAdd("other_users", "rachel").block();
            System.out.println(res6);
            // >>> true
            // REMOVE_START
            assertThat(res6).isTrue();
            // REMOVE_END

            List<Boolean> res7 = reactiveCommands
                    .cfMExists("other_users", "paolo", "rachel", "andy")
                    .collectList()
                    .block();
            System.out.println(res7);
            // >>> [true, true, false]
            // REMOVE_START
            assertThat(res7.toString()).isEqualTo("[true, true, false]");
            // REMOVE_END

            Boolean res8 = reactiveCommands.cfDel("other_users", "paolo").block();
            System.out.println(res8);
            // >>> true
            // REMOVE_START
            assertThat(res8).isTrue();
            // REMOVE_END

            Boolean res9 = reactiveCommands.cfExists("other_users", "paolo").block();
            System.out.println(res9);
            // >>> false
            // REMOVE_START
            assertThat(res9).isFalse();
            // REMOVE_END
            // STEP_END

            // STEP_START hyperloglog
            Long res10 = reactiveCommands.pfadd("group:1", "andy", "cameron", "david").block();
            System.out.println(res10);
            // >>> 1
            // REMOVE_START
            assertThat(res10).isEqualTo(1L);
            // REMOVE_END

            Long res11 = reactiveCommands.pfcount("group:1").block();
            System.out.println(res11);
            // >>> 3
            // REMOVE_START
            assertThat(res11).isEqualTo(3L);
            // REMOVE_END

            Long res12 = reactiveCommands.pfadd("group:2", "kaitlyn", "michelle", "paolo", "rachel").block();
            System.out.println(res12);
            // >>> 1
            // REMOVE_START
            assertThat(res12).isEqualTo(1L);
            // REMOVE_END

            Long res13 = reactiveCommands.pfcount("group:2").block();
            System.out.println(res13);
            // >>> 4
            // REMOVE_START
            assertThat(res13).isEqualTo(4L);
            // REMOVE_END

            String res14 = reactiveCommands.pfmerge("both_groups", "group:1", "group:2").block();
            System.out.println(res14);
            // >>> OK
            // REMOVE_START
            assertThat(res14).isEqualTo("OK");
            // REMOVE_END

            Long res15 = reactiveCommands.pfcount("both_groups").block();
            System.out.println(res15);
            // >>> 7
            // REMOVE_START
            assertThat(res15).isEqualTo(7L);
            // REMOVE_END
            // STEP_END

            // STEP_START cms
            // Specify that you want to keep the counts within 0.01
            // (1%) of the true value with a 0.005 (0.5%) chance
            // of going outside this limit.
            String res16 = reactiveCommands.cmsInitByProb("items_sold", 0.01, 0.005).block();
            System.out.println(res16);
            // >>> OK
            // REMOVE_START
            assertThat(res16).isEqualTo("OK");
            // REMOVE_END

            List<Long> res17 = new ArrayList<>(reactiveCommands
                    .cmsIncrBy("items_sold",
                            IncrementPair.of("bread", 300L),
                            IncrementPair.of("tea", 200L),
                            IncrementPair.of("coffee", 200L),
                            IncrementPair.of("beer", 100L))
                    .collectList()
                    .block());
            res17.sort(null);
            System.out.println(res17);
            // >>> [100, 200, 200, 300]
            // REMOVE_START
            assertThat(res17.toString()).isEqualTo("[100, 200, 200, 300]");
            // REMOVE_END

            List<Long> res18 = new ArrayList<>(reactiveCommands
                    .cmsIncrBy("items_sold",
                            IncrementPair.of("bread", 100L),
                            IncrementPair.of("coffee", 150L))
                    .collectList()
                    .block());
            res18.sort(null);
            System.out.println(res18);
            // >>> [350, 400]
            // REMOVE_START
            assertThat(res18.toString()).isEqualTo("[350, 400]");
            // REMOVE_END

            List<Long> res19 = new ArrayList<>(reactiveCommands
                    .cmsQuery("items_sold", "bread", "tea", "coffee", "beer")
                    .collectList()
                    .block());
            res19.sort(null);
            System.out.println(res19);
            // >>> [100, 200, 350, 400]
            // REMOVE_START
            assertThat(res19.toString()).isEqualTo("[100, 200, 350, 400]");
            // REMOVE_END
            // STEP_END

            // STEP_START tdigest
            String res20 = reactiveCommands.tdigestCreate("male_heights").block();
            System.out.println(res20);
            // >>> OK
            // REMOVE_START
            assertThat(res20).isEqualTo("OK");
            // REMOVE_END

            String res21 = reactiveCommands.tdigestAdd("male_heights",
                    "175.5", "181", "160.8", "152", "177", "196", "164").block();
            System.out.println(res21);
            // >>> OK
            // REMOVE_START
            assertThat(res21).isEqualTo("OK");
            // REMOVE_END

            Double res22 = reactiveCommands.tdigestMin("male_heights").block();
            System.out.println(res22);
            // >>> 152.0
            // REMOVE_START
            assertThat(res22).isEqualTo(152.0);
            // REMOVE_END

            Double res23 = reactiveCommands.tdigestMax("male_heights").block();
            System.out.println(res23);
            // >>> 196.0
            // REMOVE_START
            assertThat(res23).isEqualTo(196.0);
            // REMOVE_END

            List<Double> res24 = reactiveCommands.tdigestQuantile("male_heights", 0.75)
                    .collectList().block();
            System.out.println(res24);
            // >>> [181.0]
            // REMOVE_START
            assertThat(res24.toString()).isEqualTo("[181.0]");
            // REMOVE_END

            // Note that the CDF value for 181 is not exactly 0.75.
            // Both values are estimates.
            List<Double> res25 = reactiveCommands.tdigestCDF("male_heights", "181")
                    .collectList().block();
            System.out.println(res25);
            // >>> [0.7857142857142857]

            String res26 = reactiveCommands.tdigestCreate("female_heights").block();
            System.out.println(res26);
            // >>> OK
            // REMOVE_START
            assertThat(res26).isEqualTo("OK");
            // REMOVE_END

            String res27 = reactiveCommands.tdigestAdd("female_heights",
                    "155.5", "161", "168.5", "170", "157.5", "163", "171").block();
            System.out.println(res27);
            // >>> OK
            // REMOVE_START
            assertThat(res27).isEqualTo("OK");
            // REMOVE_END

            List<Double> res28 = reactiveCommands.tdigestQuantile("female_heights", 0.75)
                    .collectList().block();
            System.out.println(res28);
            // >>> [170.0]
            // REMOVE_START
            assertThat(res28.toString()).isEqualTo("[170.0]");
            // REMOVE_END

            String res29 = reactiveCommands.tdigestMerge("all_heights", "male_heights", "female_heights").block();
            System.out.println(res29);
            // >>> OK
            // REMOVE_START
            assertThat(res29).isEqualTo("OK");
            // REMOVE_END

            List<Double> res30 = reactiveCommands.tdigestQuantile("all_heights", 0.75)
                    .collectList().block();
            System.out.println(res30);
            // >>> [175.5]
            // REMOVE_START
            assertThat(res30.toString()).isEqualTo("[175.5]");
            // REMOVE_END
            // STEP_END

            // STEP_START topk
            String res31 = reactiveCommands.topKReserve("top_3_songs", 3L,
                    TopKReserveArgs.Builder.width(2000L).depth(7L).decay(0.925)).block();
            System.out.println(res31);
            // >>> OK
            // REMOVE_START
            assertThat(res31).isEqualTo("OK");
            // REMOVE_END

            List<String> res32 = reactiveCommands
                    .topKIncrBy("top_3_songs",
                            IncrementPair.of("Starfish Trooper", 3000L),
                            IncrementPair.of("Only one more time", 1850L),
                            IncrementPair.of("Rock me, Handel", 1325L),
                            IncrementPair.of("How will anyone know?", 3890L),
                            IncrementPair.of("Average lover", 4098L),
                            IncrementPair.of("Road to everywhere", 770L))
                    .map(v -> v.getValueOrElse(null))
                    .collectList()
                    .block();
            System.out.println(res32);
            // >>> [null, null, null, null, null, Rock me, Handel]

            List<String> res33 = reactiveCommands.topKList("top_3_songs").collectList().block();
            System.out.println(res33);
            // >>> [Average lover, How will anyone know?, Starfish Trooper]
            // REMOVE_START
            assertThat(res33).contains("Average lover", "How will anyone know?", "Starfish Trooper");
            // REMOVE_END

            List<Boolean> res34 = reactiveCommands
                    .topKQuery("top_3_songs", "Starfish Trooper", "Road to everywhere")
                    .collectList()
                    .block();
            System.out.println(res34);
            // >>> [true, false]
            // REMOVE_START
            assertThat(res34.toString()).isEqualTo("[true, false]");
            // REMOVE_END
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("recorded_users", "other_users",
                    "group:1", "group:2", "both_groups",
                    "items_sold", "male_heights", "female_heights", "all_heights",
                    "top_3_songs").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
