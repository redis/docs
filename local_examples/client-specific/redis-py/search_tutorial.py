# EXAMPLE: search_tutorial
# HIDE_START
"""
Code samples for the search and query tutorial:
    https://redis.io/docs/latest/develop/get-started/search-tutorial/
"""

import json

import redis
import redis.commands.search.aggregation as aggregations
import redis.commands.search.reducers as reducers
from redis.commands.json.path import Path
from redis.commands.search.field import (
    NumericField,
    TagField,
    TextField,
    VectorField,
)
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query

# HIDE_END

# STEP_START connect
r = redis.Redis(host="localhost", port=6379, db=0, decode_responses=True)
# STEP_END
# REMOVE_START
r.flushall()
# REMOVE_END

# STEP_START hash_example
r.hset(
    "product:1",
    mapping={
        "name": "Aurora AcousticPro Headphones",
        "brand": "Aurora",
        "category": "Audio",
        "price": 199.99,
        "rating": 4.6,
    },
)
# >>> 5
# STEP_END
# REMOVE_START
r.delete("product:1")
# REMOVE_END

# STEP_START json_example
r.json().set(
    "product:1",
    Path.root_path(),
    {
        "name": "Aurora AcousticPro Headphones",
        "brand": "Aurora",
        "category": "Audio",
        "price": 199.99,
        "rating": 4.6,
        "features": ["wireless", "noise-cancelling", "bluetooth"],
        "specs": {"color": "midnight black", "weight_grams": 268},
    },
)
# >>> True
# STEP_END
# REMOVE_START
r.delete("product:1")
# REMOVE_END

