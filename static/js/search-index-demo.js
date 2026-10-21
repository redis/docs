/* =========================================================================
   Redis Search scripted demo: indexing
   Dependency-free. Everything runs in the browser against recorded data;
   no Redis server is called.
   Step 1: the restaurants as stored, before any index.
   Step 2: a field's type decides which queries can find it.
   Step 3: PREFIX and FILTER decide which keys an index covers.
   Step 4: what missing, empty, and invalid values do to an index.
   Step 5: the same index on hashes and on JSON documents.
   Each indexing step shows its FT.CREATE part by part, then the query,
   then the documents as stored: a table whose headers show how the index
   treats each field, with the matches highlighted. Selecting a row shows
   the command that wrote it and what Redis holds.
   Observed, not modelled: every reply is what Redis 8.10 returned, for
   every combination the controls allow. Each case started from an empty
   database: create the index, add the documents in order, then the query. Creating the index first numbers
   the documents in the order they were added, so the replies come out the
   same on any server that follows the same steps.
   Restaurants and orders come from the food delivery sample data in
   context-retriever-demo.js, with the first 10 of the 20 orders. Taco
   Loco, Pho Corner, and Morning Deli appear only here. Keep the IDs and
   names in sync.
   Base styles come from context-retriever-demo.css and search-demo.css;
   search-index-demo.css adds the pieces this demo needs.
   ========================================================================= */
