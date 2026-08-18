---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Use FT.AGGREGATE to group, summarize, and transform your data with GROUPBY, REDUCE, and APPLY.
linkTitle: 4. Aggregation
stack: true
title: Aggregate your data
aliases:
- /get-started/search-tutorial/aggregation/
weight: 4
---

This is step 4 of the [Redis Search tutorial]({{< relref "/develop/get-started/search-tutorial" >}}). It builds on the [index]({{< relref "/develop/get-started/search-tutorial/indexing" >}}) and the queries from [the previous step]({{< relref "/develop/get-started/search-tutorial/search" >}}).

<details><summary>Reload products data and re-create index</summary>
{{% redis-cli %}}
redis> FT.CREATE idx:catalog ON JSON PREFIX 1 product: SCHEMA $.name AS name TEXT $.brand AS brand TAG SORTABLE $.category AS category TAG $.description AS description TEXT $.price AS price NUMERIC SORTABLE $.rating AS rating NUMERIC SORTABLE $.review_count AS review_count NUMERIC $.stock AS stock NUMERIC $.release_year AS release_year NUMERIC SORTABLE $.features[*] AS features TAG
OK
redis> JSON.SET product:1 $ '{"name":"Aurora AcousticPro Headphones","brand":"Aurora","category":"Audio","price":199.99,"rating":4.6,"features":["wireless","noise-cancelling","bluetooth"],"specs":{"color":"midnight black","weight_grams":268}}'
OK
redis> JSON.SET product:2 $ '{"name":"Aurora BudsMini Earbuds","brand":"Aurora","category":"Audio","description":"Tiny true-wireless earbuds with a secure in-ear fit and sweat resistance for workouts. The compact charging case slips into a pocket and delivers three full recharges on the go.","price":89.99,"rating":4.3,"review_count":942,"stock":130,"release_year":2023,"features":["wireless","bluetooth","in-ear","water-resistant"],"specs":{"color":"pearl white","weight_grams":5,"warranty_years":1}}'
OK
redis> JSON.SET product:3 $ '{"name":"Sonus Boom Portable Speaker","brand":"Sonus","category":"Audio","description":"A rugged portable Bluetooth speaker with deep bass and a waterproof shell. Toss it in a bag for the beach or a campsite and enjoy room-filling sound for up to 20 hours per charge.","price":129.5,"rating":4.5,"review_count":512,"stock":64,"release_year":2024,"features":["wireless","bluetooth","portable","waterproof"],"specs":{"color":"slate gray","weight_grams":540,"warranty_years":1}}'
OK
redis> JSON.SET product:4 $ '{"name":"Pixma Vortex 15 Laptop","brand":"Pixma","category":"Computers","description":"A thin-and-light 15-inch laptop with a fast multi-core processor, 16 GB of memory, and a speedy solid-state drive. The backlit keyboard and bright display make it a capable companion for work and study.","price":1399.0,"rating":4.7,"review_count":318,"stock":18,"release_year":2024,"features":["laptop","ssd","backlit-keyboard","lightweight"],"specs":{"color":"space silver","weight_grams":1600,"warranty_years":2}}'
OK
redis> JSON.SET product:5 $ '{"name":"Pixma UltraView 27 Monitor","brand":"Pixma","category":"Computers","description":"A 27-inch 4K monitor with an IPS panel for accurate colors and wide viewing angles. A single USB-C cable carries video and power, keeping your desk tidy.","price":329.99,"rating":4.4,"review_count":221,"stock":27,"release_year":2023,"features":["monitor","4k","ips","usb-c"],"specs":{"color":"black","weight_grams":5200,"warranty_years":3}}'
OK
redis> JSON.SET product:6 $ '{"name":"Clackr Mechanical Keyboard","brand":"Clackr","category":"Accessories","description":"A compact mechanical keyboard with tactile switches, per-key RGB lighting, and wireless connectivity. Hot-swappable switches let you tune the typing feel without soldering.","price":119.0,"rating":4.8,"review_count":1502,"stock":88,"release_year":2024,"features":["keyboard","mechanical","rgb","wireless"],"specs":{"color":"graphite","weight_grams":720,"warranty_years":2}}'
OK
redis> JSON.SET product:7 $ '{"name":"Glide Pro Wireless Mouse","brand":"Glide","category":"Accessories","description":"An ergonomic wireless mouse with a high-precision sensor and a contoured shape that reduces wrist strain. A single charge lasts for weeks of everyday use.","price":59.99,"rating":4.2,"review_count":869,"stock":150,"release_year":2022,"features":["mouse","wireless","ergonomic"],"specs":{"color":"charcoal","weight_grams":98,"warranty_years":1}}'
OK
redis> JSON.SET product:8 $ '{"name":"Pulse Series 6 Smartwatch","brand":"Pulse","category":"Wearables","description":"A sleek smartwatch with built-in GPS, continuous heart-rate monitoring, and water resistance for swimming. Track workouts, sleep, and notifications from your wrist.","price":249.0,"rating":4.5,"review_count":1733,"stock":51,"release_year":2024,"features":["smartwatch","gps","heart-rate","water-resistant"],"specs":{"color":"rose gold","weight_grams":38,"warranty_years":1}}'
OK
redis> JSON.SET product:9 $ '{"name":"Pulse Band Fitness Tracker","brand":"Pulse","category":"Wearables","description":"A lightweight fitness band that tracks steps, heart rate, and sleep stages. The slim screen shows daily progress and the battery lasts a full week between charges.","price":79.99,"rating":4.1,"review_count":2210,"stock":200,"release_year":2023,"features":["fitness-tracker","heart-rate","sleep-tracking"],"specs":{"color":"ocean blue","weight_grams":24,"warranty_years":1}}'
OK
redis> JSON.SET product:10 $ '{"name":"Lumi Glow Smart Bulb","brand":"Lumi","category":"Home","description":"A color-changing smart bulb that connects over Wi-Fi and works with voice assistants. Dim it for movie night or set a warm white for reading, all from your phone.","price":24.99,"rating":4.0,"review_count":640,"stock":320,"release_year":2022,"features":["smart-home","wifi","dimmable","color"],"specs":{"color":"white","weight_grams":70,"warranty_years":2}}'
OK
redis> JSON.SET product:11 $ '{"name":"Lumi Climate Smart Thermostat","brand":"Lumi","category":"Home","description":"A learning smart thermostat that adjusts heating and cooling to your routine and helps lower energy bills. The crisp display and Wi-Fi app make scheduling effortless.","price":149.0,"rating":4.6,"review_count":388,"stock":75,"release_year":2024,"features":["smart-home","wifi","energy-saving"],"specs":{"color":"white","weight_grams":210,"warranty_years":3}}'
OK
redis> JSON.SET product:12 $ '{"name":"Vista Action Cam 4K","brand":"Vista","category":"Cameras","description":"A pocket-sized action camera that shoots stabilized 4K video and is waterproof without a case. Mount it on a helmet or bike and capture your adventures in sharp detail.","price":299.0,"rating":4.3,"review_count":455,"stock":33,"release_year":2023,"features":["camera","4k","waterproof","wifi"],"specs":{"color":"black","weight_grams":128,"warranty_years":1}}'
OK
{{% /redis-cli %}}

