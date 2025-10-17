// EXAMPLE: cmds_hash
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

public class CmdsHashExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // REMOVE_START
            // Clean up any existing data
            reactiveCommands.del("myhash").block();
            // REMOVE_END

            // STEP_START hdel
            Map<String, String> hDelExampleParams = new HashMap<>();
            hDelExampleParams.put("field1", "foo");

            Mono<Long> hDelExample1 = reactiveCommands.hset("myhash", hDelExampleParams).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            hDelExample1.block();

            Mono<Long> hDelExample2 = reactiveCommands.hdel("myhash", "field1").doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            hDelExample2.block();

            Mono<Long> hDelExample3 = reactiveCommands.hdel("myhash", "field2").doOnNext(result -> {
                System.out.println(result); // >>> 0
                // REMOVE_START
                assertThat(result).isEqualTo(0L);
                // REMOVE_END
            });
            // STEP_END

            hDelExample3.block();
            // REMOVE_START
            reactiveCommands.del("myhash").block();
            // REMOVE_END

            // STEP_START hset
            Mono<Boolean> hSetExample1 = reactiveCommands.hset("myhash", "field1", "Hello").doOnNext(result -> {
                System.out.println(result); // >>> True
                // REMOVE_START
                assertThat(result).isEqualTo(true);
                // REMOVE_END
            });

            hSetExample1.block();

            Mono<String> hSetExample2 = reactiveCommands.hget("myhash", "field1").doOnNext(result -> {
                System.out.println(result); // >>> Hello
                // REMOVE_START
                assertThat(result).isEqualTo("Hello");
                // REMOVE_END
            });

            hSetExample2.block();

            Map<String, String> hSetExampleParams = new HashMap<>();
            hSetExampleParams.put("field2", "Hi");
            hSetExampleParams.put("field3", "World");

            Mono<Long> hSetExample3 = reactiveCommands.hset("myhash", hSetExampleParams).doOnNext(result -> {
                System.out.println(result); // >>> 2
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            hSetExample3.block();

            Mono<String> hSetExample4 = reactiveCommands.hget("myhash", "field2").doOnNext(result -> {
                System.out.println(result); // >>> Hi
                // REMOVE_START
                assertThat(result).isEqualTo("Hi");
                // REMOVE_END
            });

            hSetExample4.block();

            Mono<String> hSetExample5 = reactiveCommands.hget("myhash", "field3").doOnNext(result -> {
                System.out.println(result); // >>> World
                // REMOVE_START
                assertThat(result).isEqualTo("World");
                // REMOVE_END
            });

            hSetExample5.block();

            Mono<Map<String, String>> hSetExample6 = reactiveCommands.hgetall("myhash").collectMap(
                    KeyValue::getKey, KeyValue::getValue
            ).doOnNext(result -> {
                System.out.println(result);
                // >>> {field1=Hello, field2=Hi, field3=World}
                // REMOVE_START
                assertThat(result.get("field1")).isEqualTo("Hello");
                assertThat(result.get("field2")).isEqualTo("Hi");
                assertThat(result.get("field3")).isEqualTo("World");
                // REMOVE_END
            });
            // STEP_END

            hSetExample6.block();
            // REMOVE_START
            reactiveCommands.del("myhash").block();
            // REMOVE_END

            // STEP_START hget
            Map<String, String> hGetExampleParams = new HashMap<>();
            hGetExampleParams.put("field1", "foo");

            Mono<Long> hGetExample1 = reactiveCommands.hset("myhash", hGetExampleParams).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            });

            hGetExample1.block();

            Mono<String> hGetExample2 = reactiveCommands.hget("myhash", "field1").doOnNext(result -> {
                System.out.println(result); // >>> foo
                // REMOVE_START
                assertThat(result).isEqualTo("foo");
                // REMOVE_END
            });

            hGetExample2.block();

            Mono<String> hGetExample3 = reactiveCommands.hget("myhash", "field2").doOnNext(result -> {
                System.out.println(result); // >>> null
                // REMOVE_START
                assertThat(result).isNull();
                // REMOVE_END
            });
            // STEP_END

            hGetExample3.block();
            // REMOVE_START
            reactiveCommands.del("myhash").block();
            // REMOVE_END

            // STEP_START hgetall
            Map<String, String> hGetAllExampleParams = new HashMap<>();
            hGetAllExampleParams.put("field1", "Hello");
            hGetAllExampleParams.put("field2", "World");

            Mono<Long> hGetAllExample1 = reactiveCommands.hset("myhash", hGetAllExampleParams).doOnNext(result -> {
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            hGetAllExample1.block();

            Mono<Map<String, String>> hGetAllExample2 = reactiveCommands.hgetall("myhash").collectMap(
                    KeyValue::getKey, KeyValue::getValue
            ).doOnNext(result -> {
                System.out.println(result);
                // >>> {field1=Hello, field2=World}
                // REMOVE_START
                assertThat(result.get("field1")).isEqualTo("Hello");
                assertThat(result.get("field2")).isEqualTo("World");
                // REMOVE_END
            });
            // STEP_END

            hGetAllExample2.block();
            // REMOVE_START
            reactiveCommands.del("myhash").block();
            // REMOVE_END

            // STEP_START hvals
            Map<String, String> hValsExampleParams = new HashMap<>();
            hValsExampleParams.put("field1", "Hello");
            hValsExampleParams.put("field2", "World");

            Mono<Long> hValsExample1 = reactiveCommands.hset("myhash", hValsExampleParams).doOnNext(result -> {
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            hValsExample1.block();

            Mono<List<String>> hValsExample2 = reactiveCommands.hvals("myhash").collectList().doOnNext(result -> {
                List<String> sortedValues = new ArrayList<>(result);
                Collections.sort(sortedValues);
                System.out.println(sortedValues);
                // >>> [Hello, World]
                // REMOVE_START
                assertThat(sortedValues).containsExactly("Hello", "World");
                // REMOVE_END
            });
            // STEP_END

            hValsExample2.block();
            // REMOVE_START
            reactiveCommands.del("myhash").block();
            // REMOVE_END

            // STEP_START hexpire
            // Set up hash with fields
            Map<String, String> hExpireExampleParams = new HashMap<>();
            hExpireExampleParams.put("field1", "Hello");
            hExpireExampleParams.put("field2", "World");

            Mono<Long> hExpireExample1 = reactiveCommands.hset("myhash", hExpireExampleParams).doOnNext(result -> {
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            });

            hExpireExample1.block();

            // Set expiration on hash fields
            Mono<List<Long>> hExpireExample2 = reactiveCommands.hexpire("myhash", 10, "field1", "field2").collectList().doOnNext(result -> {
                System.out.println(result);
                // >>> [1, 1]
                // REMOVE_START
                assertThat(result).isEqualTo(Arrays.asList(1L, 1L));
                // REMOVE_END
            });

            hExpireExample2.block();

            // Check TTL of the fields
            Mono<List<Long>> hExpireExample3 = reactiveCommands.httl("myhash", "field1", "field2").collectList().doOnNext(result -> {
                System.out.println(result.size());
                // >>> 2
                // REMOVE_START
                assertThat(result.size()).isEqualTo(2);
                assertThat(result.stream().allMatch(ttl -> ttl > 0)).isTrue(); // TTL should be positive
                // REMOVE_END
            });

            hExpireExample3.block();

            // Try to set expiration on non-existent field
            Mono<List<Long>> hExpireExample4 = reactiveCommands.hexpire("myhash", 10, "nonexistent").collectList().doOnNext(result -> {
                System.out.println(result);
                // >>> [-2]
                // REMOVE_START
                assertThat(result).isEqualTo(Arrays.asList(-2L));
                // REMOVE_END
            });
            // STEP_END

            hExpireExample4.block();
            // REMOVE_START
            reactiveCommands.del("myhash").block();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }

}
