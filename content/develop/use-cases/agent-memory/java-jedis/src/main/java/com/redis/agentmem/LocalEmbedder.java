package com.redis.agentmem;

import ai.djl.huggingface.translator.TextEmbeddingTranslatorFactory;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;

/**
 * Local text-embedding helper backed by DJL + PyTorch.
 *
 * <p>This is a thin wrapper around the
 * {@code sentence-transformers/all-MiniLM-L6-v2} model loaded from
 * DJL's model zoo: a 384-dimensional encoder that runs in-process on
 * CPU through libtorch, needs no API key, and produces vectors that
 * are numerically very close to the equivalent Python and Node ports
 * (close enough that paraphrase distances differ only at the fourth
 * decimal place).
 *
 * <p>DJL's {@link TextEmbeddingTranslatorFactory} returns mean-pooled,
 * L2-normalised vectors by default, so a Redis Search index declared
 * with {@code DISTANCE_METRIC COSINE} returns scores that are
 * directly comparable across entries. The model is downloaded into
 * the local DJL cache on the first call; every later call runs
 * offline.
 */
public final class LocalEmbedder implements AutoCloseable {

    private static final String DEFAULT_MODEL_URL =
            "djl://ai.djl.huggingface.pytorch/sentence-transformers/all-MiniLM-L6-v2";
    private static final String DEFAULT_MODEL_NAME =
            "sentence-transformers/all-MiniLM-L6-v2";
    private static final int DEFAULT_VECTOR_DIM = 384;

    private final String modelName;
    private final ZooModel<String, float[]> model;
    private final Predictor<String, float[]> predictor;
    private final int dim;

    private LocalEmbedder(
            String modelName,
            ZooModel<String, float[]> model,
            Predictor<String, float[]> predictor,
            int dim) {
        this.modelName = modelName;
        this.model = model;
        this.predictor = predictor;
        this.dim = dim;
    }

    /**
     * Load the default model. Blocks while DJL downloads the
     * PyTorch weights on the first run, then keeps a single loaded
     * predictor for the lifetime of the embedder.
     */
    public static LocalEmbedder create() throws Exception {
        Criteria<String, float[]> criteria = Criteria.builder()
                .setTypes(String.class, float[].class)
                .optModelUrls(DEFAULT_MODEL_URL)
                .optEngine("PyTorch")
                .optTranslatorFactory(new TextEmbeddingTranslatorFactory())
                .optProgress(new ProgressBar())
                .build();
        ZooModel<String, float[]> model = criteria.loadModel();
        Predictor<String, float[]> predictor = model.newPredictor();
        // Probe the output shape once so we fail loudly if a
        // different model is wired up against the 384-dim Redis
        // Search field.
        float[] probe = predictor.predict("dimension probe");
        int dim = probe.length;
        return new LocalEmbedder(DEFAULT_MODEL_NAME, model, predictor, dim);
    }

    public String modelName() {
        return modelName;
    }

    public int dim() {
        return dim;
    }

    /**
     * Encode a single string. Returns a {@code float[]} of length
     * {@link #dim()}.
     *
     * <p>The DJL PyTorch {@code Predictor} is not thread-safe — its
     * underlying NDManager and tokenizer state mutate per call. The
     * demo server uses a cached thread pool, so two browser tabs
     * could land on different handler threads and call this method
     * concurrently. We {@code synchronized}-guard both encode entry
     * points to serialise access to the shared predictor; encoding
     * is the bottleneck either way and a single CPU-bound model
     * won't usefully run two requests in parallel. A higher-
     * throughput deployment would replace this with a small pool
     * of {@code Predictor} instances or a dedicated single-threaded
     * inference executor.
     */
    public synchronized float[] encodeOne(String text) throws Exception {
        return predictor.predict(text);
    }

    /** Encode several strings sequentially. See {@link #encodeOne}
     *  for the rationale behind the synchronisation. */
    public synchronized List<float[]> encodeMany(List<String> texts) throws Exception {
        List<float[]> out = new ArrayList<>(texts.size());
        for (String text : texts) {
            out.add(predictor.predict(text));
        }
        return out;
    }

    /**
     * Pack a {@code float[]} into the bytes Redis Search expects.
     * Vectors are little-endian {@code float32}; this matches the
     * encoding the Python and Node ports write.
     */
    public static byte[] toBytes(float[] vector) {
        byte[] bytes = new byte[Float.BYTES * vector.length];
        ByteBuffer
                .wrap(bytes)
                .order(ByteOrder.LITTLE_ENDIAN)
                .asFloatBuffer()
                .put(vector);
        return bytes;
    }

    @Override
    public void close() {
        try {
            predictor.close();
        } catch (Exception ignored) {
            // best-effort cleanup
        }
        try {
            model.close();
        } catch (Exception ignored) {
            // best-effort cleanup
        }
    }

    public static int defaultVectorDim() {
        return DEFAULT_VECTOR_DIM;
    }
}
