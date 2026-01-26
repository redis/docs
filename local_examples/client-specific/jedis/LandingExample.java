// EXAMPLE: landing
// BINDER_ID jedis-landing
// STEP_START import
import redis.clients.jedis.RedisClient;
import java.util.HashMap;
import java.util.Map;
// STEP_END

public class LandingExample {

    @Test
    public void run() {
        // STEP_START connect
        RedisClient jedis = new RedisClient("redis://localhost:6379");
        // STEP_END

        // STEP_START set_get_string
        String res1 = jedis.set("bike:1", "Deimos");
        System.out.println(res1); // >>> OK

        String res2 = jedis.get("bike:1");
        System.out.println(res2); // >>> Deimos
        // STEP_END

        // STEP_START set_get_hash
        Map<String, String> hash = new HashMap<>();
        hash.put("name", "John");
        hash.put("surname", "Smith");
        hash.put("company", "Redis");
        hash.put("age", "29");

        Long res3 = jedis.hset("user-session:123", hash);
        System.out.println(res3); // >>> 4

        Map<String, String> res4 = jedis.hgetAll("user-session:123");
        System.out.println(res4);
        // >>> {name=John, surname=Smith, company=Redis, age=29}
        // STEP_END

        // STEP_START close
        jedis.close();
        // STEP_END
    }
}
