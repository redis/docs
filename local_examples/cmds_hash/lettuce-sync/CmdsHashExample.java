// EXAMPLE: cmds_hash
// HIDE_START
package io.redis.examples.sync;

import io.lettuce.core.*;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.api.StatefulRedisConnection;

import java.util.*;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class CmdsHashExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisCommands<String, String> syncCommands = connection.sync();
            // HIDE_END

            // REMOVE_START
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hdel
            // `hset` returns true because `field1` is a new field.
            boolean res1 = syncCommands.hset("myhash", "field1", "foo");
            System.out.println(res1); // >>> true

            Long res2 = syncCommands.hdel("myhash", "field1");
            System.out.println(res2); // >>> 1

            // `hdel` returns 0 because `field2` doesn't exist.
            Long res3 = syncCommands.hdel("myhash", "field2");
            System.out.println(res3); // >>> 0
            // STEP_END

            // REMOVE_START
            assertThat(res1).isTrue();
            assertThat(res2).isEqualTo(1L);
            assertThat(res3).isEqualTo(0L);
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hset
            // `hset` returns true because `field1` is a new field.
            boolean res4 = syncCommands.hset("myhash", "field1", "Hello");
            System.out.println(res4); // >>> true

            String res5 = syncCommands.hget("myhash", "field1");
            System.out.println(res5); // >>> Hello

            // The `Map` overload of `hset` returns the number of new fields.
            Map<String, String> newFields = new HashMap<>();
            newFields.put("field2", "Hi");
            newFields.put("field3", "World");

            Long res6 = syncCommands.hset("myhash", newFields);
            System.out.println(res6); // >>> 2

            String res7 = syncCommands.hget("myhash", "field2");
            System.out.println(res7); // >>> Hi

            String res8 = syncCommands.hget("myhash", "field3");
            System.out.println(res8); // >>> World

            // `hgetall` returns a `Map`, whose iteration order isn't
            // guaranteed. Wrap it in a `TreeMap` to sort the fields by name.
            Map<String, String> res9 = syncCommands.hgetall("myhash");
            System.out.println(new TreeMap<>(res9));
            // >>> {field1=Hello, field2=Hi, field3=World}
            // STEP_END

            // REMOVE_START
            assertThat(res4).isTrue();
            assertThat(res5).isEqualTo("Hello");
            assertThat(res6).isEqualTo(2L);
            assertThat(res7).isEqualTo("Hi");
            assertThat(res8).isEqualTo("World");
            assertThat(new TreeMap<>(res9).toString()).isEqualTo("{field1=Hello, field2=Hi, field3=World}");
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hget
            // `hset` returns true because `field1` is a new field.
            boolean res10 = syncCommands.hset("myhash", "field1", "foo");
            System.out.println(res10); // >>> true

            String res11 = syncCommands.hget("myhash", "field1");
            System.out.println(res11); // >>> foo

            // `hget` returns null because `field2` doesn't exist.
            String res12 = syncCommands.hget("myhash", "field2");
            System.out.println(res12); // >>> null
            // STEP_END

            // REMOVE_START
            assertThat(res10).isTrue();
            assertThat(res11).isEqualTo("foo");
            assertThat(res12).isNull();
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hmget
            Map<String, String> hmgetFields = new HashMap<>();
            hmgetFields.put("field1", "Hello");
            hmgetFields.put("field2", "World");

            syncCommands.hset("myhash", hmgetFields);

            // `hmget` returns a `KeyValue` for each field you ask for, in the
            // order you asked for them. A field that doesn't exist comes back
            // as an empty `KeyValue`.
            List<KeyValue<String, String>> res13 = syncCommands.hmget("myhash", "field1", "field2", "nofield");
            System.out.println(res13);
            // >>> [KeyValue[field1, Hello], KeyValue[field2, World], KeyValue[nofield].empty]
            // STEP_END

            // REMOVE_START
            assertThat(res13).hasSize(3);
            assertThat(res13.get(0).getValue()).isEqualTo("Hello");
            assertThat(res13.get(1).getValue()).isEqualTo("World");
            assertThat(res13.get(2).hasValue()).isFalse();
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hgetall
            Map<String, String> hGetAllFields = new HashMap<>();
            hGetAllFields.put("field1", "Hello");
            hGetAllFields.put("field2", "World");

            syncCommands.hset("myhash", hGetAllFields);

            // `hgetall` returns a `Map`, whose iteration order isn't
            // guaranteed. Wrap it in a `TreeMap` to sort the fields by name.
            Map<String, String> res14 = syncCommands.hgetall("myhash");
            System.out.println(new TreeMap<>(res14));
            // >>> {field1=Hello, field2=World}
            // STEP_END

            // REMOVE_START
            assertThat(new TreeMap<>(res14).toString()).isEqualTo("{field1=Hello, field2=World}");
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hvals
            Map<String, String> hValsFields = new HashMap<>();
            hValsFields.put("field1", "Hello");
            hValsFields.put("field2", "World");

            syncCommands.hset("myhash", hValsFields);

            // The order of the values isn't guaranteed, so sort them before
            // printing.
            List<String> res15 = syncCommands.hvals("myhash");
            List<String> sortedValues = new ArrayList<>(res15);
            Collections.sort(sortedValues);
            System.out.println(sortedValues); // >>> [Hello, World]
            // STEP_END

            // REMOVE_START
            assertThat(sortedValues).containsExactly("Hello", "World");
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hexpire
            // Set up a hash with two fields.
            Map<String, String> hExpireFields = new HashMap<>();
            hExpireFields.put("field1", "Hello");
            hExpireFields.put("field2", "World");

            syncCommands.hset("myhash", hExpireFields);

            // Set the expiration of both fields. `hexpire` returns a status
            // code for each field, where 1 means the expiration was set.
            List<Long> res16 = syncCommands.hexpire("myhash", 10, "field1", "field2");
            System.out.println(res16); // >>> [1, 1]

            // Check the time to live of the fields.
            List<Long> res17 = syncCommands.httl("myhash", "field1", "field2");
            System.out.println(res17); // >>> [10, 10]

            // Try to set the expiration of a field that doesn't exist.
            // The status code -2 means there's no such field.
            List<Long> res18 = syncCommands.hexpire("myhash", 10, "nonexistent");
            System.out.println(res18); // >>> [-2]
            // STEP_END

            // REMOVE_START
            assertThat(res16).containsExactly(1L, 1L);
            assertThat(res17).hasSize(2);
            assertThat(res17.stream().allMatch(ttl -> ttl > 0)).isTrue();
            assertThat(res18).containsExactly(-2L);
            syncCommands.del("myhash");
            // REMOVE_END

            // STEP_START hlen
            // `hset` returns true because `field1` is a new field.
            boolean res19 = syncCommands.hset("myhash", "field1", "Hello");
            System.out.println(res19); // >>> true

            // `hset` returns true because `field2` is also a new field.
            boolean res20 = syncCommands.hset("myhash", "field2", "World");
            System.out.println(res20); // >>> true

            Long res21 = syncCommands.hlen("myhash");
            System.out.println(res21); // >>> 2
            // STEP_END

            // REMOVE_START
            assertThat(res19).isTrue();
            assertThat(res20).isTrue();
            assertThat(res21).isEqualTo(2L);
            syncCommands.del("myhash");
            // REMOVE_END
        // HIDE_START
        } finally {
            redisClient.shutdown();
        }
        // HIDE_END
    }
}
