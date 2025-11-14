---
acl_categories:
- '@cuckoo'
- '@write'
- '@fast'
arguments:
- name: key
  type: key
- name: capacity
  type: integer
- name: bucketsize
  optional: true
  token: BUCKETSIZE
  type: integer
- name: maxiterations
  optional: true
  token: MAXITERATIONS
  type: integer
- name: expansion
  optional: true
  token: EXPANSION
  type: integer
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(1)
description: Creates a new Cuckoo Filter
group: cf
hidden: false
linkTitle: CF.RESERVE
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Creates a new Cuckoo Filter
syntax_fmt: "CF.RESERVE key capacity [BUCKETSIZE\_bucketsize]
  [MAXITERATIONS\_\
  maxiterations] [EXPANSION\_expansion]"
syntax_str: "capacity [BUCKETSIZE\_bucketsize] [MAXITERATIONS\_maxiterations] [EXPANSION\_\
  expansion]"
title: CF.RESERVE
---
Creates an empty cuckoo filter with a single sub-filter for the initial specified capacity.

According to the cuckoo filter behavior, the filter is likely to declare itself full before `capacity` is reached; therefore, the fill rate will likely never reach 100 percent.
The fill rate can be improved by using a larger `bucketsize` at the cost of a higher error rate.
When the filter self-declare itself `full`, it will auto-expand by generating additional sub-filters at the cost of reduced performance and increased error rate.
The new sub-filter is created with size of the previous sub-filter multiplied by `expansion`.
Like bucket size, additional sub-filters grow the error rate linearly.

The minimal false positive error rate is 2/255 ≈ 0.78% when bucket size of 1 is used.
Larger buckets increase the error rate linearly (for example, a bucket size of 3 yields a 2.35% error rate) but improve the fill rate of the filter.

`maxiterations` dictates the number of attempts to find a slot for the incoming fingerprint.
Once the filter gets full, high `maxIterations` value will slow down insertions.

Unused capacity in prior sub-filters is automatically used when possible. 
The filter can grow up to 32 times.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for the the cuckoo filter to be created.
</details>

<details open><summary><code>capacity</code></summary>

Estimated capacity for the filter.

Capacity is rounded to the next `2^n` number.

The filter will likely not fill up to 100% of it's capacity. Make sure to reserve extra capacity if you want to avoid expansions.
</details>

## Optional arguments

<details open><summary><code>BUCKETSIZE bucketsize</code></summary>

Number of items in each bucket.

A higher bucket size value improves the fill rate but also causes a higher error rate and slightly slower performance.

`bucketsize` is an integer between 1 and 255. The default value is 2.
</details>

<details open><summary><code>MAXITERATIONS maxiterations</code></summary>

Number of attempts to swap items between buckets before declaring filter as full and creating an additional filter. 

A low value is better for performance and a higher number is better for filter fill rate.

`maxiterations` is an integer between 1 and 65535. The default value is 20.
</details>

<details open><summary><code>EXPANSION expansion</code></summary>

When a new filter is created, its size is the size of the current filter multiplied by `expansion`.

`expansion` is an integer between 0 and 32768. The default value is 1.

Expansion is rounded to the next `2^n` number. 
</details>

## Examples

{{< highlight bash >}}
redis> CF.RESERVE cf 1000
OK

redis> CF.RESERVE cf 1000
(error) ERR item exists

redis> CF.RESERVE cf_params 1000 BUCKETSIZE 8 MAXITERATIONS 20 EXPANSION 2
OK
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="cf-reserve-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the filter was created successfully.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or the key already exists.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if the filter was created successfully.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments or the key already exists.

{{< /multitabs >}}