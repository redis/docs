// =============================================================================
// CANONICAL LETTUCE SYNC TEST FILE TEMPLATE
// =============================================================================
// This file demonstrates the structure and conventions used for Lettuce sync
// documentation test files. These tests serve dual purposes:
// 1. Executable tests that validate code snippets
// 2. Source for documentation code examples (processed via special markers)
//
// MARKER REFERENCE:
// - EXAMPLE: <name>     - Identifies the example name (matches docs folder name)
// - BINDER_ID <id>      - Optional identifier for online code runners
// - HIDE_START/HIDE_END - Code hidden from documentation but executed in tests
// - REMOVE_START/REMOVE_END - Code removed entirely from documentation output
// - STEP_START <name>/STEP_END - Named code section for targeted doc inclusion
//
// Lettuce sync returns values directly — no CompletableFuture chaining. This is
// what makes it the most readable of the three Lettuce flavours for docs.
// RUN: mvn test -Dtest=SampleTest
// =============================================================================

// EXAMPLE: sample_example
package io.redis.examples.sync;

import io.lettuce.core.*;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
import java.util.*;
// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class SampleTest {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();

            // REMOVE_START
            syncCommands.del("mykey", "myhash", "bike:1:stats");
            // REMOVE_END

            // STEP_START string_ops
            String res1 = syncCommands.set("mykey", "Hello");
            System.out.println(res1); // >>> OK

            String res2 = syncCommands.get("mykey");
            System.out.println(res2); // >>> Hello
            // STEP_END

            // REMOVE_START
            assertThat(res1).isEqualTo("OK");
            assertThat(res2).isEqualTo("Hello");
            syncCommands.del("mykey");
            // REMOVE_END

            // STEP_START hash_ops
            // hset returns true only when the field is NEW; an update returns false.
            boolean res3 = syncCommands.hset("myhash", "field1", "value1");
            System.out.println(res3); // >>> true

            Map<String, String> fields = new HashMap<>();
            fields.put("field2", "value2");
            fields.put("field3", "value3");
            String res4 = syncCommands.hmset("myhash", fields);
            System.out.println(res4); // >>> OK

            String res5 = syncCommands.hget("myhash", "field1");
            System.out.println(res5); // >>> value1

            // hgetall returns a Map; iteration order is not guaranteed, so sort keys
            // before printing if the output comment has to be stable.
            Map<String, String> res6 = syncCommands.hgetall("myhash");
            System.out.println(new TreeMap<>(res6));
            // >>> {field1=value1, field2=value2, field3=value3}
            // STEP_END

            // REMOVE_START
            assertThat(res3).isTrue();
            assertThat(res4).isEqualTo("OK");
            assertThat(res5).isEqualTo("value1");
            assertThat(res6).containsEntry("field2", "value2");
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START numeric_ops
            syncCommands.hset("bike:1:stats", "rides", "0");
            long res7 = syncCommands.hincrby("bike:1:stats", "rides", 1);
            System.out.println(res7); // >>> 1

            long res8 = syncCommands.hincrby("bike:1:stats", "rides", 1);
            System.out.println(res8); // >>> 2
            // STEP_END

            // REMOVE_START
            assertThat(res7).isEqualTo(1L);
            assertThat(res8).isEqualTo(2L);
            syncCommands.del("bike:1:stats");
            // REMOVE_END
        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
