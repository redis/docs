// EXAMPLE: HomeQueryVec
// STEP_START import
// Jedis client and query engine classes.
import redis.clients.jedis.UnifiedJedis;
import redis.clients.jedis.search.*;
import redis.clients.jedis.search.schemafields.*;
import redis.clients.jedis.search.schemafields.VectorField.VectorAlgorithm;
import redis.clients.jedis.exceptions.JedisDataException;

// Data manipulation.
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Map;
import java.util.List;
import org.json.JSONObject;
import redis.clients.jedis.json.Path2;

// Tokenizer to generate the vector embeddings.
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
// STEP_END

public class HomeQueryVec {
    // STEP_START helper_method
    public static byte[] longsToFloatsByteString(long[] input) {
        float[] floats = new float[input.length];
        for (int i = 0; i < input.length; i++) {
            floats[i] = input[i];
        }

        byte[] bytes = new byte[Float.BYTES * floats.length];
        ByteBuffer
            .wrap(bytes)
            .order(ByteOrder.LITTLE_ENDIAN)
            .asFloatBuffer()
            .put(floats);
        return bytes;
    }
    // STEP_END

    // STEP_START json_helper_method
    public static float[] longArrayToFloatArray(long[] input) {
        float[] floats = new float[input.length];
        for (int i = 0; i < input.length; i++) {
            floats[i] = input[i];
        }
        return floats;
    }
    // STEP_END

    public static void main(String[] args) throws Exception {
        // STEP_START tokenizer
        HuggingFaceTokenizer sentenceTokenizer = HuggingFaceTokenizer.newInstance(
            "sentence-transformers/all-mpnet-base-v2",
            Map.of("maxLength", "768",  "modelMaxLength", "768")
        );
        // STEP_END

        // STEP_START connect
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");

        try {jedis.ftDropIndex("vector_idx");} catch (JedisDataException j){}
        // STEP_END

        // STEP_START create_index
        SchemaField[] schema = {
            TextField.of("content"),
            TagField.of("genre"),
            VectorField.builder()
                .fieldName("embedding")
                .algorithm(VectorAlgorithm.HNSW)
                .attributes(
                    Map.of(
                        "TYPE", "FLOAT32",
                        "DIM", 768,
                        "DISTANCE_METRIC", "L2"
                    )
                )
                .build()
        };

        jedis.ftCreate("vector_idx",
            FTCreateParams.createParams()
                .addPrefix("doc:")
                .on(IndexDataType.HASH),
                schema
        );
        // STEP_END

        // STEP_START add_data
        String sentence1 = "That is a very happy person";
        jedis.hset("doc:1", Map.of("content", sentence1, "genre", "persons"));
        jedis.hset(
            "doc:1".getBytes(),
            "embedding".getBytes(),
            longsToFloatsByteString(sentenceTokenizer.encode(sentence1).getIds())
        );

        String sentence2 = "That is a happy dog";
        jedis.hset("doc:2", Map.of("content", sentence2, "genre", "pets"));
        jedis.hset(
            "doc:2".getBytes(),
            "embedding".getBytes(),
            longsToFloatsByteString(sentenceTokenizer.encode(sentence2).getIds())
        );

        String sentence3 = "Today is a sunny day";
        jedis.hset("doc:3", Map.of("content", sentence3, "genre", "weather"));
        jedis.hset(
            "doc:3".getBytes(),
            "embedding".getBytes(),
            longsToFloatsByteString(sentenceTokenizer.encode(sentence3).getIds())
        );
        // STEP_END

        // STEP_START query
        String sentence = "That is a happy person";

        int K = 3;
        Query q = new Query("*=>[KNN $K @embedding $BLOB AS distance]")
                        .returnFields("content", "distance")
                        .addParam("K", K)
                        .addParam(
                            "BLOB",
                            longsToFloatsByteString(
                                sentenceTokenizer.encode(sentence).getIds()
                            )
                        )
                        .setSortBy("distance", true)
                        .dialect(2);

        List<Document> docs = jedis.ftSearch("vector_idx", q).getDocuments();

        for (Document doc: docs) {
            System.out.println(
                String.format(
                    "ID: %s, Distance: %s, Content: %s",
                    doc.getId(),
                    doc.get("distance"),
                    doc.get("content")
                )
            );
        }
        // STEP_END

        // STEP_START json_schema
        SchemaField[] jsonSchema = {
            TextField.of("$.content").as("content"),
            TagField.of("$.genre").as("genre"),
            VectorField.builder()
                .fieldName("$.embedding").as("embedding")
                .algorithm(VectorAlgorithm.HNSW)
                .attributes(
                    Map.of(
                        "TYPE", "FLOAT32",
                        "DIM", 768,
                        "DISTANCE_METRIC", "L2"
                    )
                )
                .build()
        };

        jedis.ftCreate("vector_json_idx",
            FTCreateParams.createParams()
                .addPrefix("jdoc:")
                .on(IndexDataType.JSON),
                jsonSchema
        );
        // STEP_END

        // STEP_START json_data
        String jSentence1 = "That is a very happy person";

        JSONObject jdoc1 = new JSONObject()
                .put("content", jSentence1)
                .put("genre", "persons")
                .put(
                    "embedding",
                    longArrayToFloatArray(
                        sentenceTokenizer.encode(jSentence1).getIds()
                    )
                );

        jedis.jsonSet("jdoc:1", Path2.ROOT_PATH, jdoc1);

        String jSentence2 = "That is a happy dog";

        JSONObject jdoc2 = new JSONObject()
                .put("content", jSentence2)
                .put("genre", "pets")
                .put(
                    "embedding",
                    longArrayToFloatArray(
                        sentenceTokenizer.encode(jSentence2).getIds()
                    )
                );

        jedis.jsonSet("jdoc:2", Path2.ROOT_PATH, jdoc2);

        String jSentence3 = "Today is a sunny day";

        JSONObject jdoc3 = new JSONObject()
                .put("content", jSentence3)
                .put("genre", "weather")
                .put(
                    "embedding",
                    longArrayToFloatArray(
                        sentenceTokenizer.encode(jSentence3).getIds()
                    )
                );

        jedis.jsonSet("jdoc:3", Path2.ROOT_PATH, jdoc3);
        // STEP_END

        // STEP_START json_query
        String jSentence = "That is a happy person";

        int jK = 3;
        Query jq = new Query("*=>[KNN $K @embedding $BLOB AS distance]")
                        .returnFields("content", "distance")
                        .addParam("K", jK)
                        .addParam(
                            "BLOB",
                            longsToFloatsByteString(
                                sentenceTokenizer.encode(jSentence).getIds()
                            )
                        )
                        .setSortBy("distance", true)
                        .dialect(2);

        // Execute the query
        List<Document> jDocs = jedis
                .ftSearch("vector_json_idx", jq)
                .getDocuments();

        for (Document doc: jDocs) {
            System.out.println(
                String.format(
                    "ID: %s, Distance: %s, Content: %s",
                    doc.getId(),
                    doc.get("distance"),
                    doc.get("content")
                )
            );
        }
        // STEP_END

        jedis.close();
    }
}
