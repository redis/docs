// EXAMPLE: home_vecsets
// STEP_START import
// Redis client (Lettuce) and vector set APIs
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.VAddArgs;
import io.lettuce.core.VSimArgs;

// Tokenizer to generate vectors (kept consistent with HomeQueryVec.java)
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;

// Data & utils
import java.util.*;
// STEP_END

public class HomeVecSets {
    // Keep the same tokenizer model style as HomeQueryVec.java
    private static final int DIM = 768; // fixed dimension to pad/truncate token ids

    // Helper: convert tokenizer ids to a fixed-length Double[] of size DIM
    private static Double[] idsToDoubleVector(long[] ids) {
        Double[] out = new Double[DIM];
        int n = Math.min(ids.length, DIM);
        for (int i = 0; i < n; i++) out[i] = (double) ids[i];
        for (int i = n; i < DIM; i++) out[i] = 0.0d; // pad
        return out;
    }

    // Simple container for people data
    private static class Person {
        final int born;
        final int died;
        final String description;
        Person(int born, int died, String description) {
            this.born = born; this.died = died; this.description = description;
        }
    }

    public static void main(String[] args) throws Exception {
        // STEP_START model
        // Tokenizer configured like HomeQueryVec.java (acts as a simple, deterministic vectorizer here)
        HuggingFaceTokenizer tokenizer = HuggingFaceTokenizer.newInstance(
            "sentence-transformers/all-mpnet-base-v2",
            Map.of("maxLength", String.valueOf(DIM), "modelMaxLength", String.valueOf(DIM))
        );
        // STEP_END

        // STEP_START data
        Map<String, Person> peopleData = new LinkedHashMap<>();
        peopleData.put("Marie Curie", new Person(
            1867, 1934,
            """
            Polish-French chemist and physicist. The only person ever to win
            two Nobel prizes for two different sciences.
            """.trim()
        ));
        peopleData.put("Linus Pauling", new Person(
            1901, 1994,
            """
            American chemist and peace activist. One of only two people to win two
            Nobel prizes in different fields (chemistry and peace).
            """.trim()
        ));
        peopleData.put("Freddie Mercury", new Person(
            1946, 1991,
            """
            British musician, best known as the lead singer of the rock band
            Queen.
            """.trim()
        ));
        peopleData.put("Marie Fredriksson", new Person(
            1958, 2019,
            """
            Swedish multi-instrumentalist, mainly known as the lead singer and
            keyboardist of the band Roxette.
            """.trim()
        ));
        peopleData.put("Paul Erdos", new Person(
            1913, 1996,
            """
            Hungarian mathematician, known for his eccentric personality almost
            as much as his contributions to many different fields of mathematics.
            """.trim()
        ));
        peopleData.put("Maryam Mirzakhani", new Person(
            1977, 2017,
            """
            Iranian mathematician. The first woman ever to win the Fields medal
            for her contributions to mathematics.
            """.trim()
        ));
        peopleData.put("Masako Natsume", new Person(
            1957, 1985,
            """
            Japanese actress. She was very famous in Japan but was primarily
            known elsewhere in the world for her portrayal of Tripitaka in the
            TV series Monkey.
            """.trim()
        ));
        peopleData.put("Chaim Topol", new Person(
            1935, 2023,
            """
            Israeli actor and singer, usually credited simply as 'Topol'. He was
            best known for his many appearances as Tevye in the musical Fiddler
            on the Roof.
            """.trim()
        ));
        // STEP_END

        // STEP_START add_data
        RedisClient client = RedisClient.create(RedisURI.Builder.redis("localhost", 6379).build());
        StatefulRedisConnection<String, String> conn = null;
        try {
            conn = client.connect();
            RedisCommands<String, String> cmd = conn.sync();

            for (Map.Entry<String, Person> e : peopleData.entrySet()) {
                String name = e.getKey();
                Person p = e.getValue();

                // Vector from description
                Double[] vec = idsToDoubleVector(tokenizer.encode(p.description).getIds());

                // Add with attributes using VADD (vector sets API)
                VAddArgs addArgs = new VAddArgs()
                    .attributes(String.format("{\"born\": %d, \"died\": %d}", p.born, p.died));

                // Create set and add element + vector in one call
                Boolean added = cmd.vadd("famousPeople", name, addArgs, vec);
                if (Boolean.FALSE.equals(added)) {
                    // If element exists, you could update attributes via vsetattr
                    cmd.vsetattr("famousPeople", name, String.format("{\"born\": %d, \"died\": %d}", p.born, p.died));
                }
            }
        } finally {
            if (conn != null) conn.close();
            client.shutdown();
        }
        // STEP_END

        // Reconnect for queries (explicitly, to mirror example flow)
        client = RedisClient.create(RedisURI.Builder.redis("localhost", 6379).build());
        try (StatefulRedisConnection<String, String> qconn = client.connect()) {
            RedisCommands<String, String> q = qconn.sync();

            // STEP_START basic_query
            String queryValue = "actors";
            List<String> actors = q.vsim("famousPeople", idsToDoubleVector(tokenizer.encode(queryValue).getIds()));
            System.out.println("'actors': " + String.join(", ", actors));
            // STEP_END

            // STEP_START limited_query
            queryValue = "actors";
            VSimArgs twoCount = new VSimArgs().count(2L);
            List<String> twoActors = q.vsim("famousPeople", twoCount, idsToDoubleVector(tokenizer.encode(queryValue).getIds()));
            System.out.println("'actors (2)': " + String.join(", ", twoActors));
            // >>> 'actors (2)': Masako Natsume, Chaim Topol
            // STEP_END

            // STEP_START entertainer_query
            queryValue = "entertainer";
            List<String> entertainers = q.vsim("famousPeople", idsToDoubleVector(tokenizer.encode(queryValue).getIds()));
            System.out.println("'entertainer': " + String.join(", ", entertainers));
            // >>> 'entertainer': Chaim Topol, Freddie Mercury, Marie Fredriksson, ...
            // STEP_END

            queryValue = "science";
            List<String> science = q.vsim("famousPeople", idsToDoubleVector(tokenizer.encode(queryValue).getIds()));
            System.out.println("'science': " + String.join(", ", science));

            // STEP_START filtered_query
            queryValue = "science";
            VSimArgs filtered = new VSimArgs().filter(".died < 2000");
            List<String> science2000 = q.vsim("famousPeople", filtered, idsToDoubleVector(tokenizer.encode(queryValue).getIds()));
            System.out.println("'science2000': " + String.join(", ", science2000));
            // STEP_END
        } finally {
            client.shutdown();
        }
    }
}

