// EXAMPLE: cmds_stream
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
import java.util.*;
import java.util.concurrent.CompletableFuture;
// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsStreamExample {

    @Test
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();

            // REMOVE_START
            CompletableFuture<Long> delResult = asyncCommands.del("mystream").toCompletableFuture();
            delResult.join();
            // REMOVE_END

            // STEP_START xadd1
            Map<String, String> entry1 = new HashMap<>();
            entry1.put("name", "Sara");
            entry1.put("surname", "OConnor");

            CompletableFuture<Void> xadd1Ops = asyncCommands.xadd("mystream", entry1)
                .thenCompose(res1 -> {
                    System.out.println(res1); // >>> 1726055713866-0
                    Map<String, String> entry2 = new HashMap<>();
                    entry2.put("field1", "value1");
                    entry2.put("field2", "value2");
                    entry2.put("field3", "value3");
                    return asyncCommands.xadd("mystream", entry2);
                })
                .thenCompose(res2 -> {
                    System.out.println(res2); // >>> 1726055713866-1
                    return asyncCommands.xlen("mystream");
                })
                .thenCompose(res3 -> {
                    System.out.println(res3); // >>> 2
                    // REMOVE_START
                    assertThat(res3).isEqualTo(2L);
                    // REMOVE_END
                    return asyncCommands.xrange("mystream", Range.unbounded());
                })
                .thenAccept(res4 -> {
                    for (var entry : res4) {
                        System.out.println(entry.getId() + " -> " + entry.getBody());
                    }
                    // >>> 1726055713866-0 -> {name=Sara, surname=OConnor}
                    // >>> 1726055713866-1 -> {field1=value1, field2=value2, field3=value3}
                    // REMOVE_START
                    assertThat(res4).hasSize(2);
                    // REMOVE_END
                })
                .toCompletableFuture();

            xadd1Ops.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("mystream").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START xadd2
            Map<String, String> idmpEntry1 = new HashMap<>();
            idmpEntry1.put("field", "value");

            CompletableFuture<Void> xadd2Ops = asyncCommands.xadd(
                    "mystream",
                    XAddArgs.Builder.idmp("producer1", "msg1"),
                    idmpEntry1)
                .thenCompose(res5 -> {
                    System.out.println(res5); // >>> 1726055713867-0
                    // Attempting to add same message again with IDMP returns original entry ID
                    Map<String, String> idmpEntry2 = new HashMap<>();
                    idmpEntry2.put("field", "different_value");
                    return asyncCommands.xadd("mystream",
                        XAddArgs.Builder.idmp("producer1", "msg1"), idmpEntry2);
                })
                .thenCompose(res6 -> {
                    System.out.println(res6); // >>> 1726055713867-0 (deduplicated)
                    Map<String, String> idmpAutoEntry1 = new HashMap<>();
                    idmpAutoEntry1.put("field", "value");
                    return asyncCommands.xadd("mystream",
                        XAddArgs.Builder.idmpAuto("producer2"), idmpAutoEntry1);
                })
                .thenCompose(res7 -> {
                    System.out.println(res7); // >>> 1726055713867-1
                    Map<String, String> idmpAutoEntry2 = new HashMap<>();
                    idmpAutoEntry2.put("field", "value");
                    return asyncCommands.xadd("mystream",
                        XAddArgs.Builder.idmpAuto("producer2"), idmpAutoEntry2);
                })
                .thenAccept(res8 -> {
                    System.out.println(res8); // >>> 1726055713867-1 (duplicate detected)
                })
                .toCompletableFuture();

            xadd2Ops.join();
            // STEP_END

            // REMOVE_START
            asyncCommands.del("mystream").toCompletableFuture().join();
            // REMOVE_END

        } finally {
            redisClient.shutdown();
        }
    }
}