</details>

`FT.SEARCH` answers "*which records match?*". Often you want to answer a different kind of question:

- How many products are in each category?
- What is the average price per category?
- Which brand has the highest average rating?

These are **aggregation** questions. They summarize across many documents instead of returning them one by one. The [FT.AGGREGATE]({{< relref "/commands/ft.aggregate" >}}) command handles them by running your results through a pipeline of steps. The three you will use most are:

- **`GROUPBY`** &mdash; collect documents into groups that share a field value.
- **`REDUCE`** &mdash; compute something for each group, such as a count or an average.
- **`APPLY`** &mdash; calculate a new value from existing fields.

## Count documents per group

The most common aggregation is a grouped count. This groups every product by `category` and counts how many fall into each. `REDUCE COUNT 0` counts the documents in each group, and `AS count` names the result:

{{< clients-example set="search_tutorial" step="agg_count" description="Grouped count: Use GROUPBY with REDUCE COUNT to count documents in each group" difficulty="beginner" >}}
> FT.AGGREGATE idx:catalog "*" GROUPBY 1 @category REDUCE COUNT 0 AS count
1) (integer) 6
2) 1) "category"
   2) "Audio"
   3) "count"
   4) "3"
3) 1) "category"
   2) "Computers"
   3) "count"
   4) "2"
4) 1) "category"
   2) "Accessories"
   3) "count"
   4) "2"
5) 1) "category"
   2) "Home"
   3) "count"
   4) "2"
6) 1) "category"
   2) "Wearables"
   3) "count"
   4) "2"
7) 1) "category"
   2) "Cameras"
   3) "count"
   4) "1"
{{< /clients-example >}}

The `"*"` after the index name is a query expression, exactly like in `FT.SEARCH`. Here it means "aggregate over all documents", but you could narrow the input first, for example `@price:[0 100]` to aggregate only the cheaper products. `GROUPBY 1 @category` reads as "group by one field: `category`".

## Compute an average per group

Swap `COUNT` for a different reducer to compute other summaries. This calculates the average price in each category and sorts the groups from most to least expensive with `SORTBY`:

