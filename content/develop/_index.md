---
title: Develop with Redis
description: Learn how to develop with Redis
linkTitle: Develop
hideListLinks: true
---



Get a Redis server running in minutes with a free trial of
[Redis Cloud](/content/operate/rc/_index.md), or install
[Redis Open Source](/content/operate/oss_and_stack/_index.md) locally
on your machine. Check out the <a href="https://hub.docker.com/_/redis">Redis Docker Hub</a> for the latest release. Then, explore Redis with your favorite
[programming language](/content/develop/clients/_index.md)
or analyze and manage your database with our
[UI tools](/content/develop/tools/_index.md):

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/redis-py" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-blue-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>Python</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/redis-py" >}}">Get started</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/redis-py/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/redis-py/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/dotnet" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-violet-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>C#/.NET</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/dotnet" >}}">Get started</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/dotnet/nredisstack/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/dotnet/nredisstack/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/nodejs" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-teal-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>Node.js</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/nodejs" >}}">Get started</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/nodejs/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/nodejs/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/jedis" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-rose-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>Java (Jedis)</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/jedis" >}}">Get started</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/jedis/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/jedis/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/lettuce" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-amber-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>Java (Lettuce)</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/lettuce" >}}">Get started</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/lettuce/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/lettuce/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/go" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-cyan-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>Go</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/go" >}}">Get started</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/go/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/go/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/php" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-indigo-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>PHP</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/php" >}}">Get started</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/php/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/php/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/ioredis" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-lime-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>JavaScript (ioredis)</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/ioredis" >}}">Get started</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/rust" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-orange-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>Rust</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/rust/json" >}}">Document search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/hiredis" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-fuchsia-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>C</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/hiredis" >}}">Get started</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/ruby" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        <span class="h-3 w-3 rounded-full bg-pink-300 border border-redis-pen-600 flex-shrink-0"></span>
        <span>Ruby</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/ruby/queryjson" >}}">Document search</a></li>
        <li><a class="no-underline hover:underline" href="{{< relref "/develop/clients/ruby/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
</div>

| | |
| - | - |
|{{< image-card image="images/dev/icons/icon-redis-insight-64-duotone.png" alt="Redis Insight icon" title="Redis Insight" url="/develop/tools/insight" >}} <p>Visual client tool for creating, managing, and analyzing Redis databases.<br/><a href="https://redis.io/downloads/#insight">Download Redis Insight</a>.</p> | {{< image-card image="images/dev/icons/icon-redis-code-64-duotone.png" alt="Redis for VS Code icon" title="Redis for VS Code" url="/develop/tools/redis-for-vscode" >}} <p>VS Code extension for creating, managing, and analyzing Redis databases.<br/><a href="https://marketplace.visualstudio.com/items?itemName=Redis.redis-for-vscode">Install Redis for VS Code</a>.</p> |
| | |

| {{< image-card image="images/icon_logo/icon-developers-64-midnight.png" alt="Quick start icon" title="Quick start" url="/develop/get-started" >}} | {{< image-card image="images/icon_logo/icon-data-structures-64-midnight.png" alt="Data types icon" title="Data types" url="/develop/data-types" >}} | {{< image-card image="images/icon_logo/icon-text-search-64-midnight.png" alt="Redis Search icon" title="Redis Search" url="/develop/ai/search-and-query" >}} |
|:---:| :---: | :---: |
| [Vector database](/content/develop/get-started/search-tutorial/vector-search.md)</br>[Document store](/content/develop/get-started/search-tutorial/_index.md)</br>[Data structure store](/content/develop/get-started/data-store.md)</br>[RAG with Redis](/content/develop/get-started/rag.md)</br>[GenAI](/content/develop/get-started/redis-in-ai.md) | [String](/content/develop/data-types/strings/_index.md)</br>[JSON](/content/develop/data-types/json/_index.md)</br>[Hash](/content/develop/data-types/hashes.md)</br>[Vector set](/content/develop/data-types/vector-sets/_index.md)</br>[Probabilistic types](/content/develop/data-types/probabilistic/_index.md) | [Get started](/content/develop/ai/search-and-query/_index.md)</br>[Schema field types](/content/develop/ai/search-and-query/indexing/field-and-type-options.md)</br>[Indexing](/content/develop/ai/search-and-query/indexing/_index.md)</br>[Querying](/content/develop/ai/search-and-query/query/_index.md)
