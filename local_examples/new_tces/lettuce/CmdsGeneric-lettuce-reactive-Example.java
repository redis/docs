// EXAMPLE: cmds_generic
// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertThat;

public class CmdsGenericReactiveExample {

    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
// HIDE_END

            // STEP_START exists
            Mono<Void> existsExample = reactiveCommands.set("key1", "Hello").doOnNext(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.exists("key1")).doOnNext(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1L);
                // REMOVE_END
            }).then(reactiveCommands.exists("nosuchkey")).doOnNext(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0L);
                // REMOVE_END
            }).then(reactiveCommands.set("key2", "World")).doOnNext(res4 -> {
                System.out.println(res4); // >>> OK
                // REMOVE_START
                assertThat(res4).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.exists("key1", "key2", "nosuchkey")).doOnNext(res5 -> {
                System.out.println(res5); // >>> 2
                // REMOVE_START
                assertThat(res5).isEqualTo(2L);
                // REMOVE_END
            }).then();
            // STEP_END

// HIDE_START
            existsExample.block();
        } finally {
            redisClient.shutdown();
        }
    }
}
// HIDE_END
// HIDE_START
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import reactor.core.publisher.Mono;

import static org.junit.jupiter.api.Assertions.assertThat;

public class CmdsGenericReactiveExample {

    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
// HIDE_END

            // STEP_START exists
            Mono<Void> existsExample = reactiveCommands.set("key1", "Hello").doOnNext(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.exists("key1")).doOnNext(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1L);
                // REMOVE_END
            }).then(reactiveCommands.exists("nosuchkey")).doOnNext(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0L);
                // REMOVE_END
            }).then(reactiveCommands.set("key2", "World")).doOnNext(res4 -> {
                System.out.println(res4); // >>> OK
                // REMOVE_START
                assertThat(res4).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.exists("key1", "key2", "nosuchkey")).doOnNext(res5 -> {
                System.out.println(res5); // >>> 2
                // REMOVE_START
                assertThat(res5).isEqualTo(2L);
                // REMOVE_END
            }).then();
            // STEP_END
            
// HIDE_START
            existsExample.block();
        } finally {
            redisClient.shutdown();
        }
    }
}
// HIDE_END
