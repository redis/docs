// EXAMPLE: tdigest_tutorial
package io.redis.examples.async;

// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;

import java.util.concurrent.CompletableFuture;

// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END
// HIDE_END

public class TDigestExample {

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
            asyncCommands.del("bikes:sales", "racer_ages").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START tdig_start
            CompletableFuture<Void> tdigStartExample = asyncCommands
                    .tdigestCreate("bikes:sales", 100L)
                    .thenCompose(res1 -> {
                        System.out.println(res1);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestAdd("bikes:sales", "21");
                    })
                    .thenCompose(res2 -> {
                        System.out.println(res2);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res2).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestAdd("bikes:sales", "150", "95", "75", "34");
                    })
                    .thenAccept(res3 -> {
                        System.out.println(res3);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res3).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            tdigStartExample.join();
            // STEP_END

            // STEP_START tdig_cdf
            CompletableFuture<Void> tdigCdfExample = asyncCommands
                    .tdigestCreate("racer_ages")
                    .thenCompose(res4 -> {
                        System.out.println(res4);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res4).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestAdd("racer_ages",
                                "45.88", "44.2", "58.03", "19.76", "39.84", "69.28",
                                "50.97", "25.41", "19.27", "85.71", "42.63");
                    })
                    .thenCompose(res5 -> {
                        System.out.println(res5);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res5).isEqualTo("OK");
                        // REMOVE_END
                        return asyncCommands.tdigestRank("racer_ages", "50");
                    })
                    .thenCompose(res6 -> {
                        System.out.println(res6);
                        // >>> [7]
                        // REMOVE_START
                        assertThat(res6.toString()).isEqualTo("[7]");
                        // REMOVE_END
                        return asyncCommands.tdigestRank("racer_ages", "50", "40");
                    })
                    .thenAccept(res7 -> {
                        System.out.println(res7);
                        // >>> [7, 4]
                        // REMOVE_START
                        assertThat(res7.toString()).isEqualTo("[7, 4]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            tdigCdfExample.join();
            // STEP_END

            // STEP_START tdig_quant
            CompletableFuture<Void> tdigQuantExample = asyncCommands
                    .tdigestQuantile("racer_ages", 0.5)
                    .thenCompose(res8 -> {
                        System.out.println(res8);
                        // >>> [44.2]
                        // REMOVE_START
                        assertThat(res8.toString()).isEqualTo("[44.2]");
                        // REMOVE_END
                        return asyncCommands.tdigestByRank("racer_ages", 4L);
                    })
                    .thenAccept(res9 -> {
                        System.out.println(res9);
                        // >>> [42.63]
                        // REMOVE_START
                        assertThat(res9.toString()).isEqualTo("[42.63]");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            tdigQuantExample.join();
            // STEP_END

            // STEP_START tdig_min
            CompletableFuture<Void> tdigMinExample = asyncCommands
                    .tdigestMin("racer_ages")
                    .thenCompose(res10 -> {
                        System.out.println(res10);
                        // >>> 19.27
                        // REMOVE_START
                        assertThat(res10).isEqualTo(19.27);
                        // REMOVE_END
                        return asyncCommands.tdigestMax("racer_ages");
                    })
                    .thenAccept(res11 -> {
                        System.out.println(res11);
                        // >>> 85.71
                        // REMOVE_START
                        assertThat(res11).isEqualTo(85.71);
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            tdigMinExample.join();
            // STEP_END

            // STEP_START tdig_reset
            CompletableFuture<Void> tdigResetExample = asyncCommands
                    .tdigestReset("racer_ages")
                    .thenAccept(res12 -> {
                        System.out.println(res12);
                        // >>> OK
                        // REMOVE_START
                        assertThat(res12).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .toCompletableFuture();

            tdigResetExample.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("bikes:sales", "racer_ages").toCompletableFuture().join();
            // REMOVE_END
            // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
