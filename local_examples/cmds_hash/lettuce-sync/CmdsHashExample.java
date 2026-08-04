// EXAMPLE: cmds_hash
// HIDE_START
package io.redis.examples.sync;

import io.lettuce.core.*;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsHashExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();
            // HIDE_END

            // REMOVE_START
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hlen
            // `hset` returns true because `field1` is a new field.
            boolean res1 = syncCommands.hset("myhash", "field1", "Hello");
            System.out.println(res1); // >>> true

            // `hset` returns true because `field2` is also a new field.
            boolean res2 = syncCommands.hset("myhash", "field2", "World");
            System.out.println(res2); // >>> true

            Long res3 = syncCommands.hlen("myhash");
            System.out.println(res3); // >>> 2
            // STEP_END

            // REMOVE_START
            assertThat(res1).isTrue();
            assertThat(res2).isTrue();
            assertThat(res3).isEqualTo(2L);
            syncCommands.del("myhash");
            // REMOVE_END
        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
