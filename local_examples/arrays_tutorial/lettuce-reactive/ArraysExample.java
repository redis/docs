// EXAMPLE: arrays_tutorial
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.array.ArAggregateType;
import io.lettuce.core.array.ArGrepArgs;
import io.lettuce.core.array.IndexedValue;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;
// HIDE_END

public class ArraysExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // HIDE_END

            // STEP_START arset_arget
            // REMOVE_START
            reactiveCommands.del("events:1").block();
            // REMOVE_END
            Mono<Long> arsetArget1 = reactiveCommands.arset("events:1", 0, "login", "click", "purchase")
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 3
                        // REMOVE_START
                        assertThat(result).isEqualTo(3L);
                        // REMOVE_END
                    });

            arsetArget1.block();

            Mono<String> arsetArget2 = reactiveCommands.arget("events:1", 0).doOnNext(result -> {
                System.out.println(result); // >>> login
                // REMOVE_START
                assertThat(result).isEqualTo("login");
                // REMOVE_END
            });

            arsetArget2.block();

            Mono<Optional<String>> arsetArget3 = reactiveCommands.arget("events:1", 999)
                    .map(Optional::of)
                    .defaultIfEmpty(Optional.empty())
                    .doOnNext(result -> {
                        System.out.println(result.orElse(null)); // >>> null
                        // REMOVE_START
                        assertThat(result).isEmpty();
                        // REMOVE_END
                    });

            arsetArget3.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("events:1").block();
            // REMOVE_END

            // STEP_START armset_armget
            // REMOVE_START
            reactiveCommands.del("metrics").block();
            // REMOVE_END
            Map<Long, String> armsetParams = new HashMap<>();
            armsetParams.put(0L, "10");
            armsetParams.put(5L, "20");
            armsetParams.put(100L, "30");

            Mono<Long> armsetArmget1 = reactiveCommands.armset("metrics", armsetParams).doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo(3L);
                // REMOVE_END
            });

            armsetArmget1.block();

            Mono<List<String>> armsetArmget2 = reactiveCommands.armget("metrics", 0, 5, 100, 999)
                    .collectList()
                    .map(values -> values.stream()
                            .map(value -> value.getValueOrElse(null))
                            .collect(Collectors.toList()))
                    .doOnNext(result -> {
                        System.out.println(result); // >>> [10, 20, 30, null]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList("10", "20", "30", null));
                        // REMOVE_END
                    });

            armsetArmget2.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("metrics").block();
            // REMOVE_END

            // STEP_START len_count
            // REMOVE_START
            reactiveCommands.del("sparse").block();
            // REMOVE_END
            Mono<Long> lenCount1 = reactiveCommands.arset("sparse", 0, "a").doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            lenCount1.block();

            Mono<Long> lenCount2 = reactiveCommands.arset("sparse", 1000000, "b").doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            lenCount2.block();

            Mono<Long> lenCount3 = reactiveCommands.arlen("sparse").doOnNext(result -> {
                System.out.println(result); // >>> 1000001
                // REMOVE_START
                assertThat(result).isEqualTo(1000001L);
                // REMOVE_END
            });

            lenCount3.block();

            Mono<Long> lenCount4 = reactiveCommands.arcount("sparse").doOnNext(result -> {
                System.out.println(result); // >>> 2
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            lenCount4.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("sparse").block();
            // REMOVE_END

            // STEP_START argetrange
            // REMOVE_START
            reactiveCommands.del("seq").block();
            // REMOVE_END
            Map<Long, String> argetrangeParams = new HashMap<>();
            argetrangeParams.put(0L, "a");
            argetrangeParams.put(1L, "b");
            argetrangeParams.put(3L, "d");

            Mono<Long> argetrange1 = reactiveCommands.armset("seq", argetrangeParams).doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo(3L);
                // REMOVE_END
            });

            argetrange1.block();

            Mono<List<String>> argetrange2 = reactiveCommands.argetrange("seq", 0, 3)
                    .collectList()
                    .map(values -> values.stream()
                            .map(value -> value.getValueOrElse(null))
                            .collect(Collectors.toList()))
                    .doOnNext(result -> {
                        System.out.println(result); // >>> [a, b, null, d]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList("a", "b", null, "d"));
                        // REMOVE_END
                    });

            argetrange2.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("seq").block();
            // REMOVE_END

            // STEP_START arscan
            // REMOVE_START
            reactiveCommands.del("seq").block();
            // REMOVE_END
            Map<Long, String> arscanParams = new HashMap<>();
            arscanParams.put(0L, "a");
            arscanParams.put(1L, "b");
            arscanParams.put(3L, "d");

            Mono<Long> arscan1 = reactiveCommands.armset("seq", arscanParams).doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo(3L);
                // REMOVE_END
            });

            arscan1.block();

            Mono<List<IndexedValue<String>>> arscan2 = reactiveCommands.arscan("seq", 0, 3)
                    .doOnNext(entry -> {
                        System.out.println(entry.getIndex() + " -> " + entry.getValue());
                        // >>> 0 -> a
                        // >>> 1 -> b
                        // >>> 3 -> d
                    })
                    .collectList()
                    // REMOVE_START
                    .doOnNext(result -> {
                        assertThat(result.size()).isEqualTo(3);
                        assertThat(result.get(0).getIndex()).isEqualTo(0L);
                        assertThat(result.get(0).getValue()).isEqualTo("a");
                        assertThat(result.get(1).getIndex()).isEqualTo(1L);
                        assertThat(result.get(1).getValue()).isEqualTo("b");
                        assertThat(result.get(2).getIndex()).isEqualTo(3L);
                        assertThat(result.get(2).getValue()).isEqualTo("d");
                    })
                    // REMOVE_END
            ;

            arscan2.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("seq").block();
            // REMOVE_END

            // STEP_START arinsert
            // REMOVE_START
            reactiveCommands.del("log").block();
            // REMOVE_END
            Mono<Long> arinsert1 = reactiveCommands.arinsert("log", "event1").doOnNext(result -> {
                System.out.println(result); // >>> 0
                // REMOVE_START
                assertThat(result).isEqualTo(0L);
                // REMOVE_END
            });

            arinsert1.block();

            Mono<Long> arinsert2 = reactiveCommands.arinsert("log", "event2").doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            arinsert2.block();

            Mono<Long> arinsert3 = reactiveCommands.arnext("log").doOnNext(result -> {
                System.out.println(result); // >>> 2
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            arinsert3.block();

            Mono<Long> arinsert4 = reactiveCommands.arseek("log", 10).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            arinsert4.block();

            Mono<Long> arinsert5 = reactiveCommands.arinsert("log", "event3").doOnNext(result -> {
                System.out.println(result); // >>> 10
                // REMOVE_START
                assertThat(result).isEqualTo(10L);
                // REMOVE_END
            });

            arinsert5.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("log").block();
            // REMOVE_END

            // STEP_START arring
            // REMOVE_START
            reactiveCommands.del("readings").block();
            // REMOVE_END
            Mono<Long> arring1 = reactiveCommands.arring("readings", 3, "v0").doOnNext(result -> {
                System.out.println(result); // >>> 0
                // REMOVE_START
                assertThat(result).isEqualTo(0L);
                // REMOVE_END
            });

            arring1.block();

            Mono<Long> arring2 = reactiveCommands.arring("readings", 3, "v1").doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            arring2.block();

            Mono<Long> arring3 = reactiveCommands.arring("readings", 3, "v2").doOnNext(result -> {
                System.out.println(result); // >>> 2
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            arring3.block();

            Mono<Long> arring4 = reactiveCommands.arring("readings", 3, "v3").doOnNext(result -> {
                System.out.println(result); // >>> 0
                // REMOVE_START
                assertThat(result).isEqualTo(0L);
                // REMOVE_END
            });

            arring4.block();

            Mono<String> arring5 = reactiveCommands.arget("readings", 0).doOnNext(result -> {
                System.out.println(result); // >>> v3
                // REMOVE_START
                assertThat(result).isEqualTo("v3");
                // REMOVE_END
            });

            arring5.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("readings").block();
            // REMOVE_END

            // STEP_START arlastitems
            // REMOVE_START
            reactiveCommands.del("readings").block();
            // REMOVE_END
            // Set up the ring: insert v0, v1, v2, v3 into a size-3 ring.
            reactiveCommands.arring("readings", 3, "v0").block();
            reactiveCommands.arring("readings", 3, "v1").block();
            reactiveCommands.arring("readings", 3, "v2").block();
            reactiveCommands.arring("readings", 3, "v3").block();

            Mono<List<String>> arlastitems1 = reactiveCommands.arlastitems("readings", 3).collectList()
                    .doOnNext(result -> {
                        System.out.println(result); // >>> [v1, v2, v3]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList("v1", "v2", "v3"));
                        // REMOVE_END
                    });

            arlastitems1.block();

            Mono<List<String>> arlastitems2 = reactiveCommands.arlastitems("readings", 3, true).collectList()
                    .doOnNext(result -> {
                        System.out.println(result); // >>> [v3, v2, v1]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList("v3", "v2", "v1"));
                        // REMOVE_END
                    });

            arlastitems2.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("readings").block();
            // REMOVE_END

            // STEP_START arop
            // REMOVE_START
            reactiveCommands.del("scores").block();
            // REMOVE_END
            Map<Long, String> aropParams = new HashMap<>();
            aropParams.put(0L, "10");
            aropParams.put(1L, "20");
            aropParams.put(2L, "30");

            Mono<Long> arop1 = reactiveCommands.armset("scores", aropParams).doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo(3L);
                // REMOVE_END
            });

            arop1.block();

            Mono<String> arop2 = reactiveCommands.aropAggregate("scores", 0, 2, ArAggregateType.SUM)
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 60
                        // REMOVE_START
                        assertThat(result).isEqualTo("60");
                        // REMOVE_END
                    });

            arop2.block();

            Mono<String> arop3 = reactiveCommands.aropAggregate("scores", 0, 2, ArAggregateType.MAX)
                    .doOnNext(result -> {
                        System.out.println(result); // >>> 30
                        // REMOVE_START
                        assertThat(result).isEqualTo("30");
                        // REMOVE_END
                    });

            arop3.block();

            Mono<Long> arop4 = reactiveCommands.aropCount("scores", 0, 2, "10").doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            arop4.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("scores").block();
            // REMOVE_END

            // STEP_START argrep
            // REMOVE_START
            reactiveCommands.del("log").block();
            // REMOVE_END
            Map<Long, String> argrepParams = new HashMap<>();
            argrepParams.put(0L, "boot: ok");
            argrepParams.put(1L, "warn: disk");
            argrepParams.put(2L, "ERROR: cpu");
            argrepParams.put(3L, "info: ready");
            argrepParams.put(4L, "error: net");

            Mono<Long> argrep1 = reactiveCommands.armset("log", argrepParams).doOnNext(result -> {
                System.out.println(result); // >>> 5
                // REMOVE_START
                assertThat(result).isEqualTo(5L);
                // REMOVE_END
            });

            argrep1.block();

            Mono<List<Long>> argrep2 = reactiveCommands.argrep("log", ArGrepArgs.range(0, 4).match("error").nocase())
                    .collectList()
                    .doOnNext(result -> {
                        System.out.println(result); // >>> [2, 4]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList(2L, 4L));
                        // REMOVE_END
                    });

            argrep2.block();

            Mono<List<IndexedValue<String>>> argrep3 = reactiveCommands
                    .argrepWithValues("log", ArGrepArgs.range(0, 4).glob("warn:*").glob("error:*"))
                    .doOnNext(entry -> {
                        System.out.println(entry.getIndex() + " -> " + entry.getValue());
                        // >>> 1 -> warn: disk
                        // >>> 4 -> error: net
                    })
                    .collectList()
                    // REMOVE_START
                    .doOnNext(result -> {
                        assertThat(result.size()).isEqualTo(2);
                        assertThat(result.get(0).getIndex()).isEqualTo(1L);
                        assertThat(result.get(0).getValue()).isEqualTo("warn: disk");
                        assertThat(result.get(1).getIndex()).isEqualTo(4L);
                        assertThat(result.get(1).getValue()).isEqualTo("error: net");
                    })
                    // REMOVE_END
            ;

            argrep3.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("log").block();
            // REMOVE_END

            // STEP_START ardel
            // REMOVE_START
            reactiveCommands.del("scores").block();
            // REMOVE_END
            Map<Long, String> ardelParams = new HashMap<>();
            ardelParams.put(0L, "10");
            ardelParams.put(1L, "20");
            ardelParams.put(2L, "30");

            Mono<Long> ardel1 = reactiveCommands.armset("scores", ardelParams).doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo(3L);
                // REMOVE_END
            });

            ardel1.block();

            Mono<Long> ardel2 = reactiveCommands.ardel("scores", 1).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            ardel2.block();

            Mono<Long> ardel3 = reactiveCommands.ardelrange("scores", 0, 2).doOnNext(result -> {
                System.out.println(result); // >>> 2
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            ardel3.block();
            // STEP_END
            // REMOVE_START
            reactiveCommands.del("scores").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }

}
