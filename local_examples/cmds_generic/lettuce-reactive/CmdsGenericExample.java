// EXAMPLE: cmds_generic
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;
// REMOVE_START
import org.junit.jupiter.api.Test;
// REMOVE_END
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;
import java.util.Map;

// REMOVE_START
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsGenericExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();
            // REMOVE_START
            reactiveCommands.del("key1", "key2", "nosuchkey").block();
            reactiveCommands.del("firstname", "lastname", "age").block();
            // REMOVE_END

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

            Mono.when(existsExample).block();
            // REMOVE_START
            reactiveCommands.del("key1", "key2").block();
            // REMOVE_END

            // STEP_START keys
            Mono<Void> keysExample = reactiveCommands.mset(Map.of(
                    "firstname", "Jack",
                    "lastname", "Stuntman",
                    "age", "35"
            )).doOnNext(res1 -> {
                System.out.println(res1); // >>> OK
                // REMOVE_START
                assertThat(res1).isEqualTo("OK");
                // REMOVE_END
            }).then(reactiveCommands.keys("*name*").collectList()).doOnNext(res2 -> {
                Collections.sort(res2);
                System.out.println(res2); // >>> [firstname, lastname]
                // REMOVE_START
                assertThat(res2).hasSize(2);
                // REMOVE_END
            }).then(reactiveCommands.keys("a??").collectList()).doOnNext(res3 -> {
                System.out.println(res3); // >>> [age]
                // REMOVE_START
                assertThat(res3).containsExactly("age");
                // REMOVE_END
            }).then(reactiveCommands.keys("*").collectList()).doOnNext(res4 -> {
                Collections.sort(res4);
                System.out.println(res4); // >>> [age, firstname, lastname]
                // REMOVE_START
                assertThat(res4).hasSize(3);
                // REMOVE_END
            }).then();
            // STEP_END

            Mono.when(keysExample).block();
            // REMOVE_START
            reactiveCommands.del("firstname", "lastname", "age").block();
            // REMOVE_END

            // STEP_START scan1
            Mono<Void> scan1Example = reactiveCommands
                    .sadd("myset", "1", "2", "3", "foo", "foobar", "feelsgood")
                    .flatMap(scan1Res1 -> {
                        System.out.println(scan1Res1);      // >>> 6
                        // REMOVE_START
                        assertThat(scan1Res1).isEqualTo(6L);
                        // REMOVE_END
                        return reactiveCommands.sscan("myset", ScanArgs.Builder.matches("f*"));
                    })
                    .doOnNext(scan1Res2 -> {
                        List<String> members = new java.util.ArrayList<>(scan1Res2.getValues());
                        Collections.sort(members);
                        System.out.println(members);        // >>> [feelsgood, foo, foobar]
                        // REMOVE_START
                        assertThat(members).hasSize(3);
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            Mono.when(scan1Example).block();
            // REMOVE_START
            reactiveCommands.del("myset").block();
            // REMOVE_END

            // STEP_START scan2
            // REMOVE_START
            for (int i = 1; i <= 1000; i++) {
                reactiveCommands.set("key:" + i, String.valueOf(i)).block();
            }
            // REMOVE_END

            // MATCH is applied after elements are fetched, so with the default COUNT most
            // iterations return few keys or none at all. Each iteration is subscribed to in
            // turn because the next one needs the cursor this one returns.
            KeyScanCursor<String> scan2Cursor = reactiveCommands
                    .scan(ScanArgs.Builder.matches("*11*")).block();
            System.out.println(scan2Cursor.getKeys().size());

            for (int i = 0; i < 3; i++) {
                scan2Cursor = reactiveCommands
                        .scan(scan2Cursor, ScanArgs.Builder.matches("*11*")).block();
                System.out.println(scan2Cursor.getKeys().size());
            }

            // A larger COUNT forces more scanning in a single iteration, so the remaining
            // matches arrive together. This continues from the cursor reached above.
            scan2Cursor = reactiveCommands
                    .scan(scan2Cursor, ScanArgs.Builder.matches("*11*").limit(1000)).block();
            System.out.println(scan2Cursor.getKeys().size());   // >>> 18
            // STEP_END

            // REMOVE_START
            assertThat(scan2Cursor.getKeys()).hasSize(18);
            reactiveCommands.flushdb().block();
            // REMOVE_END

            // STEP_START scan3
            Mono<Void> scan3Example = reactiveCommands
                    .geoadd("geokey", 0, 0, "value")
                    .flatMap(scan3Res1 -> {
                        System.out.println(scan3Res1);      // >>> 1
                        return reactiveCommands.zadd("zkey", 1000, "value");
                    })
                    .flatMap(scan3Res2 -> {
                        System.out.println(scan3Res2);      // >>> 1
                        return reactiveCommands.type("geokey");
                    })
                    .flatMap(scan3Res3 -> {
                        System.out.println(scan3Res3);      // >>> zset
                        return reactiveCommands.type("zkey");
                    })
                    .flatMap(scan3Res4 -> {
                        System.out.println(scan3Res4);      // >>> zset
                        return reactiveCommands.scan(KeyScanArgs.Builder.type("zset"));
                    })
                    .doOnNext(scan3Res5 -> {
                        List<String> keys = new java.util.ArrayList<>(scan3Res5.getKeys());
                        Collections.sort(keys);
                        System.out.println(keys);           // >>> [geokey, zkey]
                        // REMOVE_START
                        assertThat(keys).hasSize(2);
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            Mono.when(scan3Example).block();
            // REMOVE_START
            reactiveCommands.del("geokey", "zkey").block();
            // REMOVE_END

            // STEP_START scan4
            Mono<Void> scan4Example = reactiveCommands
                    .hset("myhash", Map.of("a", "1", "b", "2"))
                    .flatMap(scan4Res1 -> {
                        System.out.println(scan4Res1);      // >>> 2
                        return reactiveCommands.hscan("myhash");
                    })
                    .flatMap(scan4Res2 -> {
                        System.out.println(new java.util.TreeMap<>(scan4Res2.getMap()));
                        // >>> {a=1, b=2}
                        return reactiveCommands.hscanNovalues("myhash");
                    })
                    .doOnNext(scan4Res3 -> {
                        List<String> fields = new java.util.ArrayList<>(scan4Res3.getKeys());
                        Collections.sort(fields);
                        System.out.println(fields);         // >>> [a, b]
                        // REMOVE_START
                        assertThat(fields).containsExactly("a", "b");
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            Mono.when(scan4Example).block();
            // REMOVE_START
            reactiveCommands.del("myhash").block();
            // REMOVE_END
            // STEP_START del
            Mono<Void> delExample = reactiveCommands.set("key1", "Hello")
                    .flatMap(r1 -> {
                        System.out.println(r1);              // >>> OK
                        return reactiveCommands.set("key2", "World");
                    })
                    .flatMap(r2 -> {
                        System.out.println(r2);              // >>> OK
                        return reactiveCommands.del("key1", "key2", "key3");
                    })
                    .doOnNext(r3 -> {
                        System.out.println(r3);              // >>> 2
                        // REMOVE_START
                        assertThat(r3).isEqualTo(2L);
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            Mono.when(delExample).block();

            // STEP_START expire
            Mono<Void> expireExample = reactiveCommands.set("mykey", "Hello")
                    .flatMap(r1 -> {
                        System.out.println(r1);              // >>> OK
                        return reactiveCommands.expire("mykey", 10);
                    })
                    .flatMap(r2 -> {
                        System.out.println(r2);              // >>> true
                        return reactiveCommands.ttl("mykey");
                    })
                    .flatMap(r3 -> {
                        System.out.println(r3);              // >>> 10
                        // Overwriting a key with SET clears its expiry.
                        return reactiveCommands.set("mykey", "Hello World");
                    })
                    .flatMap(r4 -> {
                        System.out.println(r4);              // >>> OK
                        return reactiveCommands.ttl("mykey");
                    })
                    .flatMap(r5 -> {
                        System.out.println(r5);              // >>> -1
                        // XX only sets the expiry when one already exists, so this is a no-op.
                        return reactiveCommands.expire("mykey", 10, ExpireArgs.Builder.xx());
                    })
                    .flatMap(r6 -> {
                        System.out.println(r6);              // >>> false
                        return reactiveCommands.ttl("mykey");
                    })
                    .flatMap(r7 -> {
                        System.out.println(r7);              // >>> -1
                        // NX only sets the expiry when there is none, so this one applies.
                        return reactiveCommands.expire("mykey", 10, ExpireArgs.Builder.nx());
                    })
                    .flatMap(r8 -> {
                        System.out.println(r8);              // >>> true
                        return reactiveCommands.ttl("mykey");
                    })
                    .doOnNext(r9 -> {
                        System.out.println(r9);              // >>> 10
                        // REMOVE_START
                        assertThat(r9).isEqualTo(10L);
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            Mono.when(expireExample).block();
            // REMOVE_START
            reactiveCommands.del("mykey").block();
            // REMOVE_END

            // STEP_START ttl
            Mono<Void> ttlExample = reactiveCommands.set("mykey", "Hello")
                    .flatMap(r1 -> {
                        System.out.println(r1);              // >>> OK
                        return reactiveCommands.expire("mykey", 10);
                    })
                    .flatMap(r2 -> {
                        System.out.println(r2);              // >>> true
                        return reactiveCommands.ttl("mykey");
                    })
                    .doOnNext(r3 -> {
                        System.out.println(r3);              // >>> 10
                        // REMOVE_START
                        assertThat(r3).isEqualTo(10L);
                        // REMOVE_END
                    })
                    .then();
            // STEP_END

            Mono.when(ttlExample).block();
            // REMOVE_START
            reactiveCommands.del("mykey").block();
            // REMOVE_END


        } finally {
            redisClient.shutdown();
        }
    }

}
