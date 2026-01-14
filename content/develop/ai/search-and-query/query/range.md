---
aliases:
- /develop/interact/search-and-query/query/range
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
description: Perform numeric range queries
linkTitle: Range
title: Range queries
weight: 2
---

A range query on a numeric field returns the values that are in between a given start and end value:

```
FT.SEARCH index "@field:[start end]"
```

You can also use the `FILTER` argument, but you need to know that the query execution plan is different because the filter is applied after the query string (e.g., `*`) is evaluated:

```
FT.SEARCH index "*" FILTER field start end
```

## Start and end values

Start and end values are by default inclusive, but you can prepend `(` to a value to exclude it from the range.

The values `-inf`, `inf`, and `+inf` are valid values that allow you to define open ranges.

## Result set

An open-range query can lead to a large result set. 

By default, [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) returns only the first ten results. The `LIMIT` argument helps you to scroll through the result set. The `SORTBY` argument ensures that the documents in the result set are returned in the specified order.

```
FT.SEARCH index "@field:[start end]" SORTBY field LIMIT page_start page_end
```

You can find further details about using the `LIMIT` and `SORTBY` in the [[`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) command reference](/commands/ft.search/).

## Examples

The examples in this section use a schema with the following fields:

| Field name | Field type |
| ---------- | ---------- |
| `price` | `NUMERIC` |

The following query finds bicycles within a price range greater than or equal to 500 USD and smaller than or equal to 1000 USD (`500 <= price <= 1000`):

{{< clients-example set="query_range" step="range1" description="Foundational: Query numeric fields with inclusive range syntax when you need to find documents with values between two bounds" difficulty="beginner" >}}
> FT.SEARCH idx:bicycle "@price:[500 1000]"
1) (integer) 3
2) "bicycle:2"
3) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-87.6848 41.9331, -87.5748 41.9331, -87.5748 41.8231, -87.6848 41.8231, -87.6848 41.9331))\",\"store_location\":\"-87.6298,41.8781\",\"brand\":\"Nord\",\"model\":\"Chook air 5\",\"price\":815,\"description\":\"The Chook Air 5  gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower  top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails.\",\"condition\":\"used\"}"
4) "bicycle:5"
5) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-0.1778 51.5524, 0.0822 51.5524, 0.0822 51.4024, -0.1778 51.4024, -0.1778 51.5524))\",\"store_location\":\"-0.1278,51.5074\",\"brand\":\"Breakout\",\"model\":\"XBN 2.1 Alloy\",\"price\":810,\"description\":\"The XBN 2.1 Alloy is our entry-level road bike \xe2\x80\x93 but that\xe2\x80\x99s not to say that it\xe2\x80\x99s a basic machine. With an internal weld aluminium frame, a full carbon fork, and the slick-shifting Claris gears from Shimano\xe2\x80\x99s, this is a bike which doesn\xe2\x80\x99t break the bank and delivers craved performance.\",\"condition\":\"new\"}"
6) "bicycle:9"
7) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((12.4464 42.1028, 12.5464 42.1028, 12.5464 41.7028, 12.4464 41.7028, 12.4464 42.1028))\",\"store_location\":\"12.4964,41.9028\",\"model\":\"ThrillCycle\",\"brand\":\"BikeShind\",\"price\":815,\"description\":\"An artsy,  retro-inspired bicycle that\xe2\x80\x99s as functional as it is pretty: The ThrillCycle steel frame offers a smooth ride. A 9-speed drivetrain has enough gears for coasting in the city, but we wouldn\xe2\x80\x99t suggest taking it to the mountains. Fenders protect you from mud, and a rear basket lets you transport groceries, flowers and books. The ThrillCycle comes with a limited lifetime warranty, so this little guy will last you long past graduation.\",\"condition\":\"refurbished\"}"
{{< /clients-example >}}

This is semantically equivalent to:

{{< clients-example set="query_range" step="range2" description="Foundational: Query numeric fields using a FILTER clause when you need an alternative syntax for range queries with different query execution semantics" difficulty="beginner" >}}
> FT.SEARCH idx:bicycle "*" FILTER price 500 1000
1) (integer) 3
2) "bicycle:2"
3) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-87.6848 41.9331, -87.5748 41.9331, -87.5748 41.8231, -87.6848 41.8231, -87.6848 41.9331))\",\"store_location\":\"-87.6298,41.8781\",\"brand\":\"Nord\",\"model\":\"Chook air 5\",\"price\":815,\"description\":\"The Chook Air 5  gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower  top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails.\",\"condition\":\"used\"}"
4) "bicycle:5"
5) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((-0.1778 51.5524, 0.0822 51.5524, 0.0822 51.4024, -0.1778 51.4024, -0.1778 51.5524))\",\"store_location\":\"-0.1278,51.5074\",\"brand\":\"Breakout\",\"model\":\"XBN 2.1 Alloy\",\"price\":810,\"description\":\"The XBN 2.1 Alloy is our entry-level road bike \xe2\x80\x93 but that\xe2\x80\x99s not to say that it\xe2\x80\x99s a basic machine. With an internal weld aluminium frame, a full carbon fork, and the slick-shifting Claris gears from Shimano\xe2\x80\x99s, this is a bike which doesn\xe2\x80\x99t break the bank and delivers craved performance.\",\"condition\":\"new\"}"
6) "bicycle:9"
7) 1) "$"
   2) "{\"pickup_zone\":\"POLYGON((12.4464 42.1028, 12.5464 42.1028, 12.5464 41.7028, 12.4464 41.7028, 12.4464 42.1028))\",\"store_location\":\"12.4964,41.9028\",\"model\":\"ThrillCycle\",\"brand\":\"BikeShind\",\"price\":815,\"description\":\"An artsy,  retro-inspired bicycle that\xe2\x80\x99s as functional as it is pretty: The ThrillCycle steel frame offers a smooth ride. A 9-speed drivetrain has enough gears for coasting in the city, but we wouldn\xe2\x80\x99t suggest taking it to the mountains. Fenders protect you from mud, and a rear basket lets you transport groceries, flowers and books. The ThrillCycle comes with a limited lifetime warranty, so this little guy will last you long past graduation.\",\"condition\":\"refurbished\"}"
{{< /clients-example >}}

For bicycles with a price greater than 1000 USD (`price > 1000`), you can use:

{{< clients-example set="query_range" step="range3" description="Intermediate: Query numeric fields with open ranges using infinity notation and exclusive bounds when you need to find documents above or below a threshold" difficulty="intermediate" >}}
> FT.SEARCH idx:bicycle "@price:[(1000 +inf]"
 1) (integer) 5
 2) "bicycle:1"
 3) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((-118.2887 34.0972, -118.1987 34.0972, -118.1987 33.9872, -118.2887 33.9872, -118.2887 34.0972))\",\"store_location\":\"-118.2437,34.0522\",\"brand\":\"Bicyk\",\"model\":\"Hillcraft\",\"price\":1200,\"description\":\"Kids want to ride with as little weight as possible. Especially on an incline! They may be at the age when a 27.5\\\" wheel bike is just too clumsy coming off a 24\\\" bike. The Hillcraft 26 is just the solution they need!\",\"condition\":\"used\"}"
 4) "bicycle:4"
 5) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((-122.4644 37.8199, -122.3544 37.8199, -122.3544 37.7099, -122.4644 37.7099, -122.4644 37.8199))\",\"store_location\":\"-122.4194,37.7749\",\"brand\":\"Noka Bikes\",\"model\":\"Kahuna\",\"price\":3200,\"description\":\"Whether you want to try your hand at XC racing or are looking for a lively trail bike that's just as inspiring on the climbs as it is over rougher ground, the Wilder is one heck of a bike built specifically for short women. Both the frames and components have been tweaked to include a women\xe2\x80\x99s saddle, different bars and unique colourway.\",\"condition\":\"used\"}"
 6) "bicycle:3"
 7) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((-80.2433 25.8067, -80.1333 25.8067, -80.1333 25.6967, -80.2433 25.6967, -80.2433 25.8067))\",\"store_location\":\"-80.1918,25.7617\",\"brand\":\"Eva\",\"model\":\"Eva 291\",\"price\":3400,\"description\":\"The sister company to Nord, Eva launched in 2005 as the first and only women-dedicated bicycle brand. Designed by women for women, allEva bikes are optimized for the feminine physique using analytics from a body metrics database. If you like 29ers, try the Eva 291. It\xe2\x80\x99s a brand new bike for 2022.. This full-suspension, cross-country ride has been designed for velocity. The 291 has 100mm of front and rear travel, a superlight aluminum frame and fast-rolling 29-inch wheels. Yippee!\",\"condition\":\"used\"}"
 8) "bicycle:6"
 9) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((2.1767 48.9016, 2.5267 48.9016, 2.5267 48.5516, 2.1767 48.5516, 2.1767 48.9016))\",\"store_location\":\"2.3522,48.8566\",\"brand\":\"ScramBikes\",\"model\":\"WattBike\",\"price\":2300,\"description\":\"The WattBike is the best e-bike for people who still feel young at heart. It has a Bafang 1000W mid-drive system and a 48V 17.5AH Samsung Lithium-Ion battery, allowing you to ride for more than 60 miles on one charge. It\xe2\x80\x99s great for tackling hilly terrain or if you just fancy a more leisurely ride. With three working modes, you can choose between E-bike, assisted bicycle, and normal bike modes.\",\"condition\":\"new\"}"
10) "bicycle:8"
11) 1) "$"
    2) "{\"pickup_zone\":\"POLYGON((1.9450 41.4301, 2.4018 41.4301, 2.4018 41.1987, 1.9450 41.1987, 1.9450 41.4301))\",\"store_location\":\"2.1734, 41.3851\",\"brand\":\"nHill\",\"model\":\"Summit\",\"price\":1200,\"description\":\"This budget mountain bike from nHill performs well both on bike paths and on the trail. The fork with 100mm of travel absorbs rough terrain. Fat Kenda Booster tires give you grip in corners and on wet trails. The Shimano Tourney drivetrain offered enough gears for finding a comfortable pace to ride uphill, and the Tektro hydraulic disc brakes break smoothly. Whether you want an affordable bike that you can take to work, but also take trail in mountains on the weekends or you\xe2\x80\x99re just after a stable, comfortable ride for the bike path, the Summit gives a good value for money.\",\"condition\":\"new\"}"
{{< /clients-example >}}

The example below returns bicycles with a price lower than or equal to 2000 USD (`price <= 2000`) by returning the five cheapest bikes:

{{< clients-example set="query_range" step="range4" description="Intermediate: Combine range queries with SORTBY and LIMIT to retrieve sorted results in pages when you need to handle large result sets efficiently" difficulty="intermediate" >}}
> FT.SEARCH idx:bicycle "@price:[-inf 2000]" SORTBY price LIMIT 0 5
 1) (integer) 7
 2) "bicycle:0"
 3) 1) "price"
    2) "270"
    3) "$"
    4) "{\"pickup_zone\":\"POLYGON((-74.0610 40.7578, -73.9510 40.7578, -73.9510 40.6678, -74.0610 40.6678, -74.0610 40.7578))\",\"store_location\":\"-74.0060,40.7128\",\"brand\":\"Velorim\",\"model\":\"Jigger\",\"price\":270,\"description\":\"Small and powerful, the Jigger is the best ride for the smallest of tikes! This is the tiniest kids\xe2\x80\x99 pedal bike on the market available without a coaster brake, the Jigger is the vehicle of choice for the rare tenacious little rider raring to go.\",\"condition\":\"new\"}"
 4) "bicycle:7"
 5) 1) "price"
    2) "430"
    3) "$"
    4) "{\"pickup_zone\":\"POLYGON((13.3260 52.5700, 13.6550 52.5700, 13.6550 52.2700, 13.3260 52.2700, 13.3260 52.5700))\",\"store_location\":\"13.4050,52.5200\",\"brand\":\"Peaknetic\",\"model\":\"Secto\",\"price\":430,\"description\":\"If you struggle with stiff fingers or a kinked neck or back after a few minutes on the road, this lightweight, aluminum bike alleviates those issues and allows you to enjoy the ride. From the ergonomic grips to the lumbar-supporting seat position, the Roll Low-Entry offers incredible comfort. The rear-inclined seat tube facilitates stability by allowing you to put a foot on the ground to balance at a stop, and the low step-over frame makes it accessible for all ability and mobility levels. The saddle is very soft, with a wide back to support your hip joints and a cutout in the center to redistribute that pressure. Rim brakes deliver satisfactory braking control, and the wide tires provide a smooth, stable ride on paved roads and gravel. Rack and fender mounts facilitate setting up the Roll Low-Entry as your preferred commuter, and the BMX-like handlebar offers space for mounting a flashlight, bell, or phone holder.\",\"condition\":\"new\"}"
 6) "bicycle:5"
 7) 1) "price"
    2) "810"
    3) "$"
    4) "{\"pickup_zone\":\"POLYGON((-0.1778 51.5524, 0.0822 51.5524, 0.0822 51.4024, -0.1778 51.4024, -0.1778 51.5524))\",\"store_location\":\"-0.1278,51.5074\",\"brand\":\"Breakout\",\"model\":\"XBN 2.1 Alloy\",\"price\":810,\"description\":\"The XBN 2.1 Alloy is our entry-level road bike \xe2\x80\x93 but that\xe2\x80\x99s not to say that it\xe2\x80\x99s a basic machine. With an internal weld aluminium frame, a full carbon fork, and the slick-shifting Claris gears from Shimano\xe2\x80\x99s, this is a bike which doesn\xe2\x80\x99t break the bank and delivers craved performance.\",\"condition\":\"new\"}"
 8) "bicycle:2"
 9) 1) "price"
    2) "815"
    3) "$"
    4) "{\"pickup_zone\":\"POLYGON((-87.6848 41.9331, -87.5748 41.9331, -87.5748 41.8231, -87.6848 41.8231, -87.6848 41.9331))\",\"store_location\":\"-87.6298,41.8781\",\"brand\":\"Nord\",\"model\":\"Chook air 5\",\"price\":815,\"description\":\"The Chook Air 5  gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower  top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails.\",\"condition\":\"used\"}"
10) "bicycle:9"
11) 1) "price"
    2) "815"
    3) "$"
    4) "{\"pickup_zone\":\"POLYGON((12.4464 42.1028, 12.5464 42.1028, 12.5464 41.7028, 12.4464 41.7028, 12.4464 42.1028))\",\"store_location\":\"12.4964,41.9028\",\"model\":\"ThrillCycle\",\"brand\":\"BikeShind\",\"price\":815,\"description\":\"An artsy,  retro-inspired bicycle that\xe2\x80\x99s as functional as it is pretty: The ThrillCycle steel frame offers a smooth ride. A 9-speed drivetrain has enough gears for coasting in the city, but we wouldn\xe2\x80\x99t suggest taking it to the mountains. Fenders protect you from mud, and a rear basket lets you transport groceries, flowers and books. The ThrillCycle comes with a limited lifetime warranty, so this little guy will last you long past graduation.\",\"condition\":\"refurbished\"}"
{{< /clients-example >}}

## Non-numeric range queries

You can learn more about non-numeric range queries, such as [geospatial]({{< relref "/develop/ai/search-and-query/query/geo-spatial" >}}) or [vector search]({{< relref "/develop/ai/search-and-query/query/vector-search" >}}) queries, in their dedicated articles.