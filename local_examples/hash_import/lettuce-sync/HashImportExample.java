// EXAMPLE: hash_import
package io.redis.examples.sync;

import io.lettuce.core.*;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import java.util.stream.IntStream;
// REMOVE_END
import java.util.*;
// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class HashImportExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();

            // REMOVE_START
            String[] userKeys = IntStream.rangeClosed(1, 1000)
                    .mapToObj(i -> "user:" + i).toArray(String[]::new);
            syncCommands.del(userKeys);
            // REMOVE_END

            // STEP_START himport_basic
            // Declare the field names once.
            try (HashImport<String> fieldset = HashImport.of("name", "email", "age")) {
                // Create each hash by sending only its values.
                String res1 = syncCommands.himportSet("user:1", fieldset, "Alice", "alice@example.com", "34");
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END

                syncCommands.himportSet("user:2", fieldset, "Bob", "bob@example.com", "41");
                syncCommands.himportSet("user:3", fieldset, "Carol", "carol@example.com", "29");
            }

            // The result is an ordinary hash.
            Map<String, String> res2 = syncCommands.hgetall("user:2");
            System.out.println(res2);
            // >>> {age=41, name=Bob, email=bob@example.com}
            // STEP_END

            // REMOVE_START
            assertThat(res2).containsOnly(
                    Map.entry("name", "Bob"), Map.entry("email", "bob@example.com"), Map.entry("age", "41"));
            // REMOVE_END

            // STEP_START himport_pipeline
            List<String> res3 = new ArrayList<>();

            // The sync API waits for each reply, so these imports aren't pipelined.
            // To pipeline them, use the async or reactive API.
            try (HashImport<String> fieldset = HashImport.of("name", "email", "age")) {
                for (int i = 1; i <= 1000; i++) {
                    res3.add(syncCommands.himportSet("user:" + i, fieldset,
                            "user" + i, "user" + i + "@example.com", String.valueOf(20 + i % 50)));
                }
            }

            boolean allOk = res3.stream().allMatch("OK"::equals);
            System.out.println(res3.size() + " " + allOk); // >>> 1000 true

            String res4 = syncCommands.hget("user:1000", "email");
            System.out.println(res4); // >>> user1000@example.com
            // STEP_END

            // REMOVE_START
            assertThat(res3).hasSize(1000);
            assertThat(allOk).isTrue();
            assertThat(res4).isEqualTo("user1000@example.com");
            syncCommands.del(userKeys);
            // REMOVE_END
        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
