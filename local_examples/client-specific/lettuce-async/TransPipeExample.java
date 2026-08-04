// EXAMPLE: pipe_trans_tutorial
package io.redis.examples.async;

import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisFuture;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class TransPipeExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() throws Exception {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> async = connection.async();
            // REMOVE_START
            async.del("seat:0", "seat:1", "seat:2", "seat:3", "seat:4",
                    "counter:1", "counter:2", "counter:3", "shellpath").get();
            // REMOVE_END

            // STEP_START basic_pipe
            // Disable auto-flushing to buffer the commands on the client, then
            // flush them to the server as a single batch. Each command returns
            // a `RedisFuture` that completes when its response arrives.
            connection.setAutoFlushCommands(false);

            for (int i = 0; i < 5; i++) {
                async.set("seat:" + i, "#" + i);
            }

            RedisFuture<String> seat0 = async.get("seat:0");
            RedisFuture<String> seat3 = async.get("seat:3");
            RedisFuture<String> seat4 = async.get("seat:4");

            connection.flushCommands();
            connection.setAutoFlushCommands(true);

            System.out.println(seat0.get()); // >>> #0
            System.out.println(seat3.get()); // >>> #3
            System.out.println(seat4.get()); // >>> #4
            // STEP_END
            // REMOVE_START
            assertThat(seat0.get()).isEqualTo("#0");
            assertThat(seat3.get()).isEqualTo("#3");
            assertThat(seat4.get()).isEqualTo("#4");
            // REMOVE_END

            // STEP_START basic_trans
            // Commands issued between `multi()` and `exec()` are queued on the
            // server. Their futures only complete when `exec()` runs.
            async.multi();

            RedisFuture<Long> counter1 = async.incrby("counter:1", 1);
            RedisFuture<Long> counter2 = async.incrby("counter:2", 2);
            RedisFuture<Long> counter3 = async.incrby("counter:3", 3);

            RedisFuture<TransactionResult> execResult = async.exec();
            execResult.get();

            System.out.println(counter1.get()); // >>> 1
            System.out.println(counter2.get()); // >>> 2
            System.out.println(counter3.get()); // >>> 3
            // STEP_END
            // REMOVE_START
            assertThat(counter1.get()).isEqualTo(1L);
            assertThat(counter2.get()).isEqualTo(2L);
            assertThat(counter3.get()).isEqualTo(3L);
            // REMOVE_END

            // STEP_START trans_watch
            async.set("shellpath", "/usr/syscmds/").get();

            // Watch the key for changes while we prepare the update.
            async.watch("shellpath").get();

            String currentPath = async.get("shellpath").get();
            String newPath = currentPath + ":/usr/mycmds/";

            async.multi().get();
            async.set("shellpath", newPath);

            TransactionResult watchedResult = async.exec().get();

            // `exec()` reports `wasDiscarded()` if the watched key changed
            // before the transaction ran.
            if (!watchedResult.wasDiscarded()) {
                System.out.println(async.get("shellpath").get());
                // >>> /usr/syscmds/:/usr/mycmds/
            }
            // STEP_END
            // REMOVE_START
            assertThat(watchedResult.wasDiscarded()).isFalse();
            assertThat(async.get("shellpath").get()).isEqualTo("/usr/syscmds/:/usr/mycmds/");
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
