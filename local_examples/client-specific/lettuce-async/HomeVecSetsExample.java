// EXAMPLE: home_vecsets
package io.redis.examples.async;

// STEP_START import
// Lettuce client and query engine classes.
import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;

// Standard library classes for data manipulation and
// asynchronous programming.
import java.util.*;
import java.util.concurrent.CompletableFuture;

// DJL classes for model loading and inference.
import ai.djl.huggingface.translator.TextEmbeddingTranslatorFactory;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.training.util.ProgressBar;
// STEP_END
// REMOVE_START
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
// REMOVE_END

public class HomeVecSetsExample {

    // STEP_START helper_method
    public static Double[] convertFloatsToDoubles(float[] input) {
        if (input == null) {
            return null;
        }

        Double[] output = new Double[input.length];

        for (int i = 0; i < input.length; i++) {
            output[i] = Double.valueOf(input[i]);
        }

        return output;
    }
    // STEP_END

    // REMOVE_START
    @Test
    // REMOVE_END
    public void run() {
        // STEP_START model
        Predictor<String, float[]> predictor = null;

        try {
            Criteria<String, float[]> criteria = Criteria.builder().setTypes(String.class, float[].class)
                    .optModelUrls("djl://ai.djl.huggingface.pytorch/sentence-transformers/all-MiniLM-L6-v2")
                    .optEngine("PyTorch").optTranslatorFactory(new TextEmbeddingTranslatorFactory())
                    .optProgress(new ProgressBar()).build();

            predictor = criteria.loadModel().newPredictor();
        } catch (Exception e) {
            // ...
        }
        // STEP_END

        // STEP_START data
        final class Person {
            final String name;
            final int born;
            final int died;
            final String description;
            Person(String name, int born, int died, String description) {
                this.name = name; this.born = born; this.died = died; this.description = description;
            }
        }

        List<Person> people = Arrays.asList(
            new Person(
                "Marie Curie",
                1867, 1934,
                "Polish-French chemist and physicist. The only person ever to win" +
                " two Nobel prizes for two different sciences."
            ),
            new Person(
                "Linus Pauling",
                1901, 1994,
                "American chemist and peace activist. One of only two people to" +
                " win two Nobel prizes in different fields (chemistry and peace)."
            ),
            new Person(
                "Freddie Mercury",
                1946, 1991,
                "British musician, best known as the lead singer of the rock band Queen."
            ),
            new Person(
                "Marie Fredriksson",
                1958, 2019,
                "Swedish multi-instrumentalist, mainly known as the lead singer and" +
                " keyboardist of the band Roxette."
            ),
            new Person(
                "Paul Erdos",
                1913, 1996,
                "Hungarian mathematician, known for his eccentric personality almost" +
                " as much as his contributions to many different fields of mathematics."
            ),
            new Person(
                "Maryam Mirzakhani",
                1977, 2017,
                "Iranian mathematician. The first woman ever to win the Fields medal" +
                " for her contributions to mathematics."
            ),
            new Person(
                "Masako Natsume",
                1957, 1985,
                "Japanese actress. She was very famous in Japan but was primarily" +
                " known elsewhere in the world for her portrayal of Tripitaka in the" +
                " TV series Monkey."
            ),
            new Person(
                "Chaim Topol",
                1935, 2023,
                "Israeli actor and singer, usually credited simply as 'Topol'. He was" +
                " best known for his many appearances as Tevye in the musical Fiddler" +
                " on the Roof."
            )
        );
        // STEP_END

        // STEP_START add_data
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            // REMOVE_START
            asyncCommands.del("famousPeople").toCompletableFuture().join();
            // REMOVE_END

            CompletableFuture<?>[] vaddFutures = new CompletableFuture[people.size()];

            for (int i = 0; i < people.size(); i++) {
                Person person = people.get(i);
                Double[] embedding = null;

                try {
                    embedding = convertFloatsToDoubles(predictor.predict(person.description));
                } catch (Exception e) {
                    // ...
                }

                VAddArgs personArgs = VAddArgs.Builder.attributes(String.format("{\"born\": %d, \"died\": %d}", person.born, person.died));
                
                vaddFutures[i] = asyncCommands.vadd("famousPeople", person.name, personArgs, embedding)
                        .thenApply(result -> {
                            System.out.println(result); // >>> true
                            // REMOVE_START
                            assertThat(result).isTrue();
                            // REMOVE_END
                            return result;
                        }).toCompletableFuture();
            }
            
            CompletableFuture.allOf(vaddFutures).join();
            // STEP_END

            // STEP_START basic_query
            Double[] actorsEmbedding = null;
            
            try {
                actorsEmbedding = convertFloatsToDoubles(predictor.predict("actors"));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<List<String>> basicQuery = asyncCommands.vsim("famousPeople", actorsEmbedding)
                    .thenApply(result -> {
                        System.out.println(result);
                        // >>> [Masako Natsume, Chaim Topol, Linus Pauling, Marie Fredriksson, Maryam Mirzakhani, Marie Curie, Freddie Mercury, Paul Erdos]
                        // REMOVE_START
                        assertThat(result).containsExactly("Masako Natsume", "Chaim Topol", "Linus Pauling", "Marie Fredriksson", "Maryam Mirzakhani", "Marie Curie", "Freddie Mercury", "Paul Erdos");
                        // REMOVE_END
                        return result;
                    }).toCompletableFuture();
            // STEP_END
            
            // STEP_START limited_query
            VSimArgs limitArgs = VSimArgs.Builder.count(2L);
            
            CompletableFuture<List<String>> limitedQuery = asyncCommands.vsim("famousPeople", limitArgs, actorsEmbedding)
                    .thenApply(result -> {
                        System.out.println(result);
                        // >>> [Masako Natsume, Chaim Topol]
                        // REMOVE_START
                        assertThat(result).containsExactly("Masako Natsume", "Chaim Topol");
                        // REMOVE_END
                        return result;
                    }).toCompletableFuture();
            // STEP_END
            
            // STEP_START entertainer_query
            Double[] entertainerEmbedding = null;

            try {
                entertainerEmbedding = convertFloatsToDoubles(predictor.predict("entertainers"));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<List<String>> entertainerQuery = asyncCommands.vsim("famousPeople", entertainerEmbedding)
                    .thenApply(result -> {
                        System.out.println(result);
                        // >>> [Freddie Mercury, Chaim Topol, Linus Pauling, Marie Fredriksson, Masako Natsume, Paul Erdos, Maryam Mirzakhani, Marie Curie]
                        // REMOVE_START
                        assertThat(result).containsExactly("Freddie Mercury", "Chaim Topol", "Linus Pauling", "Marie Fredriksson", "Masako Natsume", "Paul Erdos", "Maryam Mirzakhani", "Marie Curie");
                        // REMOVE_END
                        return result;
                    }).toCompletableFuture();
            // STEP_END

            Double[] scienceEmbedding = null;

            try {
                scienceEmbedding = convertFloatsToDoubles(predictor.predict("science"));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<List<String>> scienceQuery = asyncCommands.vsim("famousPeople", scienceEmbedding)
                    .thenApply(result -> {
                        System.out.println(result);
                        // >>> [Marie Curie, Linus Pauling, Maryam Mirzakhani, Paul Erdos, Marie Fredriksson, Freddie Mercury, Masako Natsume, Chaim Topol]
                        // REMOVE_START
                        assertThat(result).containsExactly("Marie Curie", "Linus Pauling", "Maryam Mirzakhani", "Paul Erdos", "Marie Fredriksson", "Freddie Mercury", "Masako Natsume", "Chaim Topol");
                        // REMOVE_END
                        return result;
                    }).toCompletableFuture();
            
            // STEP_START filtered_query
            Double[] science2000Embedding = null;

            try {
                science2000Embedding = convertFloatsToDoubles(predictor.predict("science"));
            } catch (Exception e) {
                // ...
            }

            VSimArgs filterArgs = VSimArgs.Builder.filter(".died < 2000");

            CompletableFuture<List<String>> filteredQuery = asyncCommands.vsim("famousPeople", filterArgs, science2000Embedding)
                    .thenApply(result -> {
                        System.out.println(result);
                        // >>> [Marie Curie, Linus Pauling, Paul Erdos, Freddie Mercury, Masako Natsume]
                        // REMOVE_START
                        assertThat(result).containsExactly("Marie Curie", "Linus Pauling", "Paul Erdos", "Freddie Mercury", "Masako Natsume");
                        // REMOVE_END
                        return result;
                    }).toCompletableFuture();
            // STEP_END

            CompletableFuture.allOf(basicQuery, limitedQuery, entertainerQuery, scienceQuery, filteredQuery).join();
        } finally {
            redisClient.shutdown();
        }
    }
}

