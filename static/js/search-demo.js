/* =========================================================================
   Redis Search scripted demo: querying
   Dependency-free. Everything runs in the browser against recorded data;
   no Redis server is called.
   Step 1: the restaurants as stored, and the index on them.
   Step 2: full-text queries over names and descriptions, one feature of
   the query syntax each, with matches highlighted by HIGHLIGHT.
   Step 3: tag and numeric conditions, and the order SORTBY puts the
   matches in.
   Step 4: FT.AGGREGATE over orders, grouped and reduced.
   Each step shows its query and a plain-English reading of it, then the
   documents as stored with the matches highlighted, then the exact reply.
   Selecting a row shows the command that wrote it and what Redis holds.
   Observed, not modelled: the full-text and aggregation replies are what
   Redis 8.10 returned. Step 3's replies are built here and checked against
   all 288 recorded combinations. Every result list uses SORTBY, so the
   order doesn't depend on the default scorer. The documents are hashes,
   because Redis 8 rejects HIGHLIGHT on JSON indexes.
   Restaurants and orders come from the food delivery sample data in
   context-retriever-demo.js, with the first 10 of the 20 orders. Keep the
   IDs and names in sync.
   Base styles come from context-retriever-demo.css; search-demo.css and
   search-index-demo.css add the pieces the Search demos share.
   ========================================================================= */
