// EXAMPLE: home_vecsets
// REMOVE_START
package com.redis.app;
// REMOVE_END
// STEP_START import
import redis.clients.jedis.UnifiedJedis;
import redis.clients.jedis.params.VAddParams;
import redis.clients.jedis.params.VSimParams;

import java.util.*;

// DJL classes for model loading and inference.
import ai.djl.huggingface.translator.TextEmbeddingTranslatorFactory;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.training.util.ProgressBar;
// STEP_END

public class HomeVecSets {

    // REMOVE_START
    public static void main(String[] args) {
    // REMOVE_END
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
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");
        // REMOVE_START
        jedis.del("famousPeople");
        // REMOVE_END

        for (Person person : people) {
            float[] embedding;
            try {
                embedding = predictor.predict(person.description);
            } catch (Exception e) {
                // This just allows the code to compile without errors.
                // In a real-world scenario, you would handle the exception properly.
                embedding = new float[384];
            }

            // Add element with attributes using VAddParams
            String attrs = String.format("{\"born\": %d, \"died\": %d}", person.born, person.died);
            boolean added = jedis.vadd("famousPeople", embedding, person.name, new VAddParams().setAttr(attrs));
            System.out.println(added); // >>> true
        }
    // STEP_END

    // STEP_START basic_query
        float[] actorsEmbedding;
        try {
            actorsEmbedding = predictor.predict("actors");
        } catch (Exception e) {
            actorsEmbedding = new float[384];
        }

        List<String> basicResults = jedis.vsim("famousPeople", actorsEmbedding);
        System.out.println(basicResults);
        // >>> [Masako Natsume, Chaim Topol, Linus Pauling, Marie Fredriksson, Maryam Mirzakhani, Marie Curie, Freddie Mercury, Paul Erdos]
    // STEP_END

    // STEP_START limited_query
        VSimParams limitParams = new VSimParams().count(2);
        List<String> limitedResults = jedis.vsim("famousPeople", actorsEmbedding, limitParams);
        System.out.println(limitedResults);
        // >>> [Masako Natsume, Chaim Topol]
    // STEP_END

    // STEP_START entertainer_query
        float[] entertainerEmbedding;
        try {
            entertainerEmbedding = predictor.predict("entertainers");
        } catch (Exception e) {
            entertainerEmbedding = new float[384];
        }

        List<String> entertainerResults = jedis.vsim("famousPeople", entertainerEmbedding);
        System.out.println(entertainerResults);
        // >>> [Freddie Mercury, Chaim Topol, Linus Pauling, Marie Fredriksson, Masako Natsume, Paul Erdos, Maryam Mirzakhani, Marie Curie]
    // STEP_END

        float[] scienceEmbedding;
        try {
            scienceEmbedding = predictor.predict("science");
        } catch (Exception e) {
            scienceEmbedding = new float[384];
        }

        List<String> scienceResults = jedis.vsim("famousPeople", scienceEmbedding);
        System.out.println(scienceResults);
        // >>> [Marie Curie, Linus Pauling, Maryam Mirzakhani, Paul Erdos, Marie Fredriksson, Freddie Mercury, Masako Natsume, Chaim Topol]

    // STEP_START filtered_query
        float[] science2000Embedding;
        try {
            science2000Embedding = predictor.predict("science");
        } catch (Exception e) {
            science2000Embedding = new float[384];
        }

        VSimParams filterParams = new VSimParams().filter(".died < 2000");
        List<String> filteredResults = jedis.vsim("famousPeople", science2000Embedding, filterParams);
        System.out.println(filteredResults);
        // >>> [Marie Curie, Linus Pauling, Paul Erdos, Freddie Mercury, Masako Natsume]
    // STEP_END
    }
}