{{< clients-example set="search_tutorial" step="agg_avg" description="Grouped average: Use REDUCE AVG to average a numeric field per group, then order groups with SORTBY" difficulty="intermediate" >}}
> FT.AGGREGATE idx:catalog "*" GROUPBY 1 @category REDUCE AVG 1 @price AS avg_price SORTBY 2 @avg_price DESC
1) (integer) 6
2) 1) "category"
   2) "Computers"
   3) "avg_price"
   4) "864.495"
3) 1) "category"
   2) "Cameras"
   3) "avg_price"
   4) "299"
4) 1) "category"
   2) "Wearables"
   3) "avg_price"
   4) "164.495"
5) 1) "category"
   2) "Audio"
   3) "avg_price"
   4) "139.826666667"
6) 1) "category"
   2) "Accessories"
   3) "avg_price"
   4) "89.495"
7) 1) "category"
   2) "Home"
   3) "avg_price"
   4) "86.995"
{{< /clients-example >}}

`REDUCE AVG 1 @price` reads as "apply the AVG reducer to one field: `price`". The `SORTBY 2 @avg_price DESC` clause sorts by the computed `avg_price` value; the `2` is the number of arguments that follow (`@avg_price` and `DESC`). Other reducers include `SUM`, `MIN`, `MAX`, and `COUNT_DISTINCT`; see the [aggregation reference]({{< relref "/develop/ai/search-and-query/advanced-concepts/aggregations" >}}) for the full list.

## Calculate new values with APPLY

`APPLY` evaluates an expression against each record and adds the result as a new field. This takes the Audio products, loads their name and price, and computes a 10%-off `sale_price`:

{{< clients-example set="search_tutorial" step="agg_apply" description="Calculated field: Use APPLY to derive a new value (a discounted price) from an existing field" difficulty="intermediate" >}}
> FT.AGGREGATE idx:catalog "@category:{Audio}" LOAD 2 name price APPLY "@price - (@price * 0.1)" AS sale_price
1) (integer) 3
2) 1) "name"
   2) "Aurora AcousticPro Headphones"
   3) "price"
   4) "199.99"
   5) "sale_price"
   6) "179.991"
3) 1) "name"
   2) "Sonus Boom Portable Speaker"
   3) "price"
   4) "129.5"
   5) "sale_price"
   6) "116.55"
4) 1) "name"
   2) "Aurora BudsMini Earbuds"
   3) "price"
   4) "89.99"
   5) "sale_price"
   6) "80.991"
{{< /clients-example >}}

The `LOAD 2 name price` clause pulls those two fields into the pipeline so the expression can use them and so they appear in the output. `APPLY` does not group anything; it transforms each record in place.

## Build a pipeline

The real power of `FT.AGGREGATE` is chaining these steps. This finds the average rating per brand and returns the highest-rated brands first &mdash; a simple "best brands" leaderboard:

{{< clients-example set="search_tutorial" step="agg_pipeline" description="Pipeline: Combine GROUPBY, REDUCE, and SORTBY to rank brands by average rating" difficulty="intermediate" >}}
> FT.AGGREGATE idx:catalog "*" GROUPBY 1 @brand REDUCE AVG 1 @rating AS avg_rating SORTBY 2 @avg_rating DESC
1) (integer) 8
2) 1) "brand"
   2) "Clackr"
   3) "avg_rating"
   4) "4.8"
3) 1) "brand"
   2) "Pixma"
   3) "avg_rating"
   4) "4.55"
4) 1) "brand"
   2) "Sonus"
   3) "avg_rating"
   4) "4.5"
5) 1) "brand"
   2) "Aurora"
   3) "avg_rating"
   4) "4.45"
{{< /clients-example >}}

(The output is truncated; eight brands are returned in all.) You can keep extending the pipeline &mdash; apply multiple reducers under one `GROUPBY`, chain a second `GROUPBY`, add `FILTER` and `LIMIT` steps, and more. See the [aggregation queries]({{< relref "/develop/ai/search-and-query/query/aggregation" >}}) guide for deeper examples.

{{% alert title="Try it in Redis Insight" color="info" %}}
Aggregation results are tabular by nature, so they are especially easy to read in the [Redis Insight Search workspace]({{< relref "/develop/tools/insight/search-workspace" >}}). Paste any `FT.AGGREGATE` command from this page into the query editor to see each group as a row.
{{% /alert %}}

## Next steps

You can now find, filter, and summarize structured data. The final step goes beyond keywords and exact values to search by *meaning*. Continue to [vector and hybrid search]({{< relref "/develop/get-started/search-tutorial/vector-search" >}}).