(function () {
  "use strict";
  if (window.SearchDemo) return;   // loaded twice: the first copy already booted every widget

  /* ---- recorded from Redis 8.10 ---- */
  /* The restaurants: id, name, cuisine, city, rating, price level, delivery minutes, description. */
  var RESTAURANTS = [
    ["r201", "Bangkok Street Kitchen", "thai", "austin", 4.7, 2, 30, "Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request."],
    ["r202", "Smokehouse 512", "bbq", "austin", 4.4, 3, 40, "Texas barbecue: slow-smoked brisket, ribs, and mac and cheese."],
    ["r203", "Green Bowl", "vegan", "seattle", 4.8, 2, 25, "Plant-based bowls, salads, and smoothies. Everything on the menu is vegan."],
    ["r204", "Sakura Sushi Bar", "sushi", "denver", 4.6, 3, 35, "Fresh sushi and sashimi, nigiri sets, and miso soup."],
    ["r205", "Nonna's Trattoria", "italian", "seattle", 4.5, 3, 45, "Homemade pasta, risotto, and tiramisu from family recipes."],
    ["r206", "Slice Society", "pizza", "denver", 4.2, 1, 30, "New York-style pizza by the slice or the whole pie, made for sharing."],
    ["r207", "Olive & Za'atar", "mediterranean", "austin", 4.6, 2, 30, "Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean."],
    ["r208", "Spice Route", "indian", "seattle", 4.3, 2, 40, "Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes."],
    ["r209", "Lotus Thai", "thai", "austin", 4.1, 1, 25, "Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian."]
  ];
  /* The first 10 orders: id, customer, restaurant, status, total, placed at, items. */
  var ORDERS = [
    ["o3001", "u101", "r201", "delivered", 34.5, 1788375600, "Pad thai with tofu, spring rolls"],
    ["o3002", "u101", "r207", "delivered", 28, 1789045200, "Falafel wrap, hummus"],
    ["o3003", "u101", "r209", "on_the_way", 22.75, 1790272800, "Green curry without fish sauce, jasmine rice"],
    ["o3004", "u102", "r202", "delivered", 61.2, 1788638400, "Brisket platter, mac and cheese"],
    ["o3005", "u102", "r201", "cancelled", 19.9, 1787918400, "Pad see ew"],
    ["o3006", "u103", "r203", "delivered", 24, 1789214400, "Buddha bowl, oat latte"],
    ["o3007", "u103", "r208", "delivered", 38.4, 1789758000, "Chana masala, garlic naan"],
    ["o3008", "u104", "r206", "delivered", 42, 1788724800, "Two large pizzas"],
    ["o3009", "u104", "r204", "delivered", 67.8, 1789930800, "Omakase set for two"],
    ["o3010", "u105", "r205", "delivered", 54.3, 1788897600, "Mushroom risotto, tiramisu"]
  ];
  /* Each key: the HSET that wrote it, its reply, and the key as HGETALL returns it. */
  var STORED = {"restaurant:r201": {"set": ["HSET", "restaurant:r201", "name", "Bangkok Street Kitchen", "cuisine", "thai", "city", "austin", "rating", "4.7", "price_level", "2", "avg_delivery_min", "30", "description", "Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"thai\"\n 3) \"rating\"\n 4) \"4.7\"\n 5) \"description\"\n 6) \"Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request.\"\n 7) \"name\"\n 8) \"Bangkok Street Kitchen\"\n 9) \"city\"\n10) \"austin\"\n11) \"avg_delivery_min\"\n12) \"30\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r202": {"set": ["HSET", "restaurant:r202", "name", "Smokehouse 512", "cuisine", "bbq", "city", "austin", "rating", "4.4", "price_level", "3", "avg_delivery_min", "40", "description", "Texas barbecue: slow-smoked brisket, ribs, and mac and cheese."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Smokehouse 512\"\n 3) \"cuisine\"\n 4) \"bbq\"\n 5) \"city\"\n 6) \"austin\"\n 7) \"rating\"\n 8) \"4.4\"\n 9) \"price_level\"\n10) \"3\"\n11) \"avg_delivery_min\"\n12) \"40\"\n13) \"description\"\n14) \"Texas barbecue: slow-smoked brisket, ribs, and mac and cheese.\"\n"}, "restaurant:r203": {"set": ["HSET", "restaurant:r203", "name", "Green Bowl", "cuisine", "vegan", "city", "seattle", "rating", "4.8", "price_level", "2", "avg_delivery_min", "25", "description", "Plant-based bowls, salads, and smoothies. Everything on the menu is vegan."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"vegan\"\n 3) \"rating\"\n 4) \"4.8\"\n 5) \"description\"\n 6) \"Plant-based bowls, salads, and smoothies. Everything on the menu is vegan.\"\n 7) \"name\"\n 8) \"Green Bowl\"\n 9) \"city\"\n10) \"seattle\"\n11) \"avg_delivery_min\"\n12) \"25\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r204": {"set": ["HSET", "restaurant:r204", "name", "Sakura Sushi Bar", "cuisine", "sushi", "city", "denver", "rating", "4.6", "price_level", "3", "avg_delivery_min", "35", "description", "Fresh sushi and sashimi, nigiri sets, and miso soup."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Sakura Sushi Bar\"\n 3) \"cuisine\"\n 4) \"sushi\"\n 5) \"city\"\n 6) \"denver\"\n 7) \"rating\"\n 8) \"4.6\"\n 9) \"price_level\"\n10) \"3\"\n11) \"avg_delivery_min\"\n12) \"35\"\n13) \"description\"\n14) \"Fresh sushi and sashimi, nigiri sets, and miso soup.\"\n"}, "restaurant:r205": {"set": ["HSET", "restaurant:r205", "name", "Nonna's Trattoria", "cuisine", "italian", "city", "seattle", "rating", "4.5", "price_level", "3", "avg_delivery_min", "45", "description", "Homemade pasta, risotto, and tiramisu from family recipes."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Nonna's Trattoria\"\n 3) \"cuisine\"\n 4) \"italian\"\n 5) \"city\"\n 6) \"seattle\"\n 7) \"rating\"\n 8) \"4.5\"\n 9) \"price_level\"\n10) \"3\"\n11) \"avg_delivery_min\"\n12) \"45\"\n13) \"description\"\n14) \"Homemade pasta, risotto, and tiramisu from family recipes.\"\n"}, "restaurant:r206": {"set": ["HSET", "restaurant:r206", "name", "Slice Society", "cuisine", "pizza", "city", "denver", "rating", "4.2", "price_level", "1", "avg_delivery_min", "30", "description", "New York-style pizza by the slice or the whole pie, made for sharing."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"pizza\"\n 3) \"rating\"\n 4) \"4.2\"\n 5) \"description\"\n 6) \"New York-style pizza by the slice or the whole pie, made for sharing.\"\n 7) \"name\"\n 8) \"Slice Society\"\n 9) \"city\"\n10) \"denver\"\n11) \"avg_delivery_min\"\n12) \"30\"\n13) \"price_level\"\n14) \"1\"\n"}, "restaurant:r207": {"set": ["HSET", "restaurant:r207", "name", "Olive & Za'atar", "cuisine", "mediterranean", "city", "austin", "rating", "4.6", "price_level", "2", "avg_delivery_min", "30", "description", "Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"mediterranean\"\n 3) \"rating\"\n 4) \"4.6\"\n 5) \"description\"\n 6) \"Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean.\"\n 7) \"name\"\n 8) \"Olive & Za'atar\"\n 9) \"city\"\n10) \"austin\"\n11) \"avg_delivery_min\"\n12) \"30\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r208": {"set": ["HSET", "restaurant:r208", "name", "Spice Route", "cuisine", "indian", "city", "seattle", "rating", "4.3", "price_level", "2", "avg_delivery_min", "40", "description", "Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"indian\"\n 3) \"rating\"\n 4) \"4.3\"\n 5) \"description\"\n 6) \"Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes.\"\n 7) \"name\"\n 8) \"Spice Route\"\n 9) \"city\"\n10) \"seattle\"\n11) \"avg_delivery_min\"\n12) \"40\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r209": {"set": ["HSET", "restaurant:r209", "name", "Lotus Thai", "cuisine", "thai", "city", "austin", "rating", "4.1", "price_level", "1", "avg_delivery_min", "25", "description", "Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"thai\"\n 3) \"rating\"\n 4) \"4.1\"\n 5) \"description\"\n 6) \"Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\"\n 7) \"name\"\n 8) \"Lotus Thai\"\n 9) \"city\"\n10) \"austin\"\n11) \"avg_delivery_min\"\n12) \"25\"\n13) \"price_level\"\n14) \"1\"\n"}, "order:o3001": {"set": ["HSET", "order:o3001", "customer_id", "u101", "restaurant_id", "r201", "status", "delivered", "total", "34.5", "placed_ts", "1788375600", "items", "Pad thai with tofu, spring rolls"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u101\"\n 3) \"restaurant_id\"\n 4) \"r201\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"34.5\"\n 9) \"placed_ts\"\n10) \"1788375600\"\n11) \"items\"\n12) \"Pad thai with tofu, spring rolls\"\n"}, "order:o3002": {"set": ["HSET", "order:o3002", "customer_id", "u101", "restaurant_id", "r207", "status", "delivered", "total", "28", "placed_ts", "1789045200", "items", "Falafel wrap, hummus"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u101\"\n 3) \"restaurant_id\"\n 4) \"r207\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"28\"\n 9) \"placed_ts\"\n10) \"1789045200\"\n11) \"items\"\n12) \"Falafel wrap, hummus\"\n"}, "order:o3003": {"set": ["HSET", "order:o3003", "customer_id", "u101", "restaurant_id", "r209", "status", "on_the_way", "total", "22.75", "placed_ts", "1790272800", "items", "Green curry without fish sauce, jasmine rice"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u101\"\n 3) \"restaurant_id\"\n 4) \"r209\"\n 5) \"status\"\n 6) \"on_the_way\"\n 7) \"total\"\n 8) \"22.75\"\n 9) \"placed_ts\"\n10) \"1790272800\"\n11) \"items\"\n12) \"Green curry without fish sauce, jasmine rice\"\n"}, "order:o3004": {"set": ["HSET", "order:o3004", "customer_id", "u102", "restaurant_id", "r202", "status", "delivered", "total", "61.2", "placed_ts", "1788638400", "items", "Brisket platter, mac and cheese"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u102\"\n 3) \"restaurant_id\"\n 4) \"r202\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"61.2\"\n 9) \"placed_ts\"\n10) \"1788638400\"\n11) \"items\"\n12) \"Brisket platter, mac and cheese\"\n"}, "order:o3005": {"set": ["HSET", "order:o3005", "customer_id", "u102", "restaurant_id", "r201", "status", "cancelled", "total", "19.9", "placed_ts", "1787918400", "items", "Pad see ew"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u102\"\n 3) \"restaurant_id\"\n 4) \"r201\"\n 5) \"status\"\n 6) \"cancelled\"\n 7) \"total\"\n 8) \"19.9\"\n 9) \"placed_ts\"\n10) \"1787918400\"\n11) \"items\"\n12) \"Pad see ew\"\n"}, "order:o3006": {"set": ["HSET", "order:o3006", "customer_id", "u103", "restaurant_id", "r203", "status", "delivered", "total", "24", "placed_ts", "1789214400", "items", "Buddha bowl, oat latte"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u103\"\n 3) \"restaurant_id\"\n 4) \"r203\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"24\"\n 9) \"placed_ts\"\n10) \"1789214400\"\n11) \"items\"\n12) \"Buddha bowl, oat latte\"\n"}, "order:o3007": {"set": ["HSET", "order:o3007", "customer_id", "u103", "restaurant_id", "r208", "status", "delivered", "total", "38.4", "placed_ts", "1789758000", "items", "Chana masala, garlic naan"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u103\"\n 3) \"restaurant_id\"\n 4) \"r208\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"38.4\"\n 9) \"placed_ts\"\n10) \"1789758000\"\n11) \"items\"\n12) \"Chana masala, garlic naan\"\n"}, "order:o3008": {"set": ["HSET", "order:o3008", "customer_id", "u104", "restaurant_id", "r206", "status", "delivered", "total", "42", "placed_ts", "1788724800", "items", "Two large pizzas"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u104\"\n 3) \"restaurant_id\"\n 4) \"r206\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"42\"\n 9) \"placed_ts\"\n10) \"1788724800\"\n11) \"items\"\n12) \"Two large pizzas\"\n"}, "order:o3009": {"set": ["HSET", "order:o3009", "customer_id", "u104", "restaurant_id", "r204", "status", "delivered", "total", "67.8", "placed_ts", "1789930800", "items", "Omakase set for two"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u104\"\n 3) \"restaurant_id\"\n 4) \"r204\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"67.8\"\n 9) \"placed_ts\"\n10) \"1789930800\"\n11) \"items\"\n12) \"Omakase set for two\"\n"}, "order:o3010": {"set": ["HSET", "order:o3010", "customer_id", "u105", "restaurant_id", "r205", "status", "delivered", "total", "54.3", "placed_ts", "1788897600", "items", "Mushroom risotto, tiramisu"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u105\"\n 3) \"restaurant_id\"\n 4) \"r205\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"54.3\"\n 9) \"placed_ts\"\n10) \"1788897600\"\n11) \"items\"\n12) \"Mushroom risotto, tiramisu\"\n"}};
  /* The two indexes. */
  var CREATE = [["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "description", "TEXT", "cuisine", "TAG", "city", "TAG", "rating", "NUMERIC", "SORTABLE", "price_level", "NUMERIC", "SORTABLE", "avg_delivery_min", "NUMERIC", "SORTABLE"], ["FT.CREATE", "idx:orders", "ON", "HASH", "PREFIX", "1", "order:", "SCHEMA", "customer_id", "TAG", "restaurant_id", "TAG", "status", "TAG", "total", "NUMERIC", "SORTABLE", "placed_ts", "NUMERIC", "SORTABLE", "items", "TEXT"]];
  /* The full-text queries: command, reply, and the matches (key, highlighted name, highlighted description). */
  var TEXT = [
    {"query": "curry", "argv": ["FT.SEARCH", "idx:restaurants", "curry", "RETURN", "2", "name", "description", "HIGHLIGHT", "FIELDS", "2", "name", "description", "SORTBY", "rating", "DESC"], "reply": "1) (integer) 3\n2) \"restaurant:r201\"\n3) 1) \"name\"\n   2) \"Bangkok Street Kitchen\"\n   3) \"description\"\n   4) \"Thai street food: pad thai, green and red <b>curries</b>, and tofu dishes, made spicy on request.\"\n4) \"restaurant:r208\"\n5) 1) \"name\"\n   2) \"Spice Route\"\n   3) \"description\"\n   4) \"Indian <b>curries</b>, chana masala, and tandoori, with plenty of fiery vegetarian dishes.\"\n6) \"restaurant:r209\"\n7) 1) \"name\"\n   2) \"Lotus Thai\"\n   3) \"description\"\n   4) \"Thai <b>curries</b> and noodle dishes, known for its spicy green <b>curry</b>. Most dishes can be made vegetarian.\"\n", "hits": [["restaurant:r201", "Bangkok Street Kitchen", "Thai street food: pad thai, green and red <b>curries</b>, and tofu dishes, made spicy on request."], ["restaurant:r208", "Spice Route", "Indian <b>curries</b>, chana masala, and tandoori, with plenty of fiery vegetarian dishes."], ["restaurant:r209", "Lotus Thai", "Thai <b>curries</b> and noodle dishes, known for its spicy green <b>curry</b>. Most dishes can be made vegetarian."]]},
    {"query": "\"green curry\"", "argv": ["FT.SEARCH", "idx:restaurants", "\"green curry\"", "RETURN", "2", "name", "description", "HIGHLIGHT", "FIELDS", "2", "name", "description", "SORTBY", "rating", "DESC"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n3) 1) \"name\"\n   2) \"Lotus Thai\"\n   3) \"description\"\n   4) \"Thai curries and noodle dishes, known for its spicy <b>green</b> <b>curry</b>. Most dishes can be made vegetarian.\"\n", "hits": [["restaurant:r209", "Lotus Thai", "Thai curries and noodle dishes, known for its spicy <b>green</b> <b>curry</b>. Most dishes can be made vegetarian."]]},
    {"query": "spic*", "argv": ["FT.SEARCH", "idx:restaurants", "spic*", "RETURN", "2", "name", "description", "HIGHLIGHT", "FIELDS", "2", "name", "description", "SORTBY", "rating", "DESC"], "reply": "1) (integer) 3\n2) \"restaurant:r201\"\n3) 1) \"name\"\n   2) \"Bangkok Street Kitchen\"\n   3) \"description\"\n   4) \"Thai street food: pad thai, green and red curries, and tofu dishes, made <b>spicy</b> on request.\"\n4) \"restaurant:r208\"\n5) 1) \"name\"\n   2) \"<b>Spice</b> Route\"\n   3) \"description\"\n   4) \"Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes.\"\n6) \"restaurant:r209\"\n7) 1) \"name\"\n   2) \"Lotus Thai\"\n   3) \"description\"\n   4) \"Thai curries and noodle dishes, known for its <b>spicy</b> green curry. Most dishes can be made vegetarian.\"\n", "hits": [["restaurant:r201", "Bangkok Street Kitchen", "Thai street food: pad thai, green and red curries, and tofu dishes, made <b>spicy</b> on request."], ["restaurant:r208", "<b>Spice</b> Route", "Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes."], ["restaurant:r209", "Lotus Thai", "Thai curries and noodle dishes, known for its <b>spicy</b> green curry. Most dishes can be made vegetarian."]]},
    {"query": "%sushy%", "argv": ["FT.SEARCH", "idx:restaurants", "%sushy%", "RETURN", "2", "name", "description", "HIGHLIGHT", "FIELDS", "2", "name", "description", "SORTBY", "rating", "DESC"], "reply": "1) (integer) 1\n2) \"restaurant:r204\"\n3) 1) \"name\"\n   2) \"Sakura <b>Sushi</b> Bar\"\n   3) \"description\"\n   4) \"Fresh <b>sushi</b> and sashimi, nigiri sets, and miso soup.\"\n", "hits": [["restaurant:r204", "Sakura <b>Sushi</b> Bar", "Fresh <b>sushi</b> and sashimi, nigiri sets, and miso soup."]]},
    {"query": "pizza | pasta", "argv": ["FT.SEARCH", "idx:restaurants", "pizza | pasta", "RETURN", "2", "name", "description", "HIGHLIGHT", "FIELDS", "2", "name", "description", "SORTBY", "rating", "DESC"], "reply": "1) (integer) 2\n2) \"restaurant:r205\"\n3) 1) \"name\"\n   2) \"Nonna's Trattoria\"\n   3) \"description\"\n   4) \"Homemade <b>pasta</b>, risotto, and tiramisu from family recipes.\"\n4) \"restaurant:r206\"\n5) 1) \"name\"\n   2) \"Slice Society\"\n   3) \"description\"\n   4) \"New York-style <b>pizza</b> by the slice or the whole pie, made for sharing.\"\n", "hits": [["restaurant:r205", "Nonna's Trattoria", "Homemade <b>pasta</b>, risotto, and tiramisu from family recipes."], ["restaurant:r206", "Slice Society", "New York-style <b>pizza</b> by the slice or the whole pie, made for sharing."]]},
    {"query": "vegetarian -thai", "argv": ["FT.SEARCH", "idx:restaurants", "vegetarian -thai", "RETURN", "2", "name", "description", "HIGHLIGHT", "FIELDS", "2", "name", "description", "SORTBY", "rating", "DESC"], "reply": "1) (integer) 1\n2) \"restaurant:r208\"\n3) 1) \"name\"\n   2) \"Spice Route\"\n   3) \"description\"\n   4) \"Indian curries, chana masala, and tandoori, with plenty of fiery <b>vegetarian</b> dishes.\"\n", "hits": [["restaurant:r208", "Spice Route", "Indian curries, chana masala, and tandoori, with plenty of fiery <b>vegetarian</b> dishes."]]},
    {"query": "@name:thai", "argv": ["FT.SEARCH", "idx:restaurants", "@name:thai", "RETURN", "2", "name", "description", "HIGHLIGHT", "FIELDS", "2", "name", "description", "SORTBY", "rating", "DESC"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n3) 1) \"name\"\n   2) \"Lotus <b>Thai</b>\"\n   3) \"description\"\n   4) \"<b>Thai</b> curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\"\n", "hits": [["restaurant:r209", "Lotus <b>Thai</b>", "<b>Thai</b> curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian."]]}
  ];
  /* The aggregations, by group|reducer|filter: command, reply, and each group's value. */
  var AGGS = {
    "restaurant_id|COUNT|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@restaurant_id", "REDUCE", "COUNT", "0", "AS", "orders", "SORTBY", "2", "@orders", "DESC"], "reply": " 1) (integer) 9\n 2) 1) \"restaurant_id\"\n    2) \"r201\"\n    3) \"orders\"\n    4) \"2\"\n 3) 1) \"restaurant_id\"\n    2) \"r202\"\n    3) \"orders\"\n    4) \"1\"\n 4) 1) \"restaurant_id\"\n    2) \"r203\"\n    3) \"orders\"\n    4) \"1\"\n 5) 1) \"restaurant_id\"\n    2) \"r204\"\n    3) \"orders\"\n    4) \"1\"\n 6) 1) \"restaurant_id\"\n    2) \"r209\"\n    3) \"orders\"\n    4) \"1\"\n 7) 1) \"restaurant_id\"\n    2) \"r206\"\n    3) \"orders\"\n    4) \"1\"\n 8) 1) \"restaurant_id\"\n    2) \"r207\"\n    3) \"orders\"\n    4) \"1\"\n 9) 1) \"restaurant_id\"\n    2) \"r208\"\n    3) \"orders\"\n    4) \"1\"\n10) 1) \"restaurant_id\"\n    2) \"r205\"\n    3) \"orders\"\n    4) \"1\"\n", "rows": [["r201", "2"], ["r202", "1"], ["r203", "1"], ["r204", "1"], ["r209", "1"], ["r206", "1"], ["r207", "1"], ["r208", "1"], ["r205", "1"]]},
    "restaurant_id|COUNT|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@restaurant_id", "REDUCE", "COUNT", "0", "AS", "orders", "SORTBY", "2", "@orders", "DESC"], "reply": "1) (integer) 8\n2) 1) \"restaurant_id\"\n   2) \"r202\"\n   3) \"orders\"\n   4) \"1\"\n3) 1) \"restaurant_id\"\n   2) \"r203\"\n   3) \"orders\"\n   4) \"1\"\n4) 1) \"restaurant_id\"\n   2) \"r201\"\n   3) \"orders\"\n   4) \"1\"\n5) 1) \"restaurant_id\"\n   2) \"r204\"\n   3) \"orders\"\n   4) \"1\"\n6) 1) \"restaurant_id\"\n   2) \"r206\"\n   3) \"orders\"\n   4) \"1\"\n7) 1) \"restaurant_id\"\n   2) \"r207\"\n   3) \"orders\"\n   4) \"1\"\n8) 1) \"restaurant_id\"\n   2) \"r208\"\n   3) \"orders\"\n   4) \"1\"\n9) 1) \"restaurant_id\"\n   2) \"r205\"\n   3) \"orders\"\n   4) \"1\"\n", "rows": [["r202", "1"], ["r203", "1"], ["r201", "1"], ["r204", "1"], ["r206", "1"], ["r207", "1"], ["r208", "1"], ["r205", "1"]]},
    "restaurant_id|SUM|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@restaurant_id", "REDUCE", "SUM", "1", "@total", "AS", "spent", "SORTBY", "2", "@spent", "DESC"], "reply": " 1) (integer) 9\n 2) 1) \"restaurant_id\"\n    2) \"r204\"\n    3) \"spent\"\n    4) \"67.8\"\n 3) 1) \"restaurant_id\"\n    2) \"r202\"\n    3) \"spent\"\n    4) \"61.2\"\n 4) 1) \"restaurant_id\"\n    2) \"r201\"\n    3) \"spent\"\n    4) \"54.4\"\n 5) 1) \"restaurant_id\"\n    2) \"r205\"\n    3) \"spent\"\n    4) \"54.3\"\n 6) 1) \"restaurant_id\"\n    2) \"r206\"\n    3) \"spent\"\n    4) \"42\"\n 7) 1) \"restaurant_id\"\n    2) \"r208\"\n    3) \"spent\"\n    4) \"38.4\"\n 8) 1) \"restaurant_id\"\n    2) \"r207\"\n    3) \"spent\"\n    4) \"28\"\n 9) 1) \"restaurant_id\"\n    2) \"r203\"\n    3) \"spent\"\n    4) \"24\"\n10) 1) \"restaurant_id\"\n    2) \"r209\"\n    3) \"spent\"\n    4) \"22.75\"\n", "rows": [["r204", "67.8"], ["r202", "61.2"], ["r201", "54.4"], ["r205", "54.3"], ["r206", "42"], ["r208", "38.4"], ["r207", "28"], ["r203", "24"], ["r209", "22.75"]]},
    "restaurant_id|SUM|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@restaurant_id", "REDUCE", "SUM", "1", "@total", "AS", "spent", "SORTBY", "2", "@spent", "DESC"], "reply": "1) (integer) 8\n2) 1) \"restaurant_id\"\n   2) \"r204\"\n   3) \"spent\"\n   4) \"67.8\"\n3) 1) \"restaurant_id\"\n   2) \"r202\"\n   3) \"spent\"\n   4) \"61.2\"\n4) 1) \"restaurant_id\"\n   2) \"r205\"\n   3) \"spent\"\n   4) \"54.3\"\n5) 1) \"restaurant_id\"\n   2) \"r206\"\n   3) \"spent\"\n   4) \"42\"\n6) 1) \"restaurant_id\"\n   2) \"r208\"\n   3) \"spent\"\n   4) \"38.4\"\n7) 1) \"restaurant_id\"\n   2) \"r201\"\n   3) \"spent\"\n   4) \"34.5\"\n8) 1) \"restaurant_id\"\n   2) \"r207\"\n   3) \"spent\"\n   4) \"28\"\n9) 1) \"restaurant_id\"\n   2) \"r203\"\n   3) \"spent\"\n   4) \"24\"\n", "rows": [["r204", "67.8"], ["r202", "61.2"], ["r205", "54.3"], ["r206", "42"], ["r208", "38.4"], ["r201", "34.5"], ["r207", "28"], ["r203", "24"]]},
    "restaurant_id|AVG|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@restaurant_id", "REDUCE", "AVG", "1", "@total", "AS", "average", "SORTBY", "2", "@average", "DESC"], "reply": " 1) (integer) 9\n 2) 1) \"restaurant_id\"\n    2) \"r204\"\n    3) \"average\"\n    4) \"67.8\"\n 3) 1) \"restaurant_id\"\n    2) \"r202\"\n    3) \"average\"\n    4) \"61.2\"\n 4) 1) \"restaurant_id\"\n    2) \"r205\"\n    3) \"average\"\n    4) \"54.3\"\n 5) 1) \"restaurant_id\"\n    2) \"r206\"\n    3) \"average\"\n    4) \"42\"\n 6) 1) \"restaurant_id\"\n    2) \"r208\"\n    3) \"average\"\n    4) \"38.4\"\n 7) 1) \"restaurant_id\"\n    2) \"r207\"\n    3) \"average\"\n    4) \"28\"\n 8) 1) \"restaurant_id\"\n    2) \"r201\"\n    3) \"average\"\n    4) \"27.2\"\n 9) 1) \"restaurant_id\"\n    2) \"r203\"\n    3) \"average\"\n    4) \"24\"\n10) 1) \"restaurant_id\"\n    2) \"r209\"\n    3) \"average\"\n    4) \"22.75\"\n", "rows": [["r204", "67.8"], ["r202", "61.2"], ["r205", "54.3"], ["r206", "42"], ["r208", "38.4"], ["r207", "28"], ["r201", "27.2"], ["r203", "24"], ["r209", "22.75"]]},
    "restaurant_id|AVG|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@restaurant_id", "REDUCE", "AVG", "1", "@total", "AS", "average", "SORTBY", "2", "@average", "DESC"], "reply": "1) (integer) 8\n2) 1) \"restaurant_id\"\n   2) \"r204\"\n   3) \"average\"\n   4) \"67.8\"\n3) 1) \"restaurant_id\"\n   2) \"r202\"\n   3) \"average\"\n   4) \"61.2\"\n4) 1) \"restaurant_id\"\n   2) \"r205\"\n   3) \"average\"\n   4) \"54.3\"\n5) 1) \"restaurant_id\"\n   2) \"r206\"\n   3) \"average\"\n   4) \"42\"\n6) 1) \"restaurant_id\"\n   2) \"r208\"\n   3) \"average\"\n   4) \"38.4\"\n7) 1) \"restaurant_id\"\n   2) \"r201\"\n   3) \"average\"\n   4) \"34.5\"\n8) 1) \"restaurant_id\"\n   2) \"r207\"\n   3) \"average\"\n   4) \"28\"\n9) 1) \"restaurant_id\"\n   2) \"r203\"\n   3) \"average\"\n   4) \"24\"\n", "rows": [["r204", "67.8"], ["r202", "61.2"], ["r205", "54.3"], ["r206", "42"], ["r208", "38.4"], ["r201", "34.5"], ["r207", "28"], ["r203", "24"]]},
    "customer_id|COUNT|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@customer_id", "REDUCE", "COUNT", "0", "AS", "orders", "SORTBY", "2", "@orders", "DESC"], "reply": "1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"orders\"\n   4) \"3\"\n3) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"orders\"\n   4) \"2\"\n4) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"orders\"\n   4) \"2\"\n5) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"orders\"\n   4) \"2\"\n6) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"orders\"\n   4) \"1\"\n", "rows": [["u101", "3"], ["u103", "2"], ["u104", "2"], ["u102", "2"], ["u105", "1"]]},
    "customer_id|COUNT|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@customer_id", "REDUCE", "COUNT", "0", "AS", "orders", "SORTBY", "2", "@orders", "DESC"], "reply": "1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"orders\"\n   4) \"2\"\n3) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"orders\"\n   4) \"2\"\n4) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"orders\"\n   4) \"2\"\n5) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"orders\"\n   4) \"1\"\n6) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"orders\"\n   4) \"1\"\n", "rows": [["u103", "2"], ["u104", "2"], ["u101", "2"], ["u105", "1"], ["u102", "1"]]},
    "customer_id|SUM|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@customer_id", "REDUCE", "SUM", "1", "@total", "AS", "spent", "SORTBY", "2", "@spent", "DESC"], "reply": "1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"spent\"\n   4) \"109.8\"\n3) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"spent\"\n   4) \"85.25\"\n4) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"spent\"\n   4) \"81.1\"\n5) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"spent\"\n   4) \"62.4\"\n6) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"spent\"\n   4) \"54.3\"\n", "rows": [["u104", "109.8"], ["u101", "85.25"], ["u102", "81.1"], ["u103", "62.4"], ["u105", "54.3"]]},
    "customer_id|SUM|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@customer_id", "REDUCE", "SUM", "1", "@total", "AS", "spent", "SORTBY", "2", "@spent", "DESC"], "reply": "1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"spent\"\n   4) \"109.8\"\n3) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"spent\"\n   4) \"62.5\"\n4) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"spent\"\n   4) \"62.4\"\n5) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"spent\"\n   4) \"61.2\"\n6) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"spent\"\n   4) \"54.3\"\n", "rows": [["u104", "109.8"], ["u101", "62.5"], ["u103", "62.4"], ["u102", "61.2"], ["u105", "54.3"]]},
    "customer_id|AVG|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@customer_id", "REDUCE", "AVG", "1", "@total", "AS", "average", "SORTBY", "2", "@average", "DESC"], "reply": "1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"average\"\n   4) \"54.9\"\n3) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"average\"\n   4) \"54.3\"\n4) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"average\"\n   4) \"40.55\"\n5) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"average\"\n   4) \"31.2\"\n6) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"average\"\n   4) \"28.4166666667\"\n", "rows": [["u104", "54.9"], ["u105", "54.3"], ["u102", "40.55"], ["u103", "31.2"], ["u101", "28.4166666667"]]},
    "customer_id|AVG|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@customer_id", "REDUCE", "AVG", "1", "@total", "AS", "average", "SORTBY", "2", "@average", "DESC"], "reply": "1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"average\"\n   4) \"61.2\"\n3) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"average\"\n   4) \"54.9\"\n4) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"average\"\n   4) \"54.3\"\n5) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"average\"\n   4) \"31.25\"\n6) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"average\"\n   4) \"31.2\"\n", "rows": [["u102", "61.2"], ["u104", "54.9"], ["u105", "54.3"], ["u101", "31.25"], ["u103", "31.2"]]},
    "status|COUNT|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@status", "REDUCE", "COUNT", "0", "AS", "orders", "SORTBY", "2", "@orders", "DESC"], "reply": "1) (integer) 3\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"orders\"\n   4) \"8\"\n3) 1) \"status\"\n   2) \"on_the_way\"\n   3) \"orders\"\n   4) \"1\"\n4) 1) \"status\"\n   2) \"cancelled\"\n   3) \"orders\"\n   4) \"1\"\n", "rows": [["delivered", "8"], ["on_the_way", "1"], ["cancelled", "1"]]},
    "status|COUNT|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@status", "REDUCE", "COUNT", "0", "AS", "orders", "SORTBY", "2", "@orders", "DESC"], "reply": "1) (integer) 1\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"orders\"\n   4) \"8\"\n", "rows": [["delivered", "8"]]},
    "status|SUM|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@status", "REDUCE", "SUM", "1", "@total", "AS", "spent", "SORTBY", "2", "@spent", "DESC"], "reply": "1) (integer) 3\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"spent\"\n   4) \"350.2\"\n3) 1) \"status\"\n   2) \"on_the_way\"\n   3) \"spent\"\n   4) \"22.75\"\n4) 1) \"status\"\n   2) \"cancelled\"\n   3) \"spent\"\n   4) \"19.9\"\n", "rows": [["delivered", "350.2"], ["on_the_way", "22.75"], ["cancelled", "19.9"]]},
    "status|SUM|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@status", "REDUCE", "SUM", "1", "@total", "AS", "spent", "SORTBY", "2", "@spent", "DESC"], "reply": "1) (integer) 1\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"spent\"\n   4) \"350.2\"\n", "rows": [["delivered", "350.2"]]},
    "status|AVG|*": {"argv": ["FT.AGGREGATE", "idx:orders", "*", "GROUPBY", "1", "@status", "REDUCE", "AVG", "1", "@total", "AS", "average", "SORTBY", "2", "@average", "DESC"], "reply": "1) (integer) 3\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"average\"\n   4) \"43.775\"\n3) 1) \"status\"\n   2) \"on_the_way\"\n   3) \"average\"\n   4) \"22.75\"\n4) 1) \"status\"\n   2) \"cancelled\"\n   3) \"average\"\n   4) \"19.9\"\n", "rows": [["delivered", "43.775"], ["on_the_way", "22.75"], ["cancelled", "19.9"]]},
    "status|AVG|@status:{delivered}": {"argv": ["FT.AGGREGATE", "idx:orders", "@status:{delivered}", "GROUPBY", "1", "@status", "REDUCE", "AVG", "1", "@total", "AS", "average", "SORTBY", "2", "@average", "DESC"], "reply": "1) (integer) 1\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"average\"\n   4) \"43.775\"\n", "rows": [["delivered", "43.775"]]}
  };
  /* ---- end of the recordings ---- */

  var CUSTOMERS = { u101: "Maya Chen", u102: "Liam Ortiz", u103: "Priya Nair", u104: "Noah Williams", u105: "Sofia Rossi", u106: "Ethan Brooks", u107: "Aisha Khan", u108: "Lucas Meyer" };
  var CITIES = ["austin", "seattle", "denver"];
  var RETURN = ["name", "city", "rating", "price_level", "avg_delivery_min"];
  /* What each full-text query shows, once it has run. */
  var TEXT_NOTES = {
    "curry": "TEXT fields match other forms of a word, such as plurals. So `curry` also finds `curries`. This is called stemming.",
    '"green curry"': "Quotes make a phrase. Its words must appear together, in that order. Bangkok Street Kitchen has green and red curries, so it doesn't match.",
    "spic*": "A star at the end matches every word that starts with those letters. Here that's `spicy` in two descriptions and `Spice` in one name.",
    "%sushy%": "Percent signs on both sides allow one wrong letter. So `sushy` finds `sushi`.",
    "pizza | pasta": "A vertical bar matches either word.",
    "vegetarian -thai": "A minus sign leaves out anything with that word. Lotus Thai mentions vegetarian dishes, but it also mentions Thai, so only Spice Route is left.",
    "@name:thai": "`@name:` limits the search to the `name` field. A plain `thai` would also find Bangkok Street Kitchen, whose description mentions Thai street food."
  };
  /* What each full-text query looks for, in plain words. */
  var LOOK = { "curry": "the word `curry`", '"green curry"': "the phrase `green curry`", "spic*": "words that start with `spic`", "%sushy%": "words within one letter of `sushy`",
    "pizza | pasta": "`pizza` or `pasta`", "vegetarian -thai": "`vegetarian` without `thai`", "@name:thai": "the word `thai`, in `name` only" };
  var DATA_NOTE = "Every value in a hash is a string, even the rating. The index's types tell Redis how to read each one. TEXT values are split into words, TAG values are kept whole, and NUMERIC values are read as numbers.";

  /* --------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function code(s) { return "<code>" + esc(s) + "</code>"; }
  /* Escape the text, then turn `backticks` into code. */
  function md(s) { return esc(s).replace(/`([^`]+)`/g, "<code>$1</code>"); }
  /* Escape the text, then turn HIGHLIGHT's <b> tags back into marks. */
  function marked(s) { return esc(s).replace(/&lt;b&gt;/g, '<mark class="rsq-hit">').replace(/&lt;\/b&gt;/g, "</mark>"); }
  function fieldsOf(argv) { var f = {}; for (var i = 2; i + 1 < argv.length; i += 2) f[argv[i]] = argv[i + 1]; return f; }
  function list(xs) { return xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + (xs.length > 2 ? "," : "") + " and " + xs[xs.length - 1]; }
  function rest(id) { return RESTAURANTS.filter(function (r) { return r[0] === id; })[0]; }
  var BASE = RESTAURANTS.map(function (r) { return "restaurant:" + r[0]; });
  var ORDER_KEYS = ORDERS.map(function (o) { return "order:" + o[0]; });

  /* A reply as redis-cli prints it in a terminal: null is (nil), a number an integer, a string a bulk string, an array an array. */
  function fmt(v, prefix) {
    prefix = prefix || "";
    if (v === null) return "(nil)\n";
    if (typeof v === "number") return "(integer) " + v + "\n";
    if (typeof v === "string") return '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"\n';
    if (!v.length) return "(empty array)\n";
    var w = String(v.length).length, pad = new Array(w + 3).join(" "), out = "";
    v.forEach(function (x, i) {
      var n = String(i + 1);
      while (n.length < w) n = " " + n;
      out += (i ? prefix : "") + n + ") " + fmt(x, prefix + pad);
    });
    return out;
  }
  /* One argument as you'd type it in redis-cli: a query always in quotes, single ones when it
     has double quotes inside; anything else in double quotes when it has to be. */
  function token(argv, i) {
    var a = argv[i];
    if ((argv[0] === "FT.SEARCH" || argv[0] === "FT.AGGREGATE") && i === 2) return /"/.test(a) ? "'" + a + "'" : '"' + a + '"';
    return a === "" || /[\s"'\\]/.test(a) ? '"' + a.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"' : a;
  }
  function cmdline(argv) { return argv.map(function (a, i) { return token(argv, i); }).join(" "); }

  /* Syntax highlighting comes from demo-highlight.js, which the shortcode loads first. */
  function hl(argv, i) { return window.DemoHL.arg(argv, i, token(argv, i)); }
  function hlReply(text) { return window.DemoHL.reply(text); }

  /* ------------------------------------------------ step 3: filter and sort */

  function filterQuery(f) {
    var p = [];
    if (f.cities.length) p.push("@city:{" + f.cities.join(" | ") + "}");
    if (f.price) p.push("@price_level:[-inf " + f.price + "]");
    if (f.rating) p.push("@rating:[" + f.rating + " +inf]");
    if (f.fast) p.push("@avg_delivery_min:[-inf " + f.fast + "]");
    return p.join(" ") || "*";
  }
  var COL = { name: 1, city: 3, rating: 4, price_level: 5, avg_delivery_min: 6 };
  /* The command and the reply FT.SEARCH gives: the total, then each key with its fields, the sort field first. */
  function search(f) {
    var argv = ["FT.SEARCH", "idx:restaurants", filterQuery(f), "RETURN", String(RETURN.length)].concat(RETURN, ["SORTBY", f.sort[0], f.sort[1]]);
    var pass = RESTAURANTS.filter(function (r) {
      return (!f.cities.length || f.cities.indexOf(r[3]) >= 0) && (!f.price || r[5] <= f.price) && (!f.rating || r[4] >= f.rating) && (!f.fast || r[6] <= f.fast);
    });
    var dir = f.sort[1] === "DESC" ? -1 : 1, c = COL[f.sort[0]];
    /* Ties keep the order the documents were added in, reversed for DESC, as Redis returns them. */
    var sorted = pass.slice().sort(function (a, b) { return dir * ((a[c] - b[c]) || (RESTAURANTS.indexOf(a) - RESTAURANTS.indexOf(b))); });
    var fields = [f.sort[0]].concat(RETURN.filter(function (x) { return x !== f.sort[0]; }));
    var reply = [pass.length];
    sorted.forEach(function (r) {
      reply.push("restaurant:" + r[0]);
      reply.push([].concat.apply([], fields.map(function (x) { return [x, String(r[COL[x]])]; })));
    });
    return { argv: argv, reply: reply, keys: sorted.map(function (r) { return "restaurant:" + r[0]; }) };
  }

  /* --------------------------------------------------------------- the widget */

  var STEPS = [
    { key: "data", n: "1", label: "The data", lede: "Before you query, look at the data. Each restaurant is a hash. A hash is a key, such as `restaurant:r201`, that holds named fields, such as `name` and `rating`. An index tells Redis Search which of those fields to search, and how. Select a row to see a whole hash, as `HSET` wrote it and `HGETALL` reads it back." },
    { key: "text", n: "2", label: "Full-text search", lede: "A full-text query looks for words in TEXT fields. Here, those are each restaurant's `name` and `description`. The query syntax has a few ways to say which words to look for.", prompt: "Pick a query and see which restaurants it finds." },
    { key: "filter", n: "3", label: "Filter and sort", lede: "TAG and NUMERIC fields take exact conditions. A TAG condition, such as `@city:{austin}`, matches a field's whole value. A NUMERIC condition, such as `@rating:[4.5 +inf]`, matches a range of numbers. When conditions sit side by side, a restaurant must meet all of them.", prompt: "Pick some conditions and a sort order, and see which restaurants match." },
    { key: "agg", n: "4", label: "Aggregate", lede: "Here we've added 10 orders to the database, under keys that start with `order:`. They have their own index, `idx:orders`. `FT.AGGREGATE` groups the orders that a query matches. It then reduces each group to one number, such as how many orders it has or what they total.", prompt: "Pick how to group the orders and what to work out for each group." }
  ];

  function init(root) {
    var st = { tab: "data", dataKey: null, text: TEXT[0].query,
      f: { cities: [], price: null, rating: null, fast: null, sort: ["rating", "DESC"] },
      agg: { group: "restaurant_id", reducer: "COUNT", filter: "*" } };
    root.innerHTML = "";
    var tabs = el("div", "rcr-tabs");
    tabs.setAttribute("role", "tablist");
    STEPS.forEach(function (t, i) {
      var b = el("button", "rcr-tab", '<span class="rcr-n">' + t.n + "</span>" + esc(t.label));
      b.type = "button"; b.setAttribute("role", "tab"); b.dataset.tab = t.key;
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.addEventListener("click", function () { st.tab = t.key; st.dataKey = null; render(); });
      tabs.appendChild(b);
    });
    root.appendChild(tabs);
    var panel = el("div", "rcr-panel");
    panel.setAttribute("role", "tabpanel");
    root.appendChild(panel);

    /* The step's query, its reply as redis-cli prints it, and what the demo reads from it. */
    function current() {
      if (st.tab === "text") {
        var t = TEXT.filter(function (x) { return x.query === st.text; })[0];
        return { query: t.argv, reply: t.reply, keys: t.hits.map(function (h) { return h[0]; }), hits: t.hits, text: t.query };
      }
      if (st.tab === "filter") { var s = search(st.f); return { query: s.argv, reply: fmt(s.reply), keys: s.keys }; }
      if (st.tab === "agg") {
        var a = AGGS[st.agg.group + "|" + st.agg.reducer + "|" + st.agg.filter];
        return { query: a.argv, reply: a.reply, rows: a.rows };
      }
      return null;
    }

    function render() {
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.tab === st.tab ? "true" : "false"); });
      var step = STEPS.filter(function (t) { return t.key === st.tab; })[0], cur = current();
      panel.innerHTML = "";
      panel.appendChild(el("div", "rcr-lede", md(step.lede)));   // a div, so the site's paragraph styles stay out
      if (st.tab === "data") panel.appendChild(createBlock(CREATE[0]));   // the index the lede mentions
      if (st.tab === "agg") panel.appendChild(createBlock(CREATE[1]));    // the orders' own index
      if (step.prompt) panel.appendChild(el("div", "rcr-lede", md(step.prompt)));   // what to do with the controls that follow
      if (cur) panel.appendChild(controls());
      if (cur) panel.appendChild(queryBlock(cur));   // the query, before the data it finds
      panel.appendChild(dataCard(cur));
      if (st.tab === "agg") panel.appendChild(groupsBlock(cur));   // the groups, as the reply lists them
      if (cur) panel.appendChild(outputBlock(cur));   // the query's reply, exactly as redis-cli prints it
      var i = STEPS.indexOf(step), nxt = STEPS[i + 1], prv = STEPS[i - 1];
      if (nxt || prv) {
        var row = el("div", "rcr-next"), go = function (to) { st.tab = to.key; st.dataKey = null; render(); root.scrollIntoView({ block: "start", behavior: "smooth" }); };
        if (prv) {
          var pb = el("button", "rcr-btn rcr-prev", "← Previous: " + esc(prv.label));
          pb.type = "button";
          pb.addEventListener("click", function () { go(prv); });
          row.appendChild(pb);
        }
        if (nxt) {
          var b = el("button", "rcr-btn rcr-btn-primary", "Next: " + esc(nxt.label) + " →");
          b.type = "button";
          b.addEventListener("click", function () { go(nxt); });
          row.appendChild(b);
        }
        panel.appendChild(row);
      }
    }

    /* A row of options. */
    function choice(label, opts, isOn, onPick, cls) {
      var g = el("div", "rsq-choice" + (cls ? " " + cls : ""));
      g.appendChild(el("span", "rcr-lbl", label));
      var row = el("div", "rsq-opts");
      row.setAttribute("aria-label", label.replace(/<[^>]+>/g, ""));
      opts.forEach(function (o) {
        var on = isOn(o[0]), b = el("button", "rcr-chip rsq-opt" + (on ? " is-on" : ""), o[1]);
        b.type = "button";
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.addEventListener("click", function () { onPick(o[0]); render(); });
        row.appendChild(b);
      });
      g.appendChild(row);
      return g;
    }
    function controls() {
      var box = el("div", "rsq-controls");
      if (st.tab === "text") {
        box.appendChild(choice("Query", TEXT.map(function (t) { return [t.query, code(t.query)]; }), function (v) { return v === st.text; }, function (v) { st.text = v; }, "rsq-queries"));
      } else if (st.tab === "filter") {
        var f = st.f, grid = el("div", "rsq-filters");
        grid.appendChild(choice("City", CITIES.map(function (c) { return [c, esc(c)]; }), function (v) { return f.cities.indexOf(v) >= 0; },
          function (v) { var i = f.cities.indexOf(v); if (i >= 0) f.cities.splice(i, 1); else { f.cities.push(v); f.cities.sort(function (a, b) { return CITIES.indexOf(a) - CITIES.indexOf(b); }); } }));
        grid.appendChild(choice("Price level", [[null, "Any"], [2, "2 or less"], [1, "1"]], function (v) { return v === f.price; }, function (v) { f.price = v; }));
        grid.appendChild(choice("Rating", [[null, "Any"], [4.5, "4.5 or more"]], function (v) { return v === f.rating; }, function (v) { f.rating = v; }));
        grid.appendChild(choice("Delivery time", [[null, "Any"], [30, "30 min or less"]], function (v) { return v === f.fast; }, function (v) { f.fast = v; }));
        box.appendChild(grid);
        box.appendChild(choice("Sort by", [["rating|DESC", "Rating, highest first"], ["avg_delivery_min|ASC", "Delivery time, fastest first"], ["price_level|ASC", "Price level, lowest first"]],
          function (v) { return v === f.sort.join("|"); }, function (v) { f.sort = v.split("|"); }));
      } else {
        var a = st.agg;
        box.appendChild(choice("Group orders by", [["restaurant_id", "Restaurant"], ["customer_id", "Customer"], ["status", "Status"]], function (v) { return v === a.group; }, function (v) { a.group = v; }));
        box.appendChild(choice("Reduce each group to", [["COUNT", "Number of orders"], ["SUM", "Total spent"], ["AVG", "Average order"]], function (v) { return v === a.reducer; }, function (v) { a.reducer = v; }));
        box.appendChild(choice("Orders", [["*", "All"], ["@status:{delivered}", "Delivered only"]], function (v) { return v === a.filter; }, function (v) { a.filter = v; }));
      }
      return box;
    }

    /* The fields each step's table shows, each with how its index treats it. */
    var TYPES = { name: "TEXT", description: "TEXT", cuisine: "TAG", city: "TAG", rating: "NUMERIC SORTABLE", price_level: "NUMERIC SORTABLE", avg_delivery_min: "NUMERIC SORTABLE",
      customer_id: "TAG", restaurant_id: "TAG", status: "TAG", total: "NUMERIC SORTABLE" };
    function columns() {
      var col = function (f, wide) { return { field: f, label: f, type: TYPES[f], wide: !!wide, marked: st.tab === "agg" && st.agg.group === f }; };
      if (st.tab === "data") return [col("name", true), col("cuisine"), col("city"), col("rating")];
      if (st.tab === "text") return [col("name", true), col("description", true), col("rating")];
      if (st.tab === "filter") return [col("name", true), col("city"), col("rating"), col("price_level"), col("avg_delivery_min")];
      return [col("customer_id"), col("restaurant_id"), col("status"), col("total")];
    }

    /* The documents as stored, one row each. The headers show how the index treats each field;
       highlighted rows are the ones the query matched, numbered in the order Redis returned them. */
    function dataCard(c) {
      var tab = st.tab, card = el("div", "rcr-card rsi-data"), orders = tab === "agg", keys = orders ? ORDER_KEYS : BASE, ranks = {}, hits = {};
      if (c && c.keys) c.keys.forEach(function (k, i) { hits[k] = true; ranks[k] = i + 1; });
      if (orders) keys.forEach(function (k) { if (st.agg.filter === "*" || fieldsOf(STORED[k].set).status === "delivered") hits[k] = true; });
      var n = Object.keys(hits).length;
      card.appendChild(el("div", "rcr-cardhead", "<span>" + (orders ? "Orders" : "Restaurants") + '</span><span class="rcr-count">' +
        (c ? n + " of " + keys.length + " match" : keys.length + " hashes") + "</span>"));
      card.appendChild(el("div", "rsq-axis", esc(
        (tab === "data" ? "Four of each restaurant's " + Object.keys(fieldsOf(STORED[BASE[0]].set)).length + " fields." :
          orders ? "Four of each order's " + Object.keys(fieldsOf(STORED[ORDER_KEYS[0]].set)).length + " fields. Highlighted: the orders the query matched." :
            "The restaurants as stored. Highlighted: the ones the query matched, numbered in the order Redis returned them.") +
        " Select a row to see how it was written.")));
      card.appendChild(table(columns(), keys, hits, ranks, c));
      card.appendChild(el("div", "rsq-note", md(note(c))));
      return card;
    }
    /* The documents, one row each, under a header naming each field and its type.
       In the stacked layout on narrow screens, `wide` columns get a line of their own. */
    function table(cols, keys, hits, ranks, c) {
      var t = el("table", "rsi-table" + (cols.length > 2 ? " has-3" : "")), head = el("tr"), thead = el("thead"), body = el("tbody");
      var narrow = cols.filter(function (col) { return !col.wide; });
      t.style.setProperty("--cols", narrow.map(function () { return "minmax(0, 1fr)"; }).join(" "));
      head.appendChild(el("th", "", "Key"));
      cols.forEach(function (col) {
        head.appendChild(el("th", col.wide ? "rsi-wide" : "", '<span class="rcr-mono">' + esc(col.label).replace(/_/g, "_<wbr>") + "</span>" +
          ' <span class="rsi-type' + (col.marked ? " is-marked" : "") + '">' + esc(col.type) + "</span>"));
      });
      thead.appendChild(head);
      t.appendChild(thead);
      keys.forEach(function (key) {
        body.appendChild(docRow(key, cols, hits[key], ranks[key], c));
        if (st.dataKey === key) {
          var x = el("tr", "rsi-docrow"), td = el("td");
          td.colSpan = cols.length + 1;
          td.appendChild(docBox(key));
          x.appendChild(td);
          body.appendChild(x);
        }
      });
      t.appendChild(body);
      return t;
    }
    /* One document. Selecting its key shows how it was written and what Redis holds. */
    function docRow(key, cols, hit, rank, c) {
      var v = fieldsOf(STORED[key].set), open = st.dataKey === key;
      var tr = el("tr", [hit ? "is-hit" : "", open ? "is-open" : ""].join(" ").trim());
      tr.dataset.key = key;
      var k = el("td", "rsi-key"), b = el("button", "rsi-open rcr-mono", esc(key).replace(":", ":<wbr>"));
      b.type = "button";
      k.appendChild(b);
      if (rank) k.appendChild(el("span", "rsi-tag rsq-rank", "#" + rank));
      tr.appendChild(k);
      cols.forEach(function (col) { tr.appendChild(el("td", col.wide ? "rsi-wide" : "", cell(key, col.field, v, c))); });
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.title = (open ? "Hide" : "Show") + " how " + key + " was written";
      var toggle = function () { st.dataKey = open ? null : key; render(); var again = panel.querySelector('tr[data-key="' + key + '"] .rsi-open'); if (again) again.focus({ preventScroll: true }); };
      b.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
      tr.addEventListener("click", toggle);
      return tr;
    }
    /* A field's value as stored; in step 2, a matched name or description as HIGHLIGHT returned it. */
    function cell(key, field, v, c) {
      if (st.tab === "text" && (field === "name" || field === "description")) {
        var h = c.hits.filter(function (x) { return x[0] === key; })[0];
        if (h) return marked(h[field === "name" ? 1 : 2]);
      }
      return esc(v[field]);
    }

    /* What the current step shows, in a sentence or three. */
    function note(c) {
      if (st.tab === "data") return DATA_NOTE;
      if (st.tab === "text") return TEXT_NOTES[c.text];
      if (st.tab === "filter") {
        if (!c.keys.length) return "No restaurant meets every condition. Remove one to see matches again.";
        if (filterQuery(st.f) === "*") return "With no conditions, the query is `*`, which matches every restaurant. Pick a city or a range to narrow it down.";
        if (st.f.cities.length > 1) return "Inside braces, `|` means any of these cities. Between conditions, a space means all of them.";
        return c.keys.length + (c.keys.length === 1 ? " restaurant meets" : " restaurants meet") + " every condition. The numbers show the order `SORTBY` puts them in.";
      }
      var a = st.agg, rows = c.rows, top = rows[0][1], tied = rows.filter(function (r) { return r[1] === top; }).length;
      var what = { COUNT: "the most orders", SUM: "the highest total", AVG: "the highest average order" }[a.reducer];
      var first = tied > 1 ? tied + " groups tie for " + what : groupLabel(rows[0][0]) + " has " + what;
      return first + (a.filter === "*" ? "" : " among delivered orders") + ". " +
        { COUNT: "`COUNT 0` counts the orders in each group. It reads no field.", SUM: "`SUM` adds up the `total` field of each group's orders.", AVG: "`AVG` averages the `total` field of each group's orders." }[a.reducer];
    }
    function groupLabel(v) {
      return st.agg.group === "restaurant_id" ? rest(v)[1] : st.agg.group === "customer_id" ? CUSTOMERS[v] : v.replace(/_/g, " ");
    }

    /* Step 4: each group and its number, as the reply lists them. */
    function groupsBlock(c) {
      var rows = c.rows, max = Math.max.apply(null, rows.map(function (x) { return parseFloat(x[1]); })), box = el("div", "rsi-create rsq-groups");
      box.appendChild(el("div", "rsi-createhead", "The groups"));
      var list = el("div", "rsq-list");
      rows.forEach(function (x) {
        var v = parseFloat(x[1]), shown = st.agg.reducer === "COUNT" ? x[1] : "$" + v.toFixed(2);
        list.appendChild(el("div", "rsq-group", '<span class="rsq-gname">' + esc(groupLabel(x[0])) + '<span class="rsq-meta rcr-mono">' + esc(x[0]) + "</span></span>" +
          '<span class="rsq-bar" aria-hidden="true"><span style="width:' + (v / max * 100).toFixed(1) + '%"></span></span>' +
          '<span class="rsq-val rcr-mono" title="' + esc(x[1]) + '">' + esc(shown) + "</span>"));
      });
      box.appendChild(list);
      return box;
    }

    /* A transcript line: the prompt, the command, and its reply. */
    function line(argv, reply) {
      return '<span class="rsq-prompt">&gt; </span>' + cmdHtml(argv) + "\n" + hlReply(reply);
    }
    /* A key as written and as read back, exactly as redis-cli prints it. */
    function docBox(key) {
      var d = STORED[key], box = el("div", "rsq-doc");
      box.appendChild(el("pre", "rcr-code rsq-pre rsq-cmdline", (line(d.set, d.setReply) + line(["HGETALL", key], d.get)).replace(/\n$/, "")));
      return box;
    }

    /* An index's FT.CREATE, one part per line, each with what it means in plain words. */
    function createBlock(argv) {
      var lines = [], i, OPTS = ["SORTABLE"];
      var AS = { TEXT: "as words", TAG: "as one whole value", NUMERIC: "as a number" };
      var push = function (from, to, note, depth) { lines.push({ from: from, to: to, note: note, depth: depth }); };
      push(0, 1, "Create an index called " + code(argv[1]), 0);
      var prefix = argv.indexOf("PREFIX"), schema = argv.indexOf("SCHEMA"), n = +argv[prefix + 1];
      push(2, 3, "on hashes", 1);
      push(prefix, prefix + 1 + n, "whose keys start with " + argv.slice(prefix + 2, prefix + 2 + n).map(code).join(" or "), 1);
      push(schema, schema, "indexing these fields:", 1);
      for (i = schema + 1; i < argv.length;) {
        var end = i + 1;
        while (OPTS.indexOf(argv[end + 1]) >= 0) end++;
        push(i, end, code(argv[i]) + ", " + AS[argv[i + 1]] + (end > i + 1 ? ", kept ready for sorting" : ""), 2);
        i = end + 1;
      }
      var box = el("div", "rsi-create");
      box.appendChild(el("div", "rsi-createhead", "The index, part by part"));
      lines.forEach(function (l) {
        var toks = [];
        for (var j = l.from; j <= l.to; j++) toks.push(hl(argv, j));
        box.appendChild(el("div", "rsi-cline", '<span class="rsi-ccode rsi-d' + l.depth + '">' + toks.join(" ") + '</span><span class="rsi-cnote rsi-d' + l.depth + '">' + l.note + "</span>"));
      });
      var foot = el("div", "rcr-faint rsi-createcap", "One part per line here. In redis-cli, it's a single line. "), copy = el("button", "rsi-copy", "Copy as one line");
      copy.type = "button";
      copy.addEventListener("click", function () {
        var done = function (ok) { copy.textContent = ok ? "Copied" : "Couldn't copy"; setTimeout(function () { copy.textContent = "Copy as one line"; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(cmdline(argv)).then(function () { done(true); }, function () { done(false); }); else done(false);
      });
      foot.appendChild(copy);
      box.appendChild(foot);
      return box;
    }

    /* The step's query as you'd type it, then what it asks for. */
    function queryBlock(c) {
      var a = c.query, at = function (w) { return a.indexOf(w); }, box = el("div", "rsi-create rsi-query"), s;
      box.appendChild(el("div", "rsi-createhead", "The query"));
      box.appendChild(el("div", "rsi-qline", '<span class="rsq-prompt">&gt; </span>' + cmdHtml(a)));
      if (a[0] === "FT.AGGREGATE") {
        var g = a[at("GROUPBY") + 2].slice(1), r = a[at("REDUCE") + 1], as = a[at("AS") + 1];
        s = "Group the " + (a[2] === "*" ? "" : "delivered ") + "orders in `" + a[1] + "` by `" + g + "`. " +
          { COUNT: "Count the orders in each group", SUM: "Add up each group's `total`", AVG: "Average each group's `total`" }[r] + ", as `" + as + "`. Sort the groups by `" + as + "`, highest first.";
      } else {
        var f = a.slice(at("RETURN") + 2, at("RETURN") + 2 + +a[at("RETURN") + 1]);
        s = "Search `" + a[1] + "` for " + (st.tab === "text" ? LOOK[a[2]] : filterWords(st.f)) + ". Return " + list(f.map(function (x) { return "`" + x + "`"; })) +
          (at("HIGHLIGHT") > 0 ? ", with the matched words highlighted" : "") + ", sorted by `" + a[at("SORTBY") + 1] + "`" +
          (a[at("SORTBY") + 2] === "DESC" ? ", highest first." : ", lowest first.");
      }
      box.appendChild(el("div", "rsi-qnote", md(s)));
      return box;
    }
    /* Step 3's conditions in plain words. */
    function filterWords(f) {
      var p = [];
      if (f.cities.length) p.push("a `city` of " + f.cities.join(" or "));
      if (f.price) p.push("a `price_level` of " + f.price + " or less");
      if (f.rating) p.push("a `rating` of " + f.rating + " or more");
      if (f.fast) p.push("an `avg_delivery_min` of " + f.fast + " or less");
      return p.length ? "restaurants with " + list(p) : "every restaurant";
    }

    /* The reply to the step's query, exactly as redis-cli prints it. */
    function outputBlock(c) {
      var box = el("div", "rsi-create rsi-output");
      box.appendChild(el("div", "rsi-createhead", "The output"));
      box.appendChild(el("pre", "rcr-code rsq-pre rsq-cmdline", hlReply(c.reply.replace(/\n$/, ""))));
      box.appendChild(el("div", "rcr-faint rsi-createcap", esc("Exactly what redis-cli prints." +
        (st.tab === "text" ? " The <b> tags around matched words come from HIGHLIGHT." : ""))));
      return box;
    }

    /* The parts of a command the controls change, marked. */
    function marks(argv) {
      var m = {}, at = function (w) { return argv.indexOf(w); };
      if (argv[0] === "FT.SEARCH") m[2] = true;
      if (argv[0] === "FT.AGGREGATE") { m[2] = true; m[at("GROUPBY") + 2] = true; m[at("REDUCE") + 1] = true; }
      return m;
    }
    function cmdHtml(argv) {
      var m = marks(argv);
      return argv.map(function (a, i) { var t = hl(argv, i); return m[i] ? '<mark class="rsi-mark">' + t + "</mark>" : t; }).join(" ");
    }

    render();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".rsq[data-search]"), init); }
  window.SearchDemo = { fmt: fmt, cmdline: cmdline, search: search, data: { RESTAURANTS: RESTAURANTS, ORDERS: ORDERS, STORED: STORED, TEXT: TEXT, AGGS: AGGS, CREATE: CREATE } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
