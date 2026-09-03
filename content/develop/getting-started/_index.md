---
title: Get started
linkTitle: Get started
description: Get Redis running and connect your first application, however you deploy it.
hideListLinks: true
weight: 5
---

In this guide, you'll learn how to create a Redis deployment in Redis Cloud, Redis Software, or Redis Open Source. Then, you'll learn how to create an application that connects to your deployment.

## Create a Redis deployment

This section shows how to set up a Redis deployment and connect to it with `redis-cli`.

1. Install dependencies

   Before you begin, install the following dependencies in your development environment:

   - **[`redis-cli`]({{< relref "/develop/tools/cli" >}})**: command-line tool that connects to a deployment and runs Redis commands
   - **[Docker](https://docs.docker.com/get-docker/)**: platform that runs software in containers, including local Redis deployments

   Select the tab corresponding to your deployment method to see which of these you need.

   {{< multitabs id="getting-started-prereqs"
       tab1="Redis Cloud"
       tab2="Redis Software"
       tab3="Redis Open Source" >}}

   - A web browser, to sign up and manage your database in the [Redis Cloud console](https://cloud.redis.io).
   - `redis-cli` installed locally, to connect to your database in step 3:

     ```sh
     curl -fsSL https://packages.redis.io/redis-cli/install.sh | sh
     ```

     See [Install redis-cli]({{< relref "/operate/oss_and_stack/install/install-stack/install-redis-cli" >}}) for more information.

   -tab-sep-

   - [Docker](https://docs.docker.com/get-docker/) installed, to run the Docker quick start in step 2. To install without Docker, see the [Redis Software on Linux quick start]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}}) for its own system requirements.
   - A command-line HTTP client such as `curl`, if you want to create a database with the REST API in step 2.

   -tab-sep-

   - [Docker](https://docs.docker.com/get-docker/) installed, to run the Docker quick start in step 2. To install without Docker, see [Install Redis on Linux, macOS, or from source]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) for its own system requirements.

   {{< /multitabs >}}

2. Set up a fully-featured deployment

   Select the tab corresponding to your deployment method and follow its instructions to deploy Redis and create a database.

   {{< multitabs id="getting-started-deploy"
       tab1="Redis Cloud"
       tab2="Redis Software"
       tab3="Redis Open Source" >}}

   [Sign up and create your database](https://redis.io/try-free/). Signing up creates a free 30 MB database for you.

   To create additional or different types of databases from the console, see:

   - [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}}) — a cost-efficient, fully managed database for low-throughput workloads, training, and prototyping.
   - [Create a Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) — a dedicated, "pay as you go" database for production workloads that need higher throughput, larger datasets, and advanced features like Active-Active and clustering.

   -tab-sep-

   [Redis Software]({{< relref "/operate/rs/" >}}) is a self-managed Redis cluster you install and run on your own infrastructure. The fastest way to try it is with Docker:

   ```sh
   docker run -d --cap-add sys_resource --name RE -p 8443:8443 -p 9443:9443 -p 12000:12000 redislabs/redis
   ```

   See the [Redis Software on Docker quick start]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) for the full procedure, or the [Redis Software on Linux quick start]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}}) to install without Docker.

   You can create databases with Redis Software using the console or the REST API. To create a database with the REST API:

   ```sh
   POST https://<host>:<port>/v1/bdbs
   {
       "name": "test-database",
       "type": "redis",
       "memory_size": 1073741824,
       // Additional fields
   }
   ```

   See [Create a database]({{< relref "/operate/rs/databases/create" >}}) for the full procedure, including the console method and additional configuration fields.

   -tab-sep-

   [Redis Open Source]({{< relref "/operate/oss_and_stack/" >}}) is the free, self-managed core Redis server. The fastest way to run it is with Docker:

   ```sh
   docker run -d --name redis -p 6379:6379 redis:latest
   ```

   Starting the server creates your database — there's no separate create step. See [Run Redis on Docker]({{< relref "/operate/oss_and_stack/install/install-stack/docker" >}}) for the full procedure, or [Install Redis on Linux, macOS, or from source]({{< relref "/operate/oss_and_stack/install/install-stack" >}}) to install without Docker.

   {{< /multitabs >}}

