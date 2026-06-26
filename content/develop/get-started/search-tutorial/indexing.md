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
description: Create a search index over your JSON documents with FT.CREATE, choose the right field types, and understand how Redis indexes arrays.
linkTitle: 2. Indexing
stack: true
title: Create an index
aliases:
- /get-started/search-tutorial/indexing/
weight: 2
---

This is step 2 of the [search and query tutorial]({{< relref "/develop/get-started/search-tutorial" >}}). You should already have the [catalog loaded]({{< relref "/develop/get-started/search-tutorial/data-modeling" >}}) as JSON documents.

So far you can fetch a product only if you already know its key. An **index** changes that: it tells Redis which fields to track and how, so you can ask questions like "which products cost less than $100?" or "which ones mention *wireless*?" and get answers quickly.

## What an index does

When you create an index, you give Redis three things:

1. **What to index** &mdash; which keys belong to the index, selected by a key prefix (here, `product:`).
2. **The data type** &mdash; whether those keys hold hashes (`ON HASH`) or JSON documents (`ON JSON`).
3. **The schema** &mdash; which fields to index, the path to each one, and what type each field is.

Once the index exists, Redis keeps it up to date automatically. Any `product:` document you add or change after creating the index is indexed immediately, and the documents you loaded earlier are indexed right away.

## Field types

Redis Search has a few core field types. Choosing the right one for each field determines how you can query it:

| Field type | Use it for | Example query |
| --- | --- | --- |
| `TEXT` | Human language you want to search by words and partial matches. | find products whose description contains *wireless* |
| `TAG` | Exact-value labels and categories you filter on as a whole. | find products where category is exactly *Audio* |
| `NUMERIC` | Numbers you filter by range or sort by. | find products priced between 0 and 100 |
| `VECTOR` | Embeddings for similarity search (covered in the [last step]({{< relref "/develop/get-started/search-tutorial/vector-search" >}})). | find products similar in meaning to a query |

For the catalog, a good mapping is: `name` and `description` are `TEXT` (you want word search), `brand` and `category` are `TAG` (exact labels), and `price`, `rating`, `review_count`, `stock`, and `release_year` are `NUMERIC`. The `features` field is a list of exact labels, so it is also a `TAG`.

## Create the index

Use [FT.CREATE]({{< relref "/commands/ft.create" >}}) to define the index. Because the data is JSON, each field is identified by a [JSONPath]({{< relref "/develop/data-types/json/path" >}}) expression, and `AS` gives it a short alias to use in queries:

{{< clients-example set="search_tutorial" step="create_index" description="Foundational: Create an index over JSON documents with FT.CREATE, mapping JSONPaths to TEXT, TAG, and NUMERIC fields" difficulty="beginner" >}}
> FT.CREATE idx:catalog ON JSON PREFIX 1 product: SCHEMA $.name AS name TEXT $.brand AS brand TAG SORTABLE $.category AS category TAG $.description AS description TEXT $.price AS price NUMERIC SORTABLE $.rating AS rating NUMERIC SORTABLE $.review_count AS review_count NUMERIC $.stock AS stock NUMERIC $.release_year AS release_year NUMERIC SORTABLE $.features[*] AS features TAG
OK
{{< /clients-example >}}

A few things to notice:

- **`PREFIX 1 product:`** means "index every key that starts with `product:`". The `1` is the number of prefixes that follow.
- **`AS name`, `AS price`, ...** define the alias you use in queries (`@name`, `@price`). Without an alias, you would have to write the full JSONPath in every query.
- **`SORTABLE`** on a field lets you sort results by it efficiently. Add it to fields you expect to sort by, such as `price` and `rating`.
- **`$.features[*]`** ends in `[*]`, which matters for arrays. More on that next.

You only create an index once. If you make a mistake, remove it with [FT.DROPINDEX]({{< relref "/commands/ft.dropindex" >}}) (this deletes the index, not your documents) and create it again.

## Indexing arrays: the `[*]` you should not forget

The `features` field is a JSON array like `["wireless", "bluetooth", "waterproof"]`. To index each element as its own tag, the JSONPath ends in `[*]`:

```
$.features[*] AS features TAG
```

This is the single most common point of confusion when indexing JSON, so it is worth understanding:

- **With `$.features[*]`**, Redis indexes `wireless`, `bluetooth`, and `waterproof` as three separate tags. A query for `@features:{waterproof}` matches the document.
- **With `$.features`** (no `[*]`) on a JSON array, the behavior is not what you want for filtering element-by-element.

{{% alert title="Note" color="info" %}}
This behavior differs between hashes and JSON, which trips up many newcomers. In a **hash**, a `TAG` field splits on commas by default, so `"wireless,bluetooth"` becomes two tags automatically. In **JSON**, there is no automatic splitting: index array elements with `[*]`, or if you store a comma-separated string, add `SEPARATOR ","` to the field definition. For the full explanation, see [Index JSON arrays as TAG]({{< relref "/develop/ai/search-and-query/indexing#index-json-arrays-as-tag" >}}).
{{% /alert %}}

## Check the index

After creating the index, you can confirm it picked up your documents. [FT.INFO]({{< relref "/commands/ft.info" >}}) reports details about an index, including how many documents it contains:

{{< clients-example set="search_tutorial" step="index_info" description="Foundational: Inspect an index with FT.INFO to confirm it exists and see how many documents it contains" difficulty="beginner" >}}
> FT.INFO idx:catalog
{{< /clients-example >}}

Look for `num_docs` in the output; it should be `12`, one for each product you loaded.

{{% alert title="Try it in Redis Insight" color="info" %}}
In the [Redis Insight Search workspace]({{< relref "/develop/tools/insight/search-workspace" >}}), your new `idx:catalog` index appears in the list of indexes. Selecting it shows the schema you just defined &mdash; the fields, their types, and their aliases &mdash; without having to read the raw `FT.INFO` output.
{{% /alert %}}

## Next steps

Your data is indexed. Continue to [searching and filtering]({{< relref "/develop/get-started/search-tutorial/search" >}}) to start asking questions of it.
