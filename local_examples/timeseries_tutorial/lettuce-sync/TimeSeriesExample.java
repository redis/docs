// EXAMPLE: timeseries_tutorial
// HIDE_START
package io.redis.examples.sync;

import io.lettuce.core.Range;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.timeseries.TsAggregationType;
import io.lettuce.core.timeseries.TsFilter;
import io.lettuce.core.timeseries.TsMAddValue;
import io.lettuce.core.timeseries.TsMGetValue;
import io.lettuce.core.timeseries.TsReducerType;
import io.lettuce.core.timeseries.TsSample;
import io.lettuce.core.timeseries.TsSeries;
import io.lettuce.core.timeseries.arguments.TsCreateArgs;
import io.lettuce.core.timeseries.arguments.TsMGetArgs;
import io.lettuce.core.timeseries.arguments.TsMRangeArgs;
import io.lettuce.core.timeseries.arguments.TsRangeArgs;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

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
            RedisCommands<String, String> commands = connection.sync();
            // HIDE_END

            // REMOVE_START
            commands.del("thermometer:1", "thermometer:2", "thermometer:3", "thermometer:3:avg");
            // REMOVE_END

            // STEP_START ts_create
            String res1 = commands.tsCreate("thermometer:1", TsCreateArgs.Builder
                    .retention(Duration.ofDays(1))
                    .label("type", "temperature")
                    .label("location", "lab"));
            System.out.println(res1); // >>> OK
            // REMOVE_START
            assertThat(res1).isEqualTo("OK");
            // REMOVE_END

            String res2 = commands.tsCreate("thermometer:2", TsCreateArgs.Builder
                    .label("type", "temperature")
                    .label("location", "roof"));
            System.out.println(res2); // >>> OK
            // REMOVE_START
            assertThat(res2).isEqualTo("OK");
            // REMOVE_END
            // STEP_END

            // STEP_START ts_add
            Long res3 = commands.tsAdd("thermometer:1", 1L, 9.2);
            System.out.println(res3); // >>> 1
            // REMOVE_START
            assertThat(res3).isEqualTo(1L);
            // REMOVE_END

            List<Long> res4 = commands.tsMAdd(Arrays.asList(
                    TsMAddValue.of("thermometer:1", 2L, 9.1),
                    TsMAddValue.of("thermometer:1", 3L, 9.3),
                    TsMAddValue.of("thermometer:1", 4L, 9.5),
                    TsMAddValue.of("thermometer:2", 1L, 3.1),
                    TsMAddValue.of("thermometer:2", 2L, 3.4)));
            System.out.println(res4); // >>> [2, 3, 4, 1, 2]
            // REMOVE_START
            assertThat(res4).containsExactly(2L, 3L, 4L, 1L, 2L);
            // REMOVE_END
            // STEP_END

            // STEP_START ts_get
            TsSample res5 = commands.tsGet("thermometer:1");
            System.out.println(res5.getTimestamp() + " " + res5.getValue()); // >>> 4 9.5
            // REMOVE_START
            assertThat(res5.getTimestamp()).isEqualTo(4L);
            assertThat(res5.getValue()).isEqualTo(9.5);
            // REMOVE_END

            List<TsSample> res6 = commands.tsRange("thermometer:1", Range.create(2L, 3L));
            System.out.println(res6);
            // >>> [TsSample [timestamp=2, values=[9.1]], TsSample [timestamp=3, values=[9.3]]]
            // REMOVE_START
            assertThat(res6).hasSize(2);
            // REMOVE_END
            // STEP_END

            // STEP_START ts_aggregate
            List<TsSample> res7 = commands.tsRange("thermometer:1", Range.unbounded(),
                    TsRangeArgs.Builder.aggregation(2L, TsAggregationType.AVG));
            System.out.println(res7);
            // >>> [TsSample [timestamp=0, values=[9.2]], TsSample [timestamp=2, values=[9.2]], TsSample [timestamp=4, values=[9.5]]]
            // REMOVE_START
            assertThat(res7).hasSize(3);
            assertThat(res7.get(1).getTimestamp()).isEqualTo(2L);
            // REMOVE_END
            // STEP_END

            // STEP_START ts_compaction
            commands.tsCreate("thermometer:3");
            commands.tsCreate("thermometer:3:avg");
            String res8 = commands.tsCreateRule("thermometer:3", "thermometer:3:avg", TsAggregationType.AVG, 2L);
            System.out.println(res8); // >>> OK
            // REMOVE_START
            assertThat(res8).isEqualTo("OK");
            // REMOVE_END

            commands.tsMAdd(Arrays.asList(
                    TsMAddValue.of("thermometer:3", 1L, 10.0),
                    TsMAddValue.of("thermometer:3", 2L, 11.0),
                    TsMAddValue.of("thermometer:3", 3L, 13.0),
                    TsMAddValue.of("thermometer:3", 4L, 14.0),
                    TsMAddValue.of("thermometer:3", 5L, 16.0),
                    TsMAddValue.of("thermometer:3", 6L, 15.0)));

            List<TsSample> res9 = commands.tsRange("thermometer:3:avg", Range.unbounded());
            System.out.println(res9);
            // >>> [TsSample [timestamp=0, values=[10.0]], TsSample [timestamp=2, values=[12.0]], TsSample [timestamp=4, values=[15.0]]]
            // REMOVE_START
            assertThat(res9).hasSize(3);
            assertThat(res9.get(1).getValue()).isEqualTo(12.0);
            // REMOVE_END
            // STEP_END

            // STEP_START ts_labels
            List<String> res10 = commands.tsQueryIndex(TsFilter.equal("type", "temperature"));
            System.out.println(res10); // >>> [thermometer:1, thermometer:2]
            // REMOVE_START
            assertThat(res10).containsExactlyInAnyOrder("thermometer:1", "thermometer:2");
            // REMOVE_END

            List<TsMGetValue<String>> res11 = commands.tsMGet(
                    TsMGetArgs.Builder.withLabels(), TsFilter.equal("location", "lab"));
            for (TsMGetValue<String> value : res11) {
                System.out.println(value.getKey() + " " + value.getSample());
                // >>> thermometer:1 TsSample [timestamp=4, values=[9.5]]
            }
            // REMOVE_START
            assertThat(res11).hasSize(1);
            assertThat(res11.get(0).getKey()).isEqualTo("thermometer:1");
            // REMOVE_END

            List<TsSeries<String>> res12 = commands.tsMRange(Range.create(1L, 2L),
                    TsMRangeArgs.Builder.groupBy("type", TsReducerType.MAX),
                    TsFilter.equal("type", "temperature"));
            for (TsSeries<String> group : res12) {
                System.out.println(group.getGroup() + " " + group.getSamples());
                // >>> type=temperature [TsSample [timestamp=1, values=[9.2]], TsSample [timestamp=2, values=[9.1]]]
            }
            // REMOVE_START
            assertThat(res12).hasSize(1);
            assertThat(res12.get(0).getSamples()).hasSize(2);
            assertThat(res12.get(0).getSamples().get(0).getValue()).isEqualTo(9.2);
            // REMOVE_END
            // STEP_END

            // REMOVE_START
            commands.del("thermometer:1", "thermometer:2", "thermometer:3", "thermometer:3:avg");
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
