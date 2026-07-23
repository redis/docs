// EXAMPLE: pipe_trans_tutorial
package io.redis.examples.sync;

import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisFuture;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.sync.RedisCommands;
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
            RedisCommands<String, String> commands = connection.sync();
            // REMOVE_START
            commands.del("seat:0", "seat:1", "seat:2", "seat:3", "seat:4",
                    "counter:1", "counter:2", "counter:3", "shellpath");
            // REMOVE_END

            // STEP_START basic_pipe
            // Lettuce pipelines commands by buffering them on the client while
            // auto-flushing is disabled. Use the asynchronous API to obtain a
            // `RedisFuture` for each buffered command, then read the results
            // after the batch has been flushed to the server.
            RedisAsyncCommands<String, String> async = connection.async();
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
            commands.multi();

            commands.incrby("counter:1", 1);
            commands.incrby("counter:2", 2);
            commands.incrby("counter:3", 3);

            TransactionResult transResult = commands.exec();

            System.out.println((Long) transResult.get(0)); // >>> 1
            System.out.println((Long) transResult.get(1)); // >>> 2
            System.out.println((Long) transResult.get(2)); // >>> 3
            // STEP_END
            // REMOVE_START
            assertThat((Long) transResult.get(0)).isEqualTo(1L);
            assertThat((Long) transResult.get(1)).isEqualTo(2L);
            assertThat((Long) transResult.get(2)).isEqualTo(3L);
            // REMOVE_END

            // STEP_START trans_watch
            commands.set("shellpath", "/usr/syscmds/");

            // Watch the key for changes while we prepare the update.
            commands.watch("shellpath");

            String currentPath = commands.get("shellpath");
            String newPath = currentPath + ":/usr/mycmds/";

            commands.multi();
            commands.set("shellpath", newPath);

            TransactionResult watchedResult = commands.exec();

            // `exec()` returns an empty result that reports `wasDiscarded()` if
            // the watched key changed before the transaction ran.
            if (!watchedResult.wasDiscarded()) {
                System.out.println(commands.get("shellpath"));
                // >>> /usr/syscmds/:/usr/mycmds/
            }
            // STEP_END
            // REMOVE_START
            assertThat(watchedResult.wasDiscarded()).isFalse();
            assertThat(commands.get("shellpath")).isEqualTo("/usr/syscmds/:/usr/mycmds/");
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
