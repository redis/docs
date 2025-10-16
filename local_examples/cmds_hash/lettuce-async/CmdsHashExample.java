// EXAMPLE: cmds_hash
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.*;
import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsHashExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // REMOVE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            asyncCommands.del("myhash").toCompletableFuture().join();
        // REMOVE_END

            // STEP_START hdel
            Map<String, String> hDelExampleParams = new HashMap<>();
            hDelExampleParams.put("field1", "foo");

            CompletableFuture<Void> hDelExample = asyncCommands.hset("myhash", hDelExampleParams).thenCompose(res1 -> {
                System.out.println(res1); // >>> 1
                // REMOVE_START
                assertThat(res1).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.hdel("myhash", "field1");
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.hdel("myhash", "field2");
            }).thenAccept(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0L);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            hDelExample.join();
            // REMOVE_START
            asyncCommands.del("myhash").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START hset
            CompletableFuture<Void> hSetExample = asyncCommands.hset("myhash", "field1", "Hello").thenCompose(res1 -> {
                System.out.println(res1); // >>> 1
                // REMOVE_START
                assertThat(res1).isEqualTo(true);
                // REMOVE_END
                return asyncCommands.hget("myhash", "field1");
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> Hello
                // REMOVE_START
                assertThat(res2).isEqualTo("Hello");
                // REMOVE_END
                Map<String, String> hSetExampleParams = new HashMap<>();
                hSetExampleParams.put("field2", "Hi");
                hSetExampleParams.put("field3", "World");
                return asyncCommands.hset("myhash", hSetExampleParams);
            }).thenCompose(res3 -> {
                System.out.println(res3); // >>> 2
                // REMOVE_START
                assertThat(res3).isEqualTo(2L);
                // REMOVE_END
                return asyncCommands.hget("myhash", "field2");
            }).thenCompose(res4 -> {
                System.out.println(res4); // >>> Hi
                // REMOVE_START
                assertThat(res4).isEqualTo("Hi");
                // REMOVE_END
                return asyncCommands.hget("myhash", "field3");
            }).thenCompose(res5 -> {
                System.out.println(res5); // >>> World
                // REMOVE_START
                assertThat(res5).isEqualTo("World");
                // REMOVE_END
                return asyncCommands.hgetall("myhash");
            }).thenAccept(res6 -> {
                System.out.println(res6);
                // >>> {field1=Hello, field2=Hi, field3=World}
                // REMOVE_START
                assertThat(res6.get("field1")).isEqualTo("Hello");
                assertThat(res6.get("field2")).isEqualTo("Hi");
                assertThat(res6.get("field3")).isEqualTo("World");
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            hSetExample.join();
            // REMOVE_START
            asyncCommands.del("myhash").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START hget
            Map<String, String> hGetExampleParams = new HashMap<>();
            hGetExampleParams.put("field1", "foo");

            CompletableFuture<Void> hGetExample = asyncCommands.hset("myhash", hGetExampleParams).thenCompose(res1 -> {
                System.out.println(res1); // >>> 1
                // REMOVE_START
                assertThat(res1).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.hget("myhash", "field1");
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> foo
                // REMOVE_START
                assertThat(res2).isEqualTo("foo");
                // REMOVE_END
                return asyncCommands.hget("myhash", "field2");
            }).thenAccept(res3 -> {
                System.out.println(res3); // >>> null
                // REMOVE_START
                assertThat(res3).isNull();
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            hGetExample.join();
            // REMOVE_START
            asyncCommands.del("myhash").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START hgetall
            Map<String, String> hGetAllExampleParams = new HashMap<>();
            hGetAllExampleParams.put("field1", "Hello");
            hGetAllExampleParams.put("field2", "World");

            CompletableFuture<Void> hGetAllExample = asyncCommands.hset("myhash", hGetAllExampleParams).thenCompose(res1 -> {
                // REMOVE_START
                assertThat(res1).isEqualTo(2L);
                // REMOVE_END
                return asyncCommands.hgetall("myhash");
            }).thenAccept(res2 -> {
                System.out.println(res2);
                // >>> {field1=Hello, field2=World}
                // REMOVE_START
                assertThat(res2.get("field1")).isEqualTo("Hello");
                assertThat(res2.get("field2")).isEqualTo("World");
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            hGetAllExample.join();
            // REMOVE_START
            asyncCommands.del("myhash").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START hvals
            Map<String, String> hValsExampleParams = new HashMap<>();
            hValsExampleParams.put("field1", "Hello");
            hValsExampleParams.put("field2", "World");

            CompletableFuture<Void> hValsExample = asyncCommands.hset("myhash", hValsExampleParams).thenCompose(res1 -> {
                // REMOVE_START
                assertThat(res1).isEqualTo(2L);
                // REMOVE_END
                return asyncCommands.hvals("myhash");
            }).thenAccept(res2 -> {
                List<String> sortedValues = new ArrayList<>(res2);
                Collections.sort(sortedValues);
                System.out.println(sortedValues);
                // >>> [Hello, World]
                // REMOVE_START
                assertThat(sortedValues).containsExactly("Hello", "World");
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            hValsExample.join();
            // REMOVE_START
            asyncCommands.del("myhash").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START hexpire
            // Set up hash with fields
            Map<String, String> hExpireExampleParams = new HashMap<>();
            hExpireExampleParams.put("field1", "Hello");
            hExpireExampleParams.put("field2", "World");

            CompletableFuture<Void> hExpireExample = asyncCommands.hset("myhash", hExpireExampleParams).thenCompose(res1 -> {
                // REMOVE_START
                assertThat(res1).isEqualTo(2L);
                // REMOVE_END
                // Set expiration on hash fields
                return asyncCommands.hexpire("myhash", 10, "field1", "field2");
            }).thenCompose(res2 -> {
                System.out.println(res2);
                // >>> [1, 1]
                // REMOVE_START
                assertThat(res2).isEqualTo(Arrays.asList(1L, 1L));
                // REMOVE_END
                // Check TTL of the fields
                return asyncCommands.httl("myhash", "field1", "field2");
            }).thenCompose(res3 -> {
                System.out.println(res3.size());
                // >>> 2
                // REMOVE_START
                assertThat(res3.size()).isEqualTo(2);
                assertThat(res3.stream().allMatch(ttl -> ttl > 0)).isTrue(); // TTL should be positive
                // REMOVE_END
                // Try to set expiration on non-existent field
                return asyncCommands.hexpire("myhash", 10, "nonexistent");
            }).thenAccept(res4 -> {
                System.out.println(res4);
                // >>> [-2]
                // REMOVE_START
                assertThat(res4).isEqualTo(Arrays.asList(-2L));
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END

            hExpireExample.join();
            // REMOVE_START
            asyncCommands.del("myhash").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }

}

