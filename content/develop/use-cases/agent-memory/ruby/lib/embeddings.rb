# Local text-embedding helper backed by the `informers` gem.
#
# `informers` is a Ruby port of Hugging Face transformers that runs
# the ONNX-exported `sentence-transformers/all-MiniLM-L6-v2` encoder
# through the `onnxruntime` gem — same 384-d model the Python, Node.js,
# .NET, Rust, Go, Jedis, Lettuce, and PHP siblings use. Vectors are
# L2-normalized so a Redis Search index declared with
# `DISTANCE_METRIC COSINE` returns scores that are directly
# comparable across entries.
#
# Embeddings are numerically very close to the PyTorch reference (the
# Ruby ONNX path matches the Node.js Xenova ONNX path to ~0.01 in
# cosine distance); the model is downloaded into the local Hugging
# Face cache on the first call and every later call runs offline.

require 'informers'

module AgentMemory
  # `informers` exposes a synchronous API, so the constructor does the
  # model load directly. We probe the output shape once and record the
  # dimension on the instance so callers can compare against the
  # index's expected vector dimension before doing any inserts.
  # LongTermMemory also checks length on every remember / recall, so a
  # model swap that produces wrong-dim vectors fails at the call site
  # with a clear error.
  class LocalEmbedder
    DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'

    attr_reader :model_name, :dim

    def initialize(model_name: DEFAULT_MODEL)
      @model_name = model_name
      # `Informers.pipeline("embedding", ...)` returns a configured
      # EmbeddingPipeline. The `call(text, pooling:, normalize:)` API
      # mirrors @xenova/transformers' feature-extraction pipeline so
      # the Node.js sibling's code looks structurally identical.
      @model = Informers.pipeline('embedding', model_name)
      probe = encode_one('dimension probe')
      @dim = probe.length
    end

    # Encode a single string. Returns a 384-element Array of Float
    # (Ruby doubles; the values themselves are float32 round-trips
    # from the ONNX session so the precision is the model's).
    #
    # We pass `normalize: true` to informers, which L2-normalizes in
    # the ONNX graph itself — the result is already a unit vector,
    # so a second pass through `l2_normalize` would be redundant.
    def encode_one(text)
      vec = @model.(text, pooling: 'mean', normalize: true)
      # The pipeline returns a flat Array when the input is a single
      # string and an Array<Array> when the input is an Array; we
      # special-case below in encode_many. Defensive flatten in case
      # a future release unifies the shapes.
      vec = vec.first if vec.first.is_a?(Array)
      validate_dim!(vec)
      vec
    end

    # Encode several strings in one pipeline call. Returns an
    # Array<Array> of float values, one row per input string. Raises
    # if the model produces a different number of rows than inputs —
    # that would silently misalign the seed phase otherwise.
    def encode_many(texts)
      rows = @model.(texts, pooling: 'mean', normalize: true)
      if rows.length != texts.length
        raise "informers returned #{rows.length} vectors for #{texts.length} inputs"
      end
      rows.each { |row| validate_dim!(row) }
      rows
    end

    # Pack a Ruby Array of Float into the bytes Redis Search expects:
    # raw little-endian float32, no header, exactly `dim * 4` bytes.
    # Ruby's `Array#pack` directive `'e'` is little-endian single
    # precision float; `'e*'` packs every element. This is the
    # encoding RediSearch reads for a `VECTOR ... TYPE FLOAT32` field.
    def self.to_bytes(vector)
      vector.pack('e*')
    end

    private

    def validate_dim!(vec)
      return if @dim.nil?
      return if vec.length == @dim
      raise "encoder produced #{vec.length}-d vector; expected #{@dim}-d"
    end
  end
end
