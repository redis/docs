// EXAMPLE: cmds_stream
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

import java.util.*;

public class CmdsStreamExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            reactiveCommands.del("mystream").block();
            // REMOVE_END

            // STEP_START xadd1
            Map<String, String> entry1 = new HashMap<>();
            entry1.put("name", "Sara");
            entry1.put("surname", "OConnor");

            Mono<String> addEntry1 = reactiveCommands.xadd("mystream", entry1)
                .doOnNext(res1 -> {
                    System.out.println(res1); // >>> 1726055713866-0
                });

            addEntry1.block();

            Map<String, String> entry2 = new HashMap<>();
            entry2.put("field1", "value1");
            entry2.put("field2", "value2");
            entry2.put("field3", "value3");

            Mono<String> addEntry2 = reactiveCommands.xadd("mystream", entry2)
                .doOnNext(res2 -> {
                    System.out.println(res2); // >>> 1726055713866-1
                });

            addEntry2.block();

            Mono<Long> getLen = reactiveCommands.xlen("mystream")
                .doOnNext(res3 -> {
                    System.out.println(res3); // >>> 2
                    // REMOVE_START
                    assertThat(res3).isEqualTo(2L);
                    // REMOVE_END
                });

            getLen.block();

            Mono<List<StreamMessage<String, String>>> getRange = reactiveCommands
                .xrange("mystream", Range.unbounded())
                .collectList()
                .doOnNext(res4 -> {
                    for (var entry : res4) {
                        System.out.println(entry.getId() + " -> " + entry.getBody());
                    }
                    // >>> 1726055713866-0 -> {name=Sara, surname=OConnor}
                    // >>> 1726055713866-1 -> {field1=value1, field2=value2, field3=value3}
                    // REMOVE_START
                    assertThat(res4).hasSize(2);
                    // REMOVE_END
                });

            getRange.block();
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("mystream").block();
            // REMOVE_END

            // STEP_START xadd2
            Map<String, String> idmpEntry1 = new HashMap<>();
            idmpEntry1.put("field", "value");

            Mono<String> addIdmp1 = reactiveCommands.xadd(
                    "mystream",
                    XAddArgs.Builder.idmp("producer1", "msg1"),
                    idmpEntry1)
                .doOnNext(res5 -> {
                    System.out.println(res5); // >>> 1726055713867-0
                });

            addIdmp1.block();

            // Attempting to add the same message again with IDMP returns the original entry ID
            Map<String, String> idmpEntry2 = new HashMap<>();
            idmpEntry2.put("field", "different_value");

            Mono<String> addIdmp2 = reactiveCommands.xadd(
                    "mystream",
                    XAddArgs.Builder.idmp("producer1", "msg1"),
                    idmpEntry2)
                .doOnNext(res6 -> {
                    System.out.println(res6); // >>> 1726055713867-0 (deduplicated)
                });

            addIdmp2.block();

            Map<String, String> idmpAutoEntry1 = new HashMap<>();
            idmpAutoEntry1.put("field", "value");

            Mono<String> addIdmpAuto1 = reactiveCommands.xadd(
                    "mystream",
                    XAddArgs.Builder.idmpAuto("producer2"),
                    idmpAutoEntry1)
                .doOnNext(res7 -> {
                    System.out.println(res7); // >>> 1726055713867-1
                });

            addIdmpAuto1.block();

            // Auto-generated idempotent ID prevents duplicates for same producer+content
            Map<String, String> idmpAutoEntry2 = new HashMap<>();
            idmpAutoEntry2.put("field", "value");

            Mono<String> addIdmpAuto2 = reactiveCommands.xadd(
                    "mystream",
                    XAddArgs.Builder.idmpAuto("producer2"),
                    idmpAutoEntry2)
                .doOnNext(res8 -> {
                    System.out.println(res8); // >>> 1726055713867-1 (duplicate detected)
                });

            addIdmpAuto2.block();
            // STEP_END

            // REMOVE_START
            reactiveCommands.del("mystream").block();
            // REMOVE_END

        } finally {
            redisClient.shutdown();
        }
    }
}

