//EXAMPLE: ss_tutorial
// BINDER_ID jedis-dt-sorted-set
//HIDE_START
package io.redis.examples;

import redis.clients.jedis.RedisClient;
import redis.clients.jedis.params.ZRangeParams;
import redis.clients.jedis.resps.Tuple;
//HIDE_END

//REMOVE_START
import org.junit.jupiter.api.Test;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
//REMOVE_END

public class SortedSetsExample {

  @Test
  public void run() {
    //HIDE_START
    RedisClient jedis = RedisClient.create("redis://localhost:6379");
    //HIDE_END

    //REMOVE_START
    jedis.del("racer_scores");
    //REMOVE_END

    //STEP_START zadd
    long res1 = jedis.zadd("racer_scores", 10d, "Norem");
    System.out.println(res1); // >>> 1

    long res2 = jedis.zadd("racer_scores", 12d, "Castilla");
    System.out.println(res2); // >>> 1

    long res3 = jedis.zadd("racer_scores", new HashMap<String,Double>() {{
      put("Sam-Bodden", 8d);
      put("Royce", 10d);
      put("Ford", 6d);
      put("Prickett", 14d);
      put("Castilla", 12d);
    }});
    System.out.println(res3); // >>> 4
    //STEP_END

    //STEP_START zrange
    List<String> res4 = jedis.zrange("racer_scores", 0, -1);
    System.out.println(res4); // >>> [Ford, Sam-Bodden, Norem, Royce, Castil, Castilla, Prickett]

    List<String> res5 = jedis.zrange("racer_scores", ZRangeParams.zrangeParams(0, -1).rev());
    System.out.println(res5); // >>> [Prickett, Castilla, Castil, Royce, Norem, Sam-Bodden, Ford]
    //STEP_END

    //STEP_START zrange_withscores
    List<Tuple> res6 = jedis.zrangeWithScores("racer_scores", 0, -1);
    System.out.println(res6); // >>> [[Ford,6.0], [Sam-Bodden,8.0], [Norem,10.0], [Royce,10.0], [Castil,12.0], [Castilla,12.0], [Prickett,14.0]]
    //STEP_END

    //STEP_START zrangebyscore
    List<String> res7 = jedis.zrange("racer_scores", ZRangeParams.zrangeByScoreParams(Double.NEGATIVE_INFINITY, 10d));
    System.out.println(res7); // >>> [Ford, Sam-Bodden, Norem, Royce]
    //STEP_END

    //STEP_START zremrangebyscore
    long res8 = jedis.zrem("racer_scores", "Castilla");
    System.out.println(res8); // >>> 1

    long res9 = jedis.zremrangeByScore("racer_scores", Double.NEGATIVE_INFINITY, 9d);
    System.out.println(res9); // >>> 2

    List<String> res10 = jedis.zrange("racer_scores", 0, -1);
    System.out.println(res10); // >>> [Norem, Royce, Prickett]
    //STEP_END

    //REMOVE_START
    assertEquals(3, jedis.zcard("racer_scores"));
    //REMOVE_END

    //STEP_START zrank
    // Recreate the three remaining racers so this example runs on its own.
    jedis.del("racer_scores");
    jedis.zadd("racer_scores", new HashMap<String,Double>() {{
      put("Norem", 10d);
      put("Royce", 10d);
      put("Prickett", 14d);
    }});

    long res11 = jedis.zrank("racer_scores", "Norem");
    System.out.println(res11); // >>> 0

    long res12 = jedis.zrevrank("racer_scores", "Norem");
    System.out.println(res12); // >>> 2
    //STEP_END

    //STEP_START zadd_lex
    long res13 = jedis.zadd("racer_scores", new HashMap<String,Double>() {{
      put("Norem", 0d);
      put("Sam-Bodden", 0d);
      put("Royce", 0d);
      put("Ford", 0d);
      put("Prickett", 0d);
      put("Castilla", 0d);
    }});
    System.out.println(res13); // >>> 3

    List<String> res14 = jedis.zrange("racer_scores", 0, -1);
    System.out.println(res14); // >>> [Castilla, Ford, Norem, Prickett, Royce, Sam-Bodden]

    List<String> res15 = jedis.zrange("racer_scores", ZRangeParams.zrangeByLexParams("[A", "[L"));
    System.out.println(res15); // >>> [Castilla, Ford]
    //STEP_END

    //STEP_START leaderboard
    long res16 = jedis.zadd("racer_scores", 100d, "Wood");
    System.out.println(res16); // >>> 1

    long res17 = jedis.zadd("racer_scores", 100d, "Henshaw");
    System.out.println(res17); // >>> 1

    long res18 = jedis.zadd("racer_scores", 150d, "Henshaw");
    System.out.println(res18); // >>> 0

    double res19 = jedis.zincrby("racer_scores", 50d, "Wood");
    System.out.println(res19); // >>> 150.0

    double res20 = jedis.zincrby("racer_scores", 50d, "Henshaw");
    System.out.println(res20); // >>> 200.0
    //STEP_END

    //STEP_START zmove
    jedis.del("bookmarks:{user:42}", "batch:{user:42}:001");

    long res21 = jedis.zadd("bookmarks:{user:42}", new HashMap<String, Double>() {{
      put("page:1", 1699990000d);
      put("page:2", 1699995000d);
      put("page:3", 1700000500d);
    }});
    System.out.println(res21); // >>> 3

    List<Tuple> res22 = jedis.zmoveByScore("bookmarks:{user:42}", "batch:{user:42}:001", "-inf", "(1700000000", 500);
    System.out.println(res22); // >>> [[page:1,1.69999E9], [page:2,1.699995E9]]

    List<Tuple> res23 = jedis.zrangeWithScores("bookmarks:{user:42}", 0, -1);
    System.out.println(res23); // >>> [[page:3,1.7000005E9]]

    List<Tuple> res24 = jedis.zrangeWithScores("batch:{user:42}:001", 0, -1);
    System.out.println(res24); // >>> [[page:1,1.69999E9], [page:2,1.699995E9]]
    //STEP_END

    //REMOVE_START
    assertEquals(3, res21);
    assertEquals(2, res22.size());
    assertEquals("page:1", res22.get(0).getElement());
    assertEquals(1699990000d, res22.get(0).getScore());
    assertEquals("page:2", res22.get(1).getElement());
    assertEquals(1, res23.size());
    assertEquals("page:3", res23.get(0).getElement());
    assertEquals(2, res24.size());
    jedis.del("bookmarks:{user:42}", "batch:{user:42}:001");
    //REMOVE_END

    //HIDE_START
    jedis.close();
    //HIDE_END
  }
}

