import redis.clients.jedis.*;
import redis.clients.jedis.commands.ProtocolCommand;
import java.util.*;

/** Runs one command, or one MULTI/EXEC block, through Jedis and prints what it throws. */
public class Probe {
  static byte[] arg(String s) {
    if (s.startsWith("hex:")) {
      String h = s.substring(4); byte[] b = new byte[h.length() / 2];
      for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(h.substring(2 * i, 2 * i + 2), 16);
      return b;
    }
    return s.getBytes();
  }
  static ProtocolCommand pc(String name) { byte[] raw = name.getBytes(); return () -> raw; }
  static byte[][] rest(String[] t, int from) {
    byte[][] a = new byte[t.length - from][];
    for (int i = from; i < t.length; i++) a[i - from] = arg(t[i]);
    return a;
  }
  static String one(Throwable e) { return String.valueOf(e.getMessage()).replace("\r", " ").replace("\n", " "); }

  public static void main(String[] a) {
    int port = Integer.parseInt(a[0]);
    DefaultJedisClientConfig.Builder b = DefaultJedisClientConfig.builder().connectionTimeoutMillis(5000).socketTimeoutMillis(5000);
    if (!a[1].isEmpty()) b.user(a[1]);
    if (!a[2].isEmpty()) b.password(a[2]);
    try (Jedis j = new Jedis(new HostAndPort("127.0.0.1", port), b.build())) {
      if (a[3].equals("cmd")) {
        String[] t = a[4].split("\u0001", -1);
        Object r = j.sendCommand(pc(t[0]), rest(t, 1));
        System.out.println("OK\t" + (r instanceof byte[] ? new String((byte[]) r) : r));
      } else {
        Transaction tx = j.multi();
        for (int i = 4; i < a.length; i++) { String[] t = a[i].split("\u0001", -1); tx.sendCommand(pc(t[0]), rest(t, 1)); }
        List<Object> r = tx.exec();
        System.out.println("OK\t" + r);
      }
    } catch (Throwable e) {
      StringBuilder sup = new StringBuilder();
      for (Throwable t : e.getSuppressed()) sup.append(" [suppressed ").append(t.getClass().getSimpleName()).append(": ").append(one(t)).append("]");
      System.out.println("EXC\t" + e.getClass().getName() + "\t" + one(e) + sup);
    }
  }
}
