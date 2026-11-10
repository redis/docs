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

<div class="not-prose my-8 border border-redis-pen-800 rounded-md bg-redis-neutral-200 font-geist">
  <div class="flex flex-row items-center justify-between gap-4 font-mono text-xs border-b border-redis-pen-800 px-4 sm:px-6 py-2 bg-white rounded-t-md">
    <h2 class="develop-label">Choose your client library</h2>
    <a class="no-underline hover:underline text-redis-ink-900 whitespace-nowrap" href="{{< relref "/develop/clients" >}}">All clients →</a>
  </div>
  <div class="client-picker-grid">
  <input class="sr-only" type="radio" name="client-picker" id="client-python" value="python" checked>
  <label for="client-python">{{< lang-icon name="python" >}}<span>Python</span><span>redis-py</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/redis-py" >}}"><strong>Get started</strong><span>Install redis-py and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/redis-py/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/redis-py/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-dotnet" value="dotnet">
  <label for="client-dotnet">{{< lang-icon name="dotnet" >}}<span>C#/.NET</span><span>StackExchange.Redis</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/dotnet" >}}"><strong>Get started</strong><span>Install StackExchange.Redis and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/dotnet/nredisstack/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/dotnet/nredisstack/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-nodejs" value="nodejs">
  <label for="client-nodejs">{{< lang-icon name="js" >}}<span>JavaScript</span><span>node-redis</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/nodejs" >}}"><strong>Get started</strong><span>Install node-redis and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/nodejs/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/nodejs/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-jedis" value="jedis">
  <label for="client-jedis">{{< lang-icon name="java" >}}<span>Java</span><span>Jedis</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/jedis" >}}"><strong>Get started</strong><span>Install Jedis and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/jedis/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/jedis/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-lettuce" value="lettuce">
  <label for="client-lettuce">{{< lang-icon name="java" >}}<span>Java</span><span>Lettuce</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/lettuce" >}}"><strong>Get started</strong><span>Install Lettuce and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/lettuce/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/lettuce/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-go" value="go">
  <label for="client-go">{{< lang-icon name="go" >}}<span>Go</span><span>go-redis</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/go" >}}"><strong>Get started</strong><span>Install go-redis and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/go/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/go/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-php" value="php">
  <label for="client-php">{{< lang-icon name="php" >}}<span>PHP</span><span>Predis</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/php" >}}"><strong>Get started</strong><span>Install Predis and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/php/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/php/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-ioredis" value="ioredis">
  <label for="client-ioredis">{{< lang-icon name="js" >}}<span>JavaScript</span><span>ioredis</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/ioredis" >}}"><strong>Get started</strong><span>Install ioredis and connect to Redis.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-rust" value="rust">
  <label for="client-rust">{{< lang-icon name="rust" >}}<span>Rust</span><span>redis-rs</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/rust" >}}"><strong>Get started</strong><span>Install redis-rs and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/rust/json" >}}"><strong>JSON documents</strong><span>Store, read, and update JSON documents.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-hiredis" value="hiredis">
  <label for="client-hiredis">{{< lang-icon name="c" >}}<span>C</span><span>hiredis</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/hiredis" >}}"><strong>Get started</strong><span>Install hiredis and connect to Redis.</span></a></li>
    </ul>
  </div>
  <input class="sr-only" type="radio" name="client-picker" id="client-ruby" value="ruby">
  <label for="client-ruby">{{< lang-icon name="ruby" >}}<span>Ruby</span><span>redis-rb</span></label>
  <div>
    <ul>
      <li><a href="{{< relref "/develop/clients/ruby" >}}"><strong>Get started</strong><span>Install redis-rb and connect to Redis.</span></a></li>
      <li><a href="{{< relref "/develop/clients/ruby/queryjson" >}}"><strong>Document search</strong><span>Use Redis Search with JSON and hash documents.</span></a></li>
      <li><a href="{{< relref "/develop/clients/ruby/vecsearch" >}}"><strong>Vector search</strong><span>Index and query vector embeddings.</span></a></li>
    </ul>
  </div>
  </div>
</div>

<div class="develop-tools not-prose">
  <div>
    {{< inline-icon filename="images/dev/icons/icon-redis-insight-64-duotone.png" alt="Redis Insight icon" >}}
    <h2><a href="{{< relref "/develop/tools/insight" >}}">Redis Insight</a></h2>
    <p>Visual client tool for creating, managing, and analyzing Redis databases.</p>
    <div class="develop-actions"><a href="https://redis.io/downloads/#insight">Download</a><a href="{{< relref "/develop/tools/insight" >}}">Use <span aria-hidden="true">→</span></a></div>
  </div>
  <div>
    {{< inline-icon filename="images/dev/icons/icon-redis-code-64-duotone.png" alt="Redis for VS Code icon" >}}
    <h2><a href="{{< relref "/develop/tools/redis-for-vscode" >}}">Redis for VS Code</a></h2>
    <p>VS Code extension for creating, managing, and analyzing Redis databases.</p>
    <div class="develop-actions"><a href="https://marketplace.visualstudio.com/items?itemName=Redis.redis-for-vscode">Install</a><a href="{{< relref "/develop/tools/redis-for-vscode" >}}">Use <span aria-hidden="true">→</span></a></div>
  </div>
</div>

<div class="develop-topics not-prose">
  <div>
    {{< inline-icon filename="images/icon_logo/icon-developers-64-midnight.png" alt="Quick start icon" >}}
    <h2><a href="{{< relref "/develop/get-started" >}}">Quick start</a></h2>
    <ul>
      <li><a href="{{< relref "/develop/get-started/search-tutorial/vector-search" >}}">Vector database</a></li>
      <li><a href="{{< relref "/develop/get-started/search-tutorial" >}}">Document store</a></li>
      <li><a href="{{< relref "/develop/get-started/data-store" >}}">Data structure store</a></li>
      <li><a href="{{< relref "/develop/get-started/rag" >}}">RAG with Redis</a></li>
      <li><a href="{{< relref "/develop/get-started/redis-in-ai" >}}">GenAI</a></li>
    </ul>
  </div>
  <div>
    {{< inline-icon filename="images/icon_logo/icon-data-structures-64-midnight.png" alt="Data types icon" >}}
    <h2><a href="{{< relref "/develop/data-types" >}}">Data types</a></h2>
    <ul>
      <li><a href="{{< relref "/develop/data-types/strings" >}}">String</a></li>
      <li><a href="{{< relref "/develop/data-types/json" >}}">JSON</a></li>
      <li><a href="{{< relref "/develop/data-types/hashes" >}}">Hash</a></li>
      <li><a href="{{< relref "/develop/data-types/vector-sets" >}}">Vector set</a></li>
      <li><a href="{{< relref "/develop/data-types/probabilistic" >}}">Probabilistic types</a></li>
    </ul>
  </div>
  <div>
    {{< inline-icon filename="images/icon_logo/icon-text-search-64-midnight.png" alt="Redis Search icon" >}}
    <h2><a href="{{< relref "/develop/ai/search-and-query" >}}">Redis Search</a></h2>
    <ul>
      <li><a href="{{< relref "/develop/ai/search-and-query" >}}">Get started</a></li>
      <li><a href="{{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}">Schema field types</a></li>
      <li><a href="{{< relref "/develop/ai/search-and-query/indexing" >}}">Indexing</a></li>
      <li><a href="{{< relref "/develop/ai/search-and-query/query" >}}">Querying</a></li>
    </ul>
  </div>
</div>
