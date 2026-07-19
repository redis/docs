// EXAMPLE: tdigest_tutorial
// HIDE_START
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import java.util.List;
// HIDE_END

public class TDigestExample {

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
            reactiveCommands.del("bikes:sales", "racer_ages").block();
            // REMOVE_END

            // STEP_START tdig_start
            String res1 = reactiveCommands.tdigestCreate("bikes:sales", 100L).block();
            System.out.println(res1);
            // >>> OK
            // REMOVE_START
            assertThat(res1).isEqualTo("OK");
            // REMOVE_END

            String res2 = reactiveCommands.tdigestAdd("bikes:sales", "21").block();
            System.out.println(res2);
            // >>> OK
            // REMOVE_START
            assertThat(res2).isEqualTo("OK");
            // REMOVE_END

            String res3 = reactiveCommands.tdigestAdd("bikes:sales", "150", "95", "75", "34").block();
            System.out.println(res3);
            // >>> OK
            // REMOVE_START
            assertThat(res3).isEqualTo("OK");
            // REMOVE_END
            // STEP_END

            // STEP_START tdig_cdf
            String res4 = reactiveCommands.tdigestCreate("racer_ages").block();
            System.out.println(res4);
            // >>> OK
            // REMOVE_START
            assertThat(res4).isEqualTo("OK");
            // REMOVE_END

            String res5 = reactiveCommands.tdigestAdd("racer_ages",
                    "45.88", "44.2", "58.03", "19.76", "39.84", "69.28",
                    "50.97", "25.41", "19.27", "85.71", "42.63").block();
            System.out.println(res5);
            // >>> OK
            // REMOVE_START
            assertThat(res5).isEqualTo("OK");
            // REMOVE_END

            List<Long> res6 = reactiveCommands.tdigestRank("racer_ages", "50").collectList().block();
            System.out.println(res6);
            // >>> [7]
            // REMOVE_START
            assertThat(res6.toString()).isEqualTo("[7]");
            // REMOVE_END

            List<Long> res7 = reactiveCommands.tdigestRank("racer_ages", "50", "40").collectList().block();
            System.out.println(res7);
            // >>> [7, 4]
            // REMOVE_START
            assertThat(res7.toString()).isEqualTo("[7, 4]");
            // REMOVE_END
            // STEP_END

            // STEP_START tdig_quant
            List<Double> res8 = reactiveCommands.tdigestQuantile("racer_ages", 0.5).collectList().block();
            System.out.println(res8);
            // >>> [44.2]
            // REMOVE_START
            assertThat(res8.toString()).isEqualTo("[44.2]");
            // REMOVE_END

            List<Double> res9 = reactiveCommands.tdigestByRank("racer_ages", 4L).collectList().block();
            System.out.println(res9);
            // >>> [42.63]
            // REMOVE_START
            assertThat(res9.toString()).isEqualTo("[42.63]");
            // REMOVE_END
            // STEP_END

            // STEP_START tdig_min
            Double res10 = reactiveCommands.tdigestMin("racer_ages").block();
            System.out.println(res10);
            // >>> 19.27
            // REMOVE_START
            assertThat(res10).isEqualTo(19.27);
            // REMOVE_END

            Double res11 = reactiveCommands.tdigestMax("racer_ages").block();
            System.out.println(res11);
            // >>> 85.71
            // REMOVE_START
            assertThat(res11).isEqualTo(85.71);
            // REMOVE_END
            // STEP_END

            // STEP_START tdig_reset
            String res12 = reactiveCommands.tdigestReset("racer_ages").block();
            System.out.println(res12);
            // >>> OK
            // REMOVE_START
            assertThat(res12).isEqualTo("OK");
            // REMOVE_END
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("bikes:sales", "racer_ages").block();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
