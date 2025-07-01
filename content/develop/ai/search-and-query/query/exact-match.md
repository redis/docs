---
aliases:
- /develop/interact/search-and-query/query/exact-match
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
description: Perform simple exact match queries
linkTitle: Exact match
title: Exact match queries
weight: 1
---

An exact match query allows you to select all documents where a field matches a specific value. 

You can use exact match queries on several field types. The query syntax varies depending on the type. 

The examples in this article use a schema with the following fields:

| Field name | Field type |
| ---------- | ---------- |
| `description`| `TEXT` |
| `condition` | `TAG` |
| `price` | `NUMERIC` |

You can find more details about creating the index and loading the demo data in the [quick start guide]({{< relref "/develop/get-started/document-database" >}}).

## Numeric field

To perform an exact match query on a numeric field, you need to construct a range query with the same start and end value:

```
FT.SEARCH index "@field:[value value]"

or

FT.SEARCH index "@field:[value]" DIALECT 2 # requires v2.10

or

FT.SEARCH index "@field==value" DIALECT 2 # requires v2.10
```

As described in the [article about range queries]({{< relref "/develop/ai/search-and-query/query/range" >}}), you can also use the `FILTER` argument:

```
FT.SEARCH index "*" FILTER field start end
```

The following examples show you how to query for bicycles with a price of exactly 270 USD:

{{< clients-example query_em em1 >}}
> FT.SEARCH idx:bicycle "@price:[270 270]"
1) (integer) 1
2) "bicycle:0"
3) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-74.0610 40.7578, ...

> FT.SEARCH idx:bicycle "@price:[270]" # requires v2.10
1) (integer) 1
2) "bicycle:0"
3) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-74.0610 40.7578, ...

> FT.SEARCH idx:bicycle "@price==270" # requires v2.10
1) (integer) 1
2) "bicycle:0"
3) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-74.0610 40.7578, ...

> FT.SEARCH idx:bicycle "*" FILTER price 270 270
1) (integer) 1
2) "bicycle:0"
3) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-74.0610 40.7578, ...
{{< /clients-example >}}


## Tag field

A tag is a short sequence of text, for example, "new" or "Los Angeles". 

{{% alert title="Important" color="warning" %}}
If you need to query for short texts, use a tag query instead of a full-text query. Tag fields are more space-efficient for storing index entries and often lead to lower query complexity for exact match queries.
{{% /alert  %}}

You can construct a tag query for a single tag in the following way:

```
FT.SEARCH index "@field:{tag}"
```

{{% alert title="Note" color="warning" %}}
The curly brackets are mandatory for tag queries.
{{% /alert  %}}

This short example shows you how to query for new bicycles:

{{< clients-example query_em em2 >}}
> FT.SEARCH idx:bicycle "@condition:{new}"
 1) (integer) 5
 2) "bicycle:0"
 3) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((-74.0610 40.7578, -73.9510 40.7578, -73.9510 40.6678, -74.0610 40.6678, -74.0610 40.7578))\",\"store_location\":\"-74.0060,40.7128\",\"brand\":\"Velorim\",\"model\":\"Jigger\",\"price\":270,\"description\":\"Small and powerful, the Jigger is the best ride for the smallest of tikes! This is the tiniest kids\xe2\x80\x99 pedal bike on the market available without a coaster brake, the Jigger is the vehicle of choice for the rare tenacious little rider raring to go.\",\"condition\":\"new\"}"
 4) "bicycle:5"
 5) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((-0.1778 51.5524, 0.0822 51.5524, 0.0822 51.4024, -0.1778 51.4024, -0.1778 51.5524))\",\"store_location\":\"-0.1278,51.5074\",\"brand\":\"Breakout\",\"model\":\"XBN 2.1 Alloy\",\"price\":810,\"description\":\"The XBN 2.1 Alloy is our entry-level road bike \xe2\x80\x93 but that\xe2\x80\x99s not to say that it\xe2\x80\x99s a basic machine. With an internal weld aluminium frame, a full carbon fork, and the slick-shifting Claris gears from Shimano\xe2\x80\x99s, this is a bike which doesn\xe2\x80\x99t break the bank and delivers craved performance.\",\"condition\":\"new\"}"
 6) "bicycle:6"
 7) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((2.1767 48.9016, 2.5267 48.9016, 2.5267 48.5516, 2.1767 48.5516, 2.1767 48.9016))\",\"store_location\":\"2.3522,48.8566\",\"brand\":\"ScramBikes\",\"model\":\"WattBike\",\"price\":2300,\"description\":\"The WattBike is the best e-bike for people who still feel young at heart. It has a Bafang 1000W mid-drive system and a 48V 17.5AH Samsung Lithium-Ion battery, allowing you to ride for more than 60 miles on one charge. It\xe2\x80\x99s great for tackling hilly terrain or if you just fancy a more leisurely ride. With three working modes, you can choose between E-bike, assisted bicycle, and normal bike modes.\",\"condition\":\"new\"}"
 8) "bicycle:7"
 9) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((13.3260 52.5700, 13.6550 52.5700, 13.6550 52.2700, 13.3260 52.2700, 13.3260 52.5700))\",\"store_location\":\"13.4050,52.5200\",\"brand\":\"Peaknetic\",\"model\":\"Secto\",\"price\":430,\"description\":\"If you struggle with stiff fingers or a kinked neck or back after a few minutes on the road, this lightweight, aluminum bike alleviates those issues and allows you to enjoy the ride. From the ergonomic grips to the lumbar-supporting seat position, the Roll Low-Entry offers incredible comfort. The rear-inclined seat tube facilitates stability by allowing you to put a foot on the ground to balance at a stop, and the low step-over frame makes it accessible for all ability and mobility levels. The saddle is very soft, with a wide back to support your hip joints and a cutout in the center to redistribute that pressure. Rim brakes deliver satisfactory braking control, and the wide tires provide a smooth, stable ride on paved roads and gravel. Rack and fender mounts facilitate setting up the Roll Low-Entry as your preferred commuter, and the BMX-like handlebar offers space for mounting a flashlight, bell, or phone holder.\",\"condition\":\"new\"}"
