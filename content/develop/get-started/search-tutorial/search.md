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
description: Use FT.SEARCH to find documents by full text, tags, and numeric ranges, and to return only the fields you want.
linkTitle: 3. Searching
stack: true
title: Search and filter your data
aliases:
- /get-started/search-tutorial/search/
weight: 3
---

This is step 3 of the [Redis Search tutorial]({{< relref "/develop/get-started/search-tutorial" >}}).

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

Now the fun part: asking questions. The [FT.SEARCH]({{< relref "/commands/ft.search" >}}) command does two jobs:

- **Selection** &mdash; choose *which* documents to return, by matching text, tags, and numeric ranges.
- **Projection** &mdash; choose *which fields* of each matching document to return.

Every query has the same basic shape: `FT.SEARCH <index> "<query>"`, optionally followed by clauses that control what comes back.

## Return everything

The `*` query matches every document. Use it to confirm the index is working. The first line of the result is the total number of matches:

{{< clients-example set="search_tutorial" step="search_all" description="Foundational: Match every document with the wildcard query to confirm the index works" difficulty="beginner" >}}
> FT.SEARCH idx:catalog "*" LIMIT 0 0
1) (integer) 12
{{< /clients-example >}}

The `LIMIT 0 0` clause asks for zero documents, so you get just the count. By default `FT.SEARCH` returns the full document for each match, which is verbose. The rest of this page uses `RETURN` to keep the output readable.

## Full-text search

Fields you indexed as `TEXT` support full-text search: matching by word, regardless of position or surrounding text. To search a specific field, prefix the term with `@fieldname:`.

This finds products whose `name` contains the word *headphones*:

{{< clients-example set="search_tutorial" step="search_text" description="Full-text search: Match a word within a TEXT field using the @field:term syntax" difficulty="beginner" >}}
> FT.SEARCH idx:catalog "@name:headphones" RETURN 1 name
1) (integer) 1
2) "product:1"
3) 1) "name"
   2) "Aurora AcousticPro Headphones"
{{< /clients-example >}}

Full-text matching is case-insensitive and word-based, so `headphones` matches `Headphones`. You can also search across all `TEXT` fields at once by leaving off the `@field:` prefix; for example, `FT.SEARCH idx:catalog "wireless"` matches any product with *wireless* in its name or description.

### Match an exact phrase

To match an exact phrase &mdash; several words that must appear together and in order &mdash; wrap the phrase in escaped double quotes. This finds products whose description contains the phrase *noise cancelling*:

{{< clients-example set="search_tutorial" step="search_phrase" description="Exact phrase: Match an ordered, contiguous phrase in a TEXT field by wrapping it in escaped double quotes" difficulty="intermediate" >}}
> FT.SEARCH idx:catalog "@description:\"noise cancelling\"" RETURN 1 name
1) (integer) 1
2) "product:1"
3) 1) "name"
   2) "Aurora AcousticPro Headphones"
{{< /clients-example >}}

Without the quotes, `@description:noise cancelling` matches the two words independently: both must be present, but they can appear anywhere in the field and in any order. The quotes are what require them to sit together as a phrase.

## Filter by tag

Fields you indexed as `TAG` match on exact values. Tag values go inside curly braces: `@field:{value}`.

This finds every product in the `Audio` category and returns the name and price of each:

{{< clients-example set="search_tutorial" step="search_tag" description="Tag filter: Match an exact TAG value using the @field:{value} syntax" difficulty="beginner" >}}
> FT.SEARCH idx:catalog "@category:{Audio}" RETURN 2 name price
1) (integer) 3
2) "product:2"
3) 1) "name"
   2) "Aurora BudsMini Earbuds"
   3) "price"
   4) "89.99"
4) "product:3"
5) 1) "name"
   2) "Sonus Boom Portable Speaker"
   3) "price"
   4) "129.5"
6) "product:1"
7) 1) "name"
   2) "Aurora AcousticPro Headphones"
   3) "price"
   4) "199.99"
{{< /clients-example >}}

Because `features` was indexed as a multi-value tag (the `[*]` from the [previous step]({{< relref "/develop/get-started/search-tutorial/indexing" >}})), the same syntax filters on individual list elements. This finds every `waterproof` product:

