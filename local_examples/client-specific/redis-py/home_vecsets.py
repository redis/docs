# EXAMPLE: home_vecsets
# STEP_START import
from sentence_transformers import SentenceTransformer

import redis
import numpy as np
# STEP_END

# STEP_START model
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
# STEP_END

# STEP_START data
peopleData = {
    "Marie Curie": {
        "born": 1867, "died": 1934,
        "description": """
        Polish-French chemist and physicist. The only person ever to win
        two Nobel prizes for two different sciences.
        """
    },
    "Linus Pauling": {
        "born": 1901, "died": 1994,
        "description": """
        American chemist and peace activist. One of only two people to win two
        Nobel prizes in different fields (chemistry and peace).
        """
    },
    "Freddie Mercury": {
        "born": 1946, "died": 1991,
        "description": """
        British musician, best known as the lead singer of the rock band
        Queen.
        """
    },
    "Marie Fredriksson": {
        "born": 1958, "died": 2019,
        "description": """
        Swedish multi-instrumentalist, mainly known as the lead singer and
        keyboardist of the band Roxette.
        """
    },
    "Paul Erdos": {
        "born": 1913, "died": 1996,
        "description": """
        Hungarian mathematician, known for his eccentric personality almost
        as much as his contributions to many different fields of mathematics.
        """
    },
    "Maryam Mirzakhani": {
        "born": 1977, "died": 2017,
        "description": """
        Iranian mathematician. The first woman ever to win the Fields medal
        for her contributions to mathematics.
        """
    },
    "Masako Natsume": {
        "born": 1957, "died": 1985,
        "description": """
        Japanese actress. She was very famous in Japan but was primarily
        known elsewhere in the world for her portrayal of Tripitaka in the
        TV series Monkey.
        """
    },
    "Chaim Topol": {
        "born": 1935, "died": 2023,
        "description": """
        Israeli actor and singer, usually credited simply as 'Topol'. He was
        best known for his many appearances as Tevye in the musical Fiddler
        on the Roof.
        """
    }
}
# STEP_END

# STEP_START add_data
r = redis.Redis(decode_responses=True)

for name, details in peopleData.items():
    emb = model.encode(details["description"]).astype(np.float32).tobytes()

    r.vset().vadd(
        "famousPeople",
        emb,
        name,
        attributes={
            "born": details["born"],
            "died": details["died"]
        }
    )
# STEP_END

# STEP_START basic_query
query_value = "actors"

actors_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes(),
)

print(f"'actors': {actors_results}")
# STEP_END

# STEP_START limited_query
query_value = "actors"

two_actors_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes(),
    count=2
)

print(f"'actors (2)': {two_actors_results}")
# >>> 'actors (2)': ['Masako Natsume', 'Chaim Topol']
# STEP_END

# STEP_START entertainer_query
query_value = "entertainer"

entertainer_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes()
)

print(f"'entertainer': {entertainer_results}")
# >>> 'entertainer': ['Chaim Topol', 'Freddie Mercury',
# 'Marie Fredriksson', 'Masako Natsume', 'Linus Pauling',
# 'Paul Erdos', 'Maryam Mirzakhani', 'Marie Curie']
# STEP_END

query_value = "science"

science_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes()
)

print(f"'science': {science_results}")
# >>> 'science': ['Marie Curie', 'Linus Pauling',
# 'Maryam Mirzakhani', 'Paul Erdos', 'Marie Fredriksson',
# 'Freddie Mercury', 'Masako Natsume', 'Chaim Topol']

# STEP_START filtered_query
query_value = "science"

science2000_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes(),
    filter=".died < 2000"
)

print(f"'science2000': {science2000_results}")
# >>> 'science2000': ['Marie Curie', 'Linus Pauling',
# 'Paul Erdos', 'Freddie Mercury', 'Masako Natsume']
# STEP_END