# STEP_START load_data
catalog = [
    {
        "name": "Aurora AcousticPro Headphones",
        "brand": "Aurora",
        "category": "Audio",
        "description": (
            "Over-ear wireless headphones with active noise cancelling and a "
            "40-hour battery. Plush memory-foam earcups and a lightweight frame "
            "make them comfortable for all-day listening, whether you are "
            "commuting, working, or relaxing at home."
        ),
        "price": 199.99,
        "rating": 4.6,
        "review_count": 1284,
        "stock": 42,
        "release_year": 2024,
        "features": ["wireless", "noise-cancelling", "bluetooth", "over-ear"],
        "specs": {"color": "midnight black", "weight_grams": 268, "warranty_years": 2},
    },
    {
        "name": "Aurora BudsMini Earbuds",
        "brand": "Aurora",
        "category": "Audio",
        "description": (
            "Tiny true-wireless earbuds with a secure in-ear fit and sweat "
            "resistance for workouts. The compact charging case slips into a "
            "pocket and delivers three full recharges on the go."
        ),
        "price": 89.99,
        "rating": 4.3,
        "review_count": 942,
        "stock": 130,
        "release_year": 2023,
        "features": ["wireless", "bluetooth", "in-ear", "water-resistant"],
        "specs": {"color": "pearl white", "weight_grams": 5, "warranty_years": 1},
    },
    {
        "name": "Sonus Boom Portable Speaker",
        "brand": "Sonus",
        "category": "Audio",
        "description": (
            "A rugged portable Bluetooth speaker with deep bass and a waterproof "
            "shell. Toss it in a bag for the beach or a campsite and enjoy "
            "room-filling sound for up to 20 hours per charge."
        ),
        "price": 129.5,
        "rating": 4.5,
        "review_count": 512,
        "stock": 64,
        "release_year": 2024,
        "features": ["wireless", "bluetooth", "portable", "waterproof"],
        "specs": {"color": "slate gray", "weight_grams": 540, "warranty_years": 1},
    },
    {
        "name": "Pixma Vortex 15 Laptop",
        "brand": "Pixma",
        "category": "Computers",
        "description": (
            "A thin-and-light 15-inch laptop with a fast multi-core processor, "
            "16 GB of memory, and a speedy solid-state drive. The backlit keyboard "
            "and bright display make it a capable companion for work and study."
        ),
        "price": 1399.0,
        "rating": 4.7,
        "review_count": 318,
        "stock": 18,
        "release_year": 2024,
        "features": ["laptop", "ssd", "backlit-keyboard", "lightweight"],
        "specs": {"color": "space silver", "weight_grams": 1600, "warranty_years": 2},
    },
    {
        "name": "Pixma UltraView 27 Monitor",
        "brand": "Pixma",
        "category": "Computers",
        "description": (
            "A 27-inch 4K monitor with an IPS panel for accurate colors and wide "
            "viewing angles. A single USB-C cable carries video and power, keeping "
            "your desk tidy."
        ),
        "price": 329.99,
        "rating": 4.4,
        "review_count": 221,
        "stock": 27,
        "release_year": 2023,
        "features": ["monitor", "4k", "ips", "usb-c"],
        "specs": {"color": "black", "weight_grams": 5200, "warranty_years": 3},
    },
    {
        "name": "Clackr Mechanical Keyboard",
        "brand": "Clackr",
        "category": "Accessories",
        "description": (
            "A compact mechanical keyboard with tactile switches, per-key RGB "
            "lighting, and wireless connectivity. Hot-swappable switches let you "
            "tune the typing feel without soldering."
        ),
        "price": 119.0,
        "rating": 4.8,
        "review_count": 1502,
        "stock": 88,
        "release_year": 2024,
        "features": ["keyboard", "mechanical", "rgb", "wireless"],
        "specs": {"color": "graphite", "weight_grams": 720, "warranty_years": 2},
    },
    {
        "name": "Glide Pro Wireless Mouse",
        "brand": "Glide",
        "category": "Accessories",
        "description": (
            "An ergonomic wireless mouse with a high-precision sensor and a "
            "contoured shape that reduces wrist strain. A single charge lasts for "
            "weeks of everyday use."
        ),
        "price": 59.99,
        "rating": 4.2,
        "review_count": 869,
        "stock": 150,
        "release_year": 2022,
        "features": ["mouse", "wireless", "ergonomic"],
        "specs": {"color": "charcoal", "weight_grams": 98, "warranty_years": 1},
    },
    {
        "name": "Pulse Series 6 Smartwatch",
        "brand": "Pulse",
        "category": "Wearables",
        "description": (
            "A sleek smartwatch with built-in GPS, continuous heart-rate "
            "monitoring, and water resistance for swimming. Track workouts, sleep, "
            "and notifications from your wrist."
        ),
        "price": 249.0,
        "rating": 4.5,
        "review_count": 1733,
        "stock": 51,
        "release_year": 2024,
        "features": ["smartwatch", "gps", "heart-rate", "water-resistant"],
        "specs": {"color": "rose gold", "weight_grams": 38, "warranty_years": 1},
    },
    {
        "name": "Pulse Band Fitness Tracker",
        "brand": "Pulse",
        "category": "Wearables",
        "description": (
            "A lightweight fitness band that tracks steps, heart rate, and sleep "
            "stages. The slim screen shows daily progress and the battery lasts a "
            "full week between charges."
        ),
        "price": 79.99,
        "rating": 4.1,
        "review_count": 2210,
        "stock": 200,
        "release_year": 2023,
        "features": ["fitness-tracker", "heart-rate", "sleep-tracking"],
        "specs": {"color": "ocean blue", "weight_grams": 24, "warranty_years": 1},
    },
    {
        "name": "Lumi Glow Smart Bulb",
        "brand": "Lumi",
        "category": "Home",
        "description": (
            "A color-changing smart bulb that connects over Wi-Fi and works with "
            "voice assistants. Dim it for movie night or set a warm white for "
            "reading, all from your phone."
        ),
        "price": 24.99,
        "rating": 4.0,
        "review_count": 640,
        "stock": 320,
        "release_year": 2022,
        "features": ["smart-home", "wifi", "dimmable", "color"],
        "specs": {"color": "white", "weight_grams": 70, "warranty_years": 2},
    },
    {
        "name": "Lumi Climate Smart Thermostat",
        "brand": "Lumi",
        "category": "Home",
        "description": (
            "A learning smart thermostat that adjusts heating and cooling to your "
            "routine and helps lower energy bills. The crisp display and Wi-Fi app "
            "make scheduling effortless."
        ),
        "price": 149.0,
        "rating": 4.6,
        "review_count": 388,
        "stock": 75,
        "release_year": 2024,
        "features": ["smart-home", "wifi", "energy-saving"],
        "specs": {"color": "white", "weight_grams": 210, "warranty_years": 3},
    },
    {
        "name": "Vista Action Cam 4K",
        "brand": "Vista",
        "category": "Cameras",
        "description": (
            "A pocket-sized action camera that shoots stabilized 4K video and is "
            "waterproof without a case. Mount it on a helmet or bike and capture "
            "your adventures in sharp detail."
        ),
        "price": 299.0,
        "rating": 4.3,
        "review_count": 455,
        "stock": 33,
        "release_year": 2023,
        "features": ["camera", "4k", "waterproof", "wifi"],
        "specs": {"color": "black", "weight_grams": 128, "warranty_years": 1},
    },
]