{{< clients-example set="search_tutorial" step="search_tag_array" description="Tag filter on arrays: Match a single element of a multi-value TAG field" difficulty="beginner" >}}
> FT.SEARCH idx:catalog "@features:{waterproof}" RETURN 1 name
1) (integer) 2
2) "product:3"
3) 1) "name"
   2) "Sonus Boom Portable Speaker"
4) "product:12"
5) 1) "name"
   2) "Vista Action Cam 4K"
{{< /clients-example >}}

## Filter by numeric range

Fields you indexed as `NUMERIC` match on ranges, written as `@field:[min max]`. This finds products priced at $100 or less, sorted from cheapest to most expensive with `SORTBY`:

{{< clients-example set="search_tutorial" step="search_range" description="Numeric range: Match a NUMERIC field within [min max] and order results with SORTBY" difficulty="beginner" >}}
> FT.SEARCH idx:catalog "@price:[0 100]" SORTBY price ASC RETURN 2 name price
1) (integer) 4
2) "product:10"
3) 1) "price"
   2) "24.99"
   3) "name"
   4) "Lumi Glow Smart Bulb"
4) "product:7"
5) 1) "price"
   2) "59.99"
   3) "name"
   4) "Glide Pro Wireless Mouse"
6) "product:9"
7) 1) "price"
   2) "79.99"
   3) "name"
   4) "Pulse Band Fitness Tracker"
8) "product:2"
9) 1) "price"
   2) "89.99"
   3) "name"
   4) "Aurora BudsMini Earbuds"
{{< /clients-example >}}

Use `-inf` and `+inf` for open-ended ranges. For example, `@price:[1000 +inf]` matches everything priced $1000 or more.

## Combine conditions

Real questions usually combine several conditions. Listing expressions one after another means **AND**: every condition must match. This finds Audio products that also cost $100 or less:

{{< clients-example set="search_tutorial" step="search_combined" description="Combined query: AND multiple conditions by listing them together (tag plus numeric range)" difficulty="intermediate" >}}
> FT.SEARCH idx:catalog "@category:{Audio} @price:[0 100]" RETURN 2 name price
1) (integer) 1
2) "product:2"
3) 1) "name"
   2) "Aurora BudsMini Earbuds"
   3) "price"
   4) "89.99"
{{< /clients-example >}}

Only the BudsMini Earbuds satisfy both conditions. You can also express OR with `|` and negation with `-`. See [Combined queries]({{< relref "/develop/ai/search-and-query/query/combined" >}}) for the full set of operators.

## Projection: return only what you need

You have already been using `RETURN` to pick fields. It is worth calling out on its own, because returning only the fields you need keeps responses small and fast:

- `RETURN 2 name price` returns just those two fields.
- Without `RETURN`, the full document comes back for every match.
- `LIMIT <offset> <count>` controls how many results you get and is the basis for pagination. By default, `FT.SEARCH` returns the first 10 matches.

This returns the three most expensive products, newest pricing first, with only their name and price:

{{< clients-example set="search_tutorial" step="search_projection" description="Projection and paging: Return only chosen fields, sort, and page results with RETURN, SORTBY, and LIMIT" difficulty="intermediate" >}}
> FT.SEARCH idx:catalog "*" SORTBY price DESC RETURN 2 name price LIMIT 0 3
1) (integer) 12
2) "product:4"
3) 1) "price"
   2) "1399"
   3) "name"
   4) "Pixma Vortex 15 Laptop"
4) "product:5"
5) 1) "price"
   2) "329.99"
   3) "name"
   4) "Pixma UltraView 27 Monitor"
6) "product:12"
7) 1) "price"
   2) "299"
   3) "name"
   4) "Vista Action Cam 4K"
{{< /clients-example >}}

The total is still `12` (the count of all matches), but only three documents are returned because of `LIMIT 0 3`.

{{% alert title="Try it in Redis Insight" color="info" %}}
The [Redis Insight Search workspace]({{< relref "/develop/tools/insight/search-workspace" >}}) has a query editor that understands your index schema. As you type `@`, it suggests field names and tag values, and it renders results as a table instead of the numbered list you see in `redis-cli`. It is a comfortable place to experiment with the queries on this page.
{{% /alert %}}

## Next steps

`FT.SEARCH` finds and returns documents. When you need to *summarize* across many documents &mdash; counts, averages, totals per group &mdash; you use a different command. Continue to [aggregation]({{< relref "/develop/get-started/search-tutorial/aggregation" >}}).
