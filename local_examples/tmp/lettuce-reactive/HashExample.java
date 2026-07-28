// EXAMPLE: hash_tutorial
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

public class HashExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // REMOVE_START
            // Clean up any existing data
            Mono<Void> cleanup = reactiveCommands.del("bike:1", "bike:1:stats").then();
            cleanup.block();
            // REMOVE_END

            // STEP_START set_get_all
            Map<String, String> bike1 = new HashMap<>();
            bike1.put("model", "Deimos");
            bike1.put("brand", "Ergonom");
            bike1.put("type", "Enduro bikes");
            bike1.put("price", "4972");

            Mono<Long> setGetAll = reactiveCommands.hset("bike:1", bike1).doOnNext(result -> {
                System.out.println(result); // >>> 4
                // REMOVE_START
                assertThat(result).isEqualTo(4L);
                // REMOVE_END
            });

            setGetAll.block();

            Mono<String> getModel = reactiveCommands.hget("bike:1", "model").doOnNext(result -> {
                System.out.println(result); // >>> Deimos
                // REMOVE_START
                assertThat(result).isEqualTo("Deimos");
                // REMOVE_END
            });

            Mono<String> getPrice = reactiveCommands.hget("bike:1", "price").doOnNext(result -> {
                System.out.println(result); // >>> 4972
                // REMOVE_START
                assertThat(result).isEqualTo("4972");
                // REMOVE_END
            });

            Mono<List<KeyValue<String, String>>> getAll = reactiveCommands.hgetall("bike:1").collectList().doOnNext(result -> {
                System.out.println(result);
                // >>> [KeyValue[type, Enduro bikes], KeyValue[brand, Ergonom],
                // KeyValue[price, 4972], KeyValue[model, Deimos]]
                // REMOVE_START
                List<KeyValue<String, String>> expected = new ArrayList<>(
                        Arrays.asList(KeyValue.just("price", "4972"), KeyValue.just("model", "Deimos"),
                                KeyValue.just("type", "Enduro bikes"), KeyValue.just("brand", "Ergonom")));
                assertThat(result).isEqualTo(expected);
                // REMOVE_END
            });
            // STEP_END

            // STEP_START hmget
            // Recreate the bike:1 hash so this example runs on its own.
            Mono<List<KeyValue<String, String>>> hmGet = reactiveCommands.del("bike:1")
                    .then(reactiveCommands.hset("bike:1", bike1))
                    .then(reactiveCommands.hmget("bike:1", "model", "price").collectList())
                    .doOnNext(result -> {
                        System.out.println(result);
                        // >>> [KeyValue[model, Deimos], KeyValue[price, 4972]]
                        // REMOVE_START
                        List<KeyValue<String, String>> expected = new ArrayList<>(
                                Arrays.asList(KeyValue.just("model", "Deimos"), KeyValue.just("price", "4972")));
                        assertThat(result).isEqualTo(expected);
                        // REMOVE_END
                    });
            // STEP_END

            // Run the set_get_all reads together, then the self-contained hmget.
            Mono.when(getModel, getPrice, getAll).block();
            hmGet.block();

            // STEP_START hincrby
            // Recreate the bike:1 hash so this example runs on its own.
            Mono<Void> hIncrBy = reactiveCommands.del("bike:1")
                    .then(reactiveCommands.hset("bike:1", bike1))
                    .then(reactiveCommands.hincrby("bike:1", "price", 100)).doOnNext(result -> {
                System.out.println(result); // >>> 5072
                // REMOVE_START
                assertThat(result).isEqualTo(5072L);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.hincrby("bike:1", "price", -100)).doOnNext(result -> {
                System.out.println(result); // >>> 4972
                // REMOVE_START
                assertThat(result).isEqualTo(4972L);
                // REMOVE_END
            }).then();
            // STEP_END
            hIncrBy.block();

            // STEP_START incrby_get_mget
            Mono<Void> incrByGetMget = reactiveCommands.hincrby("bike:1:stats", "rides", 1).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.hincrby("bike:1:stats", "rides", 1)).doOnNext(result -> {
                System.out.println(result); // >>> 2
                // REMOVE_START
                assertThat(result).isEqualTo(2L);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.hincrby("bike:1:stats", "rides", 1)).doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo(3L);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.hincrby("bike:1:stats", "crashes", 1)).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            }).flatMap(v -> reactiveCommands.hincrby("bike:1:stats", "owners", 1)).doOnNext(result -> {
                System.out.println(result); // >>> 1
                // REMOVE_START
                assertThat(result).isEqualTo(1L);
                // REMOVE_END
            }).then();

            incrByGetMget.block();

            Mono<String> getRides = reactiveCommands.hget("bike:1:stats", "rides").doOnNext(result -> {
                System.out.println(result); // >>> 3
                // REMOVE_START
                assertThat(result).isEqualTo("3");
                // REMOVE_END
            });

            Mono<List<KeyValue<String, String>>> getCrashesOwners = reactiveCommands.hmget("bike:1:stats", "crashes", "owners")
                    .collectList().doOnNext(result -> {
                        System.out.println(result);
                        // >>> [KeyValue[crashes, 1], KeyValue[owners, 1]]
                        // REMOVE_START
                        List<KeyValue<String, String>> expected = new ArrayList<>(
                                Arrays.asList(KeyValue.just("crashes", "1"), KeyValue.just("owners", "1")));

                        assertThat(result).isEqualTo(expected);
                        // REMOVE_END
                    });
            // STEP_END

            Mono.when(getRides, getCrashesOwners).block();

            // STEP_START hexpire
            // Recreate the sensor:sensor1 hash so this example runs on its own.
            Map<String, String> sensor1 = new HashMap<>();
            sensor1.put("air_quality", "256");
            sensor1.put("battery_level", "89");

            // Set a TTL of 60 seconds on two fields of the hash.
            Mono<List<Long>> hExpire = reactiveCommands.del("sensor:sensor1")
                    .then(reactiveCommands.hset("sensor:sensor1", sensor1))
                    .then(reactiveCommands.hexpire("sensor:sensor1", 60, "air_quality", "battery_level").collectList())
                    .doOnNext(result -> {
                        System.out.println(result);
                        // >>> [1, 1]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList(1L, 1L));
                        // REMOVE_END
                    });

            hExpire.block();

            // Retrieve the remaining TTL for those fields.
            Mono<List<Long>> hTtl = reactiveCommands.httl("sensor:sensor1", "air_quality", "battery_level")
                    .collectList().doOnNext(result -> {
                        System.out.println(result.size());
                        // >>> 2
                        // REMOVE_START
                        assertThat(result).hasSize(2);
                        assertThat(result.stream().allMatch(ttl -> ttl > 0 && ttl <= 60)).isTrue();
                        // REMOVE_END
                    });

            hTtl.block();
            // STEP_END

            // STEP_START hpexpire
            // Recreate the sensor:sensor1 hash so this example runs on its own.
            // Set the TTL of the 'air_quality' field in milliseconds.
            Mono<List<Long>> hpExpire = reactiveCommands.del("sensor:sensor1")
                    .then(reactiveCommands.hset("sensor:sensor1", sensor1))
                    .then(reactiveCommands.hpexpire("sensor:sensor1", 60000, "air_quality").collectList())
                    .doOnNext(result -> {
                        System.out.println(result);
                        // >>> [1]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList(1L));
                        // REMOVE_END
                    });

            hpExpire.block();

            // Retrieve the remaining TTL in milliseconds.
            Mono<List<Long>> hpTtl = reactiveCommands.hpttl("sensor:sensor1", "air_quality")
                    .collectList().doOnNext(result -> {
                        System.out.println(result.size());
                        // >>> 1
                        // REMOVE_START
                        assertThat(result).hasSize(1);
                        assertThat(result.stream().allMatch(pttl -> pttl > 0 && pttl <= 60000)).isTrue();
                        // REMOVE_END
                    });

            hpTtl.block();
            // STEP_END

            // STEP_START hexpireat
            // Recreate the sensor:sensor1 hash so this example runs on its own.
            long expireAtSeconds = System.currentTimeMillis() / 1000L + 24 * 60 * 60;

            // Set the expiration of 'air_quality' to a Unix time 24 hours from now.
            Mono<List<Long>> hExpireAt = reactiveCommands.del("sensor:sensor1")
                    .then(reactiveCommands.hset("sensor:sensor1", sensor1))
                    .then(reactiveCommands.hexpireat("sensor:sensor1", expireAtSeconds, "air_quality").collectList())
                    .doOnNext(result -> {
                        System.out.println(result);
                        // >>> [1]
                        // REMOVE_START
                        assertThat(result).isEqualTo(Arrays.asList(1L));
                        // REMOVE_END
                    });

            hExpireAt.block();

            // Retrieve the expiration time as a Unix timestamp in seconds.
            Mono<List<Long>> hExpireTime = reactiveCommands.hexpiretime("sensor:sensor1", "air_quality")
                    .collectList().doOnNext(result -> {
                        System.out.println(result.size());
                        // >>> 1
                        // REMOVE_START
                        assertThat(result).hasSize(1);
                        assertThat(result.get(0)).isGreaterThan(System.currentTimeMillis() / 1000L);
                        // REMOVE_END
                    });

            hExpireTime.block();
            // STEP_END
        } finally {
            redisClient.shutdown();
        }
    }

}
