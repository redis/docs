// EXAMPLE: bitmap_tutorial
package io.redis.examples.async;

import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.codec.ByteArrayCodec;

import java.util.concurrent.CompletableFuture;

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
            RedisAsyncCommands<String, String> async = connection.async();
            RedisAsyncCommands<byte[], byte[]> asyncBytes = bytesConnection.async();

            // REMOVE_START
            async.del("pings:2024-01-01-00:00", "A", "B", "C", "R").toCompletableFuture().join();
            // REMOVE_END

            // STEP_START ping
            CompletableFuture<Void> ping = async.setbit("pings:2024-01-01-00:00", 123, 1).thenCompose(res1 -> {
                System.out.println(res1); // >>> 0
                // REMOVE_START
                assertThat(res1).isEqualTo(0);
                // REMOVE_END
                return async.getbit("pings:2024-01-01-00:00", 123);
            }).thenCompose(res2 -> {
                System.out.println(res2); // >>> 1
                // REMOVE_START
                assertThat(res2).isEqualTo(1);
                // REMOVE_END
                return async.getbit("pings:2024-01-01-00:00", 456);
            }).thenAccept(res3 -> {
                System.out.println(res3); // >>> 0
                // REMOVE_START
                assertThat(res3).isEqualTo(0);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END
            ping.join();

            // STEP_START bitcount
            CompletableFuture<Void> bitcount = async.bitcount("pings:2024-01-01-00:00").thenAccept(res4 -> {
                System.out.println(res4); // >>> 1
                // REMOVE_START
                assertThat(res4).isEqualTo(1);
                // REMOVE_END
            }).toCompletableFuture();
            // STEP_END
            bitcount.join();

            // STEP_START bitop_setup
            CompletableFuture<Void> setup = async.setbit("A", 0, 1).thenCompose(v -> async.setbit("A", 1, 1))
                    .thenCompose(v -> async.setbit("A", 3, 1)).thenCompose(v -> async.setbit("A", 4, 1))
                    .thenCompose(v -> async.setbit("B", 3, 1)).thenCompose(v -> async.setbit("B", 4, 1))
                    .thenCompose(v -> async.setbit("B", 7, 1)).thenCompose(v -> async.setbit("C", 1, 1))
                    .thenCompose(v -> async.setbit("C", 2, 1)).thenCompose(v -> async.setbit("C", 4, 1))
                    .thenCompose(v -> async.setbit("C", 5, 1)).thenCompose(v -> asyncBytes.get("A".getBytes()))
                    .thenApply(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bitsA = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bitsA); // >>> 11011000
                        // REMOVE_START
                        assertThat(bitsA).isEqualTo("11011000");
                        // REMOVE_END
                        return bitsA;
                    }).thenCompose(v -> asyncBytes.get("B".getBytes())).thenApply(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bitsB = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bitsB); // >>> 00011001
                        // REMOVE_START
                        assertThat(bitsB).isEqualTo("00011001");
                        // REMOVE_END
                        return bitsB;
                    })
                    // Print C
                    .thenCompose(v -> asyncBytes.get("C".getBytes())).thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bitsC = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bitsC); // >>> 01101100
                        // REMOVE_START
                        assertThat(bitsC).isEqualTo("01101100");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            setup.join();

            // STEP_START bitop_and
            CompletableFuture<Void> andOp = async.bitopAnd("R", "A", "B", "C")
                    .thenCompose(len -> asyncBytes.get("R".getBytes())).thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 00001000
                        // REMOVE_START
                        assertThat(bits).isEqualTo("00001000");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            andOp.join();

            // STEP_START bitop_or
            CompletableFuture<Void> orOp = async.bitopOr("R", "A", "B", "C").thenCompose(len -> asyncBytes.get("R".getBytes()))
                    .thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 11111101
                        // REMOVE_START
                        assertThat(bits).isEqualTo("11111101");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            orOp.join();

            // STEP_START bitop_xor
            CompletableFuture<Void> xorOp = async.bitopXor("R", "A", "B").thenCompose(len -> asyncBytes.get("R".getBytes()))
                    .thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 11000001
                        // REMOVE_START
                        assertThat(bits).isEqualTo("11000001");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            xorOp.join();

            // STEP_START bitop_not
            CompletableFuture<Void> notOp = async.bitopNot("R", "A").thenCompose(len -> asyncBytes.get("R".getBytes()))
                    .thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 00100111
                        // REMOVE_START
                        assertThat(bits).isEqualTo("00100111");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            notOp.join();

            // STEP_START bitop_diff
            CompletableFuture<Void> diffOp = async.bitopDiff("R", "A", "B", "C")
                    .thenCompose(len -> asyncBytes.get("R".getBytes())).thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 10000000
                        // REMOVE_START
                        assertThat(bits).isEqualTo("10000000");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            diffOp.join();

            // STEP_START bitop_diff1
            CompletableFuture<Void> diff1Op = async.bitopDiff1("R", "A", "B", "C")
                    .thenCompose(len -> asyncBytes.get("R".getBytes())).thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 00100101
                        // REMOVE_START
                        assertThat(bits).isEqualTo("00100101");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            diff1Op.join();

            // STEP_START bitop_andor
            CompletableFuture<Void> andorOp = async.bitopAndor("R", "A", "B", "C")
                    .thenCompose(len -> asyncBytes.get("R".getBytes())).thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 01011000
                        // REMOVE_START
                        assertThat(bits).isEqualTo("01011000");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            andorOp.join();

            // STEP_START bitop_one
            CompletableFuture<Void> oneOp = async.bitopOne("R", "A", "B", "C")
                    .thenCompose(len -> asyncBytes.get("R".getBytes())).thenAccept(res -> {
                        byte b = (res != null && res.length > 0) ? res[0] : 0;
                        String bits = String.format("%8s", Integer.toBinaryString(b & 0xFF)).replace(' ', '0');
                        System.out.println(bits); // >>> 10100101
                        // REMOVE_START
                        assertThat(bits).isEqualTo("10100101");
                        // REMOVE_END
                    }).toCompletableFuture();
            // STEP_END
            oneOp.join();

            // REMOVE_START
            async.del("pings:2024-01-01-00:00", "A", "B", "C", "R").toCompletableFuture().join();
            // REMOVE_END
        } finally {
            redisClient.shutdown();
        }
    }

}