(function () {
  "use strict";
  if (window.SearchIndexDemo) return;   // loaded twice: the first copy already booted every widget

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
  /* The three restaurants with gaps. */
  var EXTRA = {"taco": ["HSET", "restaurant:r210", "name", "Taco Loco", "cuisine", "mexican", "city", "denver", "rating", "new", "price_level", "1", "avg_delivery_min", "20", "description", "Street tacos, burritos, and fresh salsa. Just opened."], "pho": ["HSET", "restaurant:r211", "name", "Pho Corner", "cuisine", "vietnamese", "city", "seattle", "price_level", "1", "avg_delivery_min", "25", "description", "Pho, banh mi, and fresh spring rolls."], "deli": ["HSET", "restaurant:r212", "name", "Morning Deli", "cuisine", "", "city", "denver", "rating", "4.0", "price_level", "1", "avg_delivery_min", "15", "description", "Sandwiches, bagels, and coffee."]};
  /* Each key: the command that wrote it, its reply, and the key as HGETALL (or JSON.GET) returns it. */
  var STORED = {"restaurant:r201": {"set": ["HSET", "restaurant:r201", "name", "Bangkok Street Kitchen", "cuisine", "thai", "city", "austin", "rating", "4.7", "price_level", "2", "avg_delivery_min", "30", "description", "Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"thai\"\n 3) \"rating\"\n 4) \"4.7\"\n 5) \"description\"\n 6) \"Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request.\"\n 7) \"name\"\n 8) \"Bangkok Street Kitchen\"\n 9) \"city\"\n10) \"austin\"\n11) \"avg_delivery_min\"\n12) \"30\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r202": {"set": ["HSET", "restaurant:r202", "name", "Smokehouse 512", "cuisine", "bbq", "city", "austin", "rating", "4.4", "price_level", "3", "avg_delivery_min", "40", "description", "Texas barbecue: slow-smoked brisket, ribs, and mac and cheese."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Smokehouse 512\"\n 3) \"cuisine\"\n 4) \"bbq\"\n 5) \"city\"\n 6) \"austin\"\n 7) \"rating\"\n 8) \"4.4\"\n 9) \"price_level\"\n10) \"3\"\n11) \"avg_delivery_min\"\n12) \"40\"\n13) \"description\"\n14) \"Texas barbecue: slow-smoked brisket, ribs, and mac and cheese.\"\n"}, "restaurant:r203": {"set": ["HSET", "restaurant:r203", "name", "Green Bowl", "cuisine", "vegan", "city", "seattle", "rating", "4.8", "price_level", "2", "avg_delivery_min", "25", "description", "Plant-based bowls, salads, and smoothies. Everything on the menu is vegan."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"vegan\"\n 3) \"rating\"\n 4) \"4.8\"\n 5) \"description\"\n 6) \"Plant-based bowls, salads, and smoothies. Everything on the menu is vegan.\"\n 7) \"name\"\n 8) \"Green Bowl\"\n 9) \"city\"\n10) \"seattle\"\n11) \"avg_delivery_min\"\n12) \"25\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r204": {"set": ["HSET", "restaurant:r204", "name", "Sakura Sushi Bar", "cuisine", "sushi", "city", "denver", "rating", "4.6", "price_level", "3", "avg_delivery_min", "35", "description", "Fresh sushi and sashimi, nigiri sets, and miso soup."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Sakura Sushi Bar\"\n 3) \"cuisine\"\n 4) \"sushi\"\n 5) \"city\"\n 6) \"denver\"\n 7) \"rating\"\n 8) \"4.6\"\n 9) \"price_level\"\n10) \"3\"\n11) \"avg_delivery_min\"\n12) \"35\"\n13) \"description\"\n14) \"Fresh sushi and sashimi, nigiri sets, and miso soup.\"\n"}, "restaurant:r205": {"set": ["HSET", "restaurant:r205", "name", "Nonna's Trattoria", "cuisine", "italian", "city", "seattle", "rating", "4.5", "price_level", "3", "avg_delivery_min", "45", "description", "Homemade pasta, risotto, and tiramisu from family recipes."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Nonna's Trattoria\"\n 3) \"cuisine\"\n 4) \"italian\"\n 5) \"city\"\n 6) \"seattle\"\n 7) \"rating\"\n 8) \"4.5\"\n 9) \"price_level\"\n10) \"3\"\n11) \"avg_delivery_min\"\n12) \"45\"\n13) \"description\"\n14) \"Homemade pasta, risotto, and tiramisu from family recipes.\"\n"}, "restaurant:r206": {"set": ["HSET", "restaurant:r206", "name", "Slice Society", "cuisine", "pizza", "city", "denver", "rating", "4.2", "price_level", "1", "avg_delivery_min", "30", "description", "New York-style pizza by the slice or the whole pie, made for sharing."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"pizza\"\n 3) \"rating\"\n 4) \"4.2\"\n 5) \"description\"\n 6) \"New York-style pizza by the slice or the whole pie, made for sharing.\"\n 7) \"name\"\n 8) \"Slice Society\"\n 9) \"city\"\n10) \"denver\"\n11) \"avg_delivery_min\"\n12) \"30\"\n13) \"price_level\"\n14) \"1\"\n"}, "restaurant:r207": {"set": ["HSET", "restaurant:r207", "name", "Olive & Za'atar", "cuisine", "mediterranean", "city", "austin", "rating", "4.6", "price_level", "2", "avg_delivery_min", "30", "description", "Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"mediterranean\"\n 3) \"rating\"\n 4) \"4.6\"\n 5) \"description\"\n 6) \"Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean.\"\n 7) \"name\"\n 8) \"Olive & Za'atar\"\n 9) \"city\"\n10) \"austin\"\n11) \"avg_delivery_min\"\n12) \"30\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r208": {"set": ["HSET", "restaurant:r208", "name", "Spice Route", "cuisine", "indian", "city", "seattle", "rating", "4.3", "price_level", "2", "avg_delivery_min", "40", "description", "Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"indian\"\n 3) \"rating\"\n 4) \"4.3\"\n 5) \"description\"\n 6) \"Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes.\"\n 7) \"name\"\n 8) \"Spice Route\"\n 9) \"city\"\n10) \"seattle\"\n11) \"avg_delivery_min\"\n12) \"40\"\n13) \"price_level\"\n14) \"2\"\n"}, "restaurant:r209": {"set": ["HSET", "restaurant:r209", "name", "Lotus Thai", "cuisine", "thai", "city", "austin", "rating", "4.1", "price_level", "1", "avg_delivery_min", "25", "description", "Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian."], "setReply": "(integer) 7\n", "get": " 1) \"cuisine\"\n 2) \"thai\"\n 3) \"rating\"\n 4) \"4.1\"\n 5) \"description\"\n 6) \"Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\"\n 7) \"name\"\n 8) \"Lotus Thai\"\n 9) \"city\"\n10) \"austin\"\n11) \"avg_delivery_min\"\n12) \"25\"\n13) \"price_level\"\n14) \"1\"\n"}, "order:o3001": {"set": ["HSET", "order:o3001", "customer_id", "u101", "restaurant_id", "r201", "status", "delivered", "total", "34.5", "placed_ts", "1788375600", "items", "Pad thai with tofu, spring rolls"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u101\"\n 3) \"restaurant_id\"\n 4) \"r201\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"34.5\"\n 9) \"placed_ts\"\n10) \"1788375600\"\n11) \"items\"\n12) \"Pad thai with tofu, spring rolls\"\n"}, "order:o3002": {"set": ["HSET", "order:o3002", "customer_id", "u101", "restaurant_id", "r207", "status", "delivered", "total", "28", "placed_ts", "1789045200", "items", "Falafel wrap, hummus"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u101\"\n 3) \"restaurant_id\"\n 4) \"r207\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"28\"\n 9) \"placed_ts\"\n10) \"1789045200\"\n11) \"items\"\n12) \"Falafel wrap, hummus\"\n"}, "order:o3003": {"set": ["HSET", "order:o3003", "customer_id", "u101", "restaurant_id", "r209", "status", "on_the_way", "total", "22.75", "placed_ts", "1790272800", "items", "Green curry without fish sauce, jasmine rice"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u101\"\n 3) \"restaurant_id\"\n 4) \"r209\"\n 5) \"status\"\n 6) \"on_the_way\"\n 7) \"total\"\n 8) \"22.75\"\n 9) \"placed_ts\"\n10) \"1790272800\"\n11) \"items\"\n12) \"Green curry without fish sauce, jasmine rice\"\n"}, "order:o3004": {"set": ["HSET", "order:o3004", "customer_id", "u102", "restaurant_id", "r202", "status", "delivered", "total", "61.2", "placed_ts", "1788638400", "items", "Brisket platter, mac and cheese"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u102\"\n 3) \"restaurant_id\"\n 4) \"r202\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"61.2\"\n 9) \"placed_ts\"\n10) \"1788638400\"\n11) \"items\"\n12) \"Brisket platter, mac and cheese\"\n"}, "order:o3005": {"set": ["HSET", "order:o3005", "customer_id", "u102", "restaurant_id", "r201", "status", "cancelled", "total", "19.9", "placed_ts", "1787918400", "items", "Pad see ew"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u102\"\n 3) \"restaurant_id\"\n 4) \"r201\"\n 5) \"status\"\n 6) \"cancelled\"\n 7) \"total\"\n 8) \"19.9\"\n 9) \"placed_ts\"\n10) \"1787918400\"\n11) \"items\"\n12) \"Pad see ew\"\n"}, "order:o3006": {"set": ["HSET", "order:o3006", "customer_id", "u103", "restaurant_id", "r203", "status", "delivered", "total", "24", "placed_ts", "1789214400", "items", "Buddha bowl, oat latte"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u103\"\n 3) \"restaurant_id\"\n 4) \"r203\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"24\"\n 9) \"placed_ts\"\n10) \"1789214400\"\n11) \"items\"\n12) \"Buddha bowl, oat latte\"\n"}, "order:o3007": {"set": ["HSET", "order:o3007", "customer_id", "u103", "restaurant_id", "r208", "status", "delivered", "total", "38.4", "placed_ts", "1789758000", "items", "Chana masala, garlic naan"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u103\"\n 3) \"restaurant_id\"\n 4) \"r208\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"38.4\"\n 9) \"placed_ts\"\n10) \"1789758000\"\n11) \"items\"\n12) \"Chana masala, garlic naan\"\n"}, "order:o3008": {"set": ["HSET", "order:o3008", "customer_id", "u104", "restaurant_id", "r206", "status", "delivered", "total", "42", "placed_ts", "1788724800", "items", "Two large pizzas"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u104\"\n 3) \"restaurant_id\"\n 4) \"r206\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"42\"\n 9) \"placed_ts\"\n10) \"1788724800\"\n11) \"items\"\n12) \"Two large pizzas\"\n"}, "order:o3009": {"set": ["HSET", "order:o3009", "customer_id", "u104", "restaurant_id", "r204", "status", "delivered", "total", "67.8", "placed_ts", "1789930800", "items", "Omakase set for two"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u104\"\n 3) \"restaurant_id\"\n 4) \"r204\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"67.8\"\n 9) \"placed_ts\"\n10) \"1789930800\"\n11) \"items\"\n12) \"Omakase set for two\"\n"}, "order:o3010": {"set": ["HSET", "order:o3010", "customer_id", "u105", "restaurant_id", "r205", "status", "delivered", "total", "54.3", "placed_ts", "1788897600", "items", "Mushroom risotto, tiramisu"], "setReply": "(integer) 6\n", "get": " 1) \"customer_id\"\n 2) \"u105\"\n 3) \"restaurant_id\"\n 4) \"r205\"\n 5) \"status\"\n 6) \"delivered\"\n 7) \"total\"\n 8) \"54.3\"\n 9) \"placed_ts\"\n10) \"1788897600\"\n11) \"items\"\n12) \"Mushroom risotto, tiramisu\"\n"}, "restaurant:r210": {"set": ["HSET", "restaurant:r210", "name", "Taco Loco", "cuisine", "mexican", "city", "denver", "rating", "new", "price_level", "1", "avg_delivery_min", "20", "description", "Street tacos, burritos, and fresh salsa. Just opened."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Taco Loco\"\n 3) \"cuisine\"\n 4) \"mexican\"\n 5) \"city\"\n 6) \"denver\"\n 7) \"rating\"\n 8) \"new\"\n 9) \"price_level\"\n10) \"1\"\n11) \"avg_delivery_min\"\n12) \"20\"\n13) \"description\"\n14) \"Street tacos, burritos, and fresh salsa. Just opened.\"\n"}, "restaurant:r211": {"set": ["HSET", "restaurant:r211", "name", "Pho Corner", "cuisine", "vietnamese", "city", "seattle", "price_level", "1", "avg_delivery_min", "25", "description", "Pho, banh mi, and fresh spring rolls."], "setReply": "(integer) 6\n", "get": " 1) \"name\"\n 2) \"Pho Corner\"\n 3) \"cuisine\"\n 4) \"vietnamese\"\n 5) \"city\"\n 6) \"seattle\"\n 7) \"price_level\"\n 8) \"1\"\n 9) \"avg_delivery_min\"\n10) \"25\"\n11) \"description\"\n12) \"Pho, banh mi, and fresh spring rolls.\"\n"}, "restaurant:r212": {"set": ["HSET", "restaurant:r212", "name", "Morning Deli", "cuisine", "", "city", "denver", "rating", "4.0", "price_level", "1", "avg_delivery_min", "15", "description", "Sandwiches, bagels, and coffee."], "setReply": "(integer) 7\n", "get": " 1) \"name\"\n 2) \"Morning Deli\"\n 3) \"cuisine\"\n 4) \"\"\n 5) \"city\"\n 6) \"denver\"\n 7) \"rating\"\n 8) \"4.0\"\n 9) \"price_level\"\n10) \"1\"\n11) \"avg_delivery_min\"\n12) \"15\"\n13) \"description\"\n14) \"Sandwiches, bagels, and coffee.\"\n"}};
  var JSONGET = {"restaurant:r201": {"set": ["JSON.SET", "restaurant:r201", "$", "{\"name\":\"Bangkok Street Kitchen\",\"cuisine\":\"thai\",\"city\":\"austin\",\"rating\":4.7,\"price_level\":2,\"avg_delivery_min\":30,\"description\":\"Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Bangkok Street Kitchen\\\",\\\"cuisine\\\":\\\"thai\\\",\\\"city\\\":\\\"austin\\\",\\\"rating\\\":4.7,\\\"price_level\\\":2,\\\"avg_delivery_min\\\":30,\\\"description\\\":\\\"Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request.\\\"}\"\n"}, "restaurant:r202": {"set": ["JSON.SET", "restaurant:r202", "$", "{\"name\":\"Smokehouse 512\",\"cuisine\":\"bbq\",\"city\":\"austin\",\"rating\":4.4,\"price_level\":3,\"avg_delivery_min\":40,\"description\":\"Texas barbecue: slow-smoked brisket, ribs, and mac and cheese.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Smokehouse 512\\\",\\\"cuisine\\\":\\\"bbq\\\",\\\"city\\\":\\\"austin\\\",\\\"rating\\\":4.4,\\\"price_level\\\":3,\\\"avg_delivery_min\\\":40,\\\"description\\\":\\\"Texas barbecue: slow-smoked brisket, ribs, and mac and cheese.\\\"}\"\n"}, "restaurant:r203": {"set": ["JSON.SET", "restaurant:r203", "$", "{\"name\":\"Green Bowl\",\"cuisine\":\"vegan\",\"city\":\"seattle\",\"rating\":4.8,\"price_level\":2,\"avg_delivery_min\":25,\"description\":\"Plant-based bowls, salads, and smoothies. Everything on the menu is vegan.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Green Bowl\\\",\\\"cuisine\\\":\\\"vegan\\\",\\\"city\\\":\\\"seattle\\\",\\\"rating\\\":4.8,\\\"price_level\\\":2,\\\"avg_delivery_min\\\":25,\\\"description\\\":\\\"Plant-based bowls, salads, and smoothies. Everything on the menu is vegan.\\\"}\"\n"}, "restaurant:r204": {"set": ["JSON.SET", "restaurant:r204", "$", "{\"name\":\"Sakura Sushi Bar\",\"cuisine\":\"sushi\",\"city\":\"denver\",\"rating\":4.6,\"price_level\":3,\"avg_delivery_min\":35,\"description\":\"Fresh sushi and sashimi, nigiri sets, and miso soup.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Sakura Sushi Bar\\\",\\\"cuisine\\\":\\\"sushi\\\",\\\"city\\\":\\\"denver\\\",\\\"rating\\\":4.6,\\\"price_level\\\":3,\\\"avg_delivery_min\\\":35,\\\"description\\\":\\\"Fresh sushi and sashimi, nigiri sets, and miso soup.\\\"}\"\n"}, "restaurant:r205": {"set": ["JSON.SET", "restaurant:r205", "$", "{\"name\":\"Nonna's Trattoria\",\"cuisine\":\"italian\",\"city\":\"seattle\",\"rating\":4.5,\"price_level\":3,\"avg_delivery_min\":45,\"description\":\"Homemade pasta, risotto, and tiramisu from family recipes.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Nonna's Trattoria\\\",\\\"cuisine\\\":\\\"italian\\\",\\\"city\\\":\\\"seattle\\\",\\\"rating\\\":4.5,\\\"price_level\\\":3,\\\"avg_delivery_min\\\":45,\\\"description\\\":\\\"Homemade pasta, risotto, and tiramisu from family recipes.\\\"}\"\n"}, "restaurant:r206": {"set": ["JSON.SET", "restaurant:r206", "$", "{\"name\":\"Slice Society\",\"cuisine\":\"pizza\",\"city\":\"denver\",\"rating\":4.2,\"price_level\":1,\"avg_delivery_min\":30,\"description\":\"New York-style pizza by the slice or the whole pie, made for sharing.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Slice Society\\\",\\\"cuisine\\\":\\\"pizza\\\",\\\"city\\\":\\\"denver\\\",\\\"rating\\\":4.2,\\\"price_level\\\":1,\\\"avg_delivery_min\\\":30,\\\"description\\\":\\\"New York-style pizza by the slice or the whole pie, made for sharing.\\\"}\"\n"}, "restaurant:r207": {"set": ["JSON.SET", "restaurant:r207", "$", "{\"name\":\"Olive & Za'atar\",\"cuisine\":\"mediterranean\",\"city\":\"austin\",\"rating\":4.6,\"price_level\":2,\"avg_delivery_min\":30,\"description\":\"Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Olive & Za'atar\\\",\\\"cuisine\\\":\\\"mediterranean\\\",\\\"city\\\":\\\"austin\\\",\\\"rating\\\":4.6,\\\"price_level\\\":2,\\\"avg_delivery_min\\\":30,\\\"description\\\":\\\"Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean.\\\"}\"\n"}, "restaurant:r208": {"set": ["JSON.SET", "restaurant:r208", "$", "{\"name\":\"Spice Route\",\"cuisine\":\"indian\",\"city\":\"seattle\",\"rating\":4.3,\"price_level\":2,\"avg_delivery_min\":40,\"description\":\"Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Spice Route\\\",\\\"cuisine\\\":\\\"indian\\\",\\\"city\\\":\\\"seattle\\\",\\\"rating\\\":4.3,\\\"price_level\\\":2,\\\"avg_delivery_min\\\":40,\\\"description\\\":\\\"Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes.\\\"}\"\n"}, "restaurant:r209": {"set": ["JSON.SET", "restaurant:r209", "$", "{\"name\":\"Lotus Thai\",\"cuisine\":\"thai\",\"city\":\"austin\",\"rating\":4.1,\"price_level\":1,\"avg_delivery_min\":25,\"description\":\"Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\"}"], "setReply": "OK\n", "get": "\"{\\\"name\\\":\\\"Lotus Thai\\\",\\\"cuisine\\\":\\\"thai\\\",\\\"city\\\":\\\"austin\\\",\\\"rating\\\":4.1,\\\"price_level\\\":1,\\\"avg_delivery_min\\\":25,\\\"description\\\":\\\"Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\\\"}\"\n"}};
  /* Every case each step can show: the settings, the commands with their replies, and what the demo reads from the last reply. */
  var TYPES = [
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 1, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 1, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r201\"\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 1, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 1, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 1, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT"], "reply": "1) (integer) 5\n2) \"restaurant:r201\"\n3) \"restaurant:r203\"\n4) \"restaurant:r204\"\n5) \"restaurant:r205\"\n6) \"restaurant:r207\"\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 1, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 2, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 2, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r201\"\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 2, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TAG field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TAG field at offset 0 near name"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 2, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TAG field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TAG field at offset 0 near name"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 2, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 5\n2) \"restaurant:r201\"\n3) \"restaurant:r203\"\n4) \"restaurant:r204\"\n5) \"restaurant:r205\"\n6) \"restaurant:r207\"\n"},
    {"name": "TEXT", "rating": "NUMERIC", "dialect": 2, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TAG field at offset 0 near rating\n", "error": "SEARCH_SYNTAX Expected a TAG field at offset 0 near rating"},
    {"name": "TEXT", "rating": "TAG", "dialect": 1, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 1, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r201\"\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 1, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 1, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 1, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 1, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r205\"\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 2, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 2, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r201\"\n"},
    {"name": "TEXT", "rating": "TAG", "dialect": 2, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TAG field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TAG field at offset 0 near name"},
    {"name": "TEXT", "rating": "TAG", "dialect": 2, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TAG field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TAG field at offset 0 near name"},
    {"name": "TEXT", "rating": "TAG", "dialect": 2, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a NUMERIC field at offset 0 near rating\n", "error": "SEARCH_SYNTAX Expected a NUMERIC field at offset 0 near rating"},
    {"name": "TEXT", "rating": "TAG", "dialect": 2, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r205\"\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 1, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 1, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 1, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 1, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 1, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT"], "reply": "1) (integer) 5\n2) \"restaurant:r201\"\n3) \"restaurant:r203\"\n4) \"restaurant:r204\"\n5) \"restaurant:r205\"\n6) \"restaurant:r207\"\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 1, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 2, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TEXT field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TEXT field at offset 0 near name"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 2, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TEXT field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TEXT field at offset 0 near name"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 2, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 2, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 2, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 5\n2) \"restaurant:r201\"\n3) \"restaurant:r203\"\n4) \"restaurant:r204\"\n5) \"restaurant:r205\"\n6) \"restaurant:r207\"\n"},
    {"name": "TAG", "rating": "NUMERIC", "dialect": 2, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TAG field at offset 0 near rating\n", "error": "SEARCH_SYNTAX Expected a TAG field at offset 0 near rating"},
    {"name": "TAG", "rating": "TAG", "dialect": 1, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 1, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 1, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 1, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 1, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT"], "reply": "1) (integer) 0\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 1, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT"], "reply": "1) (integer) 1\n2) \"restaurant:r205\"\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 2, "q": "@name:thai", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TEXT field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TEXT field at offset 0 near name"},
    {"name": "TAG", "rating": "TAG", "dialect": 2, "q": "@name:kitchens", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:kitchens", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a TEXT field at offset 0 near name\n", "error": "SEARCH_SYNTAX Expected a TEXT field at offset 0 near name"},
    {"name": "TAG", "rating": "TAG", "dialect": 2, "q": "@name:{Lotus Thai}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus Thai}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 2, "q": "@name:{Lotus*}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:{Lotus*}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n"},
    {"name": "TAG", "rating": "TAG", "dialect": 2, "q": "@rating:[4.5 +inf]", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Expected a NUMERIC field at offset 0 near rating\n", "error": "SEARCH_SYNTAX Expected a NUMERIC field at offset 0 near rating"},
    {"name": "TAG", "rating": "TAG", "dialect": 2, "q": "@rating:{4.5}", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TAG", "rating", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:{4.5}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r205\"\n"}
  ];
  var KEYS = [
    {"prefix": "restaurant", "filter": false, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": " 1) (integer) 9\n 2) \"restaurant:r202\"\n 3) \"restaurant:r203\"\n 4) \"restaurant:r206\"\n 5) \"restaurant:r208\"\n 6) \"restaurant:r209\"\n 7) \"restaurant:r201\"\n 8) \"restaurant:r204\"\n 9) \"restaurant:r205\"\n10) \"restaurant:r207\"\n"},
    {"prefix": "restaurant", "filter": true, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "FILTER", "@city=='austin'", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": "1) (integer) 4\n2) \"restaurant:r202\"\n3) \"restaurant:r209\"\n4) \"restaurant:r201\"\n5) \"restaurant:r207\"\n"},
    {"prefix": "order", "filter": false, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "order:", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": " 1) (integer) 10\n 2) \"order:o3001\"\n 3) \"order:o3002\"\n 4) \"order:o3003\"\n 5) \"order:o3004\"\n 6) \"order:o3005\"\n 7) \"order:o3006\"\n 8) \"order:o3007\"\n 9) \"order:o3008\"\n10) \"order:o3009\"\n11) \"order:o3010\"\n"},
    {"prefix": "order", "filter": true, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "order:", "FILTER", "@city=='austin'", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": "1) (integer) 0\n"},
    {"prefix": "both", "filter": false, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "2", "restaurant:", "order:", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": " 1) (integer) 19\n 2) \"order:o3001\"\n 3) \"order:o3002\"\n 4) \"order:o3003\"\n 5) \"order:o3004\"\n 6) \"order:o3005\"\n 7) \"order:o3006\"\n 8) \"order:o3007\"\n 9) \"order:o3008\"\n10) \"order:o3009\"\n11) \"order:o3010\"\n12) \"restaurant:r202\"\n13) \"restaurant:r203\"\n14) \"restaurant:r206\"\n15) \"restaurant:r208\"\n16) \"restaurant:r209\"\n17) \"restaurant:r201\"\n18) \"restaurant:r204\"\n19) \"restaurant:r205\"\n20) \"restaurant:r207\"\n"},
    {"prefix": "both", "filter": true, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "2", "restaurant:", "order:", "FILTER", "@city=='austin'", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": "1) (integer) 4\n2) \"restaurant:r202\"\n3) \"restaurant:r209\"\n4) \"restaurant:r201\"\n5) \"restaurant:r207\"\n"},
    {"prefix": "none", "filter": false, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": " 1) (integer) 19\n 2) \"order:o3001\"\n 3) \"order:o3002\"\n 4) \"order:o3003\"\n 5) \"order:o3004\"\n 6) \"order:o3005\"\n 7) \"order:o3006\"\n 8) \"order:o3007\"\n 9) \"order:o3008\"\n10) \"order:o3009\"\n11) \"order:o3010\"\n12) \"restaurant:r202\"\n13) \"restaurant:r203\"\n14) \"restaurant:r206\"\n15) \"restaurant:r208\"\n16) \"restaurant:r209\"\n17) \"restaurant:r201\"\n18) \"restaurant:r204\"\n19) \"restaurant:r205\"\n20) \"restaurant:r207\"\n"},
    {"prefix": "none", "filter": true, "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "FILTER", "@city=='austin'", "SCHEMA", "name", "TEXT", "city", "TAG"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "50"], "reply": "1) (integer) 4\n2) \"restaurant:r202\"\n3) \"restaurant:r209\"\n4) \"restaurant:r201\"\n5) \"restaurant:r207\"\n"}
  ];
  var GAPS = [
    {"missing": false, "empty": false, "q": "all", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 11\n 2) \"restaurant:r202\"\n 3) \"restaurant:r203\"\n 4) \"restaurant:r206\"\n 5) \"restaurant:r208\"\n 6) \"restaurant:r209\"\n 7) \"restaurant:r211\"\n 8) \"restaurant:r212\"\n 9) \"restaurant:r201\"\n10) \"restaurant:r204\"\n11) \"restaurant:r205\"\n12) \"restaurant:r207\"\n"},
    {"missing": false, "empty": false, "q": "range", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4 +inf]", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 10\n 2) \"restaurant:r201\"\n 3) \"restaurant:r202\"\n 4) \"restaurant:r203\"\n 5) \"restaurant:r204\"\n 6) \"restaurant:r205\"\n 7) \"restaurant:r206\"\n 8) \"restaurant:r207\"\n 9) \"restaurant:r208\"\n10) \"restaurant:r209\"\n11) \"restaurant:r212\"\n"},
    {"missing": false, "empty": false, "q": "missing", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "ismissing(@rating)", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX 'ismissing' requires defining the field with 'INDEXMISSING' at offset 10 near rating\n", "error": "SEARCH_SYNTAX 'ismissing' requires defining the field with 'INDEXMISSING' at offset 10 near rating"},
    {"missing": false, "empty": false, "q": "empty", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@cuisine:{\"\"}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Use `INDEXEMPTY` in field creation in order to index and query for empty strings\n", "error": "SEARCH_SYNTAX Use `INDEXEMPTY` in field creation in order to index and query for empty strings"},
    {"missing": false, "empty": false, "q": "info", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.INFO", "idx:restaurants"], "reply": " 1) index_name\n 2) idx:restaurants\n 3) index_options\n 4) (empty array)\n 5) index_definition\n 6) 1) key_type\n    2) HASH\n    3) prefixes\n    4) 1) restaurant:\n    5) default_score\n    6) \"1\"\n    7) indexes_all\n    8) false\n 7) attributes\n 8) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) type\n       6) TEXT\n       7) WEIGHT\n       8) \"1\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) type\n       6) TAG\n       7) SEPARATOR\n       8) ,\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) type\n       6) NUMERIC\n 9) num_docs\n10) (integer) 11\n11) max_doc_id\n12) (integer) 11\n13) num_terms\n14) (integer) 31\n15) num_records\n16) (integer) 51\n17) inverted_sz_mb\n18) \"0.003920555114746094\"\n19) vector_index_sz_mb\n20) \"0\"\n21) total_inverted_index_blocks\n22) (integer) 41\n23) offset_vectors_sz_mb\n24) \"2.956390380859375e-5\"\n25) doc_table_size_mb\n26) \"0.008547782897949219\"\n27) sortable_values_size_mb\n28) \"0\"\n29) key_table_size_mb\n30) \"4.6539306640625e-4\"\n31) tag_overhead_sz_mb\n32) \"4.425048828125e-4\"\n33) text_overhead_sz_mb\n34) \"0.0012712478637695313\"\n35) total_index_memory_sz_mb\n36) \"0.014942169189453125\"\n37) geoshapes_sz_mb\n38) \"0\"\n39) records_per_doc_avg\n40) \"4.636363506317139\"\n41) bytes_per_record_avg\n42) \"80.60784149169922\"\n43) offsets_per_term_avg\n44) \"0.6078431606292725\"\n45) offset_bits_per_record_avg\n46) \"8\"\n47) hash_indexing_failures\n48) (integer) 1\n49) total_indexing_time\n50) \"0.643416\"\n51) indexing\n52) (integer) 0\n53) percent_indexed\n54) \"1\"\n55) number_of_uses\n56) (integer) 1\n57) cleaning\n58) (integer) 0\n59) gc_stats\n60)  1) bytes_collected\n     2) \"0\"\n     3) total_ms_run\n     4) \"0\"\n     5) total_cycles\n     6) \"0\"\n     7) average_cycle_time_ms\n     8) \"nan\"\n     9) last_run_time_ms\n    10) \"0\"\n    11) gc_numeric_trees_missed\n    12) \"0\"\n    13) gc_blocks_denied\n    14) \"0\"\n61) cursor_stats\n62) 1) global_idle\n    2) (integer) 0\n    3) global_total\n    4) (integer) 0\n    5) index_capacity\n    6) (integer) 128\n    7) index_total\n    8) (integer) 0\n63) dialect_stats\n64) 1) dialect_1\n    2) (integer) 0\n    3) dialect_2\n    4) (integer) 0\n    5) dialect_3\n    6) (integer) 0\n    7) dialect_4\n    8) (integer) 0\n65) Index Errors\n66) 1) indexing failures\n    2) (integer) 1\n    3) last indexing error\n    4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n    5) last indexing error key\n    6) \"restaurant:r210\"\n    7) background indexing status\n    8) OK\n67) field statistics\n68) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 1\n          3) last indexing error\n          4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n          5) last indexing error key\n          6) \"restaurant:r210\"\n", "result": {"num_docs": "11", "failures": "1", "error": "SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'", "key": "restaurant:r210"}},
    {"missing": false, "empty": true, "q": "all", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 11\n 2) \"restaurant:r202\"\n 3) \"restaurant:r203\"\n 4) \"restaurant:r206\"\n 5) \"restaurant:r208\"\n 6) \"restaurant:r209\"\n 7) \"restaurant:r211\"\n 8) \"restaurant:r212\"\n 9) \"restaurant:r201\"\n10) \"restaurant:r204\"\n11) \"restaurant:r205\"\n12) \"restaurant:r207\"\n"},
    {"missing": false, "empty": true, "q": "range", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4 +inf]", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 10\n 2) \"restaurant:r201\"\n 3) \"restaurant:r202\"\n 4) \"restaurant:r203\"\n 5) \"restaurant:r204\"\n 6) \"restaurant:r205\"\n 7) \"restaurant:r206\"\n 8) \"restaurant:r207\"\n 9) \"restaurant:r208\"\n10) \"restaurant:r209\"\n11) \"restaurant:r212\"\n"},
    {"missing": false, "empty": true, "q": "missing", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "ismissing(@rating)", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX 'ismissing' requires defining the field with 'INDEXMISSING' at offset 10 near rating\n", "error": "SEARCH_SYNTAX 'ismissing' requires defining the field with 'INDEXMISSING' at offset 10 near rating"},
    {"missing": false, "empty": true, "q": "empty", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@cuisine:{\"\"}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r212\"\n"},
    {"missing": false, "empty": true, "q": "info", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC"], "created": "OK\n", "query": ["FT.INFO", "idx:restaurants"], "reply": " 1) index_name\n 2) idx:restaurants\n 3) index_options\n 4) (empty array)\n 5) index_definition\n 6) 1) key_type\n    2) HASH\n    3) prefixes\n    4) 1) restaurant:\n    5) default_score\n    6) \"1\"\n    7) indexes_all\n    8) false\n 7) attributes\n 8) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) type\n       6) TEXT\n       7) WEIGHT\n       8) \"1\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) type\n       6) TAG\n       7) SEPARATOR\n       8) ,\n       9) INDEXEMPTY\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) type\n       6) NUMERIC\n 9) num_docs\n10) (integer) 11\n11) max_doc_id\n12) (integer) 11\n13) num_terms\n14) (integer) 31\n15) num_records\n16) (integer) 52\n17) inverted_sz_mb\n18) \"0.003997802734375\"\n19) vector_index_sz_mb\n20) \"0\"\n21) total_inverted_index_blocks\n22) (integer) 42\n23) offset_vectors_sz_mb\n24) \"2.956390380859375e-5\"\n25) doc_table_size_mb\n26) \"0.008547782897949219\"\n27) sortable_values_size_mb\n28) \"0\"\n29) key_table_size_mb\n30) \"4.6539306640625e-4\"\n31) tag_overhead_sz_mb\n32) \"4.425048828125e-4\"\n33) text_overhead_sz_mb\n34) \"0.0012712478637695313\"\n35) total_index_memory_sz_mb\n36) \"0.015019416809082031\"\n37) geoshapes_sz_mb\n38) \"0\"\n39) records_per_doc_avg\n40) \"4.7272725105285645\"\n41) bytes_per_record_avg\n42) \"80.61538696289063\"\n43) offsets_per_term_avg\n44) \"0.5961538553237915\"\n45) offset_bits_per_record_avg\n46) \"8\"\n47) hash_indexing_failures\n48) (integer) 1\n49) total_indexing_time\n50) \"0.682708\"\n51) indexing\n52) (integer) 0\n53) percent_indexed\n54) \"1\"\n55) number_of_uses\n56) (integer) 1\n57) cleaning\n58) (integer) 0\n59) gc_stats\n60)  1) bytes_collected\n     2) \"0\"\n     3) total_ms_run\n     4) \"0\"\n     5) total_cycles\n     6) \"0\"\n     7) average_cycle_time_ms\n     8) \"nan\"\n     9) last_run_time_ms\n    10) \"0\"\n    11) gc_numeric_trees_missed\n    12) \"0\"\n    13) gc_blocks_denied\n    14) \"0\"\n61) cursor_stats\n62) 1) global_idle\n    2) (integer) 0\n    3) global_total\n    4) (integer) 0\n    5) index_capacity\n    6) (integer) 128\n    7) index_total\n    8) (integer) 0\n63) dialect_stats\n64) 1) dialect_1\n    2) (integer) 0\n    3) dialect_2\n    4) (integer) 0\n    5) dialect_3\n    6) (integer) 0\n    7) dialect_4\n    8) (integer) 0\n65) Index Errors\n66) 1) indexing failures\n    2) (integer) 1\n    3) last indexing error\n    4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n    5) last indexing error key\n    6) \"restaurant:r210\"\n    7) background indexing status\n    8) OK\n67) field statistics\n68) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 1\n          3) last indexing error\n          4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n          5) last indexing error key\n          6) \"restaurant:r210\"\n", "result": {"num_docs": "11", "failures": "1", "error": "SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'", "key": "restaurant:r210"}},
    {"missing": true, "empty": false, "q": "all", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 11\n 2) \"restaurant:r202\"\n 3) \"restaurant:r203\"\n 4) \"restaurant:r206\"\n 5) \"restaurant:r208\"\n 6) \"restaurant:r209\"\n 7) \"restaurant:r211\"\n 8) \"restaurant:r212\"\n 9) \"restaurant:r201\"\n10) \"restaurant:r204\"\n11) \"restaurant:r205\"\n12) \"restaurant:r207\"\n"},
    {"missing": true, "empty": false, "q": "range", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4 +inf]", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 10\n 2) \"restaurant:r201\"\n 3) \"restaurant:r202\"\n 4) \"restaurant:r203\"\n 5) \"restaurant:r204\"\n 6) \"restaurant:r205\"\n 7) \"restaurant:r206\"\n 8) \"restaurant:r207\"\n 9) \"restaurant:r208\"\n10) \"restaurant:r209\"\n11) \"restaurant:r212\"\n"},
    {"missing": true, "empty": false, "q": "missing", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "ismissing(@rating)", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r211\"\n"},
    {"missing": true, "empty": false, "q": "empty", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@cuisine:{\"\"}", "NOCONTENT", "DIALECT", "2"], "reply": "(error) SEARCH_SYNTAX Use `INDEXEMPTY` in field creation in order to index and query for empty strings\n", "error": "SEARCH_SYNTAX Use `INDEXEMPTY` in field creation in order to index and query for empty strings"},
    {"missing": true, "empty": false, "q": "info", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.INFO", "idx:restaurants"], "reply": " 1) index_name\n 2) idx:restaurants\n 3) index_options\n 4) (empty array)\n 5) index_definition\n 6) 1) key_type\n    2) HASH\n    3) prefixes\n    4) 1) restaurant:\n    5) default_score\n    6) \"1\"\n    7) indexes_all\n    8) false\n 7) attributes\n 8) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) type\n       6) TEXT\n       7) WEIGHT\n       8) \"1\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) type\n       6) TAG\n       7) SEPARATOR\n       8) ,\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) type\n       6) NUMERIC\n       7) INDEXMISSING\n 9) num_docs\n10) (integer) 11\n11) max_doc_id\n12) (integer) 11\n13) num_terms\n14) (integer) 31\n15) num_records\n16) (integer) 51\n17) inverted_sz_mb\n18) \"0.003997802734375\"\n19) vector_index_sz_mb\n20) \"0\"\n21) total_inverted_index_blocks\n22) (integer) 42\n23) offset_vectors_sz_mb\n24) \"2.956390380859375e-5\"\n25) doc_table_size_mb\n26) \"0.008547782897949219\"\n27) sortable_values_size_mb\n28) \"0\"\n29) key_table_size_mb\n30) \"4.6539306640625e-4\"\n31) tag_overhead_sz_mb\n32) \"4.425048828125e-4\"\n33) text_overhead_sz_mb\n34) \"0.0012712478637695313\"\n35) total_index_memory_sz_mb\n36) \"0.015019416809082031\"\n37) geoshapes_sz_mb\n38) \"0\"\n39) records_per_doc_avg\n40) \"4.636363506317139\"\n41) bytes_per_record_avg\n42) \"82.19607543945313\"\n43) offsets_per_term_avg\n44) \"0.6078431606292725\"\n45) offset_bits_per_record_avg\n46) \"8\"\n47) hash_indexing_failures\n48) (integer) 1\n49) total_indexing_time\n50) \"0.863417\"\n51) indexing\n52) (integer) 0\n53) percent_indexed\n54) \"1\"\n55) number_of_uses\n56) (integer) 1\n57) cleaning\n58) (integer) 0\n59) gc_stats\n60)  1) bytes_collected\n     2) \"0\"\n     3) total_ms_run\n     4) \"0\"\n     5) total_cycles\n     6) \"0\"\n     7) average_cycle_time_ms\n     8) \"nan\"\n     9) last_run_time_ms\n    10) \"0\"\n    11) gc_numeric_trees_missed\n    12) \"0\"\n    13) gc_blocks_denied\n    14) \"0\"\n61) cursor_stats\n62) 1) global_idle\n    2) (integer) 0\n    3) global_total\n    4) (integer) 0\n    5) index_capacity\n    6) (integer) 128\n    7) index_total\n    8) (integer) 0\n63) dialect_stats\n64) 1) dialect_1\n    2) (integer) 0\n    3) dialect_2\n    4) (integer) 0\n    5) dialect_3\n    6) (integer) 0\n    7) dialect_4\n    8) (integer) 0\n65) Index Errors\n66) 1) indexing failures\n    2) (integer) 1\n    3) last indexing error\n    4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n    5) last indexing error key\n    6) \"restaurant:r210\"\n    7) background indexing status\n    8) OK\n67) field statistics\n68) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 1\n          3) last indexing error\n          4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n          5) last indexing error key\n          6) \"restaurant:r210\"\n", "result": {"num_docs": "11", "failures": "1", "error": "SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'", "key": "restaurant:r210"}},
    {"missing": true, "empty": true, "q": "all", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "*", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 11\n 2) \"restaurant:r202\"\n 3) \"restaurant:r203\"\n 4) \"restaurant:r206\"\n 5) \"restaurant:r208\"\n 6) \"restaurant:r209\"\n 7) \"restaurant:r211\"\n 8) \"restaurant:r212\"\n 9) \"restaurant:r201\"\n10) \"restaurant:r204\"\n11) \"restaurant:r205\"\n12) \"restaurant:r207\"\n"},
    {"missing": true, "empty": true, "q": "range", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4 +inf]", "NOCONTENT", "LIMIT", "0", "20"], "reply": " 1) (integer) 10\n 2) \"restaurant:r201\"\n 3) \"restaurant:r202\"\n 4) \"restaurant:r203\"\n 5) \"restaurant:r204\"\n 6) \"restaurant:r205\"\n 7) \"restaurant:r206\"\n 8) \"restaurant:r207\"\n 9) \"restaurant:r208\"\n10) \"restaurant:r209\"\n11) \"restaurant:r212\"\n"},
    {"missing": true, "empty": true, "q": "missing", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "ismissing(@rating)", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r211\"\n"},
    {"missing": true, "empty": true, "q": "empty", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@cuisine:{\"\"}", "NOCONTENT", "DIALECT", "2"], "reply": "1) (integer) 1\n2) \"restaurant:r212\"\n"},
    {"missing": true, "empty": true, "q": "info", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "cuisine", "TAG", "INDEXEMPTY", "rating", "NUMERIC", "INDEXMISSING"], "created": "OK\n", "query": ["FT.INFO", "idx:restaurants"], "reply": " 1) index_name\n 2) idx:restaurants\n 3) index_options\n 4) (empty array)\n 5) index_definition\n 6) 1) key_type\n    2) HASH\n    3) prefixes\n    4) 1) restaurant:\n    5) default_score\n    6) \"1\"\n    7) indexes_all\n    8) false\n 7) attributes\n 8) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) type\n       6) TEXT\n       7) WEIGHT\n       8) \"1\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) type\n       6) TAG\n       7) SEPARATOR\n       8) ,\n       9) INDEXEMPTY\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) type\n       6) NUMERIC\n       7) INDEXMISSING\n 9) num_docs\n10) (integer) 11\n11) max_doc_id\n12) (integer) 11\n13) num_terms\n14) (integer) 31\n15) num_records\n16) (integer) 52\n17) inverted_sz_mb\n18) \"0.004075050354003906\"\n19) vector_index_sz_mb\n20) \"0\"\n21) total_inverted_index_blocks\n22) (integer) 43\n23) offset_vectors_sz_mb\n24) \"2.956390380859375e-5\"\n25) doc_table_size_mb\n26) \"0.008547782897949219\"\n27) sortable_values_size_mb\n28) \"0\"\n29) key_table_size_mb\n30) \"4.6539306640625e-4\"\n31) tag_overhead_sz_mb\n32) \"4.425048828125e-4\"\n33) text_overhead_sz_mb\n34) \"0.0012712478637695313\"\n35) total_index_memory_sz_mb\n36) \"0.015096664428710938\"\n37) geoshapes_sz_mb\n38) \"0\"\n39) records_per_doc_avg\n40) \"4.7272725105285645\"\n41) bytes_per_record_avg\n42) \"82.17308044433594\"\n43) offsets_per_term_avg\n44) \"0.5961538553237915\"\n45) offset_bits_per_record_avg\n46) \"8\"\n47) hash_indexing_failures\n48) (integer) 1\n49) total_indexing_time\n50) \"0.604707\"\n51) indexing\n52) (integer) 0\n53) percent_indexed\n54) \"1\"\n55) number_of_uses\n56) (integer) 1\n57) cleaning\n58) (integer) 0\n59) gc_stats\n60)  1) bytes_collected\n     2) \"0\"\n     3) total_ms_run\n     4) \"0\"\n     5) total_cycles\n     6) \"0\"\n     7) average_cycle_time_ms\n     8) \"nan\"\n     9) last_run_time_ms\n    10) \"0\"\n    11) gc_numeric_trees_missed\n    12) \"0\"\n    13) gc_blocks_denied\n    14) \"0\"\n61) cursor_stats\n62) 1) global_idle\n    2) (integer) 0\n    3) global_total\n    4) (integer) 0\n    5) index_capacity\n    6) (integer) 128\n    7) index_total\n    8) (integer) 0\n63) dialect_stats\n64) 1) dialect_1\n    2) (integer) 0\n    3) dialect_2\n    4) (integer) 0\n    5) dialect_3\n    6) (integer) 0\n    7) dialect_4\n    8) (integer) 0\n65) Index Errors\n66) 1) indexing failures\n    2) (integer) 1\n    3) last indexing error\n    4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n    5) last indexing error key\n    6) \"restaurant:r210\"\n    7) background indexing status\n    8) OK\n67) field statistics\n68) 1) 1) identifier\n       2) name\n       3) attribute\n       4) name\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    2) 1) identifier\n       2) cuisine\n       3) attribute\n       4) cuisine\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 0\n          3) last indexing error\n          4) N/A\n          5) last indexing error key\n          6) \"N/A\"\n    3) 1) identifier\n       2) rating\n       3) attribute\n       4) rating\n       5) Index Errors\n       6) 1) indexing failures\n          2) (integer) 1\n          3) last indexing error\n          4) SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'\n          5) last indexing error key\n          6) \"restaurant:r210\"\n", "result": {"num_docs": "11", "failures": "1", "error": "SEARCH_NUMERIC_VALUE_INVALID Invalid numeric value: 'new'", "key": "restaurant:r210"}}
  ];
  var STORES = [
    {"store": "hash", "q": "doc", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC", "SORTABLE"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n3)  1) \"cuisine\"\n    2) \"thai\"\n    3) \"avg_delivery_min\"\n    4) \"25\"\n    5) \"price_level\"\n    6) \"1\"\n    7) \"description\"\n    8) \"Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\"\n    9) \"name\"\n   10) \"Lotus Thai\"\n   11) \"city\"\n   12) \"austin\"\n   13) \"rating\"\n   14) \"4.1\"\n", "result": [["restaurant:r209", ["cuisine", "avg_delivery_min", "price_level", "description", "name", "city", "rating"]]]},
    {"store": "hash", "q": "range", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC", "SORTABLE"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "RETURN", "1", "name", "SORTBY", "rating", "DESC"], "reply": " 1) (integer) 5\n 2) \"restaurant:r203\"\n 3) 1) \"name\"\n    2) \"Green Bowl\"\n 4) \"restaurant:r201\"\n 5) 1) \"name\"\n    2) \"Bangkok Street Kitchen\"\n 6) \"restaurant:r207\"\n 7) 1) \"name\"\n    2) \"Olive & Za'atar\"\n 8) \"restaurant:r204\"\n 9) 1) \"name\"\n    2) \"Sakura Sushi Bar\"\n10) \"restaurant:r205\"\n11) 1) \"name\"\n    2) \"Nonna's Trattoria\"\n", "result": [["restaurant:r203", "Green Bowl"], ["restaurant:r201", "Bangkok Street Kitchen"], ["restaurant:r207", "Olive & Za'atar"], ["restaurant:r204", "Sakura Sushi Bar"], ["restaurant:r205", "Nonna's Trattoria"]]},
    {"store": "hash", "q": "highlight", "create": ["FT.CREATE", "idx:restaurants", "ON", "HASH", "PREFIX", "1", "restaurant:", "SCHEMA", "name", "TEXT", "rating", "NUMERIC", "SORTABLE"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:sushi", "RETURN", "1", "name", "HIGHLIGHT", "FIELDS", "1", "name"], "reply": "1) (integer) 1\n2) \"restaurant:r204\"\n3) 1) \"name\"\n   2) \"Sakura <b>Sushi</b> Bar\"\n", "result": [["restaurant:r204", "Sakura <b>Sushi</b> Bar"]]},
    {"store": "json", "q": "doc", "create": ["FT.CREATE", "idx:restaurants", "ON", "JSON", "PREFIX", "1", "restaurant:", "SCHEMA", "$.name", "AS", "name", "TEXT", "$.rating", "AS", "rating", "NUMERIC", "SORTABLE"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:thai"], "reply": "1) (integer) 1\n2) \"restaurant:r209\"\n3) 1) \"$\"\n   2) \"{\\\"name\\\":\\\"Lotus Thai\\\",\\\"cuisine\\\":\\\"thai\\\",\\\"city\\\":\\\"austin\\\",\\\"rating\\\":4.1,\\\"price_level\\\":1,\\\"avg_delivery_min\\\":25,\\\"description\\\":\\\"Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian.\\\"}\"\n", "result": [["restaurant:r209", ["$"]]]},
    {"store": "json", "q": "range", "create": ["FT.CREATE", "idx:restaurants", "ON", "JSON", "PREFIX", "1", "restaurant:", "SCHEMA", "$.name", "AS", "name", "TEXT", "$.rating", "AS", "rating", "NUMERIC", "SORTABLE"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@rating:[4.5 +inf]", "RETURN", "1", "name", "SORTBY", "rating", "DESC"], "reply": " 1) (integer) 5\n 2) \"restaurant:r203\"\n 3) 1) \"name\"\n    2) \"Green Bowl\"\n 4) \"restaurant:r201\"\n 5) 1) \"name\"\n    2) \"Bangkok Street Kitchen\"\n 6) \"restaurant:r207\"\n 7) 1) \"name\"\n    2) \"Olive & Za'atar\"\n 8) \"restaurant:r204\"\n 9) 1) \"name\"\n    2) \"Sakura Sushi Bar\"\n10) \"restaurant:r205\"\n11) 1) \"name\"\n    2) \"Nonna's Trattoria\"\n", "result": [["restaurant:r203", "Green Bowl"], ["restaurant:r201", "Bangkok Street Kitchen"], ["restaurant:r207", "Olive & Za'atar"], ["restaurant:r204", "Sakura Sushi Bar"], ["restaurant:r205", "Nonna's Trattoria"]]},
    {"store": "json", "q": "highlight", "create": ["FT.CREATE", "idx:restaurants", "ON", "JSON", "PREFIX", "1", "restaurant:", "SCHEMA", "$.name", "AS", "name", "TEXT", "$.rating", "AS", "rating", "NUMERIC", "SORTABLE"], "created": "OK\n", "query": ["FT.SEARCH", "idx:restaurants", "@name:sushi", "RETURN", "1", "name", "HIGHLIGHT", "FIELDS", "1", "name"], "reply": "(error) SEARCH_QUERY_BAD HIGHLIGHT/SUMMARIZE is not supported with JSON indexes\n", "error": "SEARCH_QUERY_BAD HIGHLIGHT/SUMMARIZE is not supported with JSON indexes"}
  ];
  /* ---- end of the recordings ---- */

  var TYPE_QUERIES = [["@name:thai"], ["@name:kitchens"], ["@name:{Lotus Thai}"], ["@name:{Lotus*}"], ["@rating:[4.5 +inf]"], ["@rating:{4.5}"]];
  /* Why each query matches or doesn't, by query and the type of the field it asks about. */
  var TYPE_NOTES = {
    "@name:thai|TEXT": "TEXT splits each name into words, so the word `thai` finds Lotus Thai.",
    "@name:thai|TAG": "A TAG field holds each name whole, as one tag, so the word `thai` on its own doesn't match it.",
    "@name:kitchens|TEXT": "TEXT also matches other forms of each word, such as plurals, so `kitchens` finds Bangkok Street Kitchen. This is called stemming.",
    "@name:kitchens|TAG": "A TAG field doesn't split the name into words or match other forms of them, so `kitchens` doesn't match it.",
    "@name:{Lotus Thai}|TEXT": "Braces are the syntax for TAG fields, and `name` is a TEXT field here.",
    "@name:{Lotus Thai}|TAG": "Braces match a whole tag. Tags ignore case, so `{lotus thai}` matches too.",
    "@name:{Lotus*}|TEXT": "Braces with a star are TAG syntax, and `name` is a TEXT field here.",
    "@name:{Lotus*}|TAG": "A star at the end of a tag matches every tag that starts with those letters.",
    "@rating:[4.5 +inf]|NUMERIC": "A NUMERIC field takes ranges, here 4.5 or more. `+inf` means no upper limit.",
    "@rating:[4.5 +inf]|TAG": "A range needs a NUMERIC field. As a TAG, each rating is text, which a range can't compare.",
    "@rating:{4.5}|NUMERIC": "Braces are TAG syntax. To find one exact number in a NUMERIC field, use a range that starts and ends there: `[4.5 4.5]`.",
    "@rating:{4.5}|TAG": "As a TAG, the rating is the text `4.5`, so braces find the one restaurant rated exactly 4.5."
  };
  /* What step 1 says about the data. */
  var DATA_NOTE = "Redis stores every value in a hash as a string, even the rating. It finds a hash by its key, not by what's inside it, so to find the Thai restaurants in Austin it would have to read every hash. An index lets it answer directly. The next steps build one.";
  var GAP_QUERIES = [
    ["all", "*", "Every indexed restaurant"],
    ["range", "@rating:[4 +inf]", "Rated 4 or more"],
    ["missing", "ismissing(@rating)", "No rating"],
    ["empty", '@cuisine:{""}', "Empty cuisine"],
    ["info", "FT.INFO", "Indexing errors"]
  ];
  var STORE_QUERIES = [
    ["doc", "@name:thai", "Whole documents back"],
    ["range", "@rating:[4.5 +inf]", "One field back, sorted"],
    ["highlight", "@name:sushi", "Matched words highlighted"]
  ];

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
  function md(s) {
    var html = esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
    /* Lines that start with "- " become a list. */
    return html.replace(/(?:\n- [^\n]*)+/g, function (items) { return '<ul class="rsi-list">' + items.split("\n- ").slice(1).map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>"; });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  /* Escape the text, then turn HIGHLIGHT's <b> tags back into marks. */
  function marked(s) { return esc(s).replace(/&lt;b&gt;/g, '<mark class="rsq-hit">').replace(/&lt;\/b&gt;/g, "</mark>"); }
  function fieldsOf(argv) { var f = {}; for (var i = 2; i + 1 < argv.length; i += 2) f[argv[i]] = argv[i + 1]; return f; }
  function find(list, sel) {
    return list.filter(function (c) { return Object.keys(sel).every(function (k) { return c[k] === sel[k]; }); })[0];
  }

  /* The keys a NOCONTENT reply lists, read from the reply as redis-cli prints it. */
  function keysOf(reply) {
    var lines = reply.replace(/\n$/, "").split("\n");
    return lines.slice(1).map(function (l) { return l.replace(/^\s*\d+\) "/, "").replace(/"$/, ""); });
  }
  [TYPES, KEYS, GAPS].forEach(function (list) { list.forEach(function (c) { if (!c.error && !c.result) c.result = keysOf(c.reply); }); });

  /* Each restaurant's name, cuisine, city, and rating, as stored. */
  var INFO = {};
  RESTAURANTS.forEach(function (r) { INFO["restaurant:" + r[0]] = { name: r[1], cuisine: r[2], city: r[3], rating: String(r[4]) }; });
  [EXTRA.taco, EXTRA.pho, EXTRA.deli].forEach(function (a) { INFO[a[1]] = fieldsOf(a); });
  var BASE = RESTAURANTS.map(function (r) { return "restaurant:" + r[0]; });
  var JOINED = BASE.concat([EXTRA.taco[1], EXTRA.pho[1], EXTRA.deli[1]]);
  var ORDER_KEYS = ORDERS.map(function (o) { return "order:" + o[0]; });
  /* One argument as you'd type it in redis-cli: an FT.SEARCH query always in quotes, single ones
     when it has double quotes inside; JSON in single quotes; anything else in double quotes when it has to be. */
  function token(argv, i) {
    var a = argv[i];
    if (argv[0] === "FT.SEARCH" && i === 2) return /"/.test(a) ? "'" + a + "'" : '"' + a + '"';
    if (argv[0] === "JSON.SET" && i === 3) return "'" + a.replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    return a === "" || /[\s"'\\]/.test(a) ? '"' + a.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"' : a;
  }
  function cmdline(argv) { return argv.map(function (a, i) { return token(argv, i); }).join(" "); }

  /* --------------------------------------------------------------- the widget */

  var STEPS = [
    { key: "data", n: "1", label: "The data", lede: "Before you create an index, look at the data it will cover. Each restaurant is a hash. A hash is a key, such as `restaurant:r201`, that holds named fields, such as `name` and `rating`. Select a row to see a whole hash, as `HSET` wrote it and `HGETALL` reads it back." },
    { key: "types", n: "2", label: "Field types", lede: "An index starts with a schema. The schema is the `SCHEMA` part of `FT.CREATE`. It lists the fields to index and gives each one a type. The type decides how a query can find the field. TEXT splits a value into words, TAG keeps it whole, and NUMERIC stores a number you can query by range.", prompt: "Pick a query, then change the type of the field it looks in and see whether it still matches." },
    { key: "keys", n: "3", label: "Which keys", lede: "An index doesn't have to cover every key. Here we've added 10 orders to the database, under keys that start with `order:`. `PREFIX` in `FT.CREATE` names how the keys to include start, and `FILTER` keeps only the keys whose fields meet a condition.", prompt: "Change the prefix and the filter, and see which keys the index covers." },
    { key: "gaps", n: "4", label: "Missing and bad values", lede: "Real data has gaps. Here we've added three restaurants, each with a gap:\n- `restaurant:r210` Taco Loco's rating is `new`, which isn't a number.\n- `restaurant:r211` Pho Corner has no rating field.\n- `restaurant:r212` Morning Deli's cuisine is an empty string.", prompt: "Pick a query, then change how `rating` and `cuisine` are indexed and see what the query finds." },
    { key: "stores", n: "5", label: "Hash or JSON", lede: "Redis can also store each restaurant as a JSON document instead of a hash. An index on JSON names each field by its JSON path, such as `$.name`. `AS name` gives the field the short name that queries use. The queries stay the same, but some replies differ.", prompt: "Pick a query, then switch between hashes and JSON and compare what comes back." }
  ];

  function init(root) {
    var st = { tab: "data", dataKey: null,
      types: { name: "TEXT", rating: "NUMERIC", dialect: 1, q: TYPE_QUERIES[0][0] },
      keys: { prefix: "restaurant", filter: false },
      gaps: { missing: false, empty: false, q: "all" },
      stores: { store: "hash", q: "doc" } };
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

    /* The recorded case the controls point at. */
    function current() {
      if (st.tab === "data") return null;
      if (st.tab === "types") return find(TYPES, st.types);
      if (st.tab === "keys") return find(KEYS, st.keys);
      if (st.tab === "gaps") return find(GAPS, st.gaps);
      return find(STORES, st.stores);
    }

    function render() {
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.tab === st.tab ? "true" : "false"); });
      var step = STEPS.filter(function (t) { return t.key === st.tab; })[0], cur = current();
      panel.innerHTML = "";
      panel.appendChild(el("div", "rcr-lede", md(step.lede)));   // a div, so the site's paragraph styles stay out
      if (cur) panel.appendChild(createBlock(cur.create));   // what the lede describes, before the controls that change it
      if (step.prompt) panel.appendChild(el("div", "rcr-lede", md(step.prompt)));   // what to do with the controls that follow
      if (st.tab !== "data") panel.appendChild(controls());   // step 1 only shows the data
      if (cur) panel.appendChild(queryBlock(cur));   // the query, before the data it finds
      panel.appendChild(st.tab === "data" ? introCard() : dataCard(cur));
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
    function choice(label, opts, isOn, onPick, cls, hint) {
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
      if (hint) g.appendChild(el("div", "rsi-hint", md(hint)));
      return g;
    }
    function controls() {
      var box = el("div", "rsq-controls"), grid;
      if (st.tab === "types") {
        var t = st.types;
        box.appendChild(choice("Query", TYPE_QUERIES.map(function (q) {
          return [q[0], code(q[0])];
        }), function (v) { return v === t.q; }, function (v) { t.q = v; }, "rsq-queries",
          "Each query looks in one field: `@name:` or `@rating:` names the field, and the rest is what to look for."));
        /* Only the type of the field the query looks in matters to it, so only that one is offered. */
        if (t.q.indexOf("@name") === 0) box.appendChild(choice("Index " + code("name") + " as", [["TEXT", "TEXT"], ["TAG", "TAG"]], function (v) { return v === t.name; }, function (v) { t.name = v; }, "rsi-typechoice"));
        else box.appendChild(choice("Index " + code("rating") + " as", [["NUMERIC", "NUMERIC"], ["TAG", "TAG"]], function (v) { return v === t.rating; }, function (v) { t.rating = v; }, "rsi-typechoice"));
        box.appendChild(choice("Query dialect", [[1, "1, the default"], [2, code("DIALECT 2")]], function (v) { return v === t.dialect; }, function (v) { t.dialect = v; }, null,
          "The query syntax has versions, called dialects. Redis uses dialect 1 unless the query ends with `DIALECT` and a number."));
      } else if (st.tab === "keys") {
        var k = st.keys;
        box.appendChild(choice("Prefix", [["restaurant", code("restaurant:")], ["order", code("order:")], ["both", code("restaurant:") + " and " + code("order:")], ["none", "None"]],
          function (v) { return v === k.prefix; }, function (v) { k.prefix = v; }));
        box.appendChild(choice("Filter", [[false, "None"], [true, code("@city=='austin'")]], function (v) { return v === k.filter; }, function (v) { k.filter = v; }));
      } else if (st.tab === "gaps") {
        var g = st.gaps;
        box.appendChild(choice("Query", GAP_QUERIES.map(function (q) {
          return [q[0], code(q[1]) + " " + esc(q[2])];
        }), function (v) { return v === g.q; }, function (v) { g.q = v; }, "rsq-queries"));
        grid = el("div", "rsq-filters");
        grid.appendChild(choice("Index " + code("rating") + " as", [[false, "NUMERIC"], [true, "NUMERIC INDEXMISSING"]], function (v) { return v === g.missing; }, function (v) { g.missing = v; }));
        grid.appendChild(choice("Index " + code("cuisine") + " as", [[false, "TAG"], [true, "TAG INDEXEMPTY"]], function (v) { return v === g.empty; }, function (v) { g.empty = v; }));
        box.appendChild(grid);
      } else {
        var s = st.stores;
        box.appendChild(choice("Query", STORE_QUERIES.map(function (q) {
          return [q[0], code(q[1]) + " " + esc(q[2])];
        }), function (v) { return v === s.q; }, function (v) { s.q = v; }, "rsq-queries"));
        box.appendChild(choice("Store the restaurants as", [["hash", "Hashes"], ["json", "JSON documents"]], function (v) { return v === s.store; }, function (v) { s.store = v; }));
      }
      return box;
    }

    function gap(s) { return '<span class="rsi-gap">' + esc(s) + "</span>"; }

    /* The fields the table shows for the current step, each with how the index treats it.
       `marked` flags the parts the controls change, as in the commands. */
    function columns() {
      if (st.tab === "types") return [{ field: "name", label: "name", type: st.types.name, marked: true }, { field: "rating", label: "rating", type: st.types.rating, marked: true }];
      if (st.tab === "keys") return [{ field: "name", label: "name", type: "TEXT" }, { field: "city", label: "city", type: "TAG" }];
      if (st.tab === "gaps") return [{ field: "name", label: "name", type: "TEXT" },
        { field: "cuisine", label: "cuisine", type: "TAG" + (st.gaps.empty ? " INDEXEMPTY" : ""), marked: st.gaps.empty },
        { field: "rating", label: "rating", type: "NUMERIC" + (st.gaps.missing ? " INDEXMISSING" : ""), marked: st.gaps.missing }];
      var json = st.stores.store === "json";
      return [{ field: "name", label: json ? "$.name" : "name", type: "TEXT", marked: json },
        { field: "rating", label: json ? "$.rating" : "rating", type: "NUMERIC SORTABLE", marked: json }];
    }
    /* The rows: every key the step writes, in the order it writes them. */
    function rowKeys() {
      if (st.tab === "gaps") return JOINED;
      if (st.tab !== "keys") return BASE;
      return BASE.concat(ORDER_KEYS);
    }
    /* A document's fields, as written. */
    function valuesOf(key) {
      if (st.tab === "stores" && st.stores.store === "json") return JSON.parse(JSONGET[key].set[3]);
      return fieldsOf(STORED[key].set);
    }

    /* The documents as stored, one row each. The headers show how the index treats each field;
       highlighted rows are the ones the query matched, or in step 3 the keys the index holds. */
    function dataCard(c) {
      var tab = st.tab, card = el("div", "rcr-card rsi-data"), cols = columns(), keys = rowKeys();
      var info = tab === "gaps" && c.q === "info", hits = {}, out = {};
      var matched = c.error || info ? [] : tab === "stores" ? c.result.map(function (x) { return x[0]; }) : c.result;
      matched.forEach(function (k) { hits[k] = true; });
      if (tab === "gaps") {
        var all = find(GAPS, { missing: st.gaps.missing, empty: st.gaps.empty, q: "all" }).result;
        JOINED.forEach(function (k) { if (all.indexOf(k) < 0) out[k] = true; });
      }
      var n = keys.length, badge;
      if (c.error) badge = '<span class="rcr-count rsi-count-err">Error</span>';
      else if (info) badge = '<span class="rcr-count">' + esc(c.result.num_docs) + " of " + n + " indexed</span>";
      else badge = '<span class="rcr-count">' + matched.length + " of " + n + (tab === "keys" ? " indexed" : " match") + "</span>";
      card.appendChild(el("div", "rcr-cardhead", "<span>Data</span>" + badge));
      card.appendChild(el("div", "rsq-axis", esc(
        (tab === "keys" ? "Every key in the database. Highlighted: the keys in the index." :
          info ? "The restaurants as stored. Faded: not in the index at all." :
            "The restaurants as stored. Highlighted: the ones the query matched." + (tab === "gaps" ? " Faded: not in the index at all." : "")) +
        " Select a row to see how it was written.")));
      card.appendChild(table(cols, keys, hits, out, c));
      if (info) card.appendChild(infoBox(c));
      card.appendChild(el("div", "rsq-note", note(c)));
      return card;
    }
    /* The documents, one row each, under a header naming each field and, once indexed, its type.
       In the stacked layout on narrow screens, `wide` columns get a line of their own. */
    function table(cols, keys, hits, out, c) {
      var t = el("table", "rsi-table" + (cols.length > 2 ? " has-3" : "")), head = el("tr"), thead = el("thead"), body = el("tbody");
      var narrow = cols.filter(function (col) { return !col.wide; });
      t.style.setProperty("--cols", narrow.map(function (col, i) { return "minmax(0, " + (col.fr || (i || narrow.length < cols.length ? 1 : 1.3)) + "fr)"; }).join(" "));   // `fr` sizes a column to its contents
      head.appendChild(el("th", "", "Key"));
      cols.forEach(function (col) {
        head.appendChild(el("th", col.wide ? "rsi-wide" : "", '<span class="rcr-mono">' + esc(col.label) + "</span>" +
          (col.type ? ' <span class="rsi-type' + (col.marked ? " is-marked" : "") + '">' + esc(col.type) + "</span>" : "")));
      });
      thead.appendChild(head);
      t.appendChild(thead);
      keys.forEach(function (key) {
        var tr = docRow(key, cols, hits[key], out[key], c);
        body.appendChild(tr);
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
    function docRow(key, cols, hit, isOut, c) {
      var v = valuesOf(key), open = st.dataKey === key;
      var tr = el("tr", [hit ? "is-hit" : "", isOut ? "is-out" : "", open ? "is-open" : ""].join(" ").trim());
      tr.dataset.key = key;
      var tag = isOut ? "not indexed" : "";
      var k = el("td", "rsi-key"), b = el("button", "rsi-open rcr-mono", esc(key).replace(":", ":<wbr>"));
      b.type = "button";
      k.appendChild(b);
      if (tag) k.appendChild(el("span", "rsi-tag", tag));
      tr.appendChild(k);
      cols.forEach(function (col) { tr.appendChild(el("td", col.wide ? "rsi-wide" : "", cell(key, col.field, v, c))); });
      b.setAttribute("aria-expanded", open ? "true" : "false");
      b.title = (open ? "Hide" : "Show") + " how " + key + " was written";
      var toggle = function () { st.dataKey = open ? null : key; render(); var again = panel.querySelector('tr[data-key="' + key + '"] .rsi-open'); if (again) again.focus({ preventScroll: true }); };
      b.addEventListener("click", function (e) { e.stopPropagation(); toggle(); });
      tr.addEventListener("click", toggle);
      return tr;
    }
    /* A field's value as stored, with any gap called out. */
    function cell(key, field, v, c) {
      var val = v[field];
      if (val === undefined) return st.tab === "gaps" ? gap("missing") : '<span class="rcr-faint" title="The hash has no such field">—</span>';
      if (val === "") return '<span class="rcr-mono">""</span> ' + gap("empty");
      var html = esc(val);
      if (st.tab === "gaps" && field === "rating" && isNaN(Number(val))) html += " " + gap("not a number");
      if (field !== "name" || st.tab !== "stores") return html;
      var i = c.error ? -1 : c.result.map(function (x) { return x[0]; }).indexOf(key);
      if (c.q === "highlight" && i >= 0) html = marked(c.result[i][1]);   // the name as HIGHLIGHT returned it
      if (c.q === "doc" && i >= 0) {
        var f = c.result[i][1];
        html += '<span class="rsi-back">' + (f.length === 1 && f[0] === "$" ? "Came back as " + code("$") + ": the whole document, as one JSON string" : "Came back as " + f.length + " fields: " + f.map(code).join(", ")) + "</span>";
      }
      return html;
    }
    /* Step 4: what FT.INFO says about the failed hash. */
    function infoBox(c) {
      var r = c.result, list = el("div", "rsi-info");   // divs, not a dl, so the site's list styles stay out
      list.appendChild(el("div", "rsi-infohead", code("FT.INFO") + " reports"));
      [["num_docs", r.num_docs], ["hash_indexing_failures", r.failures], ["last indexing error", r.error], ["last indexing error key", r.key]].forEach(function (x) {
        list.appendChild(el("div", "rsi-inforow", '<span class="rsi-k rcr-mono">' + esc(x[0]) + '</span><span class="rsi-v rcr-mono">' + esc(x[1]) + "</span>"));
      });
      return list;
    }

    /* Step 1: the restaurants, before any index exists. */
    function introCard() {
      var card = el("div", "rcr-card rsi-data");
      card.appendChild(el("div", "rcr-cardhead", '<span>Restaurants</span><span class="rcr-count">' + BASE.length + " hashes</span>"));
      card.appendChild(el("div", "rsq-axis", "Four of each restaurant's " + Object.keys(fieldsOf(STORED[BASE[0]].set)).length + " fields. Select a row to see all of them."));
      card.appendChild(table([{ field: "name", label: "name", wide: true }, { field: "cuisine", label: "cuisine" }, { field: "city", label: "city" }, { field: "rating", label: "rating" }], BASE, {}, {}, {}));
      card.appendChild(el("div", "rsq-note", md(DATA_NOTE)));
      return card;
    }

    /* What the current case shows, in a sentence or three. */
    function note(c) {
      if (st.tab === "types") {
        var field = c.q.indexOf("@name") === 0 ? "name" : "rating", base = md(TYPE_NOTES[c.q + "|" + c[field]]);
        if (c.error) return md("`DIALECT 2` reports the mismatch as an error. ") + base;
        if (c.result.length) return base;
        var strict = find(TYPES, { name: c.name, rating: c.rating, dialect: 2, q: c.q });
        return "No match, and no error. " + base + (strict && strict.error ? md(" Try `DIALECT 2`: it reports a mismatch like this as an error.") : "");
      }
      if (st.tab === "keys") return keysNote(c);
      if (st.tab === "gaps") {
        if (c.q === "all") return md("11 of the 12 restaurants are in the index. Taco Loco isn't: its rating, `new`, isn't a number, so Redis couldn't index the hash at all. Pho Corner, with no rating, and Morning Deli, with an empty cuisine, are in.");
        if (c.q === "range") return md("Pho Corner has no rating, so no range can match it. Morning Deli's `4.0` counts as 4 or more.");
        if (c.q === "missing") return c.error ? md("`ismissing` only works on a field indexed with `INDEXMISSING`. Choose NUMERIC INDEXMISSING for `rating`.") :
          md("`INDEXMISSING` also records which hashes lack the field, so `ismissing` finds Pho Corner. This query needs dialect 2, so it ends with `DIALECT 2`.");
        if (c.q === "empty") return c.error ? md("Redis only finds empty values in a field indexed with `INDEXEMPTY`. Choose TAG INDEXEMPTY for `cuisine`.") :
          md("`INDEXEMPTY` indexes empty strings, so `{\"\"}` finds Morning Deli. This query needs dialect 2, so it ends with `DIALECT 2`.");
        return md("`FT.INFO` reports on an index: how many documents it holds, how many hashes Redis couldn't index, and the last one and what was wrong. Fix the value, for example with `HSET restaurant:r210 rating 4.4`, and Redis indexes the hash.");
      }
      if (c.q === "doc") return c.store === "hash" ? md("This query doesn't say which fields to return, so Redis returns every field of each matching hash.") :
        md("This query doesn't say which fields to return, so Redis returns each whole document as one JSON string, under `$`.");
      if (c.q === "range") return md("`RETURN 1 name` asks for just the `name` field. `SORTBY rating DESC` puts the highest rating first. The reply is the same for hashes and JSON, since both indexes use the same short field names.");
      return c.error ? md("Redis 8 doesn't support `HIGHLIGHT` on JSON indexes, so the query fails. On hashes, the same query works.") :
        md("`HIGHLIGHT` wraps each word that matched in `<b>` tags, here `Sushi` in Sakura Sushi Bar.");
    }
    function keysNote(c) {
      var k = st.keys, parts = [];
      parts.push({ restaurant: "The 9 restaurant keys start with `restaurant:`, so the index covers them and leaves the orders out.",
        order: "Now the " + ORDER_KEYS.length + " orders are indexed, though they have no name or city. `PREFIX` alone decides which keys go in, whatever the index is called.",
        both: "With two prefixes, the index covers the restaurants and the orders.",
        none: "With no `PREFIX`, the index covers every hash in the database." }[k.prefix]);
      if (k.filter) parts.push(k.prefix === "order" ? "`FILTER` then keeps only hashes whose city is austin. Orders have no city, so none are left." :
        "`FILTER` then keeps only the hashes whose city is austin" + (k.prefix === "restaurant" ? "." : ", and orders have no city."));
      return md(parts.join(" "));
    }

    /* A transcript line: the prompt, the command, and, when asked, its reply. */
    function line(argv, reply, withReply) {
      return '<span class="rsq-prompt">&gt; </span>' + cmdHtml(argv) + "\n" + (withReply ? esc(reply) : "");
    }
    /* A key as written and as read back, exactly as redis-cli prints it. */
    function docBox(key) {
      var json = st.tab === "stores" && st.stores.store === "json", d = (json ? JSONGET : STORED)[key];
      var html = line(d.set, d.setReply, true) + line([json ? "JSON.GET" : "HGETALL", key], d.get, true);
      var box = el("div", "rsq-doc");
      box.appendChild(el("pre", "rcr-code rsq-pre rsq-cmdline", html.replace(/\n$/, "")));
      return box;
    }

    /* The step's FT.CREATE, one part per line, each with what it means in plain words. */
    function createBlock(argv) {
      var m = marks(argv), lines = [], i = 0, OPTS = ["SORTABLE", "INDEXMISSING", "INDEXEMPTY"];
      var AS = { TEXT: "as words", TAG: "as one whole value", NUMERIC: "as a number" };
      var OPT = { SORTABLE: "kept ready for sorting", INDEXMISSING: "also noting hashes without one", INDEXEMPTY: "including empty ones" };
      var push = function (from, to, note, depth) { lines.push({ from: from, to: to, note: note, depth: depth }); };
      push(0, 1, "Create an index called " + code(argv[1]), 0);
      var prefix = argv.indexOf("PREFIX"), filter = argv.indexOf("FILTER"), schema = argv.indexOf("SCHEMA");
      push(2, 3, argv[3] === "JSON" ? "on JSON documents" : prefix < 0 ? "on every hash in the database, as there's no " + code("PREFIX") : "on hashes", 1);
      if (prefix > 0) {
        var n = +argv[prefix + 1];
        push(prefix, prefix + 1 + n, "whose keys start with " + argv.slice(prefix + 2, prefix + 2 + n).map(code).join(" or "), 1);
      }
      if (filter > 0) push(filter, filter + 1, "and only those whose city is austin", 1);
      push(schema, schema, "indexing these fields:", 1);
      for (i = schema + 1; i < argv.length;) {
        var json = argv[i].indexOf("$.") === 0, name = json ? argv[i + 2] : argv[i], type = argv[i + (json ? 3 : 1)], end = i + (json ? 3 : 1);
        while (OPTS.indexOf(argv[end + 1]) >= 0) end++;
        var note = (json ? "the document's " + code(argv[i].slice(2)) + ", queried as " + code(name) : code(name)) + ", " + AS[type];
        argv.slice(i + (json ? 4 : 2), end + 1).forEach(function (o) { note += ", " + OPT[o]; });
        push(i, end, note, 2);
        i = end + 1;
      }
      var box = el("div", "rsi-create");
      box.appendChild(el("div", "rsi-createhead", "The index, part by part"));
      lines.forEach(function (l) {
        var toks = [];
        for (var j = l.from; j <= l.to; j++) { var t = esc(token(argv, j)); toks.push(m[j] ? '<mark class="rsi-mark">' + t + "</mark>" : t); }
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

    /* What each query looks for, in plain words. */
    var LOOK = { "@name:thai": "the word `thai` in `name`", "@name:kitchens": "the word `kitchens` in `name`", "@name:{Lotus Thai}": "the tag `Lotus Thai` in `name`",
      "@name:{Lotus*}": "tags in `name` that start with `Lotus`", "@rating:[4.5 +inf]": "a `rating` of 4.5 or more", "@rating:{4.5}": "the tag `4.5` in `rating`",
      "*": "every document", "@rating:[4 +inf]": "a `rating` of 4 or more", "ismissing(@rating)": "hashes with no `rating` field", '@cuisine:{""}': "an empty `cuisine`",
      "@name:sushi": "the word `sushi` in `name`" };
    /* The step's query as you'd type it, then what it asks for. */
    function queryBlock(c) {
      var a = c.query, at = function (w) { return a.indexOf(w); }, box = el("div", "rsi-create rsi-query"), s;
      box.appendChild(el("div", "rsi-createhead", a[0] === "FT.INFO" ? "The command" : "The query"));
      box.appendChild(el("div", "rsi-qline", '<span class="rsq-prompt">&gt; </span>' + cmdHtml(a)));
      if (a[0] === "FT.INFO") s = "Report on the index `" + a[1] + "`: how many documents it holds, and any indexing errors.";
      else {
        s = "Search `" + a[1] + "` for " + LOOK[a[2]];
        s += at("NOCONTENT") > 0 ? ", and return only the keys" : at("RETURN") > 0 ? ", and return just `" + a[at("RETURN") + 2] + "`" : ", and return each whole document";
        if (at("HIGHLIGHT") > 0) s += ", with the matched words highlighted";
        if (at("SORTBY") > 0) s += ", sorted by `" + a[at("SORTBY") + 1] + "`" + (a[at("SORTBY") + 2] === "DESC" ? ", highest first" : "");
        if (at("LIMIT") > 0) s += ", up to " + a[at("LIMIT") + 2] + " of them";
        if (at("DIALECT") > 0) s += ", using dialect " + a[at("DIALECT") + 1];
        s += ".";
      }
      box.appendChild(el("div", "rsi-qnote", md(s)));
      return box;
    }

    /* The reply to the step's query, exactly as redis-cli prints it. */
    function outputBlock(c) {
      var box = el("div", "rsi-create rsi-output"), cap = "Exactly what redis-cli prints.";
      box.appendChild(el("div", "rsi-createhead", "The output"));
      box.appendChild(el("pre", "rcr-code rsq-pre rsq-cmdline" + (c.error ? " is-err" : ""), esc(c.reply.replace(/\n$/, ""))));   // an error reply in red
      if (c.query[0] === "FT.INFO") cap += " Sizes, timings, and counters vary from server to server.";
      else if (st.tab === "keys") cap += " The keys come back in Redis's own order.";
      box.appendChild(el("div", "rcr-faint rsi-createcap", cap));
      return box;
    }

    /* The parts of a command the controls change, marked. */
    function marks(argv) {
      var m = {}, i, s = argv.indexOf("SCHEMA");
      if (argv[0] === "FT.CREATE") {
        if (st.tab === "types") argv.forEach(function (a, j) { if (j > s && (argv[j - 1] === "name" || argv[j - 1] === "rating")) m[j] = true; });
        if (st.tab === "keys") for (i = 4; i < s; i++) m[i] = true;
        if (st.tab === "gaps") argv.forEach(function (a, j) { if (a === "INDEXMISSING" || a === "INDEXEMPTY") m[j] = true; });
        if (st.tab === "stores") argv.forEach(function (a, j) { if (j === 3 || a.indexOf("$.") === 0 || argv[j - 1] && argv[j - 1].indexOf("$.") === 0 || argv[j - 2] && argv[j - 2].indexOf("$.") === 0) m[j] = true; });
      }
      if (st.tab === "types" && argv[0] === "FT.SEARCH") argv.forEach(function (a, j) { if (a === "DIALECT" || argv[j - 1] === "DIALECT") m[j] = true; });
      return m;
    }
    function cmdHtml(argv) {
      var m = marks(argv);
      return argv.map(function (a, i) { var t = esc(token(argv, i)); return m[i] ? '<mark class="rsi-mark">' + t + "</mark>" : t; }).join(" ");
    }
    render();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".rsq[data-search-index]"), init); }
  window.SearchIndexDemo = { cmdline: cmdline, data: { STORED: STORED, JSONGET: JSONGET, EXTRA: EXTRA, TYPES: TYPES, KEYS: KEYS, GAPS: GAPS, STORES: STORES } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
