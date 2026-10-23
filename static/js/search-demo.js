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
   Step 5: GEO radius and GEOSHAPE queries over each restaurant's location
   and delivery zone, with a map of the spot's city.
   Each step shows its query and a plain-English reading of it, then the
   documents as stored with the matches highlighted, then the exact reply.
   Selecting a row shows the command that wrote it and what Redis holds.
   Observed, not modelled: the full-text, aggregation, and location replies
   are what Redis 8.10 returned. The map is drawn here from the stored
   location and delivery_zone values. Step 3's replies are built here and checked against
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
    "restaurant_id|COUNT|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@restaurant_id","REDUCE","COUNT","0","AS","orders","SORTBY","4","@orders","DESC","@restaurant_id","ASC"],"reply":" 1) (integer) 9\n 2) 1) \"restaurant_id\"\n    2) \"r201\"\n    3) \"orders\"\n    4) \"2\"\n 3) 1) \"restaurant_id\"\n    2) \"r202\"\n    3) \"orders\"\n    4) \"1\"\n 4) 1) \"restaurant_id\"\n    2) \"r203\"\n    3) \"orders\"\n    4) \"1\"\n 5) 1) \"restaurant_id\"\n    2) \"r204\"\n    3) \"orders\"\n    4) \"1\"\n 6) 1) \"restaurant_id\"\n    2) \"r205\"\n    3) \"orders\"\n    4) \"1\"\n 7) 1) \"restaurant_id\"\n    2) \"r206\"\n    3) \"orders\"\n    4) \"1\"\n 8) 1) \"restaurant_id\"\n    2) \"r207\"\n    3) \"orders\"\n    4) \"1\"\n 9) 1) \"restaurant_id\"\n    2) \"r208\"\n    3) \"orders\"\n    4) \"1\"\n10) 1) \"restaurant_id\"\n    2) \"r209\"\n    3) \"orders\"\n    4) \"1\"\n","rows":[["r201","2"],["r202","1"],["r203","1"],["r204","1"],["r205","1"],["r206","1"],["r207","1"],["r208","1"],["r209","1"]]},
    "restaurant_id|COUNT|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@restaurant_id","REDUCE","COUNT","0","AS","orders","SORTBY","4","@orders","DESC","@restaurant_id","ASC"],"reply":"1) (integer) 8\n2) 1) \"restaurant_id\"\n   2) \"r201\"\n   3) \"orders\"\n   4) \"1\"\n3) 1) \"restaurant_id\"\n   2) \"r202\"\n   3) \"orders\"\n   4) \"1\"\n4) 1) \"restaurant_id\"\n   2) \"r203\"\n   3) \"orders\"\n   4) \"1\"\n5) 1) \"restaurant_id\"\n   2) \"r204\"\n   3) \"orders\"\n   4) \"1\"\n6) 1) \"restaurant_id\"\n   2) \"r205\"\n   3) \"orders\"\n   4) \"1\"\n7) 1) \"restaurant_id\"\n   2) \"r206\"\n   3) \"orders\"\n   4) \"1\"\n8) 1) \"restaurant_id\"\n   2) \"r207\"\n   3) \"orders\"\n   4) \"1\"\n9) 1) \"restaurant_id\"\n   2) \"r208\"\n   3) \"orders\"\n   4) \"1\"\n","rows":[["r201","1"],["r202","1"],["r203","1"],["r204","1"],["r205","1"],["r206","1"],["r207","1"],["r208","1"]]},
    "restaurant_id|SUM|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@restaurant_id","REDUCE","SUM","1","@total","AS","spent","SORTBY","4","@spent","DESC","@restaurant_id","ASC"],"reply":" 1) (integer) 9\n 2) 1) \"restaurant_id\"\n    2) \"r204\"\n    3) \"spent\"\n    4) \"67.8\"\n 3) 1) \"restaurant_id\"\n    2) \"r202\"\n    3) \"spent\"\n    4) \"61.2\"\n 4) 1) \"restaurant_id\"\n    2) \"r201\"\n    3) \"spent\"\n    4) \"54.4\"\n 5) 1) \"restaurant_id\"\n    2) \"r205\"\n    3) \"spent\"\n    4) \"54.3\"\n 6) 1) \"restaurant_id\"\n    2) \"r206\"\n    3) \"spent\"\n    4) \"42\"\n 7) 1) \"restaurant_id\"\n    2) \"r208\"\n    3) \"spent\"\n    4) \"38.4\"\n 8) 1) \"restaurant_id\"\n    2) \"r207\"\n    3) \"spent\"\n    4) \"28\"\n 9) 1) \"restaurant_id\"\n    2) \"r203\"\n    3) \"spent\"\n    4) \"24\"\n10) 1) \"restaurant_id\"\n    2) \"r209\"\n    3) \"spent\"\n    4) \"22.75\"\n","rows":[["r204","67.8"],["r202","61.2"],["r201","54.4"],["r205","54.3"],["r206","42"],["r208","38.4"],["r207","28"],["r203","24"],["r209","22.75"]]},
    "restaurant_id|SUM|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@restaurant_id","REDUCE","SUM","1","@total","AS","spent","SORTBY","4","@spent","DESC","@restaurant_id","ASC"],"reply":"1) (integer) 8\n2) 1) \"restaurant_id\"\n   2) \"r204\"\n   3) \"spent\"\n   4) \"67.8\"\n3) 1) \"restaurant_id\"\n   2) \"r202\"\n   3) \"spent\"\n   4) \"61.2\"\n4) 1) \"restaurant_id\"\n   2) \"r205\"\n   3) \"spent\"\n   4) \"54.3\"\n5) 1) \"restaurant_id\"\n   2) \"r206\"\n   3) \"spent\"\n   4) \"42\"\n6) 1) \"restaurant_id\"\n   2) \"r208\"\n   3) \"spent\"\n   4) \"38.4\"\n7) 1) \"restaurant_id\"\n   2) \"r201\"\n   3) \"spent\"\n   4) \"34.5\"\n8) 1) \"restaurant_id\"\n   2) \"r207\"\n   3) \"spent\"\n   4) \"28\"\n9) 1) \"restaurant_id\"\n   2) \"r203\"\n   3) \"spent\"\n   4) \"24\"\n","rows":[["r204","67.8"],["r202","61.2"],["r205","54.3"],["r206","42"],["r208","38.4"],["r201","34.5"],["r207","28"],["r203","24"]]},
    "restaurant_id|AVG|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@restaurant_id","REDUCE","AVG","1","@total","AS","average","SORTBY","4","@average","DESC","@restaurant_id","ASC"],"reply":" 1) (integer) 9\n 2) 1) \"restaurant_id\"\n    2) \"r204\"\n    3) \"average\"\n    4) \"67.8\"\n 3) 1) \"restaurant_id\"\n    2) \"r202\"\n    3) \"average\"\n    4) \"61.2\"\n 4) 1) \"restaurant_id\"\n    2) \"r205\"\n    3) \"average\"\n    4) \"54.3\"\n 5) 1) \"restaurant_id\"\n    2) \"r206\"\n    3) \"average\"\n    4) \"42\"\n 6) 1) \"restaurant_id\"\n    2) \"r208\"\n    3) \"average\"\n    4) \"38.4\"\n 7) 1) \"restaurant_id\"\n    2) \"r207\"\n    3) \"average\"\n    4) \"28\"\n 8) 1) \"restaurant_id\"\n    2) \"r201\"\n    3) \"average\"\n    4) \"27.2\"\n 9) 1) \"restaurant_id\"\n    2) \"r203\"\n    3) \"average\"\n    4) \"24\"\n10) 1) \"restaurant_id\"\n    2) \"r209\"\n    3) \"average\"\n    4) \"22.75\"\n","rows":[["r204","67.8"],["r202","61.2"],["r205","54.3"],["r206","42"],["r208","38.4"],["r207","28"],["r201","27.2"],["r203","24"],["r209","22.75"]]},
    "restaurant_id|AVG|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@restaurant_id","REDUCE","AVG","1","@total","AS","average","SORTBY","4","@average","DESC","@restaurant_id","ASC"],"reply":"1) (integer) 8\n2) 1) \"restaurant_id\"\n   2) \"r204\"\n   3) \"average\"\n   4) \"67.8\"\n3) 1) \"restaurant_id\"\n   2) \"r202\"\n   3) \"average\"\n   4) \"61.2\"\n4) 1) \"restaurant_id\"\n   2) \"r205\"\n   3) \"average\"\n   4) \"54.3\"\n5) 1) \"restaurant_id\"\n   2) \"r206\"\n   3) \"average\"\n   4) \"42\"\n6) 1) \"restaurant_id\"\n   2) \"r208\"\n   3) \"average\"\n   4) \"38.4\"\n7) 1) \"restaurant_id\"\n   2) \"r201\"\n   3) \"average\"\n   4) \"34.5\"\n8) 1) \"restaurant_id\"\n   2) \"r207\"\n   3) \"average\"\n   4) \"28\"\n9) 1) \"restaurant_id\"\n   2) \"r203\"\n   3) \"average\"\n   4) \"24\"\n","rows":[["r204","67.8"],["r202","61.2"],["r205","54.3"],["r206","42"],["r208","38.4"],["r201","34.5"],["r207","28"],["r203","24"]]},
    "customer_id|COUNT|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@customer_id","REDUCE","COUNT","0","AS","orders","SORTBY","4","@orders","DESC","@customer_id","ASC"],"reply":"1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"orders\"\n   4) \"3\"\n3) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"orders\"\n   4) \"2\"\n4) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"orders\"\n   4) \"2\"\n5) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"orders\"\n   4) \"2\"\n6) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"orders\"\n   4) \"1\"\n","rows":[["u101","3"],["u102","2"],["u103","2"],["u104","2"],["u105","1"]]},
    "customer_id|COUNT|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@customer_id","REDUCE","COUNT","0","AS","orders","SORTBY","4","@orders","DESC","@customer_id","ASC"],"reply":"1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"orders\"\n   4) \"2\"\n3) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"orders\"\n   4) \"2\"\n4) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"orders\"\n   4) \"2\"\n5) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"orders\"\n   4) \"1\"\n6) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"orders\"\n   4) \"1\"\n","rows":[["u101","2"],["u103","2"],["u104","2"],["u102","1"],["u105","1"]]},
    "customer_id|SUM|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@customer_id","REDUCE","SUM","1","@total","AS","spent","SORTBY","4","@spent","DESC","@customer_id","ASC"],"reply":"1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"spent\"\n   4) \"109.8\"\n3) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"spent\"\n   4) \"85.25\"\n4) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"spent\"\n   4) \"81.1\"\n5) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"spent\"\n   4) \"62.4\"\n6) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"spent\"\n   4) \"54.3\"\n","rows":[["u104","109.8"],["u101","85.25"],["u102","81.1"],["u103","62.4"],["u105","54.3"]]},
    "customer_id|SUM|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@customer_id","REDUCE","SUM","1","@total","AS","spent","SORTBY","4","@spent","DESC","@customer_id","ASC"],"reply":"1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"spent\"\n   4) \"109.8\"\n3) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"spent\"\n   4) \"62.5\"\n4) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"spent\"\n   4) \"62.4\"\n5) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"spent\"\n   4) \"61.2\"\n6) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"spent\"\n   4) \"54.3\"\n","rows":[["u104","109.8"],["u101","62.5"],["u103","62.4"],["u102","61.2"],["u105","54.3"]]},
    "customer_id|AVG|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@customer_id","REDUCE","AVG","1","@total","AS","average","SORTBY","4","@average","DESC","@customer_id","ASC"],"reply":"1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"average\"\n   4) \"54.9\"\n3) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"average\"\n   4) \"54.3\"\n4) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"average\"\n   4) \"40.55\"\n5) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"average\"\n   4) \"31.2\"\n6) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"average\"\n   4) \"28.4166666667\"\n","rows":[["u104","54.9"],["u105","54.3"],["u102","40.55"],["u103","31.2"],["u101","28.4166666667"]]},
    "customer_id|AVG|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@customer_id","REDUCE","AVG","1","@total","AS","average","SORTBY","4","@average","DESC","@customer_id","ASC"],"reply":"1) (integer) 5\n2) 1) \"customer_id\"\n   2) \"u102\"\n   3) \"average\"\n   4) \"61.2\"\n3) 1) \"customer_id\"\n   2) \"u104\"\n   3) \"average\"\n   4) \"54.9\"\n4) 1) \"customer_id\"\n   2) \"u105\"\n   3) \"average\"\n   4) \"54.3\"\n5) 1) \"customer_id\"\n   2) \"u101\"\n   3) \"average\"\n   4) \"31.25\"\n6) 1) \"customer_id\"\n   2) \"u103\"\n   3) \"average\"\n   4) \"31.2\"\n","rows":[["u102","61.2"],["u104","54.9"],["u105","54.3"],["u101","31.25"],["u103","31.2"]]},
    "status|COUNT|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@status","REDUCE","COUNT","0","AS","orders","SORTBY","4","@orders","DESC","@status","ASC"],"reply":"1) (integer) 3\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"orders\"\n   4) \"8\"\n3) 1) \"status\"\n   2) \"cancelled\"\n   3) \"orders\"\n   4) \"1\"\n4) 1) \"status\"\n   2) \"on_the_way\"\n   3) \"orders\"\n   4) \"1\"\n","rows":[["delivered","8"],["cancelled","1"],["on_the_way","1"]]},
    "status|COUNT|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@status","REDUCE","COUNT","0","AS","orders","SORTBY","4","@orders","DESC","@status","ASC"],"reply":"1) (integer) 1\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"orders\"\n   4) \"8\"\n","rows":[["delivered","8"]]},
    "status|SUM|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@status","REDUCE","SUM","1","@total","AS","spent","SORTBY","4","@spent","DESC","@status","ASC"],"reply":"1) (integer) 3\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"spent\"\n   4) \"350.2\"\n3) 1) \"status\"\n   2) \"on_the_way\"\n   3) \"spent\"\n   4) \"22.75\"\n4) 1) \"status\"\n   2) \"cancelled\"\n   3) \"spent\"\n   4) \"19.9\"\n","rows":[["delivered","350.2"],["on_the_way","22.75"],["cancelled","19.9"]]},
    "status|SUM|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@status","REDUCE","SUM","1","@total","AS","spent","SORTBY","4","@spent","DESC","@status","ASC"],"reply":"1) (integer) 1\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"spent\"\n   4) \"350.2\"\n","rows":[["delivered","350.2"]]},
    "status|AVG|*": {"argv":["FT.AGGREGATE","idx:orders","*","GROUPBY","1","@status","REDUCE","AVG","1","@total","AS","average","SORTBY","4","@average","DESC","@status","ASC"],"reply":"1) (integer) 3\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"average\"\n   4) \"43.775\"\n3) 1) \"status\"\n   2) \"on_the_way\"\n   3) \"average\"\n   4) \"22.75\"\n4) 1) \"status\"\n   2) \"cancelled\"\n   3) \"average\"\n   4) \"19.9\"\n","rows":[["delivered","43.775"],["on_the_way","22.75"],["cancelled","19.9"]]},
    "status|AVG|@status:{delivered}": {"argv":["FT.AGGREGATE","idx:orders","@status:{delivered}","GROUPBY","1","@status","REDUCE","AVG","1","@total","AS","average","SORTBY","4","@average","DESC","@status","ASC"],"reply":"1) (integer) 1\n2) 1) \"status\"\n   2) \"delivered\"\n   3) \"average\"\n   4) \"43.775\"\n","rows":[["delivered","43.775"]]}
  };
  /* Step 5: the spots to search from, each restaurant's location and delivery zone as HSET added them, the index on
     them, and every radius ("spot|km") and delivery-zone query. */
  var PLACES = {"spots":[{"id":"atx-downtown","label":"Downtown Austin","city":"austin","lon":-97.7431,"lat":30.2672},{"id":"atx-soco","label":"South Congress, Austin","city":"austin","lon":-97.749,"lat":30.246},{"id":"atx-hydepark","label":"Hyde Park, Austin","city":"austin","lon":-97.731,"lat":30.306},{"id":"sea-downtown","label":"Downtown Seattle","city":"seattle","lon":-122.3321,"lat":47.6062},{"id":"sea-ballard","label":"Ballard, Seattle","city":"seattle","lon":-122.385,"lat":47.669},{"id":"den-downtown","label":"Downtown Denver","city":"denver","lon":-104.9903,"lat":39.7392}],"radii":[1,3,5],"create":{"argv":["FT.CREATE","idx:places","ON","HASH","PREFIX","1","restaurant:","SCHEMA","name","TEXT","SORTABLE","location","GEO","delivery_zone","GEOSHAPE"],"reply":"OK\n"},"stored":{"restaurant:r201":{"set":["HSET","restaurant:r201","location","-97.7230,30.2640","delivery_zone","POLYGON((-97.6960 30.2640, -97.7067 30.2781, -97.7230 30.2899, -97.7402 30.2790, -97.7514 30.2640, -97.7383 30.2507, -97.7230 30.2370, -97.7048 30.2482, -97.6960 30.2640))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"austin\"\n 3) \"location\"\n 4) \"-97.7230,30.2640\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-97.6960 30.2640, -97.7067 30.2781, -97.7230 30.2899, -97.7402 30.2790, -97.7514 30.2640, -97.7383 30.2507, -97.7230 30.2370, -97.7048 30.2482, -97.6960 30.2640))\"\n 7) \"description\"\n 8) \"Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request.\"\n 9) \"cuisine\"\n10) \"thai\"\n11) \"name\"\n12) \"Bangkok Street Kitchen\"\n13) \"price_level\"\n14) \"2\"\n15) \"rating\"\n16) \"4.7\"\n17) \"avg_delivery_min\"\n18) \"30\"\n"},"restaurant:r202":{"set":["HSET","restaurant:r202","location","-97.7500,30.2470","delivery_zone","POLYGON((-97.7136 30.2470, -97.7281 30.2660, -97.7500 30.2818, -97.7732 30.2671, -97.7882 30.2470, -97.7706 30.2291, -97.7500 30.2106, -97.7256 30.2257, -97.7136 30.2470))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"austin\"\n 3) \"location\"\n 4) \"-97.7500,30.2470\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-97.7136 30.2470, -97.7281 30.2660, -97.7500 30.2818, -97.7732 30.2671, -97.7882 30.2470, -97.7706 30.2291, -97.7500 30.2106, -97.7256 30.2257, -97.7136 30.2470))\"\n 7) \"description\"\n 8) \"Texas barbecue: slow-smoked brisket, ribs, and mac and cheese.\"\n 9) \"cuisine\"\n10) \"bbq\"\n11) \"name\"\n12) \"Smokehouse 512\"\n13) \"price_level\"\n14) \"3\"\n15) \"rating\"\n16) \"4.4\"\n17) \"avg_delivery_min\"\n18) \"40\"\n"},"restaurant:r203":{"set":["HSET","restaurant:r203","location","-122.3200,47.6200","delivery_zone","POLYGON((-122.2800 47.6200, -122.2960 47.6363, -122.3200 47.6498, -122.3454 47.6373, -122.3620 47.6200, -122.3426 47.6047, -122.3200 47.5888, -122.2931 47.6018, -122.2800 47.6200))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"seattle\"\n 3) \"location\"\n 4) \"-122.3200,47.6200\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-122.2800 47.6200, -122.2960 47.6363, -122.3200 47.6498, -122.3454 47.6373, -122.3620 47.6200, -122.3426 47.6047, -122.3200 47.5888, -122.2931 47.6018, -122.2800 47.6200))\"\n 7) \"description\"\n 8) \"Plant-based bowls, salads, and smoothies. Everything on the menu is vegan.\"\n 9) \"cuisine\"\n10) \"vegan\"\n11) \"name\"\n12) \"Green Bowl\"\n13) \"price_level\"\n14) \"2\"\n15) \"rating\"\n16) \"4.8\"\n17) \"avg_delivery_min\"\n18) \"25\"\n"},"restaurant:r204":{"set":["HSET","restaurant:r204","location","-104.9990,39.7530","delivery_zone","POLYGON((-104.9639 39.7530, -104.9779 39.7693, -104.9990 39.7828, -105.0213 39.7703, -105.0358 39.7530, -105.0188 39.7377, -104.9990 39.7218, -104.9755 39.7348, -104.9639 39.7530))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"denver\"\n 3) \"location\"\n 4) \"-104.9990,39.7530\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-104.9639 39.7530, -104.9779 39.7693, -104.9990 39.7828, -105.0213 39.7703, -105.0358 39.7530, -105.0188 39.7377, -104.9990 39.7218, -104.9755 39.7348, -104.9639 39.7530))\"\n 7) \"description\"\n 8) \"Fresh sushi and sashimi, nigiri sets, and miso soup.\"\n 9) \"cuisine\"\n10) \"sushi\"\n11) \"name\"\n12) \"Sakura Sushi Bar\"\n13) \"price_level\"\n14) \"3\"\n15) \"rating\"\n16) \"4.6\"\n17) \"avg_delivery_min\"\n18) \"35\"\n"},"restaurant:r205":{"set":["HSET","restaurant:r205","location","-122.3840,47.6680","delivery_zone","POLYGON((-122.3306 47.6680, -122.3519 47.6897, -122.3840 47.7078, -122.4180 47.6910, -122.4400 47.6680, -122.4142 47.6475, -122.3840 47.6264, -122.3482 47.6437, -122.3306 47.6680))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"seattle\"\n 3) \"location\"\n 4) \"-122.3840,47.6680\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-122.3306 47.6680, -122.3519 47.6897, -122.3840 47.7078, -122.4180 47.6910, -122.4400 47.6680, -122.4142 47.6475, -122.3840 47.6264, -122.3482 47.6437, -122.3306 47.6680))\"\n 7) \"description\"\n 8) \"Homemade pasta, risotto, and tiramisu from family recipes.\"\n 9) \"cuisine\"\n10) \"italian\"\n11) \"name\"\n12) \"Nonna's Trattoria\"\n13) \"price_level\"\n14) \"3\"\n15) \"rating\"\n16) \"4.5\"\n17) \"avg_delivery_min\"\n18) \"45\"\n"},"restaurant:r206":{"set":["HSET","restaurant:r206","location","-104.9780,39.7330","delivery_zone","POLYGON((-104.9675 39.7330, -104.9717 39.7379, -104.9780 39.7420, -104.9847 39.7382, -104.9890 39.7330, -104.9839 39.7284, -104.9780 39.7236, -104.9709 39.7275, -104.9675 39.7330))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"denver\"\n 3) \"location\"\n 4) \"-104.9780,39.7330\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-104.9675 39.7330, -104.9717 39.7379, -104.9780 39.7420, -104.9847 39.7382, -104.9890 39.7330, -104.9839 39.7284, -104.9780 39.7236, -104.9709 39.7275, -104.9675 39.7330))\"\n 7) \"description\"\n 8) \"New York-style pizza by the slice or the whole pie, made for sharing.\"\n 9) \"cuisine\"\n10) \"pizza\"\n11) \"name\"\n12) \"Slice Society\"\n13) \"price_level\"\n14) \"1\"\n15) \"rating\"\n16) \"4.2\"\n17) \"avg_delivery_min\"\n18) \"30\"\n"},"restaurant:r207":{"set":["HSET","restaurant:r207","location","-97.7300,30.3050","delivery_zone","POLYGON((-97.7040 30.3050, -97.7144 30.3186, -97.7300 30.3299, -97.7466 30.3194, -97.7573 30.3050, -97.7447 30.2922, -97.7300 30.2790, -97.7125 30.2898, -97.7040 30.3050))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"austin\"\n 3) \"location\"\n 4) \"-97.7300,30.3050\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-97.7040 30.3050, -97.7144 30.3186, -97.7300 30.3299, -97.7466 30.3194, -97.7573 30.3050, -97.7447 30.2922, -97.7300 30.2790, -97.7125 30.2898, -97.7040 30.3050))\"\n 7) \"description\"\n 8) \"Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean.\"\n 9) \"cuisine\"\n10) \"mediterranean\"\n11) \"name\"\n12) \"Olive & Za'atar\"\n13) \"price_level\"\n14) \"2\"\n15) \"rating\"\n16) \"4.6\"\n17) \"avg_delivery_min\"\n18) \"30\"\n"},"restaurant:r208":{"set":["HSET","restaurant:r208","location","-122.3380,47.6100","delivery_zone","POLYGON((-122.3047 47.6100, -122.3180 47.6236, -122.3380 47.6349, -122.3592 47.6244, -122.3730 47.6100, -122.3568 47.5972, -122.3380 47.5840, -122.3156 47.5948, -122.3047 47.6100))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"seattle\"\n 3) \"location\"\n 4) \"-122.3380,47.6100\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-122.3047 47.6100, -122.3180 47.6236, -122.3380 47.6349, -122.3592 47.6244, -122.3730 47.6100, -122.3568 47.5972, -122.3380 47.5840, -122.3156 47.5948, -122.3047 47.6100))\"\n 7) \"description\"\n 8) \"Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes.\"\n 9) \"cuisine\"\n10) \"indian\"\n11) \"name\"\n12) \"Spice Route\"\n13) \"price_level\"\n14) \"2\"\n15) \"rating\"\n16) \"4.3\"\n17) \"avg_delivery_min\"\n18) \"40\"\n"},"restaurant:r209":{"set":["HSET","restaurant:r209","location","-97.7420,30.2690","delivery_zone","POLYGON((-97.7212 30.2690, -97.7295 30.2799, -97.7420 30.2889, -97.7552 30.2805, -97.7638 30.2690, -97.7538 30.2588, -97.7420 30.2482, -97.7280 30.2568, -97.7212 30.2690))"],"setReply":"(integer) 2\n","get":" 1) \"city\"\n 2) \"austin\"\n 3) \"location\"\n 4) \"-97.7420,30.2690\"\n 5) \"delivery_zone\"\n 6) \"POLYGON((-97.7212 30.2690, -97.7295 30.2799, -97.7420 30.2889, -97.7552 30.2805, -97.7638 30.2690, -97.7538 30.2588, -97.7420 30.2482, -97.7280 30.2568, -97.7212 30.2690))\"\n 7) \"description\"\n 8) \"Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\"\n 9) \"cuisine\"\n10) \"thai\"\n11) \"name\"\n12) \"Lotus Thai\"\n13) \"price_level\"\n14) \"1\"\n15) \"rating\"\n16) \"4.1\"\n17) \"avg_delivery_min\"\n18) \"25\"\n"}},"near":{"atx-downtown|1":{"argv":["FT.SEARCH","idx:places","@location:[-97.7431 30.2672 1 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r209\"\n3) 1) \"name\"\n   2) \"Lotus Thai\"\n","keys":["restaurant:r209"]},"atx-downtown|3":{"argv":["FT.SEARCH","idx:places","@location:[-97.7431 30.2672 3 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 3\n2) \"restaurant:r201\"\n3) 1) \"name\"\n   2) \"Bangkok Street Kitchen\"\n4) \"restaurant:r209\"\n5) 1) \"name\"\n   2) \"Lotus Thai\"\n6) \"restaurant:r202\"\n7) 1) \"name\"\n   2) \"Smokehouse 512\"\n","keys":["restaurant:r201","restaurant:r209","restaurant:r202"]},"atx-downtown|5":{"argv":["FT.SEARCH","idx:places","@location:[-97.7431 30.2672 5 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 4\n2) \"restaurant:r201\"\n3) 1) \"name\"\n   2) \"Bangkok Street Kitchen\"\n4) \"restaurant:r209\"\n5) 1) \"name\"\n   2) \"Lotus Thai\"\n6) \"restaurant:r207\"\n7) 1) \"name\"\n   2) \"Olive & Za'atar\"\n8) \"restaurant:r202\"\n9) 1) \"name\"\n   2) \"Smokehouse 512\"\n","keys":["restaurant:r201","restaurant:r209","restaurant:r207","restaurant:r202"]},"atx-soco|1":{"argv":["FT.SEARCH","idx:places","@location:[-97.749 30.246 1 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r202\"\n3) 1) \"name\"\n   2) \"Smokehouse 512\"\n","keys":["restaurant:r202"]},"atx-soco|3":{"argv":["FT.SEARCH","idx:places","@location:[-97.749 30.246 3 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 2\n2) \"restaurant:r209\"\n3) 1) \"name\"\n   2) \"Lotus Thai\"\n4) \"restaurant:r202\"\n5) 1) \"name\"\n   2) \"Smokehouse 512\"\n","keys":["restaurant:r209","restaurant:r202"]},"atx-soco|5":{"argv":["FT.SEARCH","idx:places","@location:[-97.749 30.246 5 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 3\n2) \"restaurant:r201\"\n3) 1) \"name\"\n   2) \"Bangkok Street Kitchen\"\n4) \"restaurant:r209\"\n5) 1) \"name\"\n   2) \"Lotus Thai\"\n6) \"restaurant:r202\"\n7) 1) \"name\"\n   2) \"Smokehouse 512\"\n","keys":["restaurant:r201","restaurant:r209","restaurant:r202"]},"atx-hydepark|1":{"argv":["FT.SEARCH","idx:places","@location:[-97.731 30.306 1 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r207\"\n3) 1) \"name\"\n   2) \"Olive & Za'atar\"\n","keys":["restaurant:r207"]},"atx-hydepark|3":{"argv":["FT.SEARCH","idx:places","@location:[-97.731 30.306 3 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r207\"\n3) 1) \"name\"\n   2) \"Olive & Za'atar\"\n","keys":["restaurant:r207"]},"atx-hydepark|5":{"argv":["FT.SEARCH","idx:places","@location:[-97.731 30.306 5 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 3\n2) \"restaurant:r201\"\n3) 1) \"name\"\n   2) \"Bangkok Street Kitchen\"\n4) \"restaurant:r209\"\n5) 1) \"name\"\n   2) \"Lotus Thai\"\n6) \"restaurant:r207\"\n7) 1) \"name\"\n   2) \"Olive & Za'atar\"\n","keys":["restaurant:r201","restaurant:r209","restaurant:r207"]},"sea-downtown|1":{"argv":["FT.SEARCH","idx:places","@location:[-122.3321 47.6062 1 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r208\"\n3) 1) \"name\"\n   2) \"Spice Route\"\n","keys":["restaurant:r208"]},"sea-downtown|3":{"argv":["FT.SEARCH","idx:places","@location:[-122.3321 47.6062 3 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 2\n2) \"restaurant:r203\"\n3) 1) \"name\"\n   2) \"Green Bowl\"\n4) \"restaurant:r208\"\n5) 1) \"name\"\n   2) \"Spice Route\"\n","keys":["restaurant:r203","restaurant:r208"]},"sea-downtown|5":{"argv":["FT.SEARCH","idx:places","@location:[-122.3321 47.6062 5 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 2\n2) \"restaurant:r203\"\n3) 1) \"name\"\n   2) \"Green Bowl\"\n4) \"restaurant:r208\"\n5) 1) \"name\"\n   2) \"Spice Route\"\n","keys":["restaurant:r203","restaurant:r208"]},"sea-ballard|1":{"argv":["FT.SEARCH","idx:places","@location:[-122.385 47.669 1 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r205\"\n3) 1) \"name\"\n   2) \"Nonna's Trattoria\"\n","keys":["restaurant:r205"]},"sea-ballard|3":{"argv":["FT.SEARCH","idx:places","@location:[-122.385 47.669 3 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r205\"\n3) 1) \"name\"\n   2) \"Nonna's Trattoria\"\n","keys":["restaurant:r205"]},"sea-ballard|5":{"argv":["FT.SEARCH","idx:places","@location:[-122.385 47.669 5 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 1\n2) \"restaurant:r205\"\n3) 1) \"name\"\n   2) \"Nonna's Trattoria\"\n","keys":["restaurant:r205"]},"den-downtown|1":{"argv":["FT.SEARCH","idx:places","@location:[-104.9903 39.7392 1 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 0\n","keys":[]},"den-downtown|3":{"argv":["FT.SEARCH","idx:places","@location:[-104.9903 39.7392 3 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 2\n2) \"restaurant:r204\"\n3) 1) \"name\"\n   2) \"Sakura Sushi Bar\"\n4) \"restaurant:r206\"\n5) 1) \"name\"\n   2) \"Slice Society\"\n","keys":["restaurant:r204","restaurant:r206"]},"den-downtown|5":{"argv":["FT.SEARCH","idx:places","@location:[-104.9903 39.7392 5 km]","RETURN","1","name","SORTBY","name"],"reply":"1) (integer) 2\n2) \"restaurant:r204\"\n3) 1) \"name\"\n   2) \"Sakura Sushi Bar\"\n4) \"restaurant:r206\"\n5) 1) \"name\"\n   2) \"Slice Society\"\n","keys":["restaurant:r204","restaurant:r206"]}},"zone":{"atx-downtown":{"argv":["FT.SEARCH","idx:places","@delivery_zone:[CONTAINS $spot]","PARAMS","2","spot","POINT(-97.7431 30.2672)","RETURN","1","name","SORTBY","name","DIALECT","2"],"reply":"1) (integer) 3\n2) \"restaurant:r201\"\n3) 1) \"name\"\n   2) \"Bangkok Street Kitchen\"\n4) \"restaurant:r209\"\n5) 1) \"name\"\n   2) \"Lotus Thai\"\n6) \"restaurant:r202\"\n7) 1) \"name\"\n   2) \"Smokehouse 512\"\n","keys":["restaurant:r201","restaurant:r209","restaurant:r202"]},"atx-soco":{"argv":["FT.SEARCH","idx:places","@delivery_zone:[CONTAINS $spot]","PARAMS","2","spot","POINT(-97.749 30.246)","RETURN","1","name","SORTBY","name","DIALECT","2"],"reply":"1) (integer) 1\n2) \"restaurant:r202\"\n3) 1) \"name\"\n   2) \"Smokehouse 512\"\n","keys":["restaurant:r202"]},"atx-hydepark":{"argv":["FT.SEARCH","idx:places","@delivery_zone:[CONTAINS $spot]","PARAMS","2","spot","POINT(-97.731 30.306)","RETURN","1","name","SORTBY","name","DIALECT","2"],"reply":"1) (integer) 1\n2) \"restaurant:r207\"\n3) 1) \"name\"\n   2) \"Olive & Za'atar\"\n","keys":["restaurant:r207"]},"sea-downtown":{"argv":["FT.SEARCH","idx:places","@delivery_zone:[CONTAINS $spot]","PARAMS","2","spot","POINT(-122.3321 47.6062)","RETURN","1","name","SORTBY","name","DIALECT","2"],"reply":"1) (integer) 2\n2) \"restaurant:r203\"\n3) 1) \"name\"\n   2) \"Green Bowl\"\n4) \"restaurant:r208\"\n5) 1) \"name\"\n   2) \"Spice Route\"\n","keys":["restaurant:r203","restaurant:r208"]},"sea-ballard":{"argv":["FT.SEARCH","idx:places","@delivery_zone:[CONTAINS $spot]","PARAMS","2","spot","POINT(-122.385 47.669)","RETURN","1","name","SORTBY","name","DIALECT","2"],"reply":"1) (integer) 1\n2) \"restaurant:r205\"\n3) 1) \"name\"\n   2) \"Nonna's Trattoria\"\n","keys":["restaurant:r205"]},"den-downtown":{"argv":["FT.SEARCH","idx:places","@delivery_zone:[CONTAINS $spot]","PARAMS","2","spot","POINT(-104.9903 39.7392)","RETURN","1","name","SORTBY","name","DIALECT","2"],"reply":"1) (integer) 1\n2) \"restaurant:r204\"\n3) 1) \"name\"\n   2) \"Sakura Sushi Bar\"\n","keys":["restaurant:r204"]}}};
  /* ---- end of the recordings ---- */

  /* Step 5's basemaps, one overview and one detail image per city, with the box each covers. They were made once
     from OpenStreetMap tiles, faded so the demo's marks stand out. Map data © OpenStreetMap contributors. */
  var BASEMAPS = {"austin":{"overview":{"file":"map-austin-overview.webp","west":-97.87273,"east":-97.53696,"north":30.38295,"south":30.17095},"detail":{"file":"map-austin-detail.webp","west":-97.80381,"east":-97.68039,"north":30.34347,"south":30.19707}},"seattle":{"overview":{"file":"map-seattle-overview.webp","west":-122.52914,"east":-122.09312,"north":47.74417,"south":47.52833},"detail":{"file":"map-seattle-detail.webp","west":-122.45996,"east":-122.25998,"north":47.72137,"south":47.57045}},"denver":{"overview":{"file":"map-denver-overview.webp","west":-105.09007,"east":-104.84562,"north":39.80827,"south":39.66994},"detail":{"file":"map-denver-detail.webp","west":-105.05333,"east":-104.94638,"north":39.79634,"south":39.70824}}};

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
    { key: "agg", n: "4", label: "Aggregate", lede: "Here we've added 10 orders to the database, under keys that start with `order:`. They have their own index, `idx:orders`. `FT.AGGREGATE` groups the orders that a query matches. It then reduces each group to one number, such as how many orders it has or what they total.", prompt: "Pick how to group the orders and what to work out for each group." },
    { key: "geo", n: "5", label: "Location", lede: "Here we've added two fields to each restaurant. `location` is where the restaurant is, as a longitude and a latitude. `delivery_zone` is the area it delivers to, as a polygon. A new index, `idx:places`, reads `location` as a GEO field and `delivery_zone` as a GEOSHAPE field.", prompt: "Pick a spot. Then find the restaurants near it, or the ones that deliver to it." }
  ];

  function init(root) {
    var st = { tab: "data", dataKey: null, text: TEXT[0].query,
      f: { cities: [], price: null, rating: null, fast: null, sort: ["rating", "DESC"] },
      agg: { group: "restaurant_id", reducer: "COUNT", filter: "*" },
      geo: { ask: "near", spot: PLACES.spots[0].id, radius: 3 } };
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
    var maps = root.getAttribute("data-maps") || "/images/ai/search-and-query/demo-maps/";   // where step 5's basemaps are, from the shortcode

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
      if (st.tab === "geo") {
        var g = st.geo, q = g.ask === "near" ? PLACES.near[g.spot + "|" + g.radius] : PLACES.zone[g.spot];
        return { query: q.argv, reply: q.reply, keys: q.keys };
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
      if (st.tab === "geo") panel.appendChild(createBlock(PLACES.create.argv));   // the index on the new fields
      if (step.prompt) panel.appendChild(el("div", "rcr-lede", md(step.prompt)));   // what to do with the controls that follow
      if (cur) panel.appendChild(controls());
      if (cur) panel.appendChild(queryBlock(cur));   // the query, before the data it finds
      if (st.tab === "geo") panel.appendChild(mapCard(cur));   // where the spot and the restaurants are
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
      } else if (st.tab === "geo") {
        var g = st.geo;
        box.appendChild(choice("Find restaurants", [["near", "Near a spot"], ["zone", "That deliver to a spot"]], function (v) { return v === g.ask; }, function (v) { g.ask = v; }));
        box.appendChild(choice("Spot", PLACES.spots.map(function (s) { return [s.id, esc(s.label)]; }), function (v) { return v === g.spot; }, function (v) { g.spot = v; }));
        if (g.ask === "near") box.appendChild(choice("Within", PLACES.radii.map(function (r) { return [r, r + " km"]; }), function (v) { return v === g.radius; }, function (v) { g.radius = v; }));
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
    var PLACE_TYPES = { name: "TEXT SORTABLE", location: "GEO", delivery_zone: "GEOSHAPE" };   // as idx:places has them
    function columns() {
      var geo = st.tab === "geo", used = geo && (st.geo.ask === "near" ? "location" : "delivery_zone");
      var col = function (f, wide) { return { field: f, label: f, type: (geo ? PLACE_TYPES : TYPES)[f], wide: !!wide, marked: st.tab === "agg" && st.agg.group === f || f === used }; };
      if (st.tab === "data") return [col("name", true), col("cuisine"), col("city"), col("rating")];
      if (st.tab === "text") return [col("name", true), col("description", true), col("rating")];
      if (st.tab === "filter") return [col("name", true), col("city"), col("rating"), col("price_level"), col("avg_delivery_min")];
      if (geo) return [col("name", true), col("location"), col("delivery_zone", true)];
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
      var v = fieldsFor(key), open = st.dataKey === key;
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
    /* A field's value as stored; in step 2, a matched name or description as HIGHLIGHT returned it. A delivery
       zone is long, so the table shows its first point, and the whole value on hover and in the row's commands. */
    function cell(key, field, v, c) {
      if (st.tab === "text" && (field === "name" || field === "description")) {
        var h = c.hits.filter(function (x) { return x[0] === key; })[0];
        if (h) return marked(h[field === "name" ? 1 : 2]);
      }
      if (field === "delivery_zone") return '<span class="rcr-mono" title="' + esc(v[field]) + '">' + esc(v[field].replace(/^(POLYGON\(\([^,]+),.*$/, "$1, …))")) + "</span>";
      return esc(v[field]);
    }
    /* A document's fields; in step 5, with the two that step adds. */
    function fieldsFor(key) {
      var v = fieldsOf(STORED[key].set), more = st.tab === "geo" && PLACES.stored[key] ? fieldsOf(PLACES.stored[key].set) : {};
      for (var f in more) v[f] = more[f];
      return v;
    }
    function spotOf(id) { return PLACES.spots.filter(function (s) { return s.id === id; })[0]; }

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
      if (st.tab === "geo") {
        var g = st.geo, s = spotOf(g.spot), named = function (ks) { return ks.map(function (k) { return rest(k.slice(11))[1]; }); }, names = named(c.keys);
        if (g.ask === "near") {
          return (names.length ? list(names) + (names.length === 1 ? " is" : " are") : "No restaurant is") + " within " + g.radius + " km of " + s.label + ". " +
            "A GEO query takes a longitude, a latitude, a radius, and a unit: `m`, `km`, `mi`, or `ft`." + (names.length ? "" : " Try a bigger radius.");
        }
        var close = named(PLACES.near[g.spot + "|3"].keys.filter(function (k) { return c.keys.indexOf(k) < 0; }));
        return (names.length ? list(names) + (names.length === 1 ? " delivers" : " deliver") : "No restaurant delivers") + " to " + s.label + ". " +
          "`CONTAINS` finds the zones that contain the spot, which `PARAMS` passes as a point in well-known text (WKT)." +
          (close.length ? " " + list(close) + (close.length === 1 ? " is within 3 km, but its zone doesn't" : " are within 3 km, but their zones don't") + " reach this spot." : "");
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

    /* Step 5: the spot's city, drawn here from the stored location and delivery_zone values: the spot, each restaurant,
       and either the radius or the delivery zones. Which restaurants match comes from the reply; the map only shows it. */
    function mapCard(c) {
      /* Drawn at about the size it shows, so its text stays readable on a phone. room: space for labels on the right. */
      var W = Math.round(Math.max(300, Math.min(440, (root.clientWidth || 440) - 32))), H = Math.round(W * 0.68), pad = 24, room = Math.round(W * 0.2);
      var g = st.geo, s = spotOf(g.spot), near = g.ask === "near", hits = {};
      c.keys.forEach(function (k) { hits[k] = true; });
      var kx = 111.32 * Math.cos(s.lat * Math.PI / 180), ky = 110.57;
      var km = function (lon, lat) { return [(lon - s.lon) * kx, (s.lat - lat) * ky]; };   // km east and south of the spot
      var places = BASE.filter(function (k) { return fieldsOf(STORED[k].set).city === s.city; }).map(function (k) {
        var v = fieldsOf(PLACES.stored[k].set), ll = v.location.split(",").map(Number);
        return { key: k, name: rest(k.slice(11))[1], at: km(ll[0], ll[1]), zone: shape(v.delivery_zone).map(function (p) { return km(p[0], p[1]); }), hit: !!hits[k] };
      });
      /* One view per spot, fitting the widest radius and every zone, so changing the radius or the question
         changes only the circle or the zones, and the map stays put. */
      var pts = [[0, 0]], far = Math.max.apply(null, PLACES.radii);
      places.forEach(function (p) { pts.push(p.at); pts = pts.concat(p.zone); });
      pts.push([-far, -far], [far, far]);
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var w = W - 2 * pad - room, h = H - 2 * pad, scale = Math.min(w / Math.max(x1 - x0, 0.5), h / Math.max(y1 - y0, 0.5));
      var ox = pad + (w - (x1 - x0) * scale) / 2 - x0 * scale, oy = pad + (h - (y1 - y0) * scale) / 2 - y0 * scale;
      var X = function (p) { return +(ox + p[0] * scale).toFixed(1); }, Y = function (p) { return +(oy + p[1] * scale).toFixed(1); };
      var city = s.city.charAt(0).toUpperCase() + s.city.slice(1), matched = places.filter(function (p) { return p.hit; }).map(function (p) { return p.name; });
      var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc("Map of " + city + ". The spot: " + s.label + ". " +
        (matched.length ? "Matches: " + list(matched) + "." : "No matches.")) + '">';
      /* The city's basemap: the overview, with the sharper detail image over the part it covers. */
      ["overview", "detail"].forEach(function (k) {
        var b = BASEMAPS[s.city][k], nw = km(b.west, b.north), se = km(b.east, b.south);
        svg += '<image href="' + esc(maps + b.file) + '" x="' + X(nw) + '" y="' + Y(nw) + '" width="' + (X(se) - X(nw)).toFixed(1) + '" height="' + (Y(se) - Y(nw)).toFixed(1) + '" preserveAspectRatio="none"/>';
      });
      if (near) svg += '<circle class="rsq-radius" cx="' + X([0, 0]) + '" cy="' + Y([0, 0]) + '" r="' + (g.radius * scale).toFixed(1) + '"/>';
      else places.forEach(function (p) { svg += '<polygon class="rsq-zone' + (p.hit ? " is-hit" : "") + '" points="' + p.zone.map(function (q) { return X(q) + "," + Y(q); }).join(" ") + '"/>'; });
      /* Labels go right of their point, or left when there's no room, moved up or down when they would cover a point
         or a label already placed. */
      var boxes = [[0, 0]].concat(places.map(function (p) { return p.at; })).map(function (q) { return { x: X(q) - 7, y: Y(q) - 7, w: 14, h: 14 }; }), labels = "";
      var label = function (x, y, text, cls) {
        var wd = text.length * 6.4, left = x + wd > W - 4, bx = left ? x - 18 - wd : x, tries = [0, 14, -14, 28, -28, 42], i, b;
        for (i = 0; i < tries.length; i++) {
          b = { x: bx, y: y + tries[i] - 10, w: wd, h: 13 };
          if (!boxes.some(function (o) { return b.x < o.x + o.w && o.x < b.x + b.w && b.y < o.y + o.h && o.y < b.y + b.h; })) break;
        }
        boxes.push(b);
        labels += '<text class="' + cls + '" x="' + bx.toFixed(1) + '" y="' + (b.y + 10) + '">' + esc(text) + "</text>";
      };
      label(X([0, 0]) + 10, Y([0, 0]) + 4, s.label, "rsq-mlabel is-spot");
      places.forEach(function (p) {
        svg += '<circle class="rsq-pin' + (p.hit ? " is-hit" : "") + '" cx="' + X(p.at) + '" cy="' + Y(p.at) + '" r="5.5"/>';
        label(X(p.at) + 9, Y(p.at) + 4, p.name, "rsq-mlabel" + (p.hit ? " is-hit" : ""));
      });
      svg += '<circle class="rsq-spot" cx="' + X([0, 0]) + '" cy="' + Y([0, 0]) + '" r="6"/>' + labels;
      var bar = [0.5, 1, 2, 5, 10].filter(function (l) { return l * scale >= 40; })[0] || 10, bx = pad, by = H - 10;
      svg += '<path class="rsq-scale" d="M' + bx + " " + (by - 4) + "v4h" + (bar * scale).toFixed(1) + "v-4" + '"/><text class="rsq-mlabel" x="' + (bx + bar * scale + 6).toFixed(1) + '" y="' + by + '">' + bar + " km</text></svg>";
      var card = el("div", "rcr-card rsq-map");
      card.appendChild(el("div", "rcr-cardhead", "<span>Map: " + esc(city) + '</span><span class="rcr-count">' + matched.length + " of " + places.length + " here match</span>"));
      card.appendChild(el("div", "rsq-axis", md("Drawn here from the stored `location` and `delivery_zone` values. Redis returns only the matches. Restaurants in other cities are hundreds of kilometers away, so they aren't drawn. The restaurants and their delivery zones are made up, but the map and the spots are real.")));
      card.appendChild(el("div", "rsq-mapbox", svg));
      card.appendChild(el("div", "rsq-legend", '<span><i class="rsq-key is-spot"></i>The spot</span><span><i class="rsq-key is-hit"></i>A match</span><span><i class="rsq-key"></i>Not a match</span>' +
        (near ? '<span><i class="rsq-key is-radius"></i>' + g.radius + " km around the spot</span>" : '<span><i class="rsq-key is-zone"></i>A delivery zone</span>') +
        /* OpenStreetMap asks for both: credit, and that the data's license is made clear. */
        '<span class="rsq-credit">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, ' +
        'available under the <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noopener">Open Database License</a></span>'));
      return card;
    }
    /* A WKT polygon's points, as [longitude, latitude] pairs. */
    function shape(wkt) {
      return wkt.replace(/^POLYGON\(\(|\)\)$/g, "").split(",").map(function (p) { return p.trim().split(/\s+/).map(Number); });
    }

    /* A transcript line: the prompt, the command, and its reply. */
    function line(argv, reply) {
      return '<span class="rsq-prompt">&gt; </span>' + cmdHtml(argv) + "\n" + esc(reply);
    }
    /* A key as written and as read back, exactly as redis-cli prints it. */
    function docBox(key) {
      var d = st.tab === "geo" && PLACES.stored[key] ? PLACES.stored[key] : STORED[key], box = el("div", "rsq-doc");   // step 5: the HSET that added the location fields
      box.appendChild(el("pre", "rcr-code rsq-pre rsq-cmdline", (line(d.set, d.setReply) + line(["HGETALL", key], d.get)).replace(/\n$/, "")));
      return box;
    }

    /* An index's FT.CREATE, one part per line, each with what it means in plain words. */
    function createBlock(argv) {
      var lines = [], i, OPTS = ["SORTABLE"];
      var AS = { TEXT: "as words", TAG: "as one whole value", NUMERIC: "as a number", GEO: "as a point: a longitude and a latitude", GEOSHAPE: "as a shape, here a polygon" };
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
        for (var j = l.from; j <= l.to; j++) toks.push(esc(token(argv, j)));
        box.appendChild(el("div", "rsi-cline", '<span class="rsi-ccode rsi-d' + l.depth + '">' + toks.join(" ") + '</span><span class="rsi-cnote rsi-d' + l.depth + '">' + l.note + "</span>"));
      });
      var foot = el("div", "rcr-faint rsi-createcap", "One part per line here. In redis-cli, it's a single line. ");
      foot.appendChild(copyButton("Copy as one line", argv));
      box.appendChild(foot);
      return box;
    }
    /* A button that copies a command as one line, to paste into Redis Insight or redis-cli. */
    function copyButton(label, argv) {
      var b = el("button", "rsi-copy", label);
      b.type = "button";
      b.addEventListener("click", function () {
        var done = function (ok) { b.textContent = ok ? "Copied" : "Couldn't copy"; setTimeout(function () { b.textContent = label; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(cmdline(argv)).then(function () { done(true); }, function () { done(false); }); else done(false);
      });
      return b;
    }

    /* The step's query as you'd type it, then what it asks for. */
    function queryBlock(c) {
      var a = c.query, at = function (w) { return a.indexOf(w); }, box = el("div", "rsi-create rsi-query"), s;
      var head = el("div", "rsi-createhead rsq-qhead", "<span>The query</span>");
      head.appendChild(copyButton("Copy", a));
      box.appendChild(head);
      box.appendChild(el("div", "rsi-qline", '<span class="rsq-prompt">&gt; </span>' + cmdHtml(a)));
      if (a[0] === "FT.AGGREGATE") {
        var g = a[at("GROUPBY") + 2].slice(1), r = a[at("REDUCE") + 1], as = a[at("AS") + 1];
        s = "Group the " + (a[2] === "*" ? "" : "delivered ") + "orders in `" + a[1] + "` by `" + g + "`. " +
          { COUNT: "Count the orders in each group", SUM: "Add up each group's `total`", AVG: "Average each group's `total`" }[r] + ", as `" + as + "`. Sort the groups by `" + as + "`, highest first, and groups that tie by `" + g + "`.";
      } else if (st.tab === "geo") {
        var sp = spotOf(st.geo.spot);
        s = "Search `" + a[1] + "` for restaurants " + (st.geo.ask === "near" ? "whose `location` is within " + st.geo.radius + " km of " :
          "whose `delivery_zone` contains the point `spot`, ") + sp.label + " (longitude " + sp.lon + ", latitude " + sp.lat + "). Return `name`, sorted by `name`.";
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
      box.appendChild(el("pre", "rcr-code rsq-pre rsq-cmdline", esc(c.reply.replace(/\n$/, ""))));
      box.appendChild(el("div", "rcr-faint rsi-createcap", esc("Exactly what redis-cli prints." +
        (st.tab === "text" ? " The <b> tags around matched words come from HIGHLIGHT." : ""))));
      return box;
    }

    /* The parts of a command the controls change, marked. */
    function marks(argv) {
      var m = {}, at = function (w) { return argv.indexOf(w); };
      if (argv[0] === "FT.SEARCH") m[2] = true;
      if (argv[0] === "FT.SEARCH" && at("PARAMS") > 0) m[at("PARAMS") + 3] = true;   // step 5's spot
      if (argv[0] === "FT.AGGREGATE") { m[2] = true; m[at("GROUPBY") + 2] = true; m[at("REDUCE") + 1] = true; }
      return m;
    }
    function cmdHtml(argv) {
      var m = marks(argv);
      return argv.map(function (a, i) { var t = esc(token(argv, i)); return m[i] ? '<mark class="rsi-mark">' + t + "</mark>" : t; }).join(" ");
    }

    render();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".rsq[data-search]"), init); }
  window.SearchDemo = { fmt: fmt, cmdline: cmdline, search: search, data: { RESTAURANTS: RESTAURANTS, ORDERS: ORDERS, STORED: STORED, TEXT: TEXT, AGGS: AGGS, CREATE: CREATE, PLACES: PLACES } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
