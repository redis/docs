// EXAMPLE: home_query_vec
package io.redis.examples.async;

// STEP_START import
// Lettuce client and Redis Search classes.
import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.search.arguments.*;
import io.lettuce.core.search.SearchReply;
import io.lettuce.core.json.JsonParser;
import io.lettuce.core.json.JsonObject;
import io.lettuce.core.json.JsonPath;

// Standard library classes for data manipulation and
// asynchronous programming.
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
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

public class HomeQueryVecExample {

    // STEP_START helper_method
    private byte[] floatArrayToByteArray(float[] vector) {
        ByteBuffer buffer = ByteBuffer.allocate(vector.length * 4).order(ByteOrder.LITTLE_ENDIAN);
        for (float value : vector) {
            buffer.putFloat(value);
        }
        return buffer.array();
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

        // STEP_START connect
        RedisClient redisClient = RedisClient.create("redis://localhost:6379");

        try (StatefulRedisConnection<String, String> connection = redisClient.connect();
                StatefulRedisConnection<String, byte[]> binConnection = redisClient
                        .connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE))) {
            RedisAsyncCommands<String, String> asyncCommands = connection.async();
            RedisAsyncCommands<String, byte[]> binAsyncCommands = binConnection.async();
            // ...
            // STEP_END
            // REMOVE_START
            asyncCommands.del("doc:1", "doc:2", "doc:3", "jdoc:1", "jdoc:2", "jdoc:3").toCompletableFuture().join();

            asyncCommands.ftDropindex("vector_idx").exceptionally(ex -> null) // Ignore errors if the index doesn't exist.
                    .toCompletableFuture().join();

            asyncCommands.ftDropindex("vector_json_idx").exceptionally(ex -> null) // Ignore errors if the index doesn't exist.
                    .toCompletableFuture().join();
            // REMOVE_END

            // STEP_START create_index
            List<FieldArgs<String>> schema = Arrays.asList(TextFieldArgs.<String> builder().name("content").build(),
                    TagFieldArgs.<String> builder().name("genre").build(),
                    VectorFieldArgs.<String> builder().name("embedding").hnsw().type(VectorFieldArgs.VectorType.FLOAT32)
                            .dimensions(384).distanceMetric(VectorFieldArgs.DistanceMetric.L2).build());

            CreateArgs<String, String> createArgs = CreateArgs.<String, String> builder().on(CreateArgs.TargetType.HASH)
                    .withPrefix("doc:").build();

            CompletableFuture<Void> createIndex = asyncCommands.ftCreate("vector_idx", createArgs, schema)
                    // REMOVE_START
                    .thenApply(result -> {
                        System.out.println(result); // >>> OK

                        assertThat(result).isEqualTo("OK");
                        return result;
                    })
                    // REMOVE_END
                    .thenAccept(System.out::println).toCompletableFuture();
            // STEP_END
            createIndex.join();

            // STEP_START add_data
            String sentence1 = "That is a very happy person";

            Map<String, byte[]> doc1 = new HashMap<>();
            doc1.put("content", sentence1.getBytes(StandardCharsets.UTF_8));
            doc1.put("genre", "persons".getBytes(StandardCharsets.UTF_8));

            try {
                doc1.put("embedding", floatArrayToByteArray(predictor.predict(sentence1)));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<Long> addDoc1 = binAsyncCommands.hset("doc:1", doc1)
                    .thenApply(result -> {
                        // REMOVE_START
                        assertThat(result).isEqualTo(3L);
                        // REMOVE_END
                        System.out.println(result); // >>> 3
                        return result;
                    }).toCompletableFuture();

            String sentence2 = "That is a happy dog";

            Map<String, byte[]> doc2 = new HashMap<>();
            doc2.put("content", sentence2.getBytes(StandardCharsets.UTF_8));
            doc2.put("genre", "pets".getBytes(StandardCharsets.UTF_8));

            try {
                doc2.put("embedding", floatArrayToByteArray(predictor.predict(sentence2)));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<Long> addDoc2 = binAsyncCommands.hset("doc:2", doc2)
                    .thenApply(result -> {
                        // REMOVE_START
                        assertThat(result).isEqualTo(3L);
                        // REMOVE_END
                        System.out.println(result); // >>> 3
                        return result;
                    }).toCompletableFuture();

            String sentence3 = "Today is a sunny day";

            Map<String, byte[]> doc3 = new HashMap<>();
            doc3.put("content", sentence3.getBytes(StandardCharsets.UTF_8));
            doc3.put("genre", "weather".getBytes(StandardCharsets.UTF_8));

            try {
                doc3.put("embedding", floatArrayToByteArray(predictor.predict(sentence3)));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<Long> addDoc3 = binAsyncCommands.hset("doc:3", doc3)
                    .thenApply(result -> {
                        // REMOVE_START
                        assertThat(result).isEqualTo(3L);
                        // REMOVE_END
                        System.out.println(result); // >>> 3
                        return result;
                    }).toCompletableFuture();
            // STEP_END
            CompletableFuture.allOf(addDoc1, addDoc2, addDoc3).join();

            // STEP_START himport_data
            String[][] docData = {
                    { "doc:1", "That is a very happy person", "persons" },
                    { "doc:2", "That is a happy dog", "pets" },
                    { "doc:3", "Today is a sunny day", "weather" } };

            List<RedisFuture<String>> himportDocs = new ArrayList<>();

            try (HashImport<String> fieldset = HashImport.of("content", "genre", "embedding")) {
                for (String[] doc : docData) {
                    byte[] docEmbedding = null;

                    try {
                        docEmbedding = floatArrayToByteArray(predictor.predict(doc[1]));
                    } catch (Exception e) {
                        // ...
                    }

                    himportDocs.add(binAsyncCommands.himportSet(doc[0], fieldset, doc[1].getBytes(StandardCharsets.UTF_8),
                            doc[2].getBytes(StandardCharsets.UTF_8), docEmbedding));
                }
            }

            CompletableFuture<Void> importDocs = CompletableFuture
                    .allOf(himportDocs.stream().map(RedisFuture::toCompletableFuture).toArray(CompletableFuture[]::new));
            // STEP_END
            importDocs.join();
            // REMOVE_START
            himportDocs.forEach(f -> assertThat(f.toCompletableFuture().join()).isEqualTo("OK"));
            // REMOVE_END

            // STEP_START query
            String query = "That is a happy person";
            float[] queryEmbedding = null;

            try {
                queryEmbedding = predictor.predict(query);
            } catch (Exception e) {
                // ...
            }

            SearchArgs<String, byte[]> searchArgs = SearchArgs.<String, byte[]> builder()
                    .param("vec", floatArrayToByteArray(queryEmbedding)).returnField("content").returnField("vector_distance")
                    .sortBy(SortByArgs.<String> builder().attribute("vector_distance").build()).build();

            CompletableFuture<SearchReply<String, byte[]>> hashQuery = binAsyncCommands
                    .ftSearch("vector_idx", "*=>[KNN 3 @embedding $vec AS vector_distance]".getBytes(StandardCharsets.UTF_8),
                            searchArgs)
                    .thenApply(result -> {
                        List<SearchReply.SearchResult<String, byte[]>> results = result.getResults();

                        results.forEach(r -> {
                            String content = new String(r.getFields().get("content"), StandardCharsets.UTF_8);
                            String distance = new String(r.getFields().get("vector_distance"), StandardCharsets.UTF_8);

                            System.out.println("ID: " + r.getId() + ", Content: " + content + ", Distance: " + distance);
                        });
                        // >>> ID: doc:1, Content: That is a very happy person, Distance: 0.114169836044
                        // >>> ID: doc:2, Content: That is a happy dog, Distance: 0.610845506191
                        // >>> ID: doc:3, Content: Today is a sunny day, Distance: 1.48624765873

                        // REMOVE_START
                        assertThat(result.getCount()).isEqualTo(3);
                        // REMOVE_END
                        return result;
                    }).toCompletableFuture();
            // STEP_END
            hashQuery.join();

            // STEP_START json_schema
            List<FieldArgs<String>> jsonSchema = Arrays.asList(
                    TextFieldArgs.<String> builder().name("$.content").as("content").build(),
                    TagFieldArgs.<String> builder().name("$.genre").as("genre").build(),
                    VectorFieldArgs.<String> builder().name("$.embedding").as("embedding").hnsw()
                            .type(VectorFieldArgs.VectorType.FLOAT32).dimensions(384)
                            .distanceMetric(VectorFieldArgs.DistanceMetric.L2).build());

            CreateArgs<String, String> jsonCreateArgs = CreateArgs.<String, String> builder().on(CreateArgs.TargetType.JSON)
                    .withPrefix("jdoc:").build();

            CompletableFuture<Void> jsonCreateIndex = asyncCommands.ftCreate("vector_json_idx", jsonCreateArgs, jsonSchema)
                    // REMOVE_START
                    .thenApply(result -> {
                        System.out.println(result); // >>> OK

                        assertThat(result).isEqualTo("OK");
                        return result;
                    })
                    // REMOVE_END
                    .thenAccept(System.out::println).toCompletableFuture();
            // STEP_END
            jsonCreateIndex.join();

            // STEP_START json_data
            JsonParser parser = asyncCommands.getJsonParser();

            String jSentence1 = "\"That is a very happy person\"";

            JsonObject jDoc1 = parser.createJsonObject();
            jDoc1.put("content", parser.createJsonValue(jSentence1));
            jDoc1.put("genre", parser.createJsonValue("\"persons\""));

            try {
                jDoc1.put("embedding", parser.createJsonValue(Arrays.toString(predictor.predict(jSentence1))));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<String> jsonAddDoc1 = asyncCommands.jsonSet("jdoc:1", JsonPath.ROOT_PATH, jDoc1)
                    .thenApply(result -> {
                        // REMOVE_START
                        assertThat(result).isEqualTo("OK");
                        // REMOVE_END
                        System.out.println(result); // >>> OK
                        return result;
                    }).toCompletableFuture();

            String jSentence2 = "\"That is a happy dog\"";

            JsonObject jDoc2 = parser.createJsonObject();
            jDoc2.put("content", parser.createJsonValue(jSentence2));
            jDoc2.put("genre", parser.createJsonValue("\"pets\""));

            try {
                jDoc2.put("embedding", parser.createJsonValue(Arrays.toString(predictor.predict(jSentence2))));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<String> jsonAddDoc2 = asyncCommands.jsonSet("jdoc:2", JsonPath.ROOT_PATH, jDoc2)
                    .thenApply(result -> {
                        // REMOVE_START
                        assertThat(result).isEqualTo("OK");
                        // REMOVE_END
                        System.out.println(result); // >>> OK
                        return result;
                    }).toCompletableFuture();

            String jSentence3 = "\"Today is a sunny day\"";

            JsonObject jDoc3 = parser.createJsonObject();
            jDoc3.put("content", parser.createJsonValue(jSentence3));
            jDoc3.put("genre", parser.createJsonValue("\"weather\""));

            try {
                jDoc3.put("embedding", parser.createJsonValue(Arrays.toString(predictor.predict(jSentence3))));
            } catch (Exception e) {
                // ...
            }

            CompletableFuture<String> jsonAddDoc3 = asyncCommands.jsonSet("jdoc:3", JsonPath.ROOT_PATH, jDoc3)
                    .thenApply(result -> {
                        // REMOVE_START
                        assertThat(result).isEqualTo("OK");
                        // REMOVE_END
                        System.out.println(result); // >>> OK
                        return result;
                    }).toCompletableFuture();
            // STEP_END
            CompletableFuture.allOf(jsonAddDoc1, jsonAddDoc2, jsonAddDoc3).join();

            // STEP_START json_query
            String jQuery = "That is a happy person";
            float[] jsonQueryEmbedding = null;

            try {
                jsonQueryEmbedding = predictor.predict(jQuery);
            } catch (Exception e) {
                // ...
            }

            SearchArgs<String, byte[]> jsonSearchArgs = SearchArgs.<String, byte[]> builder()
                    .param("vec", floatArrayToByteArray(jsonQueryEmbedding)).returnField("content").returnField("vector_distance")
                    .sortBy(SortByArgs.<String> builder().attribute("vector_distance").build()).build();

            CompletableFuture<SearchReply<String, byte[]>> jsonQuery = binAsyncCommands
                    .ftSearch("vector_json_idx", "*=>[KNN 3 @embedding $vec AS vector_distance]".getBytes(StandardCharsets.UTF_8),
                            jsonSearchArgs)
                    .thenApply(result -> {
                        List<SearchReply.SearchResult<String, byte[]>> results = result.getResults();

                        results.forEach(r -> {
                            String content = new String(r.getFields().get("content"), StandardCharsets.UTF_8);
                            String distance = new String(r.getFields().get("vector_distance"), StandardCharsets.UTF_8);

                            System.out.println("ID: " + r.getId() + ", Content: " + content + ", Distance: " + distance);
                        });
                        // >>> ID: jdoc:1, Content: That is a very happy person, Distance: 0.628328084946
                        // >>> ID: jdoc:2, Content: That is a happy dog, Distance: 0.895147025585
                        // >>> ID: jdoc:3, Content: Today is a sunny day, Distance: 1.49569523335

                        // REMOVE_START
                        assertThat(result.getCount()).isEqualTo(3);
                        // REMOVE_END
                        return result;
                    }).toCompletableFuture();
            // STEP_END
            jsonQuery.join();
        } finally {
            redisClient.shutdown();
        }
    }

}