10) "bicycle:8"
11) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((1.9450 41.4301, 2.4018 41.4301, 2.4018 41.1987, 1.9450 41.1987, 1.9450 41.4301))\",\"store_location\":\"2.1734, 41.3851\",\"brand\":\"nHill\",\"model\":\"Summit\",\"price\":1200,\"description\":\"This budget mountain bike from nHill performs well both on bike paths and on the trail. The fork with 100mm of travel absorbs rough terrain. Fat Kenda Booster tires give you grip in corners and on wet trails. The Shimano Tourney drivetrain offered enough gears for finding a comfortable pace to ride uphill, and the Tektro hydraulic disc brakes break smoothly. Whether you want an affordable bike that you can take to work, but also take trail in mountains on the weekends or you\xe2\x80\x99re just after a stable, comfortable ride for the bike path, the Summit gives a good value for money.\",\"condition\":\"new\"}"
{{< /clients-example >}}

Use double quotes and [DIALECT 2]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}}#dialect-2) for exact match queries involving tags that contain special characters. As of v2.10, the only character that needs escaping in queries involving double-quoted tags is the double-quote character. Here's an example of using double-quoted tags that contain special characters:

{{< clients-example query_em em3 >}}
> FT.CREATE idx:email ON JSON PREFIX 1 key: SCHEMA $.email AS email TAG
OK
> JSON.SET key:1 $ '{"email": "test@redis.com"}'
OK
> FT.SEARCH idx:email '@email:{"test@redis.com"}' DIALECT 2
1) (integer) 1
2) "key:1"
3) 1) "$"
   2) "{\"email\":\"test@redis.com\"}"
{{< /clients-example>}}

## Full-text field

A detailed explanation of full-text queries is available in the [full-text queries documentation]({{< relref "/develop/ai/search-and-query/query/full-text" >}}). You can also query for an exact match of a phrase within a text field:

```
FT.SEARCH index "@field:\"phrase\""
```

{{% alert title="Important" color="warning" %}}
The phrase must be wrapped by escaped double quotes for an exact match query.

You can't use a phrase that starts with a [stop word]({{< relref "/develop/ai/search-and-query/advanced-concepts/stopwords" >}}).
{{% /alert  %}}

Here is an example for finding all bicycles that have a description containing the exact text 'rough terrain':

{{< clients-example query_em em4 >}}
FT.SEARCH idx:bicycle "@description:\"rough terrain\""
1) (integer) 1
2) "bicycle:8"
3) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((1.9450 41.4301, 2.4018 41.4301, 2.4018 41.1987, 1.9450 41.1987, 1.9450 41.4301))\",\"store_location\":\"2.1734, 41.3851\",\"brand\":\"nHill\",\"model\":\"Summit\",\"price\":1200,\"description\":\"This budget mountain bike from nHill performs well both on bike paths and on the trail. The fork with 100mm of travel absorbs rough terrain. Fat Kenda Booster tires give you grip in corners and on wet trails. The Shimano Tourney drivetrain offered enough gears for finding a comfortable pace to ride uphill, and the Tektro hydraulic disc brakes break smoothly. Whether you want an affordable bike that you can take to work, but also take trail in mountains on the weekends or you\xe2\x80\x99re just after a stable, comfortable ride for the bike path, the Summit gives a good value for money.\",\"condition\":\"new\"}"
{{< /clients-example >}}