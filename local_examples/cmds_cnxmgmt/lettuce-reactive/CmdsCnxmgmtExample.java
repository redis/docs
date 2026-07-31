// EXAMPLE: cmds_cnxmgmt
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;
// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END

import reactor.core.publisher.Mono;

public class CmdsCnxmgmtExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // STEP_START auth1
            Mono<Void> authExample1 = reactiveCommands.auth("temp_pass")
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                    })
                    .then(reactiveCommands.auth("default", "temp_pass"))
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> OK
                    })
                    .then();
            // STEP_END

            authExample1.block();

            // STEP_START auth2
            Mono<Void> authExample2 = reactiveCommands.auth("test-user", "strong_password")
                    .doOnNext(res3 -> {
                        System.out.println(res3); // >>> OK
                    })
                    .then();
            // STEP_END

            authExample2.block();
        } finally {
            redisClient.shutdown();
        }
    }
}
