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
description: Learn how to store records in Redis so they can be searched, and when to choose hashes versus JSON documents.
linkTitle: 1. Data modeling
stack: true
title: Data modeling for search
aliases:
- /get-started/search-tutorial/data-modeling/
weight: 1
---

This is step 1 of the [search and query tutorial]({{< relref "/develop/get-started/search-tutorial" >}}).

Before you can search anything, you need to decide how to store it. Redis gives you two natural ways to represent a structured record like a product: as a **hash** or as a **JSON document**. Both can be indexed and searched. This page explains the difference, helps you choose, and then loads the tutorial dataset.

## A record as a hash

A [hash]({{< relref "/develop/data-types/hashes" >}}) stores a flat set of field-value pairs under a single key. It is the simplest way to represent a record and maps neatly onto a row of fields:

{{< clients-example set="search_tutorial" step="hash_example" description="Foundational: Store a record as a hash with HSET when your data is a flat set of fields" difficulty="beginner" >}}
> HSET product:1 name "Aurora AcousticPro Headphones" brand "Aurora" category "Audio" price 199.99 rating 4.6
(integer) 5
{{< /clients-example >}}

Hashes are compact and fast, but they are **flat**: every value is a string or number. There is no natural place to put a nested object (like a `specs` sub-record) or a list of values (like multiple `features`) without flattening or encoding it yourself.

## A record as a JSON document

The [JSON]({{< relref "/develop/data-types/json" >}}) data type stores a full JSON document under a key. It can represent nested objects and arrays directly, which matches how application data usually looks:

{{< clients-example set="search_tutorial" step="json_example" description="Foundational: Store a record as a JSON document with JSON.SET when your data has nested objects or arrays" difficulty="beginner" max_lines="6" >}}
> JSON.SET product:1 $ '{"name":"Aurora AcousticPro Headphones","brand":"Aurora","category":"Audio","price":199.99,"rating":4.6,"features":["wireless","noise-cancelling","bluetooth"],"specs":{"color":"midnight black","weight_grams":268}}'
OK
{{< /clients-example >}}

Notice that `features` is a real array and `specs` is a real nested object. You did not have to flatten them.

## Which should you use?

Both hashes and JSON documents can be indexed and searched by Redis Search, so you can search either one. Use this as a guide:

| Choose **hashes** when... | Choose **JSON** when... |
| --- | --- |
| Your records are flat (no nesting). | Your records have nested objects or arrays. |
| You want the smallest possible memory footprint. | You want your stored shape to match your application objects. |
| You frequently update individual fields. | You want to read, update, or index nested paths directly. |

For this tutorial, the catalog records have arrays (`features`) and a nested object (`specs`), so **we will use JSON documents** for the rest of the tutorial. If you are coming from a background where every record is a flat row, JSON is also a gentle way to keep your existing object shapes.

{{% alert title="Note" color="info" %}}
This is a modeling choice, not a limitation. The indexing and query commands you will learn (`FT.CREATE`, `FT.SEARCH`, `FT.AGGREGATE`) work with both hashes and JSON. The main practical difference shows up when indexing arrays, which you will see on the [next page]({{< relref "/develop/get-started/search-tutorial/indexing" >}}).
{{% /alert %}}

## Load the dataset

Now load the full catalog of 12 products. Each product is stored as a JSON document under a key with the prefix `product:`. The key prefix matters: in the next step you will tell Redis to index every key that starts with `product:`.

