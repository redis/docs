---
aliases: /develop/connect/insight/search-workspace
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
description: Create and manage search indexes, build and save queries, and explore your data in the Redis Insight Search workspace.
linkTitle: Search workspace
stack: true
title: Search workspace
weight: 5
---

The **Search** workspace in Redis Insight is a dedicated space for working with the [Redis Search]({{< relref "/develop/ai/search-and-query" >}}). From a single page you can browse the search indexes in your database, create new indexes from sample or existing data, build and run queries with a schema-aware editor, and save queries to a reusable library.

To open the workspace, select **Search** in the menu at the top of the screen.

{{< image filename="images/ri/ri-search-indexes-list.png" alt="The Search workspace showing the list of indexes" >}}

## Prerequisites

The Search workspace requires Redis Search. When you open the workspace, Redis Insight checks the connected database and shows a message instead of the workspace if it is not available:

- **Redis Search is not available for this database** &mdash; the connected database does not include Redis Search. The engine is available in Redis Open Source, Redis Software, and Redis Cloud.
- **Redis Search 2.0+ required** &mdash; the Search workspace requires Redis Search 2.0 or later (included with Redis 6 and later). Older query engine versions are not compatible with the commands used here.

## Get started

The first time you open the Search workspace for a database that has no search indexes, Redis Insight shows a welcome screen that introduces full-text, vector, and hybrid search. From here you can get started in one of two ways:

