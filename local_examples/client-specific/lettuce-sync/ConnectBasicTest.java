// EXAMPLE: landing
// BINDER_ID lettuce-landing
// STEP_START import
import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
// STEP_END


public class ConnectBasicTest {

    public void connectBasic() {
        // STEP_START connect
        RedisURI uri = RedisURI.Builder
                .redis("localhost", 6379)
                .build();

        RedisClient client = RedisClient.create(uri);
        StatefulRedisConnection<String, String> connection = client.connect();
        RedisCommands<String, String> commands = connection.sync();
        // STEP_END

        // STEP_START set_get_string
        commands.set("foo", "bar");
        String result = commands.get("foo");
        System.out.println(result); // >>> bar
        // STEP_END

        // STEP_START close
        connection.close();
        client.shutdown();
        // STEP_END
    }
}