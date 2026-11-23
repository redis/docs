// EXAMPLE: timeseries_tutorial
// HIDE_START
package io.redis.examples.async;

import io.lettuce.core.Range;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.timeseries.TsAggregationType;
import io.lettuce.core.timeseries.TsFilter;
import io.lettuce.core.timeseries.TsMAddValue;
import io.lettuce.core.timeseries.TsReducerType;
import io.lettuce.core.timeseries.arguments.TsCreateArgs;
import io.lettuce.core.timeseries.arguments.TsMGetArgs;
import io.lettuce.core.timeseries.arguments.TsMRangeArgs;
import io.lettuce.core.timeseries.arguments.TsRangeArgs;

import java.time.Duration;
import java.util.Arrays;
import java.util.concurrent.CompletableFuture;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class TimeSeriesExample {

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
            asyncCommands.del("thermometer:1", "thermometer:2", "thermometer:3", "thermometer:3:avg")
                    .toCompletableFuture().join();
            // REMOVE_END

            // STEP_START ts_create
            CompletableFuture<Void> createExample = asyncCommands
                    .tsCreate("thermometer:1", TsCreateArgs.Builder
                            .retention(Duration.ofDays(1))
                            .label("type", "temperature")
                            .label("location", "lab"))
                    .thenCompose(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tsCreate("thermometer:2", TsCreateArgs.Builder
                                .label("type", "temperature")
                                .label("location", "roof"));
                    })
                    .thenAccept(res2 -> {
                        System.out.println(res2); // >>> OK
                        // REMOVE_START
                        assertThat(res2).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            createExample.join();
            // STEP_END

            // STEP_START ts_add
            CompletableFuture<Void> addExample = asyncCommands
                    .tsAdd("thermometer:1", 1L, 9.2)
                    .thenCompose(res3 -> {
                        System.out.println(res3); // >>> 1
                        // REMOVE_START
                        assertThat(res3).isEqualTo(1L);
                        // REMOVE_END
                        return asyncCommands.tsMAdd(Arrays.asList(
                                TsMAddValue.of("thermometer:1", 2L, 9.1),
                                TsMAddValue.of("thermometer:1", 3L, 9.3),
                                TsMAddValue.of("thermometer:1", 4L, 9.5),
                                TsMAddValue.of("thermometer:2", 1L, 3.1),
                                TsMAddValue.of("thermometer:2", 2L, 3.4)));
                    })
                    .thenAccept(res4 -> {
                        System.out.println(res4); // >>> [2, 3, 4, 1, 2]
                        // REMOVE_START
                        assertThat(res4).containsExactly(2L, 3L, 4L, 1L, 2L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            addExample.join();
            // STEP_END

            // STEP_START ts_get
            CompletableFuture<Void> getExample = asyncCommands
                    .tsGet("thermometer:1")
                    .thenCompose(res5 -> {
                        System.out.println(res5.getTimestamp() + " " + res5.getValue()); // >>> 4 9.5
                        // REMOVE_START
                        assertThat(res5.getTimestamp()).isEqualTo(4L);
                        assertThat(res5.getValue()).isEqualTo(9.5);
                        // REMOVE_END
                        return asyncCommands.tsRange("thermometer:1", Range.create(2L, 3L));
                    })
                    .thenAccept(res6 -> {
                        System.out.println(res6);
                        // >>> [TsSample [timestamp=2, values=[9.1]], TsSample [timestamp=3, values=[9.3]]]
                        // REMOVE_START
                        assertThat(res6).hasSize(2);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            getExample.join();
            // STEP_END

            // STEP_START ts_aggregate
            CompletableFuture<Void> aggregateExample = asyncCommands
                    .tsRange("thermometer:1", Range.unbounded(),
                            TsRangeArgs.Builder.aggregation(2L, TsAggregationType.AVG))
                    .thenAccept(res7 -> {
                        System.out.println(res7);
                        // >>> [TsSample [timestamp=0, values=[9.2]], TsSample [timestamp=2, values=[9.2]], TsSample [timestamp=4, values=[9.5]]]
                        // REMOVE_START
                        assertThat(res7).hasSize(3);
                        assertThat(res7.get(1).getTimestamp()).isEqualTo(2L);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            aggregateExample.join();
            // STEP_END

            // STEP_START ts_compaction
            CompletableFuture<Void> compactionExample = asyncCommands
                    .tsCreate("thermometer:3")
                    .thenCompose(r -> asyncCommands.tsCreate("thermometer:3:avg"))
                    .thenCompose(r -> asyncCommands.tsCreateRule(
                            "thermometer:3", "thermometer:3:avg", TsAggregationType.AVG, 2L))
                    .thenCompose(res8 -> {
                        System.out.println(res8); // >>> OK
                        // REMOVE_START
                        assertThat(res8).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tsMAdd(Arrays.asList(
                                TsMAddValue.of("thermometer:3", 1L, 10.0),
                                TsMAddValue.of("thermometer:3", 2L, 11.0),
                                TsMAddValue.of("thermometer:3", 3L, 13.0),
                                TsMAddValue.of("thermometer:3", 4L, 14.0),
                                TsMAddValue.of("thermometer:3", 5L, 16.0),
                                TsMAddValue.of("thermometer:3", 6L, 15.0)));
                    })
                    .thenCompose(r -> asyncCommands.tsRange("thermometer:3:avg", Range.unbounded()))
                    .thenAccept(res9 -> {
                        System.out.println(res9);
                        // >>> [TsSample [timestamp=0, values=[10.0]], TsSample [timestamp=2, values=[12.0]], TsSample [timestamp=4, values=[15.0]]]
                        // REMOVE_START
                        assertThat(res9).hasSize(3);
                        assertThat(res9.get(1).getValue()).isEqualTo(12.0);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            compactionExample.join();
            // STEP_END

            // STEP_START ts_labels
            CompletableFuture<Void> labelsExample = asyncCommands
                    .tsQueryIndex(TsFilter.equal("type", "temperature"))
                    .thenCompose(res10 -> {
                        System.out.println(res10); // >>> [thermometer:1, thermometer:2]
                        // REMOVE_START
                        assertThat(res10).containsExactlyInAnyOrder("thermometer:1", "thermometer:2");
                        // REMOVE_END
                        return asyncCommands.tsMGet(
                                TsMGetArgs.Builder.withLabels(), TsFilter.equal("location", "lab"));
                    })
                    .thenCompose(res11 -> {
                        res11.forEach(value -> {
                            System.out.println(value.getKey() + " " + value.getSample());
                            // >>> thermometer:1 TsSample [timestamp=4, values=[9.5]]
                        });
                        // REMOVE_START
                        assertThat(res11).hasSize(1);
                        assertThat(res11.get(0).getKey()).isEqualTo("thermometer:1");
                        // REMOVE_END
                        return asyncCommands.tsMRange(Range.create(1L, 2L),
                                TsMRangeArgs.Builder.groupBy("type", TsReducerType.MAX),
                                TsFilter.equal("type", "temperature"));
                    })
                    .thenAccept(res12 -> {
                        res12.forEach(group -> {
                            System.out.println(group.getGroup() + " " + group.getSamples());
                            // >>> type=temperature [TsSample [timestamp=1, values=[9.2]], TsSample [timestamp=2, values=[9.1]]]
                        });
                        // REMOVE_START
                        assertThat(res12).hasSize(1);
                        assertThat(res12.get(0).getSamples()).hasSize(2);
                        assertThat(res12.get(0).getSamples().get(0).getValue()).isEqualTo(9.2);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            labelsExample.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("thermometer:1", "thermometer:2", "thermometer:3", "thermometer:3:avg")
                    .toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
