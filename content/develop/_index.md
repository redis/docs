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
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="python" >}}
        <span>Python</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/redis-py" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/redis-py/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/redis-py/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/dotnet" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="dotnet" >}}
        <span>C#/.NET</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/dotnet" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/dotnet/nredisstack/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/dotnet/nredisstack/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/nodejs" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="js" >}}
        <span>Node.js</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/nodejs" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/nodejs/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/nodejs/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/jedis" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="java" >}}
        <span>Java (Jedis)</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/jedis" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/jedis/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/jedis/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/lettuce" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="java" >}}
        <span>Java (Lettuce)</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/lettuce" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/lettuce/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/lettuce/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/go" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="go" >}}
        <span>Go</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/go" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/go/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/go/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/php" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="php" >}}
        <span>PHP</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/php" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/php/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/php/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/ioredis" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="js" >}}
        <span>JavaScript (ioredis)</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/ioredis" >}}">Get started</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/rust" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="rust" >}}
        <span>Rust</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/rust" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/rust/json" >}}">Document search</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/hiredis" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="c" >}}
        <span>C</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/hiredis" >}}">Get started</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/clients/ruby" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< lang-icon name="ruby" >}}
        <span>Ruby</span>
      </div>
      <p class="text-sm px-6 pt-2 text-redis-pen-600 font-geist">Examples:</p>
      <ul class="text-sm px-6 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/ruby" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/ruby/queryjson" >}}">Document search</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/clients/ruby/vecsearch" >}}">Vector search</a></li>
      </ul>
    </div>
  </div>
</div>

<div class="flex flex-col gap-4 my-6">
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/tools/insight" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< inline-icon filename="images/dev/icons/icon-redis-insight-64-duotone.png" alt="Redis Insight icon" class="h-4 w-4 flex-shrink-0" >}}
        <span>Redis Insight</span>
      </div>
      <p class="text-sm px-6 pt-3 my-0 text-redis-pen-600 font-geist">Visual client tool for creating, managing, and analyzing Redis databases.</p>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="https://redis.io/downloads/#insight">Download</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/tools/insight" >}}">Use</a></li>
      </ol>
    </div>
  </div>
  <div class="relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/tools/redis-for-vscode" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< inline-icon filename="images/dev/icons/icon-redis-code-64-duotone.png" alt="Redis for VS Code icon" class="h-4 w-4 flex-shrink-0" >}}
        <span>Redis for VS Code</span>
      </div>
      <p class="text-sm px-6 pt-3 my-0 text-redis-pen-600 font-geist">VS Code extension for creating, managing, and analyzing Redis databases.</p>
      <ol class="flex flex-wrap items-center gap-x-2 gap-y-2 list-none m-0 px-6 py-4 text-sm text-redis-pen-600 font-geist">
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="https://marketplace.visualstudio.com/items?itemName=Redis.redis-for-vscode">Install</a><span aria-hidden="true">→</span></li>
        <li class="flex items-center gap-2 my-0 pl-0"><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/tools/redis-for-vscode" >}}">Use</a></li>
      </ol>
    </div>
  </div>
</div>

<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/get-started" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< inline-icon filename="images/icon_logo/icon-developers-64-midnight.png" alt="Quick start icon" class="h-4 w-4 flex-shrink-0" >}}
        <span>Quick start</span>
      </div>
      <ul class="text-sm px-6 pt-2 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/get-started/search-tutorial/vector-search" >}}">Vector database</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/get-started/search-tutorial" >}}">Document store</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/get-started/data-store" >}}">Data structure store</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/get-started/rag" >}}">RAG with Redis</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/get-started/redis-in-ai" >}}">GenAI</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/data-types" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< inline-icon filename="images/icon_logo/icon-data-structures-64-midnight.png" alt="Data types icon" class="h-4 w-4 flex-shrink-0" >}}
        <span>Data types</span>
      </div>
      <ul class="text-sm px-6 pt-2 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/data-types/strings" >}}">String</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/data-types/json" >}}">JSON</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/data-types/hashes" >}}">Hash</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/data-types/vector-sets" >}}">Vector set</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/data-types/probabilistic" >}}">Probabilistic types</a></li>
      </ul>
    </div>
  </div>
  <div class="flex flex-col gap-2 h-full min-h-40 relative transition text-redis-ink-900 hover:text-red-900 focus-within:text-red-900 bg-white hover:bg-red-50/50 focus-within:bg-red-50/50 border border-redis-pen-800 focus-within:ring-red-200 focus-within:ring-[3px] focus-within:outline-none bg-clip-padding rounded-md group">
    <a class="absolute inset-0 z-0 outline-0" href="{{< relref "/develop/ai/search-and-query" >}}"><span class="sr-only">Read more</span></a>
    <div class="relative z-10 pointer-events-none">
      <div class="flex flex-row items-center gap-2 uppercase font-mono text-xs border-b border-redis-pen-800 px-6 py-2">
        {{< inline-icon filename="images/icon_logo/icon-text-search-64-midnight.png" alt="Redis Search icon" class="h-4 w-4 flex-shrink-0" >}}
        <span>Redis Search</span>
      </div>
      <ul class="text-sm px-6 pt-2 pb-4 text-redis-pen-600 font-geist space-y-1">
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/ai/search-and-query" >}}">Get started</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}">Schema field types</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/ai/search-and-query/indexing" >}}">Indexing</a></li>
        <li><a class="pointer-events-auto no-underline hover:underline" href="{{< relref "/develop/ai/search-and-query/query" >}}">Querying</a></li>
      </ul>
    </div>
  </div>
</div>
