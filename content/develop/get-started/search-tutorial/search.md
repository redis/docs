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

This is step 3 of the [Redis Search tutorial]({{< relref "/develop/get-started/search-tutorial" >}}). You need the [catalog loaded]({{< relref "/develop/get-started/search-tutorial/data-modeling" >}}) and the [index created]({{< relref "/develop/get-started/search-tutorial/indexing" >}}) before the queries below will work.

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
