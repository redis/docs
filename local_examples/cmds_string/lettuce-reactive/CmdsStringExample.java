// EXAMPLE: cmds_string
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

public class CmdsStringExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // REMOVE_START
            reactiveCommands.del("key1", "key2", "mykey", "nonexisting").block();
            // REMOVE_END

            // STEP_START mget
            Mono<Void> mgetExample = reactiveCommands.set("key1", "Hello")
                    .flatMap(res1 -> reactiveCommands.set("key2", "World"))
                    .flatMap(res2 -> reactiveCommands.mget("key1", "key2", "nonexisting").collectList())
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> [KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting].empty]
                        // REMOVE_START
                        assertThat(res3.toString()).isEqualTo(
                                "[KeyValue[key1, Hello], KeyValue[key2, World], KeyValue[nonexisting].empty]");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            mgetExample.block();

            // STEP_START incr
            Mono<Void> incrExample = reactiveCommands.set("mykey", "10")
                    .flatMap(incrResult1 -> {
                        System.out.println(incrResult1);    // >>> OK
                        // REMOVE_START
                        assertThat(incrResult1).isEqualTo("OK");
                        // REMOVE_END
                        return reactiveCommands.incr("mykey");
                    })
                    .flatMap(incrResult2 -> {
                        System.out.println(incrResult2);    // >>> 11
                        // REMOVE_START
                        assertThat(incrResult2).isEqualTo(11L);
                        // REMOVE_END
                        return reactiveCommands.get("mykey");
                    })
                    .doOnNext(incrResult3 -> {
                        System.out.println(incrResult3);    // >>> 11
                        // REMOVE_START
                        assertThat(incrResult3).isEqualTo("11");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            incrExample.block();
            // REMOVE_START
            reactiveCommands.del("key1", "key2", "mykey", "nonexisting").block();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
