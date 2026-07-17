// EXAMPLE: pipe_trans_tutorial
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
import reactor.core.publisher.Flux;

import java.util.List;

// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class TransPipeExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactive = connection.reactive();
            // REMOVE_START
            reactive.del("seat:0", "seat:1", "seat:2", "seat:3", "seat:4",
                    "counter:1", "counter:2", "counter:3", "shellpath").block();
            // REMOVE_END

            // STEP_START basic_pipe
            // Reactive commands are pipelined automatically: the writes below are
            // sent to the server back to back, then the reads are sent as a batch
            // once you subscribe (here, by calling `block()`).
            List<String> seats = Flux.range(0, 5)
                    .flatMap(i -> reactive.set("seat:" + i, "#" + i))
                    .thenMany(Flux.concat(
                            reactive.get("seat:0"),
                            reactive.get("seat:3"),
                            reactive.get("seat:4")))
                    .collectList()
                    .block();

            System.out.println(seats.get(0)); // >>> #0
            System.out.println(seats.get(1)); // >>> #3
            System.out.println(seats.get(2)); // >>> #4
            // STEP_END
            // REMOVE_START
            assertThat(seats).containsExactly("#0", "#3", "#4");
            // REMOVE_END

            // STEP_START basic_trans
            // Queue the commands between `multi()` and `exec()`. Subscribing to
            // each one inside the `multi()` callback sends it to the server, where
            // it is held until `exec()` runs the transaction.
            TransactionResult transResult = reactive.multi()
                    .flatMap(ok -> {
                        reactive.incrby("counter:1", 1).subscribe();
                        reactive.incrby("counter:2", 2).subscribe();
                        reactive.incrby("counter:3", 3).subscribe();
                        return reactive.exec();
                    })
                    .block();

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
            reactive.set("shellpath", "/usr/syscmds/").block();

            // Watch the key, read its current value, then queue the update in a
            // transaction. `exec()` reports `wasDiscarded()` if the watched key
            // changed before the transaction ran.
            TransactionResult watchedResult = reactive.watch("shellpath")
                    .then(reactive.get("shellpath"))
                    .flatMap(currentPath -> reactive.multi()
                            .flatMap(ok -> {
                                reactive.set("shellpath", currentPath + ":/usr/mycmds/").subscribe();
                                return reactive.exec();
                            }))
                    .block();

            if (!watchedResult.wasDiscarded()) {
                System.out.println(reactive.get("shellpath").block());
                // >>> /usr/syscmds/:/usr/mycmds/
            }
            // STEP_END
            // REMOVE_START
            assertThat(watchedResult.wasDiscarded()).isFalse();
            assertThat(reactive.get("shellpath").block()).isEqualTo("/usr/syscmds/:/usr/mycmds/");
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
