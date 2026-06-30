# Local text-embedding helper backed by the `informers` gem.
#
# `informers` runs the same `sentence-transformers/all-MiniLM-L6-v2`
# ONNX model the Python and Node ports use: a 384-dimensional encoder
# that runs on CPU, needs no API key, and has a small footprint (~80 MB).
# On the first call the model files are downloaded into the local
# Hugging Face cache; every later call runs locally.
#
# Vectors are L2-normalised on output so a Redis Search index declared
# with `DISTANCE_METRIC COSINE` returns scores that are already
# directly comparable across items. The `embedding` pipeline applies
# mean-pooling and L2 normalisation automatically, so a raw call to the
# pipeline is enough -- no manual post-processing.

require 'informers'

class LocalEmbedder
  DEFAULT_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'.freeze

  attr_reader :model_name, :dim

  # The model file is large; loading it is slow. The demo keeps a single
  # `LocalEmbedder` for the lifetime of the process and reuses it for
  # every encode call.
  def initialize(model_name: DEFAULT_MODEL)
    @model_name = model_name
    # `Informers.pipeline("embedding", ...)` returns an object whose
    # `call` runs the model. For all-MiniLM-L6-v2 the output is a 384-d
    # mean-pooled, L2-normalised float vector.
    @pipeline = Informers.pipeline('embedding', model_name)
    @dim = encode_one('dimensionality probe').length
  end

  # Encode a single string. Returns a Ruby `Array` of `Float`s of
  # length `dim`. The caller packs it into the binary wire format with
  # `LocalEmbedder.to_bytes` when it needs to hand the vector to
  # `FT.SEARCH` or `HSET`.
  def encode_one(text)
    encode_many([text]).first
  end

  # Encode a batch. Returns an Array of Arrays.
  def encode_many(texts)
    batch = texts.to_a
    return [] if batch.empty?
    result = @pipeline.call(batch)
    # `Informers.pipeline("embedding", ...)` returns either a single
    # 1-D array (for a single string passed in) or an Array of 1-D
    # arrays (for a batch). Normalise to the batch shape.
    if result.first.is_a?(Array)
      result
    else
      [result]
    end
  end

  # Pack a 1-D vector into the raw little-endian float32 bytes Redis
  # Search expects in the vector field and in `$vec` query params.
  def self.to_bytes(vector)
    vector.pack('e*')
  end
end