- **Try with sample data** &mdash; load a ready-made dataset and its index so you can explore search straight away. See [Create an index from sample data](#from-sample-data).
- **Use data from my database** &mdash; build an index over keys that already exist in your database. See [Create an index from existing data](#from-existing-data).

{{< image filename="images/ri/ri-search-welcome.png" alt="The Search workspace welcome screen" >}}

Once your database contains at least one search index, the Search workspace opens to the index list instead.

## Search indexes list

The Search workspace lists the [search indexes]({{< relref "/develop/ai/search-and-query/indexing" >}}) defined in the connected database.

The list shows the following information for each index. Several columns include an info button that explains the column when selected.

| Column | Description |
|--------|-------------|
| **Index name** | The name of the index. |
| **Index prefix** | The key prefix that the index matches. Keys whose names start with this prefix are automatically indexed. |
| **Index types** | The field types used in the index schema (for example, text, tag, numeric, vector). |
| **Docs** | The number of documents currently indexed. |
| **Records** | The total number of indexed field-value pairs across all documents. (A document with five fields counts as five records.) |
| **Terms** | The number of unique words extracted from `TEXT` fields for full-text search. |
| **Fields** | The total number of fields defined in the index schema. |

The last column (unlabeled) holds the row actions:

- A **query** button that opens the index in the [query editor](#query-an-index).
- An ellipsis (**...**) menu with:
  - **View index** &mdash; open the query page for the index with its details side panel showing.
  - **Browse dataset** &mdash; switch to the Browse workspace to review the keys that the index covers.
  - **Delete** &mdash; drop the index.

## Create an index

Select **+ Create search index** to create a new index. You can create an index from sample data or from data that already exists in your database.

{{< image filename="images/ri/ri-search-create-menu.png" alt="The Create search index menu" >}}

### From sample data

Choose **Use sample data** to load a ready-made dataset and the index that goes with it. This is the quickest way to explore how Redis Search works without preparing your own data.

Select one of the bundled datasets:

- **E-commerce Discovery** &mdash; product data for exploring discovery use cases that match intent rather than just text.
- **Content recommendations** &mdash; content data for discovering items by theme or plot.

{{< image filename="images/ri/ri-search-sample-data.png" alt="The sample data selection modal" >}}

From here you can:

- Select **See index definition** to review the schema that will be created before you commit to it.
- Select **Start querying** to load the data, create the index, and open the query editor right away.

### From existing data

Choose **Use existing data** to build an index over keys that already exist in your database. Indexing is available for hash and JSON data structures.

Redis Insight opens the create-index page with a key browser on the left. Select a key to get started: Redis Insight uses it to generate a suggested indexing schema. The index then covers **all keys that share the same prefix**, not just the key you selected.

After you select a key, Redis Insight inspects it and automatically detects its fields, presenting the suggested schema on the right. You can edit the index name (shown as **Define search index: `<name>`**) using the pencil icon next to it, and edit the **Index prefix** to control which keys the index matches.

The schema is shown in a table with the following columns:

- A **selection** checkbox &mdash; select or clear a field to include or exclude it from the index.
- **Field name** &mdash; the detected field.
- **Field sample value** &mdash; an example value taken from the key.
- **Suggested indexing type** &mdash; the field type Redis Insight recommends.
- A **pencil** icon &mdash; edit the field's type and options.

{{< image filename="images/ri/ri-search-create-existing.png" alt="Creating an index from existing data with automatic field detection" >}}

{{< note >}}
The first time you create an index from existing data, Redis Insight shows a short guided tour of the page. Select **Skip tour** to dismiss it, or **Next** to step through it.
{{< /note >}}
&nbsp;
{{< note >}}
Nested objects and arrays cannot be indexed directly. If Redis Insight detects one, it removes the field and shows a warning that explains why.
{{< /note >}}

#### Configure field types

To add a field, select **+ Add field**; to change a detected field, select its **pencil** icon. In the field dialog, choose the index type and configure its options:

- **Text** &mdash; full-text searchable fields, with options for weight and phonetic matching (English, French, Portuguese, or Spanish).
- **Tag** &mdash; exact-match fields for filtering and faceting.
- **Numeric** &mdash; numeric fields for range filtering.
- **Geo** &mdash; geospatial fields for location filtering.
- **Vector** &mdash; vector fields for similarity search, with options for the indexing algorithm (`FLAT` or `HNSW`), vector type (`FLOAT32`, `FLOAT64`, `FLOAT16`, or `BFLOAT16`), distance metric (`L2`, `IP`, or `COSINE`), the number of dimensions, and (for `HNSW`) algorithm-specific tuning parameters.

{{< image filename="images/ri/ri-search-field-type.png" alt="Configuring a field type" >}}

#### Table view and command view

The create-index page provides two views of your index definition:

- **Table view** &mdash; the visual schema editor described above.
- **Command view** &mdash; the equivalent [`FT.CREATE`]({{< relref "/commands/ft.create" >}}) command that Redis Insight will run.

{{< image filename="images/ri/ri-search-command-view.png" alt="The generated FT.CREATE command in command view" >}}

When you are satisfied with the schema, select **Create index**. Redis Insight confirms when the index is created and your data becomes searchable.

## Query an index

When you open an index, Redis Insight shows the query page. At the top of the page, an index selector (shown as **Indexes / `<index name>`**) lets you switch between the indexes in your database, and a **View index** button opens a side panel with the full index definition and statistics.

{{< image filename="images/ri/ri-search-index-info.png" alt="The index details side panel" >}}

The rest of the page is split into two resizable panes: the query editor on top and the results below. The editor has two tabs, **Query editor** and **Query library**.

{{< image filename="images/ri/ri-search-run-query.png" alt="The Search query editor with results" >}}

### Query editor

The **Query editor** tab lets you write and run [Redis Query Engine commands]({{< relref "/develop/ai/search-and-query/query" >}}) (such as `FT.SEARCH` and `FT.AGGREGATE`) against the selected index, with syntax highlighting and schema-aware autocomplete. Start typing `FT.` to see available search commands, index names, and fields based on your current query.

The action bar at the bottom of the editor pane provides the following actions:

- **Explain** &mdash; show the execution plan for the query (using [`FT.EXPLAIN`]({{< relref "/commands/ft.explain" >}})) so you can understand how it will run. Available for `FT.SEARCH` and `FT.AGGREGATE` queries.
- **Profile** &mdash; profile the query (using [`FT.PROFILE`]({{< relref "/commands/ft.profile" >}})) to see where time is spent and identify bottlenecks. Available for `FT.SEARCH` and `FT.AGGREGATE` queries.
- **Save** &mdash; save the current query to the Query library for reuse.
- **Run** &mdash; run the query and view the results in the lower pane.

For example, the following query returns the first 10 documents priced under 2000:

```
FT.SEARCH idx:bikes_vss "@price:[0 2000]" LIMIT 0 10
```

Select **Explain** to see how the query runs:

{{< image filename="images/ri/ri-search-explain-query.png" alt="The execution plan returned by Explain" >}}

Select **Profile** to see where time is spent:

{{< image filename="images/ri/ri-search-profile-query.png" alt="The profile returned by Profile" >}}

### Results

Each command you run appears in the results pane below the editor. You can switch between a **Text** and a **Table** view of the results, and re-run, profile, or explain a command directly from its result using the actions on the right.

{{< image filename="images/ri/ri-search-results-view-button.png" alt="Switching between Text and Table views of the results" >}}

{{< image filename="images/ri/ri-search-results-actions-button.png" alt="Per-result Profile and Explain actions" >}}

### Query library

The **Query library** tab keeps saved and sample queries together so you can reuse them quickly. Use the search field at the top to filter the list. From the library you can load a query into the editor, run it directly, or delete it.

To save your own query, write it in the **Query editor** tab, select **Save**, and give it a name. It then appears in the library alongside the built-in sample queries.

{{< image filename="images/ri/ri-search-query-library.png" alt="The Query library" >}}

## Navigate between the Browse and Search workspaces

The [Browse]({{< relref "/develop/tools/insight#browser" >}}) and Search workspaces are connected so you can move between your raw data and your indexes.

### Make data searchable from the Browse workspace

When you view a hash or JSON key in the Browse workspace that is not yet indexed, select **Make searchable** to create an index for it. A **Make this data searchable** dialog explains that all keys sharing the key's prefix will be included. Select **Continue** to go to the Search workspace, where you can review and adjust the schema before creating the index, as described in [Create an index from existing data](#from-existing-data).

{{< image filename="images/ri/ri-search-make-searchable.png" alt="The Make searchable button in the Browse workspace" >}}

### View the index for a key

When you view a key that is already indexed, select **View index** to jump to that index in the Search workspace. If the key belongs to more than one index, choose the index you want from the menu.

{{< image filename="images/ri/ri-search-view-index.png" alt="The View index button in the Browse workspace" >}}
