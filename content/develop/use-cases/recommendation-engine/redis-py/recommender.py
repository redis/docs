"""
Redis recommendation-engine helper backed by Redis Search.

Items live as Hash documents at ``product:<id>``. Each hash stores the
item's structured metadata (name, description, category, brand, price,
in-stock flag, rating) alongside the raw float32 bytes of its
384-dimensional embedding. A single Redis Search index covers every
field, so one ``FT.SEARCH`` call does the KNN over the embedding and
the TAG / NUMERIC / TEXT pre-filter in the same pass — no cross-store
joins, no extra round trips.

Per-user state lives in ``user:<id>:features``: a session vector
written as an exponentially weighted average of recently-clicked item
embeddings, plus per-category affinity counters incremented atomically
with ``HINCRBYFLOAT``. The next time the application reads that hash
to build a query, it sees the click — no batch cycle, no cache
invalidation.

The recommendation flow has two paths:

* **Query path** (per recommendation request)
  1. *Candidate retrieval* — ``FT.SEARCH`` with ``KNN`` over the
     embedding, optionally pre-filtered by structured attributes,
     optionally biased toward a session vector blended into the query.
  2. *Re-ranking* — the client takes the top-N candidates and adds a
     log-scaled per-category affinity bonus pulled from the user
     features hash.
* **Click path** (per user interaction) — the click writes a new
  EWMA-blended session vector and increments the category affinity in
  the user features hash. The next query path picks both up.

This helper expects a ``redis.Redis`` client constructed with
``decode_responses=False`` because the embedding field is binary and
mixing UTF-8 decoding into a binary path corrupts vectors. The text
fields it returns are decoded explicitly where needed.
"""

from __future__ import annotations

import base64
import math
from dataclasses import dataclass
from typing import Iterable, Optional

import numpy as np
import redis
from redis.commands.search.field import (
    NumericField,
    TagField,
    TextField,
    VectorField,
)
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query


VECTOR_DIM_DEFAULT = 384


@dataclass
class Candidate:
    """One result row from the candidate-retrieval stage."""

    id: str
    name: str
    description: str
    category: str
    brand: str
    price: float
    rating: float
    in_stock: bool
    # Cosine *distance* returned by FT.SEARCH (0 = identical, 2 = opposite).
    # Lower is better.
    vector_distance: float
    # Final ranking score. Initialised to ``vector_distance`` and
    # nudged downward by ``RedisRecommender.rerank`` when the user has
    # category affinities. Lower is better, same orientation as the
    # underlying distance.
    score: float

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "brand": self.brand,
            "price": self.price,
            "rating": self.rating,
            "in_stock": self.in_stock,
            "vector_distance": round(self.vector_distance, 4),
            "score": round(self.score, 4),
        }


