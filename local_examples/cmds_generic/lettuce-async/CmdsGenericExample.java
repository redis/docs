// EXAMPLE: cmds_generic
package io.redis.examples.async;

import io.lettuce.core.*;

import io.lettuce.core.api.async.RedisAsyncCommands;

import io.lettuce.core.api.StatefulRedisConnection;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
// REMOVE_START
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsGenericExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // REMOVE_START
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            asyncCommands.del("key1", "key2", "nosuchkey").toCompletableFuture().join();
            asyncCommands.del("firstname", "lastname", "age").toCompletableFuture().join();
        // REMOVE_END

            // STEP_START exists
            CompletableFuture<Void> existsExample = asyncCommands.set("key1", "Hello").thenCompose(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END

                return asyncCommands.exists("key1");
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1L);
                // REMOVE_END

                return asyncCommands.exists("nosuchkey");
            }).thenCompose(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0L);
                // REMOVE_END

                return asyncCommands.set("key2", "World");
            }).thenCompose(res4 -> {
                System.out.println(res4); // >>> OK
                // REMOVE_START
                assertThat(res4).isEqualTo("OK");
                // REMOVE_END

                return asyncCommands.exists("key1", "key2", "nosuchkey");
            }).thenAccept(res5 -> {
                System.out.println(res5); // >>> 2
                // REMOVE_START
                assertThat(res5).isEqualTo(2L);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END
            existsExample.join();
            // REMOVE_START
            asyncCommands.del("key1", "key2").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START keys
            CompletableFuture<Void> keysExample = asyncCommands.mset(Map.of(
                    "firstname", "Jack",
                    "lastname", "Stuntman",
                    "age", "35"
            )).thenCompose(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END

                return asyncCommands.keys("*name*");
            }).thenCompose(res2 -> {
                Collections.sort(res2);
                System.out.println(res2); // >>> [firstname, lastname]
                // REMOVE_START
                assertThat(res2).hasSize(2);
                // REMOVE_END

                return asyncCommands.keys("a??");
            }).thenCompose(res3 -> {
                System.out.println(res3); // >>> [age]
                // REMOVE_START
                assertThat(res3).containsExactly("age");
                // REMOVE_END

                return asyncCommands.keys("*");
            }).thenAccept(res4 -> {
                Collections.sort(res4);
                System.out.println(res4); // >>> [age, firstname, lastname]
                // REMOVE_START
                assertThat(res4).hasSize(3);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END
            keysExample.join();
            // REMOVE_START
            asyncCommands.del("firstname", "lastname", "age").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START scan1
            CompletableFuture<Void> scan1Example = asyncCommands
                    .sadd("myset", "1", "2", "3", "foo", "foobar", "feelsgood")
                    .thenCompose(scan1Res1 -> {
                        System.out.println(scan1Res1);      // >>> 6
                        // REMOVE_START
                        assertThat(scan1Res1).isEqualTo(6L);
                        // REMOVE_END
                        return asyncCommands.sscan("myset", ScanArgs.Builder.matches("f*"));
                    })
                    .thenAccept(scan1Res2 -> {
                        List<String> members = new java.util.ArrayList<>(scan1Res2.getValues());
                        Collections.sort(members);
                        System.out.println(members);        // >>> [feelsgood, foo, foobar]
                        // REMOVE_START
                        assertThat(members).hasSize(3);
                        // REMOVE_END
                    })
                    .toCompletableFuture();
            // STEP_END

            scan1Example.join();
            // REMOVE_START
            asyncCommands.del("myset").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START scan2
            // REMOVE_START
            for (int i = 1; i <= 1000; i++) {
                asyncCommands.set("key:" + i, String.valueOf(i)).toCompletableFuture().join();
            }
            // REMOVE_END

            // MATCH is applied after elements are fetched, so with the default COUNT most
            // iterations return few keys or none at all. Each iteration is awaited because
            // the next one needs the cursor this one returns.
            KeyScanCursor<String> scan2Cursor = asyncCommands
                    .scan(ScanArgs.Builder.matches("*11*")).toCompletableFuture().join();
            System.out.println(scan2Cursor.getKeys().size());

            for (int i = 0; i < 3; i++) {
                scan2Cursor = asyncCommands
                        .scan(scan2Cursor, ScanArgs.Builder.matches("*11*"))
                        .toCompletableFuture().join();
                System.out.println(scan2Cursor.getKeys().size());
            }

            // A larger COUNT forces more scanning in a single iteration, so the remaining
            // matches arrive together. This continues from the cursor reached above.
            scan2Cursor = asyncCommands
                    .scan(scan2Cursor, ScanArgs.Builder.matches("*11*").limit(1000))
                    .toCompletableFuture().join();
            System.out.println(scan2Cursor.getKeys().size());   // >>> 18
            // STEP_END

            // REMOVE_START
            assertThat(scan2Cursor.getKeys()).hasSize(18);
            asyncCommands.flushdb().toCompletableFuture().join();
            // REMOVE_END

            // STEP_START scan3
            CompletableFuture<Void> scan3Example = asyncCommands
                    .geoadd("geokey", 0, 0, "value")
                    .thenCompose(scan3Res1 -> {
                        System.out.println(scan3Res1);      // >>> 1
                        return asyncCommands.zadd("zkey", 1000, "value");
                    })
                    .thenCompose(scan3Res2 -> {
                        System.out.println(scan3Res2);      // >>> 1
                        return asyncCommands.type("geokey");
                    })
                    .thenCompose(scan3Res3 -> {
                        System.out.println(scan3Res3);      // >>> zset
                        return asyncCommands.type("zkey");
                    })
                    .thenCompose(scan3Res4 -> {
                        System.out.println(scan3Res4);      // >>> zset
                        return asyncCommands.scan(KeyScanArgs.Builder.type("zset"));
                    })
                    .thenAccept(scan3Res5 -> {
                        List<String> keys = new java.util.ArrayList<>(scan3Res5.getKeys());
                        Collections.sort(keys);
                        System.out.println(keys);           // >>> [geokey, zkey]
                        // REMOVE_START
                        assertThat(keys).hasSize(2);
                        // REMOVE_END
                    })
                    .toCompletableFuture();
            // STEP_END

            scan3Example.join();
            // REMOVE_START
            asyncCommands.del("geokey", "zkey").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START scan4
            CompletableFuture<Void> scan4Example = asyncCommands
                    .hset("myhash", Map.of("a", "1", "b", "2"))
                    .thenCompose(scan4Res1 -> {
                        System.out.println(scan4Res1);      // >>> 2
                        return asyncCommands.hscan("myhash");
                    })
                    .thenCompose(scan4Res2 -> {
                        System.out.println(new java.util.TreeMap<>(scan4Res2.getMap()));
                        // >>> {a=1, b=2}
                        return asyncCommands.hscanNovalues("myhash");
                    })
                    .thenAccept(scan4Res3 -> {
                        List<String> fields = new java.util.ArrayList<>(scan4Res3.getKeys());
                        Collections.sort(fields);
                        System.out.println(fields);         // >>> [a, b]
                        // REMOVE_START
                        assertThat(fields).containsExactly("a", "b");
                        // REMOVE_END
                    })
                    .toCompletableFuture();
            // STEP_END

            scan4Example.join();
            // REMOVE_START
            asyncCommands.del("myhash").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }
}
