// EXAMPLE: pipe_trans_tutorial
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisFuture;
import io.lettuce.core.RedisURI;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.sync.RedisCommands;

public class TransPipeExample {

    public void run() throws Exception {
        RedisURI uri = RedisURI.Builder.redis("localhost", 6379).build();
        RedisClient client = RedisClient.create(uri);
        StatefulRedisConnection<String, String> connection = client.connect();
        RedisCommands<String, String> commands = connection.sync();
        RedisAsyncCommands<String, String> async = connection.async();

        for (int i = 0; i < 8; i++) {
            commands.del("seat:" + i);
        }

        for (int i = 1; i < 4; i++) {
            commands.del("counter:" + i);
        }

        commands.del("shellpath");

        // STEP_START basic_pipe
        connection.setAutoFlushCommands(false);

        async.set("seat:0", "#0");
        async.set("seat:1", "#1");
        async.set("seat:2", "#2");
        async.set("seat:3", "#3");
        async.set("seat:4", "#4");

        RedisFuture<String> seat0 = async.get("seat:0");
        RedisFuture<String> seat1 = async.get("seat:1");
        RedisFuture<String> seat2 = async.get("seat:2");
        RedisFuture<String> seat3 = async.get("seat:3");
        RedisFuture<String> seat4 = async.get("seat:4");

        connection.flushCommands();
        connection.setAutoFlushCommands(true);

        System.out.println(
            seat0.get() + ", " + seat1.get() + ", " + seat2.get() + ", " + seat3.get() + ", " + seat4.get()
        );
        // >>> #0, #1, #2, #3, #4
        // STEP_END

        // STEP_START basic_trans
        commands.multi();
        commands.incr("counter:1");
        commands.incrby("counter:2", 2);
        commands.incrby("counter:3", 3);

        TransactionResult txResults = commands.exec();
        System.out.println(txResults.get(0) + ", " + txResults.get(1) + ", " + txResults.get(2));
        // >>> 1, 2, 3
        // STEP_END

        // STEP_START trans_watch
        commands.set("shellpath", "/usr/syscmds/");
        commands.watch("shellpath");

        String currentPath = commands.get("shellpath");
        commands.multi();
        commands.set("shellpath", currentPath + ":/usr/mycmds/");

        TransactionResult watched = commands.exec();

        if (!watched.wasDiscarded()) {
            System.out.println(commands.get("shellpath"));
            // >>> /usr/syscmds/:/usr/mycmds/
        }
        // STEP_END

        connection.close();
        client.shutdown();
    }
}
