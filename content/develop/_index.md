---
title: Develop with Redis
description: Learn how to develop with Redis
linkTitle: Develop
hideListLinks: true
hideTOC: true
---

Get a Redis server running in minutes with a free trial of
[Redis Cloud]({{< relref "/operate/rc" >}}), or install
[Redis Open Source]({{< relref "/operate/oss_and_stack" >}}) locally
on your machine. Then, explore Redis with your favorite
[programming language]({{< relref "/develop/clients" >}})
or analyze and manage your database with our
[UI tools]({{< relref "/develop/tools" >}}):

| | Get started | Document search | Vector search |
|:----- | :-----: | :-----: | :-----:|
| [Python]({{< relref "/develop/clients/redis-py" >}}) | [See Python examples]({{< relref "/develop/clients/redis-py/connect" >}}) | [See Python examples]({{< relref "/develop/clients/redis-py/queryjson" >}}) | [See Python examples]({{< relref "/develop/clients/redis-py/vecsearch" >}}) |
| [C#/.NET]({{< relref "/develop/clients/dotnet" >}}) | [See C# examples]({{< relref "/develop/clients/dotnet/connect" >}}) | [See C# examples]({{< relref "/develop/clients/dotnet/queryjson" >}}) | [See C# examples]({{< relref "/develop/clients/dotnet/vecsearch" >}}) |
| [Node.js]({{< relref "/develop/clients/nodejs" >}}) | [See JS examples]({{< relref "/develop/clients/nodejs/connect" >}}) | [See JS examples]({{< relref "/develop/clients/nodejs/queryjson" >}}) | [See JS examples]({{< relref "/develop/clients/nodejs/vecsearch" >}}) |
| [Java]({{< relref "/develop/clients/jedis" >}}) | [See Java examples]({{< relref "/develop/clients/jedis/connect" >}}) | [See Java examples]({{< relref "/develop/clients/jedis/queryjson" >}}) | [See Java examples]({{< relref "/develop/clients/jedis/vecsearch" >}}) |
| [Go]({{< relref "/develop/clients/go" >}}) | [See Go examples]({{< relref "/develop/clients/go/connect" >}}) | [See Go examples]({{< relref "/develop/clients/go/queryjson" >}}) | [See Go examples]({{< relref "/develop/clients/go/vecsearch" >}}) |
| [PHP]({{< relref "/develop/clients/php" >}}) | [See PHP examples]({{< relref "/develop/clients/php/connect" >}}) | [See PHP examples]({{< relref "/develop/clients/php/queryjson" >}}) | [See PHP examples]({{< relref "/develop/clients/php/vecsearch" >}}) |

<div class="flex flex-col gap-5">
  <div class="flex items-start">
    {{< image filename="develop/tools/insight/images/Browser.png" class="w-[300px] mr-4" >}}
    <div>
      <h3><a href="/develop/tools/insight">Redis Insight</a></h3>
      <p>Visual client tool for creating, managing, and analyzing Redis databases.</p>
    </div>
  </div>
  <div class="flex items-start">
    {{< image filename="images/dev/connect/vscode/vscode-cli.png" class="w-[300px] mr-4" >}}
    <div>
      <h3><a href="/develop/tools/insight">Redis for VS Code</a></h3>
      <p>Visual client tool for creating, managing, and analyzing Redis databases.</p>
    </div>
  </div>
</div>

| {{< image filename="images/icon_logo/icon-developers-32-midnight.png" >}}</br>[**Quick start**]({{< relref "/develop/get-started" >}}) | {{< image filename="images/icon_logo/icon-data-structures-32-midnight.png" >}}</br>[**Data types**]({{< relref "/develop/data-types" >}}) | {{< image filename="images/icon_logo/icon-text-search-32-midnight.png" >}}</br>[**Query engine**]({{< relref "/develop/interact/search-and-query" >}}) |
|-----|-----|-----|
| [Vector database]({{< relref "/develop/get-started/vector-database" >}}) | [String]({{< relref "/develop/data-types/strings" >}}) | [Get started]({{< relref "/develop/interact/search-and-query" >}}) |
| [Document store]({{< relref "/develop/get-started/document-database" >}}) | [JSON]({{< relref "/develop/data-types/json" >}}) | [Schema field types]({{< relref "/develop/interact/search-and-query/basic-constructs/field-and-type-options" >}}) |
| [Data structure store]({{< relref "/develop/get-started/data-store" >}}) | [Hash]({{< relref "/develop/data-types/hashes" >}}) | [Indexing]({{< relref "/develop/interact/search-and-query/indexing" >}}) |
| [RAG with Redis]({{< relref "/develop/get-started/rag" >}}) | [Vector set]({{< relref "/develop/data-types/vector-sets" >}}) | [Querying]({{< relref "/develop/interact/search-and-query/query" >}}) |
| [GenAI]({{< relref "/develop/get-started/redis-in-ai" >}}) | [Probabilistic]({{< relref "/develop/data-types/probabilistic" >}}) | [Use cases]({{< relref "/develop/interact/search-and-query/query-use-cases" >}}) |