3. Connect to your deployment

   You can connect to your deployment with `redis-cli`. Select the tab corresponding to your deployment method.

   {{< multitabs id="getting-started-connect"
       tab1="Redis Cloud"
       tab2="Redis Software"
       tab3="Redis Open Source" >}}

   Get your database's host, port, and password from the connection wizard in the [Redis Cloud console](https://cloud.redis.io), then connect with `redis-cli`:

   ```sh
   redis-cli -h <hostname> -p <portnumber> -a <password>
   ```

   See [Connect to a Redis Cloud database]({{< relref "/operate/rc/databases/connect" >}}) for the full procedure, including Redis Insight and client library options.

   -tab-sep-

   Connect to your Redis Software database using the following command:

   ```sh
   docker exec -it <container_name_or_ID> redis-cli -h <host_or_IP> -p <port>

   See [Connect to a Redis Software database]({{< relref "/operate/rs/databases/connect" >}}) for the full procedure, including Redis Insight and client library options.

   -tab-sep-

   If you started Redis with the `docker run` command from step 2:

   ```sh
   docker exec -it redis redis-cli
   ```

   See [Redis CLI]({{< relref "/develop/tools/cli" >}}) for the full procedure, including non-Docker installs and [Redis Insight]({{< relref "/develop/tools/insight" >}}) as a GUI alternative.

   {{< /multitabs >}}

Congratulations! You have successfully set up your Redis deployment and connected to it.

In the next section, you'll learn how to create an application that connects to your deployment and interacts with data.

## Create your first Redis application

To connect to your Redis deployment in an application, you can use one of the official [Redis client libraries]({{< relref "/develop/clients" >}}).

Select your preferred programming language from the tabs in each step below.

1. Load sample data

   Unlike some databases, Redis doesn't need a separate sample-data load step. The `SET` and `GET` commands in step 3 both create and read the sample data directly — there's no dataset to restore first.

2. Initialize your application

   {{< multitabs id="getting-started-init"
       tab1="Python"
       tab2="Node.js"
       tab3="Java"
       tab4="Go"
       tab5="C#"
       tab6="Ruby"
       tab7="C"
       tab8="Rust"
       tab9="PHP"
       tab10="RedisVL" >}}

   Create a project directory and [install redis-py]({{< relref "/develop/clients/redis-py/_index.md#install" >}}):

   ```sh
   mkdir python-quickstart
   cd python-quickstart
   pip install redis
   ```

   -tab-sep-

   Create a project directory and [install node-redis]({{< relref "/develop/clients/nodejs/_index.md#install" >}}):

   ```sh
   mkdir node-quickstart
   cd node-quickstart
   npm init -y
   npm install redis
   ```

   -tab-sep-

   Add [Jedis]({{< relref "/develop/clients/jedis/_index.md" >}}) as a dependency in your Maven project's `pom.xml`:

   ```xml
   <dependency>
       <groupId>redis.clients</groupId>
       <artifactId>jedis</artifactId>
       <version>7.2.0</version>
   </dependency>
   ```

   -tab-sep-

   Create a project directory and [install go-redis]({{< relref "/develop/clients/go/_index.md" >}}):

   ```sh
   mkdir go-quickstart
   cd go-quickstart
   go mod init go-quickstart
   go get github.com/redis/go-redis/v9
   ```

   -tab-sep-

   Create a project directory and [install StackExchange.Redis]({{< relref "/develop/clients/dotnet/_index.md" >}}):

   ```sh
   mkdir csharp-quickstart
   cd csharp-quickstart
   dotnet new console
   dotnet add package StackExchange.Redis
   ```

   -tab-sep-

   Create a project directory and [install redis-rb]({{< relref "/develop/clients/ruby/_index.md#install" >}}):

   ```sh
   mkdir ruby-quickstart
   cd ruby-quickstart
   gem install redis
   ```

   -tab-sep-

   [Build and install hiredis]({{< relref "/develop/clients/hiredis/_index.md#build-and-install" >}}) from source:

   ```sh
   git clone https://github.com/redis/hiredis.git
   cd hiredis
   make
   sudo make install
   ```

   -tab-sep-

   Create a project directory and [add the `redis` crate]({{< relref "/develop/clients/rust/_index.md#install" >}}) as a dependency in `Cargo.toml`:

   ```toml
   [dependencies]
   redis = "1.0.4"
   ```

   -tab-sep-

   Use [Composer]({{< relref "/develop/clients/php/_index.md#install" >}}) to install Predis:

   ```sh
   composer require predis/predis
   ```

   -tab-sep-

   Create a project directory and [install RedisVL]({{< relref "/develop/ai/redisvl/install" >}}):

   ```sh
   mkdir redisvl-quickstart
   cd redisvl-quickstart
   pip install redisvl
   ```

   {{< /multitabs >}}

3. Create your application

   {{< multitabs id="getting-started-create-app"
       tab1="Python"
       tab2="Node.js"
       tab3="Java"
       tab4="Go"
       tab5="C#"
       tab6="Ruby"
       tab7="C"
       tab8="Rust"
       tab9="PHP"
       tab10="RedisVL" >}}

   Copy the following code into `app.py`. This connects to your database and sets and retrieves a value.

   ```python
   import redis

   r = redis.Redis(host='localhost', port=6379, decode_responses=True)

   r.set('bike:1', 'Process 134')
   print(r.get('bike:1'))
   ```

   -tab-sep-

   Copy the following code into `index.js`. This connects to your database and sets and retrieves a value.

   ```js
   import { createClient } from 'redis';

   const client = createClient();
   client.on('error', err => console.log('Redis Client Error', err));
   await client.connect();

   await client.set('bike:1', 'Process 134');
   const value = await client.get('bike:1');
   console.log(value);
   ```

   -tab-sep-

   Copy the following code into `Main.java`. This connects to your database and sets and retrieves a value.

   ```java
   package org.example;
   import redis.clients.jedis.RedisClient;

   public class Main {
       public static void main(String[] args) {
           RedisClient jedis = RedisClient.create("redis://localhost:6379");

           String res1 = jedis.set("bike:1", "Process 134");
           System.out.println(res1);

           String res2 = jedis.get("bike:1");
           System.out.println(res2);

           jedis.close();
       }
   }
   ```

   -tab-sep-

   Copy the following code into `main.go`. This connects to your database and sets and retrieves a value.

   ```go
   package main

   import (
       "context"
       "fmt"
       "github.com/redis/go-redis/v9"
   )

   func main() {
       ctx := context.Background()
       client := redis.NewClient(&redis.Options{
           Addr: "localhost:6379",
       })

       if err := client.Set(ctx, "bike:1", "Process 134", 0).Err(); err != nil {
           panic(err)
       }

       val, err := client.Get(ctx, "bike:1").Result()
       if err != nil {
           panic(err)
       }
       fmt.Println(val)
   }
   ```

   -tab-sep-

   Copy the following code into `Program.cs`. This connects to your database and sets and retrieves a value.

   ```csharp
   using StackExchange.Redis;

   ConnectionMultiplexer redis = ConnectionMultiplexer.Connect("localhost:6379");
   IDatabase db = redis.GetDatabase();

   db.StringSet("bike:1", "Process 134");
   Console.WriteLine(db.StringGet("bike:1"));
   ```

   -tab-sep-

   Copy the following code into `app.rb`. This connects to your database and sets and retrieves a value.

   ```ruby
   require 'redis'

   r = Redis.new

   r.set('bike:1', 'Process 134')
   puts r.get('bike:1')
   ```

   -tab-sep-

   Copy the following code into `main.c`. This connects to your database and sets and retrieves a value.

   ```c
   #include <stdio.h>
   #include <stdlib.h>
   #include <hiredis/hiredis.h>

   int main() {
       redisContext *c = redisConnect("127.0.0.1", 6379);
       if (c == NULL || c->err) {
           printf("Connection error\n");
           exit(1);
       }

       redisReply *reply = redisCommand(c, "SET bike:1 %s", "Process 134");
       printf("%s\n", reply->str);
       freeReplyObject(reply);

       reply = redisCommand(c, "GET bike:1");
       printf("%s\n", reply->str);
       freeReplyObject(reply);

       redisFree(c);
       return 0;
   }
   ```

   -tab-sep-

   Copy the following code into `src/main.rs`. This connects to your database and sets and retrieves a value.

   ```rust
   use redis::Commands;

   fn main() -> redis::RedisResult<()> {
       let client = redis::Client::open("redis://127.0.0.1:6379")?;
       let mut con = client.get_connection()?;

       con.set("bike:1", "Process 134")?;
       let value: String = con.get("bike:1")?;
       println!("{value}");

       Ok(())
   }
   ```

   -tab-sep-

   Copy the following code into `app.php`. This connects to your database and sets and retrieves a value.

   ```php
   <?php
   require 'vendor/autoload.php';

   use Predis\Client;

   $client = new Client([
       'scheme' => 'tcp',
       'host'   => '127.0.0.1',
       'port'   => 6379,
   ]);

   $client->set('bike:1', 'Process 134');
   echo $client->get('bike:1') . PHP_EOL;
   ```

   -tab-sep-

   RedisVL is a vector-search library, not a general key-value client — it works with index schemas rather than simple `SET`/`GET` commands. Copy the following code into `app.py` to define a schema and create an index:

   ```python
   from redisvl.index import SearchIndex

   schema = {
       "index": {"name": "bikes", "prefix": "bike"},
       "fields": [
           {"name": "model", "type": "text"},
           {"name": "price", "type": "numeric"},
       ],
   }

   index = SearchIndex.from_dict(schema, redis_url="redis://localhost:6379")
   index.create(overwrite=True)
   ```

   See the [RedisVL getting started guide]({{< relref "/develop/ai/redisvl/user_guide/getting_started" >}}) for the full procedure, including loading data and running vector searches.

   {{< /multitabs >}}

4. Add your connection string

   The examples in step 3 connect to `localhost:6379`. Replace that with your actual deployment's host, port, and password — from the [Redis Cloud connection wizard](https://cloud.redis.io), the [Redis Software connection details]({{< relref "/operate/rs/databases/connect" >}}), or `localhost:6379` if you're already running Redis Open Source locally.

   {{< multitabs id="getting-started-connstring"
       tab1="Python"
       tab2="Node.js"
       tab3="Java"
       tab4="Go"
       tab5="C#"
       tab6="Ruby"
       tab7="C"
       tab8="Rust"
       tab9="PHP"
       tab10="RedisVL" >}}

   ```python
   r = redis.from_url("redis://default:<password>@<host>:<port>")
   ```

   -tab-sep-

   ```js
   const client = createClient({
     url: 'redis://default:<password>@<host>:<port>'
   });
   ```

   -tab-sep-

   ```java
   RedisClient jedis = RedisClient.create("redis://default:<password>@<host>:<port>");
   ```

   -tab-sep-

   ```go
   opt, err := redis.ParseURL("redis://default:<password>@<host>:<port>")
   if err != nil {
       panic(err)
   }
   client := redis.NewClient(opt)
   ```

   -tab-sep-

   ```csharp
   ConfigurationOptions conf = new ConfigurationOptions {
       EndPoints = { "<host>:<port>" },
       User = "default",
       Password = "<password>"
   };
   ConnectionMultiplexer redis = ConnectionMultiplexer.Connect(conf);
   ```

   -tab-sep-

   ```ruby
   r = Redis.new(url: "redis://default:<password>@<host>:<port>")
   ```

   -tab-sep-

   `hiredis` connects by host and port, then authenticates with a separate command:

   ```c
   redisContext *c = redisConnect("<host>", <port>);
   redisReply *reply = redisCommand(c, "AUTH %s", "<password>");
   freeReplyObject(reply);
   ```

   -tab-sep-

   ```rust
   let client = redis::Client::open("redis://default:<password>@<host>:<port>")?;
   ```

   -tab-sep-

   ```php
   $client = new Client([
       'scheme'   => 'tcp',
       'host'     => '<host>',
       'port'     => '<port>',
       'password' => '<password>',
   ]);
   ```

   -tab-sep-

   ```python
   index = SearchIndex.from_dict(schema, redis_url="redis://default:<password>@<host>:<port>")
   ```

   {{< /multitabs >}}

5. Run your application

   {{< multitabs id="getting-started-run"
       tab1="Python"
       tab2="Node.js"
       tab3="Java"
       tab4="Go"
       tab5="C#"
       tab6="Ruby"
       tab7="C"
       tab8="Rust"
       tab9="PHP"
       tab10="RedisVL" >}}

   ```sh
   python app.py
   ```

   -tab-sep-

   ```sh
   node index.js
   ```

   -tab-sep-

   ```sh
   mvn compile exec:java -Dexec.mainClass="org.example.Main"
   ```

   -tab-sep-

   ```sh
   go run main.go
   ```

   -tab-sep-

   ```sh
   dotnet run
   ```

   -tab-sep-

   ```sh
   ruby app.rb
   ```

   -tab-sep-

   ```sh
   cc main.c -L/usr/local/lib -lhiredis -o app
   ./app
   ```

   -tab-sep-

   ```sh
   cargo run
   ```

   -tab-sep-

   ```sh
   php app.php
   ```

   -tab-sep-

   ```sh
   python app.py
   ```

   {{< /multitabs >}}

   Each program prints `Process 134` — the value you stored and then retrieved. (RedisVL's example instead confirms the index was created.)

6. Explore a use case

   Each of the following quick starts shows a complete example application for a specific use case:

   - [Data structure store]({{< relref "/develop/get-started/data-store" >}})
   - [Document database]({{< relref "/develop/get-started/search-tutorial" >}})
   - [Vector database]({{< relref "/develop/get-started/search-tutorial/vector-search" >}})
   - [AI agents and chatbots]({{< relref "/develop/get-started/redis-in-ai" >}})
   - [Retrieval Augmented Generation (RAG)]({{< relref "/develop/get-started/rag" >}})

### Next steps

To learn more about developing with Redis, see the following resources:

- [Explore all client libraries]({{< relref "/develop/clients" >}})
- [Redis products overview]({{< relref "/operate/" >}})
- [Develop with Redis]({{< relref "/develop/" >}})
