// EXAMPLE: timeseries_tutorial
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.Range;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
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

import reactor.core.publisher.Mono;

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
            RedisReactiveCommands<String, String> reactiveCommands = connection.commands(RedisReactiveCommands.factory());
            // HIDE_END

            // REMOVE_START
            reactiveCommands.del("thermometer:1", "thermometer:2", "thermometer:3", "thermometer:3:avg").block();
            // REMOVE_END

            // STEP_START ts_create
            Mono<Void> createExample = reactiveCommands
                    .tsCreate("thermometer:1", TsCreateArgs.Builder
                            .retention(Duration.ofDays(1))
                            .label("type", "temperature")
                            .label("location", "lab"))
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.tsCreate("thermometer:2", TsCreateArgs.Builder
                            .label("type", "temperature")
                            .label("location", "roof")))
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> OK
                        // REMOVE_START
                        assertThat(res2).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then();

            createExample.block();
            // STEP_END

            // STEP_START ts_add
            Mono<Void> addExample = reactiveCommands
                    .tsAdd("thermometer:1", 1L, 9.2)
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> 1
                        // REMOVE_START
                        assertThat(res3).isEqualTo(1L);
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.tsMAdd(Arrays.asList(
                            TsMAddValue.of("thermometer:1", 2L, 9.1),
                            TsMAddValue.of("thermometer:1", 3L, 9.3),
                            TsMAddValue.of("thermometer:1", 4L, 9.5),
                            TsMAddValue.of("thermometer:2", 1L, 3.1),
                            TsMAddValue.of("thermometer:2", 2L, 3.4))))
                    .collectList()
                    .doOnNext(res4 -> {
                        System.out.println(res4); // >>> [Value[2], Value[3], Value[4], Value[1], Value[2]]
                        // REMOVE_START
                        assertThat(res4.toString()).isEqualTo("[Value[2], Value[3], Value[4], Value[1], Value[2]]");
                        // REMOVE_END
                    })
                    .then();

            addExample.block();
            // STEP_END

            // STEP_START ts_get
            Mono<Void> getExample = reactiveCommands
                    .tsGet("thermometer:1")
                    .doOnNext(res5 -> {
                        System.out.println(res5.getTimestamp() + " " + res5.getValue()); // >>> 4 9.5
                        // REMOVE_START
                        assertThat(res5.getTimestamp()).isEqualTo(4L);
                        assertThat(res5.getValue()).isEqualTo(9.5);
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.tsRange("thermometer:1", Range.create(2L, 3L)))
                    .collectList()
                    .doOnNext(res6 -> {
                        System.out.println(res6);
                        // >>> [TsSample [timestamp=2, values=[9.1]], TsSample [timestamp=3, values=[9.3]]]
                        // REMOVE_START
                        assertThat(res6).hasSize(2);
                        // REMOVE_END
                    })
                    .then();

            getExample.block();
            // STEP_END

            // STEP_START ts_aggregate
            Mono<Void> aggregateExample = reactiveCommands
                    .tsRange("thermometer:1", Range.unbounded(),
                            TsRangeArgs.Builder.aggregation(2L, TsAggregationType.AVG))
                    .collectList()
                    .doOnNext(res7 -> {
                        System.out.println(res7);
                        // >>> [TsSample [timestamp=0, values=[9.2]], TsSample [timestamp=2, values=[9.2]], TsSample [timestamp=4, values=[9.5]]]
                        // REMOVE_START
                        assertThat(res7).hasSize(3);
                        assertThat(res7.get(1).getTimestamp()).isEqualTo(2L);
                        // REMOVE_END
                    })
                    .then();

            aggregateExample.block();
            // STEP_END

            // STEP_START ts_compaction
            Mono<Void> compactionExample = reactiveCommands
                    .tsCreate("thermometer:3")
                    .then(reactiveCommands.tsCreate("thermometer:3:avg"))
                    .then(reactiveCommands.tsCreateRule(
                            "thermometer:3", "thermometer:3:avg", TsAggregationType.AVG, 2L))
                    .doOnNext(res8 -> {
                        System.out.println(res8); // >>> OK
                        // REMOVE_START
                        assertThat(res8).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.tsMAdd(Arrays.asList(
                            TsMAddValue.of("thermometer:3", 1L, 10.0),
                            TsMAddValue.of("thermometer:3", 2L, 11.0),
                            TsMAddValue.of("thermometer:3", 3L, 13.0),
                            TsMAddValue.of("thermometer:3", 4L, 14.0),
                            TsMAddValue.of("thermometer:3", 5L, 16.0),
                            TsMAddValue.of("thermometer:3", 6L, 15.0))))
                    .thenMany(reactiveCommands.tsRange("thermometer:3:avg", Range.unbounded()))
                    .collectList()
                    .doOnNext(res9 -> {
                        System.out.println(res9);
                        // >>> [TsSample [timestamp=0, values=[10.0]], TsSample [timestamp=2, values=[12.0]], TsSample [timestamp=4, values=[15.0]]]
                        // REMOVE_START
                        assertThat(res9).hasSize(3);
                        assertThat(res9.get(1).getValue()).isEqualTo(12.0);
                        // REMOVE_END
                    })
                    .then();

            compactionExample.block();
            // STEP_END

            // STEP_START ts_labels
            Mono<Void> labelsExample = reactiveCommands
                    .tsQueryIndex(TsFilter.equal("type", "temperature"))
                    .collectList()
                    .doOnNext(res10 -> {
                        System.out.println(res10); // >>> [thermometer:1, thermometer:2]
                        // REMOVE_START
                        assertThat(res10).containsExactlyInAnyOrder("thermometer:1", "thermometer:2");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.tsMGet(
                            TsMGetArgs.Builder.withLabels(), TsFilter.equal("location", "lab")))
                    .collectList()
                    .doOnNext(res11 -> {
                        res11.forEach(value -> {
                            System.out.println(value.getKey() + " " + value.getSample());
                            // >>> thermometer:1 TsSample [timestamp=4, values=[9.5]]
                        });
                        // REMOVE_START
                        assertThat(res11).hasSize(1);
                        assertThat(res11.get(0).getKey()).isEqualTo("thermometer:1");
                        // REMOVE_END
                    })
                    .thenMany(reactiveCommands.tsMRange(Range.create(1L, 2L),
                            TsMRangeArgs.Builder.groupBy("type", TsReducerType.MAX),
                            TsFilter.equal("type", "temperature")))
                    .collectList()
                    .doOnNext(res12 -> {
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
                    .then();

            labelsExample.block();
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("thermometer:1", "thermometer:2", "thermometer:3", "thermometer:3:avg").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
