// EXAMPLE: arrays_tutorial
package io.redis.examples.async;

// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.array.ArAggregateType;
import io.lettuce.core.array.ArGrepArgs;
import io.lettuce.core.array.IndexedValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class ArraysExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // HIDE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // HIDE_END

            // STEP_START arset_arget
            // REMOVE_START
            asyncCommands.del("events:1").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> arsetArgetExample = asyncCommands
                    .arset("events:1", 0, "login", "click", "purchase")
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 3
                        // REMOVE_START
                        assertThat(res1).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.arget("events:1", 0);
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> login
                        // REMOVE_START
                        assertThat(res2).isEqualTo("login");
                        // REMOVE_END
                        return asyncCommands.arget("events:1", 999);
                    })
                    .thenAccept(res3 -> {
                        System.out.println(res3);
                        // >>> null
                        // REMOVE_START
                        assertThat(res3).isNull();
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            arsetArgetExample.join();
            // STEP_END

            // STEP_START armset_armget
            // REMOVE_START
            asyncCommands.del("metrics").toCompletableFuture().join();
            // REMOVE_END
            Map<Long, String> metricsValues = new HashMap<>();
            metricsValues.put(0L, "10");
            metricsValues.put(5L, "20");
            metricsValues.put(100L, "30");

            CompletableFuture<Void> armsetArmgetExample = asyncCommands
                    .armset("metrics", metricsValues)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 3
                        // REMOVE_START
                        assertThat(res1).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.armget("metrics", 0, 5, 100, 999);
                    })
                    .thenAccept(res2 -> {
                        System.out.println(res2);
                        // >>> [10, 20, 30, null]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[10, 20, 30, null]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            armsetArmgetExample.join();
            // STEP_END

            // STEP_START len_count
            // REMOVE_START
            asyncCommands.del("sparse").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> lenCountExample = asyncCommands
                    .arset("sparse", 0, "a")
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res1).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.arset("sparse", 1000000, "b");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res2).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.arlen("sparse");
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> 1000001
                        // REMOVE_START
                        assertThat(res3).isEqualTo(1000001L);
                        // REMOVE_END
                        return asyncCommands.arcount("sparse");
                    })
                    .thenAccept(res4 -> {
                        System.out.println(res4);
                        // >>> 2
                        // REMOVE_START
                        assertThat(res4).isEqualTo(2L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            lenCountExample.join();
            // STEP_END

            // STEP_START argetrange
            // REMOVE_START
            asyncCommands.del("seq").toCompletableFuture().join();
            // REMOVE_END
            Map<Long, String> seqRangeValues = new HashMap<>();
            seqRangeValues.put(0L, "a");
            seqRangeValues.put(1L, "b");
            seqRangeValues.put(3L, "d");

            CompletableFuture<Void> argetrangeExample = asyncCommands
                    .armset("seq", seqRangeValues)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 3
                        // REMOVE_START
                        assertThat(res1).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.argetrange("seq", 0, 3);
                    })
                    .thenAccept(res2 -> {
                        System.out.println(res2);
                        // >>> [a, b, null, d]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[a, b, null, d]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            argetrangeExample.join();
            // STEP_END

            // STEP_START arscan
            // REMOVE_START
            asyncCommands.del("seq").toCompletableFuture().join();
            // REMOVE_END
            Map<Long, String> seqScanValues = new HashMap<>();
            seqScanValues.put(0L, "a");
            seqScanValues.put(1L, "b");
            seqScanValues.put(3L, "d");

            CompletableFuture<Void> arscanExample = asyncCommands
                    .armset("seq", seqScanValues)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 3
                        // REMOVE_START
                        assertThat(res1).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.arscan("seq", 0, 3);
                    })
                    .thenAccept(res2 -> {
                        for (IndexedValue<String> pair : res2) {
                            System.out.println(pair.getIndex() + " -> " + pair.getValue());
                        }
                        // >>> 0 -> a
                        // >>> 1 -> b
                        // >>> 3 -> d
                        // REMOVE_START
                        assertThat(res2.size()).isEqualTo(3);
                        assertThat(res2.get(0).getIndex()).isEqualTo(0L);
                        assertThat(res2.get(0).getValue()).isEqualTo("a");
                        assertThat(res2.get(1).getIndex()).isEqualTo(1L);
                        assertThat(res2.get(1).getValue()).isEqualTo("b");
                        assertThat(res2.get(2).getIndex()).isEqualTo(3L);
                        assertThat(res2.get(2).getValue()).isEqualTo("d");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            arscanExample.join();
            // STEP_END

            // STEP_START arinsert
            // REMOVE_START
            asyncCommands.del("log").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> arinsertExample = asyncCommands
                    .arinsert("log", "event1")
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 0
                        // REMOVE_START
                        assertThat(res1).isEqualTo(0L);
                        // REMOVE_END
                        return asyncCommands.arinsert("log", "event2");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res2).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.arnext("log");
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> 2
                        // REMOVE_START
                        assertThat(res3).isEqualTo(2L);
                        // REMOVE_END
                        return asyncCommands.arseek("log", 10);
                    })
                    .thenCompose(res4 -> {
                        System.out.println(res4);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res4).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.arinsert("log", "event3");
                    })
                    .thenAccept(res5 -> {
                        System.out.println(res5);
                        // >>> 10
                        // REMOVE_START
                        assertThat(res5).isEqualTo(10L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            arinsertExample.join();
            // STEP_END

            // STEP_START arring
            // REMOVE_START
            asyncCommands.del("readings").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> arringExample = asyncCommands
                    .arring("readings", 3, "v0")
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 0
                        // REMOVE_START
                        assertThat(res1).isEqualTo(0L);
                        // REMOVE_END
                        return asyncCommands.arring("readings", 3, "v1");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res2).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.arring("readings", 3, "v2");
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> 2
                        // REMOVE_START
                        assertThat(res3).isEqualTo(2L);
                        // REMOVE_END
                        return asyncCommands.arring("readings", 3, "v3");
                    })
                    .thenCompose(res4 -> {
                        System.out.println(res4);
                        // >>> 0
                        // REMOVE_START
                        assertThat(res4).isEqualTo(0L);
                        // REMOVE_END
                        return asyncCommands.arget("readings", 0);
                    })
                    .thenAccept(res5 -> {
                        System.out.println(res5);
                        // >>> v3
                        // REMOVE_START
                        assertThat(res5).isEqualTo("v3");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            arringExample.join();
            // STEP_END

            // STEP_START arlastitems
            // REMOVE_START
            asyncCommands.del("readings").toCompletableFuture().join();
            // REMOVE_END
            CompletableFuture<Void> arlastitemsExample = asyncCommands
                    .arring("readings", 3, "v0")
                    .thenCompose(res1 -> asyncCommands.arring("readings", 3, "v1"))
                    .thenCompose(res2 -> asyncCommands.arring("readings", 3, "v2"))
                    .thenCompose(res3 -> asyncCommands.arring("readings", 3, "v3"))
                    .thenCompose(res4 -> asyncCommands.arlastitems("readings", 3))
                    .thenCompose(res5 -> {
                        System.out.println(res5);
                        // >>> [v1, v2, v3]
                        // REMOVE_START
                        assertThat(res5.toString()).isEqualTo("[v1, v2, v3]");
                        // REMOVE_END
                        return asyncCommands.arlastitems("readings", 3, true);
                    })
                    .thenAccept(res6 -> {
                        System.out.println(res6);
                        // >>> [v3, v2, v1]
                        // REMOVE_START
                        assertThat(res6.toString()).isEqualTo("[v3, v2, v1]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            arlastitemsExample.join();
            // STEP_END

            // STEP_START arop
            // REMOVE_START
            asyncCommands.del("scores").toCompletableFuture().join();
            // REMOVE_END
            Map<Long, String> aropScores = new HashMap<>();
            aropScores.put(0L, "10");
            aropScores.put(1L, "20");
            aropScores.put(2L, "30");

            CompletableFuture<Void> aropExample = asyncCommands
                    .armset("scores", aropScores)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 3
                        // REMOVE_START
                        assertThat(res1).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.aropAggregate("scores", 0, 2, ArAggregateType.SUM);
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> 60
                        // REMOVE_START
                        assertThat(res2).isEqualTo("60");
                        // REMOVE_END
                        return asyncCommands.aropAggregate("scores", 0, 2, ArAggregateType.MAX);
                    })
                    .thenCompose(res3 -> {
                        System.out.println(res3);
                        // >>> 30
                        // REMOVE_START
                        assertThat(res3).isEqualTo("30");
                        // REMOVE_END
                        return asyncCommands.aropCount("scores", 0, 2, "10");
                    })
                    .thenAccept(res4 -> {
                        System.out.println(res4);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res4).isEqualTo(1L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            aropExample.join();
            // STEP_END

            // STEP_START argrep
            // REMOVE_START
            asyncCommands.del("log").toCompletableFuture().join();
            // REMOVE_END
            Map<Long, String> argrepLog = new HashMap<>();
            argrepLog.put(0L, "boot: ok");
            argrepLog.put(1L, "warn: disk");
            argrepLog.put(2L, "ERROR: cpu");
            argrepLog.put(3L, "info: ready");
            argrepLog.put(4L, "error: net");

            CompletableFuture<Void> argrepExample = asyncCommands
                    .armset("log", argrepLog)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 5
                        // REMOVE_START
                        assertThat(res1).isEqualTo(5L);
                        // REMOVE_END
                        return asyncCommands.argrep("log",
                                ArGrepArgs.range(0, 4).match("error").nocase());
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> [2, 4]
                        // REMOVE_START
                        assertThat(res2.toString()).isEqualTo("[2, 4]");
                        // REMOVE_END
                        return asyncCommands.argrepWithValues("log",
                                ArGrepArgs.range(0, 4).glob("warn:*").glob("error:*"));
                    })
                    .thenAccept(res3 -> {
                        for (IndexedValue<String> pair : res3) {
                            System.out.println(pair.getIndex() + " -> " + pair.getValue());
                        }
                        // >>> 1 -> warn: disk
                        // >>> 4 -> error: net
                        // REMOVE_START
                        assertThat(res3.size()).isEqualTo(2);
                        assertThat(res3.get(0).getIndex()).isEqualTo(1L);
                        assertThat(res3.get(0).getValue()).isEqualTo("warn: disk");
                        assertThat(res3.get(1).getIndex()).isEqualTo(4L);
                        assertThat(res3.get(1).getValue()).isEqualTo("error: net");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            argrepExample.join();
            // STEP_END

            // STEP_START ardel
            // REMOVE_START
            asyncCommands.del("scores").toCompletableFuture().join();
            // REMOVE_END
            Map<Long, String> ardelScores = new HashMap<>();
            ardelScores.put(0L, "10");
            ardelScores.put(1L, "20");
            ardelScores.put(2L, "30");

            CompletableFuture<Void> ardelExample = asyncCommands
                    .armset("scores", ardelScores)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> 3
                        // REMOVE_START
                        assertThat(res1).isEqualTo(3L);
                        // REMOVE_END
                        return asyncCommands.ardel("scores", 1);
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> 1
                        // REMOVE_START
                        assertThat(res2).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.ardelrange("scores", 0, 2);
                    })
                    .thenAccept(res3 -> {
                        System.out.println(res3);
                        // >>> 2
                        // REMOVE_START
                        assertThat(res3).isEqualTo(2L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            ardelExample.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("events:1", "metrics", "sparse", "seq", "log", "readings", "scores")
                    .toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