for product_id, product in enumerate(catalog, start=1):
    r.json().set(f"product:{product_id}", Path.root_path(), product)
# STEP_END

# STEP_START get_one
res = r.json().get("product:1", "$.name")
print(res)  # >>> ['Aurora AcousticPro Headphones']
# STEP_END
# REMOVE_START
assert res == ["Aurora AcousticPro Headphones"]
# REMOVE_END

# STEP_START create_index
schema = (
    TextField("$.name", as_name="name"),
    TagField("$.brand", as_name="brand", sortable=True),
    TagField("$.category", as_name="category"),
    TextField("$.description", as_name="description"),
    NumericField("$.price", as_name="price", sortable=True),
    NumericField("$.rating", as_name="rating", sortable=True),
    NumericField("$.review_count", as_name="review_count"),
    NumericField("$.stock", as_name="stock"),
    NumericField("$.release_year", as_name="release_year", sortable=True),
    TagField("$.features[*]", as_name="features"),
)
index = r.ft("idx:catalog")
index.create_index(
    schema,
    definition=IndexDefinition(prefix=["product:"], index_type=IndexType.JSON),
)
# STEP_END

# STEP_START index_info
info = r.ft("idx:catalog").info()
print("Documents indexed:", info["num_docs"])  # >>> Documents indexed: 12
# STEP_END
# REMOVE_START
assert int(info["num_docs"]) == 12
# REMOVE_END

# STEP_START search_all
res = index.search(Query("*").paging(0, 0))
print("Total products:", res.total)  # >>> Total products: 12
# STEP_END
# REMOVE_START
assert res.total == 12
# REMOVE_END

# STEP_START search_text
res = index.search(Query("@name:headphones").return_field("name"))
print(res.docs)
# >>> [Document {'id': 'product:1', ... 'name': 'Aurora AcousticPro Headphones'}]
# STEP_END
# REMOVE_START
assert res.total == 1 and res.docs[0].id == "product:1"
# REMOVE_END

# STEP_START search_tag
res = index.search(Query("@category:{Audio}").return_fields("name", "price"))
print(res.total, [d.name for d in res.docs])
# >>> 3 ['Aurora BudsMini Earbuds', 'Sonus Boom Portable Speaker', ...]
# STEP_END
# REMOVE_START
assert res.total == 3
# REMOVE_END

# STEP_START search_tag_array
res = index.search(Query("@features:{waterproof}").return_field("name"))
print(res.total, [d.name for d in res.docs])
# >>> 2 ['Sonus Boom Portable Speaker', 'Vista Action Cam 4K']
# STEP_END
# REMOVE_START
assert res.total == 2
# REMOVE_END

# STEP_START search_range
res = index.search(
    Query("@price:[0 100]").sort_by("price", asc=True).return_fields("name", "price")
)
print([(d.name, d.price) for d in res.docs])
# >>> [('Lumi Glow Smart Bulb', '24.99'), ('Glide Pro Wireless Mouse', '59.99'), ...]
# STEP_END
# REMOVE_START
assert res.total == 4 and res.docs[0].id == "product:10"
# REMOVE_END

# STEP_START search_combined
res = index.search(
    Query("@category:{Audio} @price:[0 100]").return_fields("name", "price")
)
print(res.total, [d.name for d in res.docs])
# >>> 1 ['Aurora BudsMini Earbuds']
# STEP_END
# REMOVE_START
assert res.total == 1 and res.docs[0].id == "product:2"
# REMOVE_END

# STEP_START search_projection
res = index.search(
    Query("*").sort_by("price", asc=False).return_fields("name", "price").paging(0, 3)
)
print([(d.name, d.price) for d in res.docs])
# >>> [('Pixma Vortex 15 Laptop', '1399'), ('Pixma UltraView 27 Monitor', '329.99'), ...]
# STEP_END
# REMOVE_START
assert res.total == 12 and res.docs[0].id == "product:4"
# REMOVE_END

# STEP_START agg_count
req = aggregations.AggregateRequest("*").group_by(
    "@category", reducers.count().alias("count")
)
res = index.aggregate(req).rows
print(res)
# >>> [['category', 'Audio', 'count', '3'], ['category', 'Computers', 'count', '2'], ...]
# STEP_END
# REMOVE_START
assert len(res) == 6
# REMOVE_END