{{< clients-example set="search_tutorial" step="load_data" description="Foundational: Load the tutorial dataset as JSON documents under a shared key prefix using JSON.SET" difficulty="beginner" max_lines="4" >}}
> JSON.SET product:1 $ '{"name":"Aurora AcousticPro Headphones","brand":"Aurora","category":"Audio","description":"Over-ear wireless headphones with active noise cancelling and a 40-hour battery. Plush memory-foam earcups and a lightweight frame make them comfortable for all-day listening, whether you are commuting, working, or relaxing at home.","price":199.99,"rating":4.6,"review_count":1284,"stock":42,"release_year":2024,"features":["wireless","noise-cancelling","bluetooth","over-ear"],"specs":{"color":"midnight black","weight_grams":268,"warranty_years":2}}'
OK
> JSON.SET product:2 $ '{"name":"Aurora BudsMini Earbuds","brand":"Aurora","category":"Audio","description":"Tiny true-wireless earbuds with a secure in-ear fit and sweat resistance for workouts. The compact charging case slips into a pocket and delivers three full recharges on the go.","price":89.99,"rating":4.3,"review_count":942,"stock":130,"release_year":2023,"features":["wireless","bluetooth","in-ear","water-resistant"],"specs":{"color":"pearl white","weight_grams":5,"warranty_years":1}}'
OK
> JSON.SET product:3 $ '{"name":"Sonus Boom Portable Speaker","brand":"Sonus","category":"Audio","description":"A rugged portable Bluetooth speaker with deep bass and a waterproof shell. Toss it in a bag for the beach or a campsite and enjoy room-filling sound for up to 20 hours per charge.","price":129.5,"rating":4.5,"review_count":512,"stock":64,"release_year":2024,"features":["wireless","bluetooth","portable","waterproof"],"specs":{"color":"slate gray","weight_grams":540,"warranty_years":1}}'
OK
> JSON.SET product:4 $ '{"name":"Pixma Vortex 15 Laptop","brand":"Pixma","category":"Computers","description":"A thin-and-light 15-inch laptop with a fast multi-core processor, 16 GB of memory, and a speedy solid-state drive. The backlit keyboard and bright display make it a capable companion for work and study.","price":1399.0,"rating":4.7,"review_count":318,"stock":18,"release_year":2024,"features":["laptop","ssd","backlit-keyboard","lightweight"],"specs":{"color":"space silver","weight_grams":1600,"warranty_years":2}}'
OK
> JSON.SET product:5 $ '{"name":"Pixma UltraView 27 Monitor","brand":"Pixma","category":"Computers","description":"A 27-inch 4K monitor with an IPS panel for accurate colors and wide viewing angles. A single USB-C cable carries video and power, keeping your desk tidy.","price":329.99,"rating":4.4,"review_count":221,"stock":27,"release_year":2023,"features":["monitor","4k","ips","usb-c"],"specs":{"color":"black","weight_grams":5200,"warranty_years":3}}'
OK
> JSON.SET product:6 $ '{"name":"Clackr Mechanical Keyboard","brand":"Clackr","category":"Accessories","description":"A compact mechanical keyboard with tactile switches, per-key RGB lighting, and wireless connectivity. Hot-swappable switches let you tune the typing feel without soldering.","price":119.0,"rating":4.8,"review_count":1502,"stock":88,"release_year":2024,"features":["keyboard","mechanical","rgb","wireless"],"specs":{"color":"graphite","weight_grams":720,"warranty_years":2}}'
OK
> JSON.SET product:7 $ '{"name":"Glide Pro Wireless Mouse","brand":"Glide","category":"Accessories","description":"An ergonomic wireless mouse with a high-precision sensor and a contoured shape that reduces wrist strain. A single charge lasts for weeks of everyday use.","price":59.99,"rating":4.2,"review_count":869,"stock":150,"release_year":2022,"features":["mouse","wireless","ergonomic"],"specs":{"color":"charcoal","weight_grams":98,"warranty_years":1}}'
OK
> JSON.SET product:8 $ '{"name":"Pulse Series 6 Smartwatch","brand":"Pulse","category":"Wearables","description":"A sleek smartwatch with built-in GPS, continuous heart-rate monitoring, and water resistance for swimming. Track workouts, sleep, and notifications from your wrist.","price":249.0,"rating":4.5,"review_count":1733,"stock":51,"release_year":2024,"features":["smartwatch","gps","heart-rate","water-resistant"],"specs":{"color":"rose gold","weight_grams":38,"warranty_years":1}}'
OK
> JSON.SET product:9 $ '{"name":"Pulse Band Fitness Tracker","brand":"Pulse","category":"Wearables","description":"A lightweight fitness band that tracks steps, heart rate, and sleep stages. The slim screen shows daily progress and the battery lasts a full week between charges.","price":79.99,"rating":4.1,"review_count":2210,"stock":200,"release_year":2023,"features":["fitness-tracker","heart-rate","sleep-tracking"],"specs":{"color":"ocean blue","weight_grams":24,"warranty_years":1}}'
OK
> JSON.SET product:10 $ '{"name":"Lumi Glow Smart Bulb","brand":"Lumi","category":"Home","description":"A color-changing smart bulb that connects over Wi-Fi and works with voice assistants. Dim it for movie night or set a warm white for reading, all from your phone.","price":24.99,"rating":4.0,"review_count":640,"stock":320,"release_year":2022,"features":["smart-home","wifi","dimmable","color"],"specs":{"color":"white","weight_grams":70,"warranty_years":2}}'
OK
> JSON.SET product:11 $ '{"name":"Lumi Climate Smart Thermostat","brand":"Lumi","category":"Home","description":"A learning smart thermostat that adjusts heating and cooling to your routine and helps lower energy bills. The crisp display and Wi-Fi app make scheduling effortless.","price":149.0,"rating":4.6,"review_count":388,"stock":75,"release_year":2024,"features":["smart-home","wifi","energy-saving"],"specs":{"color":"white","weight_grams":210,"warranty_years":3}}'
OK
> JSON.SET product:12 $ '{"name":"Vista Action Cam 4K","brand":"Vista","category":"Cameras","description":"A pocket-sized action camera that shoots stabilized 4K video and is waterproof without a case. Mount it on a helmet or bike and capture your adventures in sharp detail.","price":299.0,"rating":4.3,"review_count":455,"stock":33,"release_year":2023,"features":["camera","4k","waterproof","wifi"],"specs":{"color":"black","weight_grams":128,"warranty_years":1}}'
OK
{{< /clients-example >}}

You can read any single document back by its key with [JSON.GET]({{< relref "/commands/json.get" >}}):

{{< clients-example set="search_tutorial" step="get_one" description="Foundational: Read one JSON document back by its key with JSON.GET" difficulty="beginner" >}}
> JSON.GET product:1 $.name
"[\"Aurora AcousticPro Headphones\"]"
{{< /clients-example >}}

At this point the data is in Redis, but you can only fetch it one key at a time. To *search* across all products, you need an index.

## Next steps

Continue to [creating an index]({{< relref "/develop/get-started/search-tutorial/indexing" >}}) to make this data searchable.
