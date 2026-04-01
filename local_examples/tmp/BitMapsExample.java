// EXAMPLE: bitmap_tutorial
package io.redis.examples;

import redis.clients.jedis.UnifiedJedis;
import redis.clients.jedis.args.BitOP;
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
// REMOVE_END

public class BitMapsExample {

    @Test
    public void run() {
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");

        // REMOVE_START
        jedis.del("pings:2024-01-01-00:00");
        // REMOVE_END

        // STEP_START ping
        boolean res1 = jedis.setbit("pings:2024-01-01-00:00", 123, true);
        System.out.println(res1); // >>> false

        boolean res2 = jedis.getbit("pings:2024-01-01-00:00", 123);
        System.out.println(res2); // >>> true

        boolean res3 = jedis.getbit("pings:2024-01-01-00:00", 456);
        System.out.println(res3); // >>> false
        // STEP_END

        // REMOVE_START
        assertFalse(res1);
        assertTrue(res2);
        assertFalse(res3);
        // REMOVE_END

        // STEP_START bitcount
        long res4 = jedis.bitcount("pings:2024-01-01-00:00");
        System.out.println(res4); // >>> 1
        // STEP_END

        // REMOVE_START
        assertEquals(1, res4);
        // REMOVE_END
        // REMOVE_START
        jedis.del("A", "B", "C", "R");
        // REMOVE_END

        // STEP_START bitop_setup
        jedis.setbit("A", 0, true);
        jedis.setbit("A", 1, true);
        jedis.setbit("A", 3, true);
        jedis.setbit("A", 4, true);

        byte[] res5 = jedis.get("A".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res5[0] & 0xFF)).replace(' ', '0'));
        // >>> 11011000

        jedis.setbit("B", 3, true);
        jedis.setbit("B", 4, true);
        jedis.setbit("B", 7, true);

        byte[] res6 = jedis.get("B".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res6[0] & 0xFF)).replace(' ', '0'));
        // >>> 00011001

        jedis.setbit("C", 1, true);
        jedis.setbit("C", 2, true);
        jedis.setbit("C", 4, true);
        jedis.setbit("C", 5, true);

        byte[] res7 = jedis.get("C".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res7[0] & 0xFF)).replace(' ', '0'));
        // >>> 01101100
        // STEP_END
        // REMOVE_START
        assertEquals(0b11011000, res5[0] & 0xFF);
        assertEquals(0b00011001, res6[0] & 0xFF);
        assertEquals(0b01101100, res7[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_and
        jedis.bitop(BitOP.AND, "R", "A", "B", "C");
        byte[] res8 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res8[0] & 0xFF)).replace(' ', '0'));
        // >>> 00001000
        // STEP_END
        // REMOVE_START
        assertEquals(0b00001000, res8[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_or
        jedis.bitop(BitOP.OR, "R", "A", "B", "C");
        byte[] res9 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res9[0] & 0xFF)).replace(' ', '0'));
        // >>> 11111101
        // STEP_END
        // REMOVE_START
        assertEquals(0b11111101, res9[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_xor
        jedis.bitop(BitOP.XOR, "R", "A", "B");
        byte[] res10 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res10[0] & 0xFF)).replace(' ', '0'));
        // >>> 11000001
        // STEP_END
        // REMOVE_START
        assertEquals(0b11000001, res10[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_not
        jedis.bitop(BitOP.NOT, "R", "A");
        byte[] res11 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res11[0] & 0xFF)).replace(' ', '0'));
        // >>> 00100111
        // STEP_END
        // REMOVE_START
        assertEquals(0b00100111, res11[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_diff
        jedis.bitop(BitOP.DIFF, "R", "A", "B", "C");
        byte[] res12 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res12[0] & 0xFF)).replace(' ', '0'));
        // >>> 10000000
        // STEP_END
        // REMOVE_START
        assertEquals(0b10000000, res12[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_diff1
        jedis.bitop(BitOP.DIFF1, "R", "A", "B", "C");
        byte[] res13 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res13[0] & 0xFF)).replace(' ', '0'));
        // >>> 00100101
        // STEP_END
        // REMOVE_START
        assertEquals(0b00100101, res13[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_andor
        jedis.bitop(BitOP.ANDOR, "R", "A", "B", "C");
        byte[] res14 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res14[0] & 0xFF)).replace(' ', '0'));
        // >>> 01011000
        // STEP_END
        // REMOVE_START
        assertEquals(0b01011000, res14[0] & 0xFF);
        // REMOVE_END

        // STEP_START bitop_one
        jedis.bitop(BitOP.ONE, "R", "A", "B", "C");
        byte[] res15 = jedis.get("R".getBytes());
        System.out.println(String.format("%8s", Integer.toBinaryString(res15[0] & 0xFF)).replace(' ', '0'));
        // >>> 10100101
        // STEP_END
        // REMOVE_START
        assertEquals(0b10100101, res15[0] & 0xFF);
        // REMOVE_END


// HIDE_START
        jedis.close();
    }
}
// HIDE_END
