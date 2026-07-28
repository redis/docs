// EXAMPLE: hash_tutorial
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

public class HashExample {

    @Test
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // REMOVE_START
            CompletableFuture<Long> delResult = asyncCommands.del("bike:1", "bike:1:stats").toCompletableFuture();

            // REMOVE_END

            // STEP_START set_get_all
            Map<String, String> bike1 = new HashMap<>();
            bike1.put("model", "Deimos");
            bike1.put("brand", "Ergonom");
            bike1.put("type", "Enduro bikes");
            bike1.put("price", "4972");

            CompletableFuture<Void> setGetAll = asyncCommands.hset("bike:1", bike1).thenCompose(res1 -> {
                System.out.println(res1); // >>> 4
                // REMOVE_START
                assertThat(res1).isEqualTo(4);
                // REMOVE_END
                return asyncCommands.hget("bike:1", "model");
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> Deimos
                // REMOVE_START
                assertThat(res2).isEqualTo("Deimos");
                // REMOVE_END
                return asyncCommands.hget("bike:1", "price");
            }).thenCompose(res3 -> {
                System.out.println(res3); // >>> 4972
                // REMOVE_START
                assertThat(res3).isEqualTo("4972");
                // REMOVE_END
                return asyncCommands.hgetall("bike:1");
            })
                    // REMOVE_START
                    .thenApply(res -> {
                        assertThat(res.get("type")).isEqualTo("Enduro bikes");
                        assertThat(res.get("brand")).isEqualTo("Ergonom");
                        assertThat(res.get("price")).isEqualTo("4972");
                        assertThat(res.get("model")).isEqualTo("Deimos");

                        return res;
                    })
                    // REMOVE_END
                    .thenAccept(System.out::println)
                    // >>> {type=Enduro bikes, brand=Ergonom, price=4972, model=Deimos}
                    .toCompletableFuture();
            // STEP_END

            // STEP_START hmget
            // Recreate the bike:1 hash so this example runs on its own.
            CompletableFuture<Void> hmGet = setGetAll
                    .thenCompose(res4 -> asyncCommands.del("bike:1"))
                    .thenCompose(delRes -> asyncCommands.hset("bike:1", bike1))
                    .thenCompose(hsetRes -> asyncCommands.hmget("bike:1", "model", "price"))
                    // REMOVE_START
                    .thenApply(res -> {
                        assertThat(res.toString()).isEqualTo("[KeyValue[model, Deimos], KeyValue[price, 4972]]");
                        return res;
                    })
                    // REMOVE_END
                    .thenAccept(System.out::println)
                    // [KeyValue[model, Deimos], KeyValue[price, 4972]]
                    .toCompletableFuture();
            // STEP_END

            // STEP_START hincrby
            // Recreate the bike:1 hash so this example runs on its own.
            CompletableFuture<Void> hIncrBy = hmGet
                    .thenCompose(r -> asyncCommands.del("bike:1"))
                    .thenCompose(delRes -> asyncCommands.hset("bike:1", bike1))
                    .thenCompose(hsetRes -> asyncCommands.hincrby("bike:1", "price", 100))
                    .thenCompose(res6 -> {
                        System.out.println(res6); // >>> 5072
                        // REMOVE_START
                        assertThat(res6).isEqualTo(5072L);
                        // REMOVE_END
                        return asyncCommands.hincrby("bike:1", "price", -100);
                    })
                    // REMOVE_START
                    .thenApply(res -> {
                        assertThat(res).isEqualTo(4972L);
                        return res;
                    })
                    // REMOVE_END
                    .thenAccept(System.out::println)
                    // >>> 4972
                    .toCompletableFuture();
            // STEP_END

            // STEP_START incrby_get_mget
            CompletableFuture<Void> incrByGetMget = asyncCommands.hincrby("bike:1:stats", "rides", 1).thenCompose(res7 -> {
                System.out.println(res7); // >>> 1
                // REMOVE_START
                assertThat(res7).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.hincrby("bike:1:stats", "rides", 1);
            }).thenCompose(res8 -> {
                System.out.println(res8); // >>> 2
                // REMOVE_START
                assertThat(res8).isEqualTo(2L);
                // REMOVE_END
                return asyncCommands.hincrby("bike:1:stats", "rides", 1);
            }).thenCompose(res9 -> {
                System.out.println(res9); // >>> 3
                // REMOVE_START
                assertThat(res9).isEqualTo(3L);
                // REMOVE_END
                return asyncCommands.hincrby("bike:1:stats", "crashes", 1);
            }).thenCompose(res10 -> {
                System.out.println(res10); // >>> 1
                // REMOVE_START
                assertThat(res10).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.hincrby("bike:1:stats", "owners", 1);
            }).thenCompose(res11 -> {
                System.out.println(res11); // >>> 1
                // REMOVE_START
                assertThat(res11).isEqualTo(1L);
                // REMOVE_END
                return asyncCommands.hget("bike:1:stats", "rides");
            }).thenCompose(res12 -> {
                System.out.println(res12); // >>> 3
                // REMOVE_START
                assertThat(res12).isEqualTo("3");
                // REMOVE_END
                return asyncCommands.hmget("bike:1:stats", "crashes", "owners");
            })
                    // REMOVE_START
                    .thenApply(res -> {
                        assertThat(res.toString()).isEqualTo("[KeyValue[crashes, 1], KeyValue[owners, 1]]");
                        return res;
                    })
                    // REMOVE_END
                    .thenAccept(System.out::println)
                    // >>> [KeyValue[crashes, 1], KeyValue[owners, 1]]
                    .toCompletableFuture();
            // STEP_END

