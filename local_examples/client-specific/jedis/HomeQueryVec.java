// EXAMPLE: HomeQueryVec
// REMOVE_START
package com.redis.app;
// REMOVE_END
// STEP_START import
import redis.clients.jedis.UnifiedJedis;
import redis.clients.jedis.search.*;
import redis.clients.jedis.search.schemafields.*;
import redis.clients.jedis.search.schemafields.VectorField.VectorAlgorithm;
import redis.clients.jedis.exceptions.JedisDataException;
import redis.clients.jedis.json.Path2;

import org.json.JSONObject;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Map;
import java.util.List;

// DJL classes for model loading and inference.
import ai.djl.huggingface.translator.TextEmbeddingTranslatorFactory;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.training.util.ProgressBar;
// STEP_END

public class HomeQueryVec {
    // STEP_START helper_method
    public static byte[] floatsToByteString(float[] floats) {
        byte[] bytes = new byte[Float.BYTES * floats.length];
        ByteBuffer
            .wrap(bytes)
            .order(ByteOrder.LITTLE_ENDIAN)
            .asFloatBuffer()
            .put(floats);
        return bytes;
    }
    // STEP_END

    public static void main(String[] args) {
        // STEP_START tokenizer
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
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");
        // REMOVE_START
        jedis.del(
            "doc:1", "doc:2", "doc:3",
            "jdoc:1", "jdoc:2", "jdoc:3"
        );
        // REMOVE_END
        
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
                        "DIM", 384,
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
        byte[] embedding1;

        try {
            embedding1 = floatsToByteString(predictor.predict(sentence1));
        } catch (Exception e) {
            // This just allows the code to compile without errors.
            // In a real-world scenario, you would handle the exception properly.
            embedding1 = new byte[384 * Float.BYTES];
        }

        jedis.hset("doc:1", Map.of(  "content", sentence1, "genre", "persons"));
        jedis.hset("doc:1".getBytes(), "embedding".getBytes(), embedding1);
        
        String sentence2 = "That is a happy dog";
        byte[] embedding2;

        try {
            embedding2 = floatsToByteString(predictor.predict(sentence2));
        } catch (Exception e) {
            embedding2 = new byte[384 * Float.BYTES];
        }
        
        jedis.hset("doc:2", Map.of(  "content", sentence2, "genre", "pets"));
        jedis.hset("doc:2".getBytes(), "embedding".getBytes(), embedding2);

        String sentence3 = "Today is a sunny day";
        byte[] embedding3;

        try {
            embedding3 = floatsToByteString(predictor.predict(sentence3));
        } catch (Exception e) {
            embedding3 = new byte[384 * Float.BYTES];
        }

        Map<String, String> doc3 = Map.of(  "content", sentence3, "genre", "weather");
        jedis.hset("doc:3", doc3);
        jedis.hset("doc:3".getBytes(), "embedding".getBytes(), embedding3);
        // STEP_END
        
        // STEP_START query
        String sentence = "That is a happy person";
        byte[] embedding;

        try {
            embedding = floatsToByteString(predictor.predict(sentence));
        } catch (Exception e) {
            embedding = new byte[384 * Float.BYTES];
        }
        
        int K = 3;
        Query q = new Query("*=>[KNN $K @embedding $BLOB AS distance]").
                            returnFields("content", "distance").
                            addParam("K", K).
                            addParam("BLOB", embedding)
                            .setSortBy("distance", true)
                            .dialect(2);

        // Execute the query
        List<Document> docs = jedis.ftSearch("vector_idx", q).getDocuments();
        System.out.println("Results:");
        
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

        try {jedis.ftDropIndex("vector_json_idx");} catch (JedisDataException j){}

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
                        "DIM", 384,
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

        float[] jEmbedding1;

        try {
            jEmbedding1 = predictor.predict(jSentence1);
        } catch (Exception e) {
            // This just allows the code to compile without errors.
            // In a real-world scenario, you would handle the exception properly.
            jEmbedding1 = new float[384];
        }

        JSONObject jdoc1 = new JSONObject()
                .put("content", jSentence1)
                .put("genre", "persons")
                .put(
                    "embedding",
                    jEmbedding1
                );

        jedis.jsonSet("jdoc:1", Path2.ROOT_PATH, jdoc1);

        String jSentence2 = "That is a happy dog";

        float[] jEmbedding2;

        try {
            jEmbedding2 = predictor.predict(jSentence2);
        } catch (Exception e) {
            jEmbedding2 = new float[384];
        }

        JSONObject jdoc2 = new JSONObject()
                .put("content", jSentence2)
                .put("genre", "pets")
                .put(
                    "embedding",
                    jEmbedding2
                );
        
        jedis.jsonSet("jdoc:2", Path2.ROOT_PATH, jdoc2);

        String jSentence3 = "Today is a sunny day";

        float[] jEmbedding3;

        try {
            jEmbedding3 = predictor.predict(jSentence3);
        } catch (Exception e) {
            jEmbedding3 = new float[384];
        }

        JSONObject jdoc3 = new JSONObject()
                .put("content", jSentence3)
                .put("genre", "weather")
                .put(
                    "embedding",
                    jEmbedding3
                );

        jedis.jsonSet("jdoc:3", Path2.ROOT_PATH, jdoc3);
        // STEP_END

        // STEP_START json_query
        String jSentence = "That is a happy person";
        byte[] jEmbedding;

        try {
            jEmbedding = floatsToByteString(predictor.predict(jSentence));
        } catch (Exception e) {
            jEmbedding = new byte[384 * Float.BYTES];
        }

        int jK = 3;
        Query jq = new Query("*=>[KNN $K @embedding $BLOB AS distance]").
                            returnFields("content", "distance").
                            addParam("K", jK).
                            addParam(
                                "BLOB",
                                jEmbedding
                            )
                            .setSortBy("distance", true)
                            .dialect(2);

        // Execute the query
        List<Document> jDocs = jedis
                .ftSearch("vector_json_idx", jq)
                .getDocuments();

        System.out.println("Results:");
        
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
    }
}
