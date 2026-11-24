import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.output.NestedMultiOutput;
import io.lettuce.core.protocol.CommandArgs;
import io.lettuce.core.protocol.ProtocolKeyword;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

/** Runs one command, or one MULTI/EXEC block, through Lettuce's sync, async or reactive API and prints what it throws. */
public class LettuceProbe {
  static final StringCodec C = StringCodec.UTF8;

  static ProtocolKeyword kw(String name) {
    byte[] raw = name.getBytes();
    return new ProtocolKeyword() {
      public byte[] getBytes() { return raw; }
      public String name() { return name; }
    };
  }
  static CommandArgs<String, String> args(String[] t) {
    CommandArgs<String, String> a = new CommandArgs<>(C);
    for (int i = 1; i < t.length; i++) {
      if (t[i].startsWith("hex:")) {
        String h = t[i].substring(4); byte[] b = new byte[h.length() / 2];
        for (int j = 0; j < b.length; j++) b[j] = (byte) Integer.parseInt(h.substring(2 * j, 2 * j + 2), 16);
        a.add(b);
      } else a.add(t[i]);
    }
    return a;
  }
  static NestedMultiOutput<String, String> out() { return new NestedMultiOutput<>(C); }
  static String one(Throwable e) { return String.valueOf(e.getMessage()).replace("\r", " ").replace("\n", " "); }

  /** The exception the caller meant: the cause of an ExecutionException or CompletionException. */
  static String describe(Throwable e) {
    String wrapper = "";
    if ((e instanceof ExecutionException || e instanceof CompletionException) && e.getCause() != null) {
      wrapper = " [thrown as " + e.getClass().getSimpleName() + "]";
      e = e.getCause();
    }
    String cause = e.getCause() != null ? " [cause " + e.getCause().getClass().getName() + ": " + one(e.getCause()) + "]" : "";
    return "EXC\t" + e.getClass().getName() + "\t" + one(e) + cause + wrapper;
  }

  public static void main(String[] a) {
    String api = a[0]; int port = Integer.parseInt(a[1]);
    RedisURI.Builder ub = RedisURI.builder().withHost("127.0.0.1").withPort(port).withTimeout(Duration.ofSeconds(5));
    if (!a[2].isEmpty() && !a[3].isEmpty()) ub.withAuthentication(a[2], a[3]);
    else if (!a[3].isEmpty()) ub.withPassword(a[3].toCharArray());
    RedisClient client = RedisClient.create(ub.build());
    try (StatefulRedisConnection<String, String> conn = client.connect()) {
      Object r;
      if (a[4].equals("cmd")) {
        String[] t = a[5].split("\u0001", -1);
        switch (api) {
          case "sync": r = conn.sync().dispatch(kw(t[0]), out(), args(t)); break;
          case "async": r = conn.async().dispatch(kw(t[0]), out(), args(t)).get(); break;
          default: r = conn.reactive().dispatch(kw(t[0]), out(), args(t)).collectList().block();
        }
      } else {
        List<String[]> cmds = new ArrayList<>();
        for (int i = 5; i < a.length; i++) cmds.add(a[i].split("\u0001", -1));
        switch (api) {
          case "sync": {
            RedisCommands<String, String> c = conn.sync(); c.multi();
            for (String[] t : cmds) c.dispatch(kw(t[0]), out(), args(t));
            r = c.exec(); break;
          }
          case "async": {
            RedisAsyncCommands<String, String> c = conn.async(); c.multi().get();
            for (String[] t : cmds) c.dispatch(kw(t[0]), out(), args(t));
            r = c.exec().get(); break;
          }
          default: {
            RedisReactiveCommands<String, String> c = conn.reactive();
            r = c.multi().flatMap(s -> {
              for (String[] t : cmds) c.dispatch(kw(t[0]), out(), args(t)).subscribe(v -> {}, e -> {});
              return c.exec();
            }).block();
          }
        }
      }
      System.out.println("OK\t" + r);
    } catch (Throwable e) {
      System.out.println(describe(e));
    } finally {
      client.shutdown(Duration.ZERO, Duration.ofSeconds(1));
    }
  }
}