class RedisRecommender:
    """Index, query, and re-rank a small product catalogue."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        index_name: str = "recommend:idx",
        key_prefix: str = "product:",
        user_key_prefix: str = "user:",
        vector_dim: int = VECTOR_DIM_DEFAULT,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=False,
        )
        self.index_name = index_name
        self.key_prefix = key_prefix
        self.user_key_prefix = user_key_prefix
        self.vector_dim = vector_dim

    # ------------------------------------------------------------------
    # Keys
    # ------------------------------------------------------------------

    def product_key(self, product_id: str) -> str:
        return f"{self.key_prefix}{product_id}"

    def user_key(self, user_id: str) -> str:
        return f"{self.user_key_prefix}{user_id}:features"

    # ------------------------------------------------------------------
    # Index management
    # ------------------------------------------------------------------

    def create_index(self) -> None:
        """Create the Redis Search index if it doesn't already exist.

        One index covers every queryable field. The vector field is
        HNSW with cosine distance so KNN is approximate but fast, and
        TAG / NUMERIC fields share the same index so a single
        ``FT.SEARCH`` can pre-filter and then KNN-rank in one pass.
        """
        schema = (
            TextField("name", weight=1.0),
            TextField("description", weight=0.5),
            TagField("category"),
            TagField("brand"),
            TagField("in_stock"),
            NumericField("price", sortable=True),
            NumericField("rating", sortable=True),
            VectorField(
                "embedding",
                "HNSW",
                {
                    "TYPE": "FLOAT32",
                    "DIM": self.vector_dim,
                    "DISTANCE_METRIC": "COSINE",
                },
            ),
        )
        definition = IndexDefinition(
            prefix=[self.key_prefix], index_type=IndexType.HASH,
        )
        try:
            self.redis.ft(self.index_name).create_index(
                fields=schema, definition=definition,
            )
        except redis.ResponseError as exc:
            if "Index already exists" not in str(exc):
                raise

    def drop_index(self, delete_documents: bool = False) -> None:
        """Drop the search index. Optionally also delete the documents."""
        try:
            self.redis.ft(self.index_name).dropindex(
                delete_documents=delete_documents,
            )
        except redis.ResponseError as exc:
            message = str(exc)
            # Different Redis Search versions phrase the missing-index
            # error differently; tolerate either.
            if "no such index" not in message.lower() \
                    and "unknown index name" not in message.lower():
                raise

    # ------------------------------------------------------------------
    # Catalogue ingest
    # ------------------------------------------------------------------

    def index_products(self, products: Iterable[dict]) -> int:
        """Pipeline a batch of ``HSET`` writes for the catalogue.

        Each product dict must include the fields named in
        ``create_index`` plus either ``embedding`` (an ``np.ndarray`` of
        ``float32``) or ``embedding_b64`` (the base64-encoded bytes of
        the same vector — that's what ``build_catalog.py`` writes into
        ``catalog.json``).
        """
        products = list(products)
        pipe = self.redis.pipeline(transaction=False)
        for product in products:
            mapping = self._encode_product(product)
            pipe.hset(self.product_key(product["id"]), mapping=mapping)
        pipe.execute()
        return len(products)

    def _encode_product(self, product: dict) -> dict:
        # The product id lives in the Redis key itself (``product:<id>``);
        # we don't repeat it as a hash field.
        vec_bytes = self._extract_vector_bytes(product)
        return {
            "name": product["name"],
            "description": product["description"],
            "category": product["category"],
            "brand": product["brand"],
            "price": str(float(product["price"])),
            "rating": str(float(product["rating"])),
            "in_stock": "true" if product["in_stock"] else "false",
            "embedding": vec_bytes,
        }

    def _extract_vector_bytes(self, product: dict) -> bytes:
        if "embedding_b64" in product:
            return base64.b64decode(product["embedding_b64"])
        vec = product["embedding"]
        if isinstance(vec, np.ndarray):
            if vec.dtype != np.float32:
                vec = vec.astype(np.float32, copy=False)
            return vec.tobytes()
        # Fall through for plain list-of-float input
        return np.asarray(vec, dtype=np.float32).tobytes()

    def count_indexed(self) -> int:
        """Cheap document count via ``FT.SEARCH * LIMIT 0 0``."""
        try:
            result = self.redis.ft(self.index_name).search(
                Query("*").paging(0, 0),
            )
            return int(result.total)
        except redis.ResponseError:
            return 0

    # ------------------------------------------------------------------
    # Candidate retrieval (KNN + optional pre-filter)
    # ------------------------------------------------------------------

    def candidate_retrieve(
        self,
        query_vec: np.ndarray,
        category: str | None = None,
        brand: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        in_stock_only: bool = False,
        min_rating: float | None = None,
        text_match: str | None = None,
        text_field: str = "description",
        k: int = 10,
        session_vec: np.ndarray | None = None,
        session_weight: float = 0.3,
    ) -> list[Candidate]:
        """Retrieve top-``k`` candidates with ``FT.SEARCH`` KNN + filters.

        Pre-filter knobs are TAG (``category``, ``brand``,
        ``in_stock_only``), NUMERIC (``min_price`` / ``max_price``,
        ``min_rating``), and TEXT (``text_match`` against
        ``text_field``, default ``description``). They combine with an
        implicit AND in front of the ``KNN`` clause, so Redis evaluates
        them first and then KNN-ranks only the matching documents.

        If ``session_vec`` is provided, the query vector is blended
        with it before retrieval — that's the real-time signal path.
        Returns ``Candidate`` rows ordered by ascending cosine distance
        (closest first); ``score`` is initialised to the distance and
        may be reduced by ``rerank`` when the user has affinities.
        """
        # Blend query + session signal so a session's clicks pull the
        # next retrieval toward the things the user has been engaging
        # with. Both inputs are unit-normalised so cosine scores stay
        # comparable.
        effective_vec = self._blend_vectors(query_vec, session_vec, session_weight)

        # Build the pre-filter clause. Empty filters become ``*``, which
        # is a no-op pre-filter in DIALECT 2.
        filter_clause = self._build_filter_clause(
            category=category,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            in_stock_only=in_stock_only,
            min_rating=min_rating,
            text_match=text_match,
            text_field=text_field,
        )

        knn_query = (
            f"{filter_clause}=>[KNN {k} @embedding $vec AS vector_score]"
        )
        q = (
            Query(knn_query)
            .sort_by("vector_score")
            .return_fields(
                "name", "description", "category", "brand",
                "price", "rating", "in_stock", "vector_score",
            )
            .paging(0, k)
            .dialect(2)
        )
        result = self.redis.ft(self.index_name).search(
            q,
            query_params={"vec": effective_vec.tobytes()},
        )
        return [
            self._decode_candidate(doc, self.key_prefix)
            for doc in result.docs
        ]

    # Characters Redis Search treats as syntax inside a TAG value; any of
    # them appearing in a user-supplied filter must be backslash-escaped
    # or the surrounding ``{...}`` block won't parse correctly. The list
    # comes from the Redis Search query-syntax documentation. The
    # backslash itself is included so a value containing a literal
    # ``\`` can't ``eat`` the next character's escape.
    _TAG_SPECIAL = set("\\,.<>{}[]\"':;!@#$%^&*()-+=~| ")

    @classmethod
    def _escape_tag_value(cls, value: str) -> str:
        """Backslash-escape characters that have meaning inside ``@tag:{...}``.

        With this in place a TAG filter built from external input can't
        accidentally close the brace, inject an additional clause, or
        misparse a value that simply contains a space or a hyphen.
        """
        return "".join(
            "\\" + ch if ch in cls._TAG_SPECIAL else ch for ch in value
        )

    @classmethod
    def _build_filter_clause(
        cls,
        *,
        category: str | None,
        brand: str | None,
        min_price: float | None,
        max_price: float | None,
        in_stock_only: bool,
        min_rating: float | None,
        text_match: str | None = None,
        text_field: str = "description",
    ) -> str:
        clauses: list[str] = []
        if category:
            clauses.append(f"@category:{{{cls._escape_tag_value(category)}}}")
        if brand:
            clauses.append(f"@brand:{{{cls._escape_tag_value(brand)}}}")
        if min_price is not None or max_price is not None:
            lo = "-inf" if min_price is None else str(float(min_price))
            hi = "+inf" if max_price is None else str(float(max_price))
            clauses.append(f"@price:[{lo} {hi}]")
        if min_rating is not None:
            clauses.append(f"@rating:[{float(min_rating)} +inf]")
        if in_stock_only:
            clauses.append("@in_stock:{true}")
        if text_match:
            # TEXT-field filter. Wrapping in quotes makes the value a
            # single phrase and avoids tripping the query parser on
            # operators (``-``, ``|``, ``"``, etc.) that a user might
            # legitimately type in a search box.
            safe = text_match.replace("\\", "\\\\").replace('"', '\\"')
            clauses.append(f'@{text_field}:"{safe}"')
        return "(" + " ".join(clauses) + ")" if clauses else "(*)"

    @staticmethod
    def _blend_vectors(
        query_vec: np.ndarray,
        session_vec: np.ndarray | None,
        session_weight: float,
    ) -> np.ndarray:
        if session_vec is None or session_weight <= 0:
            return query_vec.astype(np.float32, copy=False)
        mixed = (1.0 - session_weight) * query_vec + session_weight * session_vec
        norm = float(np.linalg.norm(mixed))
        if norm == 0.0:
            return query_vec.astype(np.float32, copy=False)
        return (mixed / norm).astype(np.float32, copy=False)

    @staticmethod
    def _decode_candidate(doc, key_prefix: str) -> Candidate:
        # FT.SEARCH return fields may come back as ``bytes`` when the
        # client is in ``decode_responses=False`` mode, depending on the
        # redis-py version and whether the field is on the
        # ``Document``'s ``payload`` or its own attribute. Decode
        # defensively so the rest of the pipeline is plain Python types.
        def _s(name: str, default: str = "") -> str:
            value = getattr(doc, name, None)
            if value is None:
                return default
            return value.decode("utf-8") if isinstance(value, bytes) else value

        # ``doc.id`` is the Redis key (``product:<id>``); strip the
        # prefix to expose the bare product id the rest of the demo uses.
        raw_key = _s("id")
        bare_id = (
            raw_key[len(key_prefix):] if raw_key.startswith(key_prefix)
            else raw_key
        )

        # FT.SEARCH returns ``vector_score`` as the cosine *distance*
        # (0 = identical, 2 = opposite). Carry that through directly so
        # the score the UI sees is the same number Redis computed; lower
        # means closer.
        cosine_distance = float(_s("vector_score", "0") or 0)

        return Candidate(
            id=bare_id,
            name=_s("name"),
            description=_s("description"),
            category=_s("category"),
            brand=_s("brand"),
            price=float(_s("price", "0") or 0),
            rating=float(_s("rating", "0") or 0),
            in_stock=_s("in_stock", "false") == "true",
            vector_distance=cosine_distance,
            score=cosine_distance,
        )

    # ------------------------------------------------------------------
    # Re-ranking with user affinities
    # ------------------------------------------------------------------

    def rerank(
        self,
        candidates: list[Candidate],
        user_features: dict,
        affinity_weight: float = 0.15,
    ) -> list[Candidate]:
        """Apply a per-category affinity bonus and re-sort.

        ``user_features['affinities']`` is a ``{category: weight}`` map
        accumulated from previous clicks. The bonus is shaped by
        ``log(1 + affinity) * affinity_weight`` so repeated clicks see
        diminishing returns and a single dominant category can't
        push the bonus arbitrarily large. The bonus is subtracted from
        the cosine distance, so a category the user has shown interest
        in pulls its members up the list (closer to zero) without
        overwhelming the vector signal.
        """
        affinities: dict[str, float] = user_features.get("affinities", {})
        if not affinities or affinity_weight <= 0:
            return sorted(candidates, key=lambda c: c.score)
        for candidate in candidates:
            raw_aff = affinities.get(candidate.category, 0.0)
            bonus = math.log1p(max(raw_aff, 0.0)) * affinity_weight
            candidate.score = candidate.vector_distance - bonus
        return sorted(candidates, key=lambda c: c.score)

    # ------------------------------------------------------------------
    # Session signals (clicks)
    # ------------------------------------------------------------------

    def record_click(
        self,
        user_id: str,
        product_id: str,
        ewma_alpha: float = 0.4,
        affinity_step: float = 1.0,
    ) -> dict:
        """Update a user's session vector and category affinity.

        Reads the clicked item's embedding from its hash, blends it
        into the user's session vector with an exponentially weighted
        moving average, and bumps the category counter and click total.

        ``ewma_alpha`` is the weight given to the *new* click; the
        previous session keeps ``1 - ewma_alpha``. The default biases
        history (0.6) over the latest click (0.4) so a single
        accidental click doesn't swing the session.

        The category-affinity bump and click-count bump use
        ``HINCRBYFLOAT`` / ``HINCRBY`` so they're atomic against any
        concurrent caller. The session vector blend is inherently
        read-modify-write — the new vector depends on the previous
        one — and is *not* atomic against a concurrent click for the
        same user. For the per-user data this helper writes, that
        window is rare in practice; if it matters in a given
        deployment, wrap the read and the writeback in
        ``WATCH/MULTI/EXEC`` (or move the whole blend into a Lua
        script).
        """
        product_key = self.product_key(product_id)
        # Pull the fields we need from the product hash in one round trip.
        raw = self.redis.hmget(product_key, "embedding", "category")
        if raw[0] is None:
            raise KeyError(f"unknown product {product_id}")
        clicked_vec = self._bytes_to_vec(raw[0])
        category = raw[1].decode("utf-8") if raw[1] else "unknown"

        user_key = self.user_key(user_id)
        previous_raw = self.redis.hget(user_key, "session_vec")
        if previous_raw:
            previous_vec = self._bytes_to_vec(previous_raw)
            mixed = ewma_alpha * clicked_vec + (1.0 - ewma_alpha) * previous_vec
            new_session = mixed / max(float(np.linalg.norm(mixed)), 1e-12)
        else:
            new_session = clicked_vec  # already unit-normalised

        # Affinity and click counters are independent atomic increments;
        # only the session vector needs the read-modify-write because
        # it depends on the previous value. Pipelining sends the three
        # writes in one round trip.
        pipe = self.redis.pipeline(transaction=False)
        pipe.hset(
            user_key,
            mapping={
                "session_vec": new_session.astype(np.float32).tobytes(),
                "last_clicked_id": product_id,
                "last_clicked_category": category,
            },
        )
        pipe.hincrbyfloat(user_key, f"aff:{category}", affinity_step)
        pipe.hincrby(user_key, "clicks", 1)
        _hset_n, new_aff_raw, new_clicks = pipe.execute()

        return {
            "category": category,
            "affinity": float(new_aff_raw),
            "clicks": int(new_clicks),
            "last_clicked_id": product_id,
        }

    def get_user_features(self, user_id: str) -> dict:
        """Read a user's session vector and affinities for re-ranking."""
        raw = self.redis.hgetall(self.user_key(user_id))
        if not raw:
            return {"session_vec": None, "affinities": {}, "clicks": 0,
                    "last_clicked_id": None, "last_clicked_category": None}
        # ``decode_responses=False`` mode hands keys back as bytes too,
        # so look up by the bytes form of each field name.
        session_raw = raw.get(b"session_vec")
        session_vec = self._bytes_to_vec(session_raw) if session_raw else None
        affinities: dict[str, float] = {}
        for field, value in raw.items():
            if field.startswith(b"aff:"):
                category = field[len(b"aff:"):].decode("utf-8")
                try:
                    affinities[category] = float(value)
                except (TypeError, ValueError):
                    continue
        return {
            "session_vec": session_vec,
            "affinities": affinities,
            "clicks": int(raw.get(b"clicks", b"0") or 0),
            "last_clicked_id":
                raw.get(b"last_clicked_id", b"").decode("utf-8") or None,
            "last_clicked_category":
                raw.get(b"last_clicked_category", b"").decode("utf-8") or None,
        }

    def reset_user(self, user_id: str) -> None:
        """Delete a user's feature hash. Next request starts cold."""
        self.redis.delete(self.user_key(user_id))

    def _bytes_to_vec(self, raw: bytes) -> np.ndarray:
        # Vector fields come back as raw little-endian float32 bytes.
        # Validate the length: a corrupted or wrong-dim field would
        # otherwise produce a vector that NumPy or Redis Search rejects
        # later with a less useful error.
        expected_bytes = self.vector_dim * 4
        if len(raw) != expected_bytes:
            raise ValueError(
                f"expected {expected_bytes} bytes for a "
                f"{self.vector_dim}-dim float32 vector, got {len(raw)}"
            )
        return np.frombuffer(raw, dtype=np.float32)

    # ------------------------------------------------------------------
    # Hot embedding refresh (no serving downtime)
    # ------------------------------------------------------------------

    def refresh_embedding(self, product_id: str, new_vector: np.ndarray) -> None:
        """Overwrite the embedding for one product.

        The HNSW index reflects the change as soon as the ``HSET``
        commits, so subsequent ``FT.SEARCH`` calls see the new vector
        without any index rebuild or serving downtime. The same call
        path is what an offline retraining pipeline would use to roll
        out a re-trained model: stream the new vectors into Redis and
        the serving tier picks them up on the next query.

        Raises ``KeyError`` if ``product_id`` does not already exist —
        ``HSET`` would otherwise happily create a new key with only an
        ``embedding`` field, which the index would then pick up as a
        partially-populated document. Also rejects vectors with the
        wrong dimensionality so a model swap doesn't quietly corrupt
        the index.
        """
        if new_vector.dtype != np.float32:
            new_vector = new_vector.astype(np.float32, copy=False)
        if new_vector.shape != (self.vector_dim,):
            raise ValueError(
                f"new_vector has shape {new_vector.shape}; "
                f"index expects ({self.vector_dim},)"
            )
        key = self.product_key(product_id)
        if not self.redis.exists(key):
            raise KeyError(f"unknown product {product_id}")
        self.redis.hset(key, "embedding", new_vector.tobytes())

    # ------------------------------------------------------------------
    # Inspection
    # ------------------------------------------------------------------

    def index_info(self) -> dict:
        """Subset of ``FT.INFO`` useful for the demo UI."""
        try:
            info = self.redis.ft(self.index_name).info()
        except redis.ResponseError:
            return {"num_docs": 0, "indexing_failures": 0,
                    "vector_index_size_mb": 0.0}
        # FT.INFO returns a flat list in older redis-py versions, a dict
        # in newer ones; redis-py normalises this to a dict for us.
        return {
            "num_docs": int(info.get("num_docs", 0)),
            "indexing_failures":
                int(info.get("hash_indexing_failures", 0)),
            "vector_index_size_mb": _safe_mb(info),
        }

    def list_products(self, limit: int = 100) -> list[dict]:
        """Return every indexed product (metadata only, no vector).

        Used by the demo to show the full catalogue and to know what
        IDs exist for the "click" buttons.
        """
        q = (
            Query("*")
            .return_fields("name", "category", "brand",
                           "price", "rating", "in_stock")
            .paging(0, limit)
            .sort_by("price")
        )
        result = self.redis.ft(self.index_name).search(q)
        out: list[dict] = []
        for doc in result.docs:
            def _s(name, default=""):
                value = getattr(doc, name, None)
                return (value.decode("utf-8") if isinstance(value, bytes)
                        else (value or default))
            raw_key = _s("id")
            bare_id = (
                raw_key[len(self.key_prefix):] if raw_key.startswith(self.key_prefix)
                else raw_key
            )
            out.append({
                "id": bare_id,
                "name": _s("name"),
                "category": _s("category"),
                "brand": _s("brand"),
                "price": float(_s("price", "0") or 0),
                "rating": float(_s("rating", "0") or 0),
                "in_stock": _s("in_stock", "false") == "true",
            })
        return out

    def list_categories(self) -> list[str]:
        """Distinct category values, from the TAG index, for the UI."""
        try:
            raw = self.redis.ft(self.index_name).tagvals("category")
        except redis.ResponseError:
            return []
        return sorted(
            v.decode("utf-8") if isinstance(v, bytes) else v
            for v in raw
        )

    def list_brands(self) -> list[str]:
        try:
            raw = self.redis.ft(self.index_name).tagvals("brand")
        except redis.ResponseError:
            return []
        return sorted(
            v.decode("utf-8") if isinstance(v, bytes) else v
            for v in raw
        )


def _safe_mb(info: dict) -> float:
    """Pull total vector-index memory out of ``FT.INFO``.

    Redis Search reports ``vector_index_sz_mb`` at the top level of
    ``FT.INFO`` (alongside other ``*_sz_mb`` counters), so we don't
    have to dig into the per-attribute structure, which under
    ``decode_responses=False`` is a list of bytes that's awkward to
    introspect.
    """
    try:
        return float(info.get("vector_index_sz_mb", 0.0) or 0.0)
    except (TypeError, ValueError):
        return 0.0
