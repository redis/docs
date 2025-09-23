// EXAMPLE: bitmap_tutorial
package io.redis.examples.reactive;

import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.codec.ByteArrayCodec;
import reactor.core.publisher.Mono;

// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class BitmapExample {

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect();
                StatefulRedisConnection<byte[], byte[]> bytesConnection = redisClient.connect(ByteArrayCodec.INSTANCE)) {

            RedisReactiveCommands<String, String> reactive = connection.reactive();
            RedisReactiveCommands<byte[], byte[]> reactiveBytes = bytesConnection.reactive();

            // REMOVE_START
            reactive.del("pings:2024-01-01-00:00", "A", "B", "C", "R").block();
            // REMOVE_END

            // STEP_START ping
            Mono<Void> ping = reactive.setbit("pings:2024-01-01-00:00", 123, 1).doOnNext(res1 -> {
                System.out.println(res1); // >>> 0
                // REMOVE_START
                assertThat(res1).isEqualTo(0L);
                // REMOVE_END
            }).flatMap(v -> reactive.getbit("pings:2024-01-01-00:00", 123)).doOnNext(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1L);
                // REMOVE_END
            }).flatMap(v -> reactive.getbit("pings:2024-01-01-00:00", 456)).doOnNext(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0L);
                // REMOVE_END
            }).then();
            // STEP_END
            ping.block();

            // STEP_START bitcount
            Mono<Void> bitcount = reactive.bitcount("pings:2024-01-01-00:00").doOnNext(res4 -> {
                System.out.println(res4); // >>> 1
                // REMOVE_START
                assertThat(res4).isEqualTo(1L);
                // REMOVE_END
            }).then();
            // STEP_END
            bitcount.block();

            // STEP_START bitop_setup
            Mono<Void> setup = reactive.setbit("A", 0, 1).then(reactive.setbit("A", 1, 1)).then(reactive.setbit("A", 3, 1))
                    .then(reactive.setbit("A", 4, 1)).then(reactive.setbit("B", 3, 1)).then(reactive.setbit("B", 4, 1))
                    .then(reactive.setbit("B", 7, 1)).then(reactive.setbit("C", 1, 1)).then(reactive.setbit("C", 2, 1))
                    .then(reactive.setbit("C", 4, 1)).then(reactive.setbit("C", 5, 1)).then(reactiveBytes.get("A".getBytes()))
                    .doOnNext(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bitsA = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bitsA); // >>> 11011000
                        // REMOVE_START
                        assertThat(bitsA).isEqualTo("11011000");
                        // REMOVE_END
                    }).then(reactiveBytes.get("B".getBytes())).doOnNext(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bitsB = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bitsB); // >>> 00011001
                        // REMOVE_START
                        assertThat(bitsB).isEqualTo("00011001");
                        // REMOVE_END
                    }).then(reactiveBytes.get("C".getBytes())).doOnNext(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bitsC = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bitsC); // >>> 01101100
                        // REMOVE_START
                        assertThat(bitsC).isEqualTo("01101100");
                        // REMOVE_END
                    }).then();
            // STEP_END
            setup.block();

            // STEP_START bitop_and
            Mono<Void> andOp = reactive.bitopAnd("R", "A", "B", "C").then(reactiveBytes.get("R".getBytes())).doOnNext(res -> {
                byte b = (res != null && res.length > 0) ? res[0] : 0;
                String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                System.out.println(bits); // >>> 00001000
                // REMOVE_START
                assertThat(bits).isEqualTo("00001000");
                // REMOVE_END
            }).then();
            // STEP_END
            andOp.block();

            // STEP_START bitop_or
            Mono<Void> orOp = reactive.bitopOr("R", "A", "B", "C").then(reactiveBytes.get("R".getBytes())).doOnNext(res -> {
                byte b = (res != null && res.length > 0) ? res[0] : 0;
                String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                System.out.println(bits); // >>> 11111101
                // REMOVE_START
                assertThat(bits).isEqualTo("11111101");
                // REMOVE_END
            }).then();
            // STEP_END
            orOp.block();

            // STEP_START bitop_xor
            Mono<Void> xorOp = reactive.bitopXor("R", "A", "B").then(reactiveBytes.get("R".getBytes())).doOnNext(res -> {
                byte b = (res != null && res.length > 0) ? res[0] : 0;
                String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                System.out.println(bits); // >>> 11000001
                // REMOVE_START
                assertThat(bits).isEqualTo("11000001");
                // REMOVE_END
            }).then();
            // STEP_END
            xorOp.block();

            // STEP_START bitop_not
            Mono<Void> notOp = reactive.bitopNot("R", "A").then(reactiveBytes.get("R".getBytes())).doOnNext(res -> {
                byte b = (res != null && res.length > 0) ? res[0] : 0;
                String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                System.out.println(bits); // >>> 00100111
                // REMOVE_START
                assertThat(bits).isEqualTo("00100111");
                // REMOVE_END
            }).then();
            // STEP_END
            notOp.block();

            // STEP_START bitop_diff
            Mono<Void> diffOp = reactive.bitopDiff("R", "A", "B", "C").then(reactiveBytes.get("R".getBytes())).doOnNext(res -> {
                byte b = (res != null && res.length > 0) ? res[0] : 0;
                String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                System.out.println(bits); // >>> 10000000
                // REMOVE_START
                assertThat(bits).isEqualTo("10000000");
                // REMOVE_END
            }).then();
            // STEP_END
            diffOp.block();

            // STEP_START bitop_diff1
            Mono<Void> diff1Op = reactive.bitopDiff1("R", "A", "B", "C").then(reactiveBytes.get("R".getBytes()))
                    .doOnNext(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 00100101
                        // REMOVE_START
                        assertThat(bits).isEqualTo("00100101");
                        // REMOVE_END
                    }).then();
            // STEP_END
            diff1Op.block();

            // STEP_START bitop_andor
            Mono<Void> andorOp = reactive.bitopAndor("R", "A", "B", "C").then(reactiveBytes.get("R".getBytes()))
                    .doOnNext(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 01011000
                        // REMOVE_START
                        assertThat(bits).isEqualTo("01011000");
                        // REMOVE_END
                    }).then();
            // STEP_END
            andorOp.block();

            // STEP_START bitop_one
            Mono<Void> oneOp = reactive.bitopOne("R", "A", "B", "C").then(reactiveBytes.get("R".getBytes())).doOnNext(res -> {
                byte b = (res != null && res.length > 0) ? res[0] : 0;
                String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                System.out.println(bits); // >>> 10100101
                // REMOVE_START
                assertThat(bits).isEqualTo("10100101");
                // REMOVE_END
            }).then();
            // STEP_END
            oneOp.block();

            // REMOVE_START
            reactive.del("pings:2024-01-01-00:00", "A", "B", "C", "R").block();
            // REMOVE_END

        } finally {
            redisClient.shutdown();
        }
    }

}
