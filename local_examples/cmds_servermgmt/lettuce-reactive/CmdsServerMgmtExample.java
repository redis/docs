// EXAMPLE: cmds_servermgmt
package io.redis.examples.reactive;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

import reactor.core.publisher.Mono;

public class CmdsServerMgmtExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

            // STEP_START flushall
            Mono<Void> flushallExample = reactiveCommands.flushall()
                    .doOnNext(res1 -> {
                        System.out.println(res1); // >>> OK
                        // REMOVE_START
                        assertThat(res1).isEqualTo("OK");
                        // REMOVE_END
                    })
                    .then(reactiveCommands.keys("*").collectList())
                    .doOnNext(res2 -> {
                        System.out.println(res2); // >>> []
                        // REMOVE_START
                        assertThat(res2).isEmpty();
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            flushallExample.block();

            // STEP_START info
            Mono<Void> infoExample = reactiveCommands.info()
                    .doOnNext(res3 -> {
                        System.out.println(res3);
                        // >>> # Server
                        // >>> redis_version:7.4.0
                        // >>> ...
                        // REMOVE_START
                        assertThat(res3).contains("redis_version");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            infoExample.block();
        } finally {
            redisClient.shutdown();
        }
    }
}