            // STEP_START hexpire
            // Recreate the sensor:sensor1 hash so this example runs on its own.
            Map<String, String> sensor1 = new HashMap<>();
            sensor1.put("air_quality", "256");
            sensor1.put("battery_level", "89");

            CompletableFuture<Void> hExpire = asyncCommands.del("sensor:sensor1")
                    .thenCompose(delRes -> asyncCommands.hset("sensor:sensor1", sensor1))
                    // Set a TTL of 60 seconds on two fields of the hash.
                    .thenCompose(hsetRes -> asyncCommands.hexpire("sensor:sensor1", 60, "air_quality", "battery_level"))
                    .thenCompose(res15 -> {
                        System.out.println(res15); // >>> [1, 1]
                        // REMOVE_START
                        assertThat(res15).isEqualTo(Arrays.asList(1L, 1L));
                        // REMOVE_END
                        // Retrieve the remaining TTL for those fields.
                        return asyncCommands.httl("sensor:sensor1", "air_quality", "battery_level");
                    })
                    // REMOVE_START
                    .thenApply(res16 -> {
                        assertThat(res16).hasSize(2);
                        assertThat(res16.stream().allMatch(ttl -> ttl > 0 && ttl <= 60)).isTrue();
                        return res16;
                    })
                    // REMOVE_END
                    .thenAccept(res16 -> System.out.println(res16.size()))
                    // >>> 2
                    .toCompletableFuture();
            // STEP_END

            // STEP_START hpexpire
            // Recreate the sensor:sensor1 hash so this example runs on its own.
            CompletableFuture<Void> hpExpire = hExpire
                    .thenCompose(prev -> asyncCommands.del("sensor:sensor1"))
                    .thenCompose(delRes -> asyncCommands.hset("sensor:sensor1", sensor1))
                    // Set the TTL of the 'air_quality' field in milliseconds.
                    .thenCompose(hsetRes -> asyncCommands.hpexpire("sensor:sensor1", 60000, "air_quality"))
                    .thenCompose(res17 -> {
                        System.out.println(res17); // >>> [1]
                        // REMOVE_START
                        assertThat(res17).isEqualTo(Arrays.asList(1L));
                        // REMOVE_END
                        // Retrieve the remaining TTL in milliseconds.
                        return asyncCommands.hpttl("sensor:sensor1", "air_quality");
                    })
                    // REMOVE_START
                    .thenApply(res18 -> {
                        assertThat(res18).hasSize(1);
                        assertThat(res18.stream().allMatch(pttl -> pttl > 0 && pttl <= 60000)).isTrue();
                        return res18;
                    })
                    // REMOVE_END
                    .thenAccept(res18 -> System.out.println(res18.size()))
                    // >>> 1
                    .toCompletableFuture();
            // STEP_END

            // STEP_START hexpireat
            // Recreate the sensor:sensor1 hash so this example runs on its own.
            long expireAtSeconds = System.currentTimeMillis() / 1000L + 24 * 60 * 60;
            CompletableFuture<Void> hExpireAt = hpExpire
                    .thenCompose(prev -> asyncCommands.del("sensor:sensor1"))
                    .thenCompose(delRes -> asyncCommands.hset("sensor:sensor1", sensor1))
                    // Set the expiration of 'air_quality' to a Unix time 24 hours from now.
                    .thenCompose(hsetRes -> asyncCommands.hexpireat("sensor:sensor1", expireAtSeconds, "air_quality"))
                    .thenCompose(res19 -> {
                        System.out.println(res19); // >>> [1]
                        // REMOVE_START
                        assertThat(res19).isEqualTo(Arrays.asList(1L));
                        // REMOVE_END
                        // Retrieve the expiration time as a Unix timestamp in seconds.
                        return asyncCommands.hexpiretime("sensor:sensor1", "air_quality");
                    })
                    // REMOVE_START
                    .thenApply(res20 -> {
                        assertThat(res20).hasSize(1);
                        assertThat(res20.get(0)).isGreaterThan(System.currentTimeMillis() / 1000L);
                        return res20;
                    })
                    // REMOVE_END
                    .thenAccept(res20 -> System.out.println(res20.size()))
                    // >>> 1
                    .toCompletableFuture();
            // STEP_END

            CompletableFuture.allOf(
                    // REMOVE_START
                    delResult,
                    // REMOVE_END
                    hIncrBy, incrByGetMget, hExpireAt).join();
        } finally {
            redisClient.shutdown();
        }
    }

}