# STEP_START agg_avg
req = (
    aggregations.AggregateRequest("*")
    .group_by("@category", reducers.avg("@price").alias("avg_price"))
    .sort_by(aggregations.Desc("@avg_price"))
)
res = index.aggregate(req).rows
print(res)
# >>> [['category', 'Computers', 'avg_price', '864.495'], ...]
# STEP_END
# REMOVE_START
assert len(res) == 6
# REMOVE_END

# STEP_START agg_apply
req = (
    aggregations.AggregateRequest("@category:{Audio}")
    .load("name", "price")
    .apply(sale_price="@price - (@price * 0.1)")
)
res = index.aggregate(req).rows
print(res)
# >>> [['name', 'Aurora AcousticPro Headphones', 'price', '199.99', 'sale_price', '179.991'], ...]
# STEP_END
# REMOVE_START
assert len(res) == 3
# REMOVE_END

# STEP_START agg_pipeline
req = (
    aggregations.AggregateRequest("*")
    .group_by("@brand", reducers.avg("@rating").alias("avg_rating"))
    .sort_by(aggregations.Desc("@avg_rating"))
)
res = index.aggregate(req).rows
print(res)
# >>> [['brand', 'Clackr', 'avg_rating', '4.8'], ['brand', 'Pixma', 'avg_rating', '4.55'], ...]
# STEP_END
# REMOVE_START
assert len(res) == 8
# REMOVE_END

# STEP_START gen_embeddings
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("msmarco-distilbert-base-v4")  # 768-dimensional vectors

for key in r.scan_iter(match="product:*"):
    description = r.json().get(key, "$.description")[0]
    embedding = embedder.encode(description).astype("float32").tolist()
    r.json().set(key, "$.embedding", embedding)
# STEP_END

# STEP_START create_vector_index
r.ft("idx:catalog").dropindex()
schema = (
    TextField("$.name", as_name="name"),
    TagField("$.brand", as_name="brand", sortable=True),
    TagField("$.category", as_name="category"),
    TextField("$.description", as_name="description"),
    NumericField("$.price", as_name="price", sortable=True),
    NumericField("$.rating", as_name="rating", sortable=True),
    TagField("$.features[*]", as_name="features"),
    VectorField(
        "$.embedding",
        "FLAT",
        {"TYPE": "FLOAT32", "DIM": 768, "DISTANCE_METRIC": "COSINE"},
        as_name="embedding",
    ),
)
index = r.ft("idx:catalog")
index.create_index(
    schema,
    definition=IndexDefinition(prefix=["product:"], index_type=IndexType.JSON),
)
# STEP_END

# STEP_START vector_knn
query_vector = (
    embedder.encode("portable music for the outdoors").astype("float32").tobytes()
)
res = index.search(
    Query("(*)=>[KNN 3 @embedding $query_vector AS score]")
    .sort_by("score", asc=True)
    .return_fields("score", "name")
    .dialect(2),
    query_params={"query_vector": query_vector},
)
print([d.name for d in res.docs])
# >>> ['Sonus Boom Portable Speaker', 'Aurora BudsMini Earbuds', 'Aurora AcousticPro Headphones']
# STEP_END
# REMOVE_START
assert res.docs[0].name == "Sonus Boom Portable Speaker"
# REMOVE_END

# STEP_START vector_prefilter
res = index.search(
    Query("(@category:{Audio})=>[KNN 3 @embedding $query_vector AS score]")
    .sort_by("score", asc=True)
    .return_field("name")
    .dialect(2),
    query_params={"query_vector": query_vector},
)
print([d.name for d in res.docs])
# >>> ['Sonus Boom Portable Speaker', 'Aurora BudsMini Earbuds', 'Aurora AcousticPro Headphones']
# STEP_END
# REMOVE_START
assert res.total == 3
# REMOVE_END

# STEP_START hybrid_search
hybrid_vector = (
    embedder.encode("wireless headphones for listening to music")
    .astype("float32")
    .tobytes()
)
res = r.execute_command(
    "FT.HYBRID",
    "idx:catalog",
    "SEARCH",
    "wireless",
    "VSIM",
    "@embedding",
    "$query_vector",
    "KNN",
    "2",
    "K",
    "5",
    "LOAD",
    "1",
    "@name",
    "PARAMS",
    "2",
    "query_vector",
    hybrid_vector,
)
print(res)
# >>> {'total_results': 7, 'results': [{'name': 'Aurora AcousticPro Headphones'}, ...]}
# STEP_END
# REMOVE_START
assert res["total_results"] >= 1
# REMOVE_END
