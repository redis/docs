import java.util.List;

import ai.djl.huggingface.translator.TextEmbeddingTranslatorFactory;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;

/**
 * Local text-embedding helper backed by DJL with the HuggingFace
 * tokenizer and the ONNX Runtime engine.
 *
 * <p>This is a thin wrapper around the ONNX export of
 * {@code sentence-transformers/all-MiniLM-L6-v2}: a 384-dimensional
 * encoder that runs on CPU, needs no API key, and has a small
 * footprint (~80 MB). On the first call DJL downloads the model into
 * its local cache; every later call runs locally.</p>
 *
 * <p>Vectors are L2-normalised on output so a Redis Search index
 * declared with {@code DISTANCE_METRIC COSINE} returns scores that
 * are already directly comparable across items. The
 * {@code TextEmbeddingTranslatorFactory} pipeline already normalises,
 * so we re-check here as a defensive guard.</p>
 *
 * <p>One instance loads the model once and reuses it for every call.
 * The demo server keeps a single {@code LocalEmbedder} around for the
 * lifetime of the process. The wrapper guards calls to
 * {@link Predictor#predict} with {@code synchronized} because the
 * predictor isn't safe to call concurrently.</p>
 */
public class LocalEmbedder implements AutoCloseable {

    public static final String DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2";

    private final String modelName;
    private final ZooModel<String, float[]> model;
    private final Predictor<String, float[]> predictor;
    private final int dim;

    public LocalEmbedder() throws Exception {
        this(DEFAULT_MODEL);
    }

    public LocalEmbedder(String modelName) throws Exception {
        this.modelName = (modelName == null || modelName.isEmpty()) ? DEFAULT_MODEL : modelName;

        // ``djl://`` URL routes through DJL's model zoo. The
        // ``ai.djl.huggingface.onnxruntime`` group ID pulls a
        // pre-converted ONNX bundle for the model; ``optEngine`` then
        // forces the inference engine to ONNX Runtime so we don't drag
        // in a heavy PyTorch native library.
        Criteria<String, float[]> criteria = Criteria.builder()
                .setTypes(String.class, float[].class)
                .optModelUrls("djl://ai.djl.huggingface.onnxruntime/" + this.modelName)
                .optEngine("OnnxRuntime")
                .optTranslatorFactory(new TextEmbeddingTranslatorFactory())
                .optProgress(new ProgressBar())
                .build();
        this.model = criteria.loadModel();
        this.predictor = this.model.newPredictor();

        // Warm the predictor once so the first real call doesn't pay
        // session-init latency on a user-facing request, and learn
        // the dimensionality at the same time.
        float[] warm = this.predictor.predict("warmup");
        this.dim = warm.length;
    }

    public String getModelName() { return modelName; }
    public int getDim() { return dim; }

    /** Encode a single string. Returned vector is unit-normalised. */
    public float[] encodeOne(String text) {
        synchronized (predictor) {
            try {
                float[] v = predictor.predict(text);
                return Recommender.l2Normalise(v);
            } catch (Exception exc) {
                throw new RuntimeException("predict failed: " + exc.getMessage(), exc);
            }
        }
    }

    /** Encode a batch. Returned vectors are unit-normalised. */
    public float[][] encodeMany(List<String> texts) {
        float[][] out = new float[texts.size()][];
        synchronized (predictor) {
            try {
                List<float[]> rows = predictor.batchPredict(texts);
                for (int i = 0; i < rows.size(); i++) {
                    out[i] = Recommender.l2Normalise(rows.get(i));
                }
            } catch (Exception exc) {
                throw new RuntimeException("batch predict failed: " + exc.getMessage(), exc);
            }
        }
        return out;
    }

    @Override
    public void close() {
        try { predictor.close(); } catch (Exception ignored) {}
        try { model.close(); } catch (Exception ignored) {}
    }
}
