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
description: Learn how to use Redis pipelines and transactions
linkTitle: Pipelines/transactions
title: Pipelines and transactions
weight: 4
---

Redis lets you send a sequence of commands to the server together in a batch.
There are two types of batch that you can use:

-   **Pipelines** avoid network and processing overhead by sending several commands
    to the server together in a single communication. The server then sends back
    a single communication with all the responses. See the
    [Pipelining]({{< relref "/develop/using-commands/pipelining" >}}) page for more
    information.
-   **Transactions** guarantee that all the included commands will execute
    to completion without being interrupted by commands from other clients.
    See the [Transactions]({{< relref "develop/using-commands/transactions" >}})
    page for more information.

## Execute a pipeline

There are two ways to execute commands in a pipeline. Firstly, `node-redis` will
automatically pipeline commands that execute within the same "tick" of the
[event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#what-is-the-event-loop).
You can ensure that commands happen in the same tick very easily by including them in a
[`Promise.all()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all)
call, as shown in the following example. The chained `then(...)` callback is optional
and you can often omit it for commands that write data and only return a
status result.

```js
await Promise.all([
  client.set('seat:0', '#0'),
  client.set('seat:1', '#1'),
  client.set('seat:2', '#2'),
]).then((results) =>{
    console.log(results);
    // >>> ['OK', 'OK', 'OK']
});

await Promise.all([
    client.get('seat:0'),
    client.get('seat:1'),
    client.get('seat:2'),
]).then((results) =>{
    console.log(results);
    // >>> ['#0', '#1', '#2']
});
```

You can also create a pipeline object using the
[`multi()`]({{< relref "/commands/multi" >}}) method
and then add commands to it using methods that resemble the standard
command methods (for example, `set()` and `get()`). The commands are
buffered in the pipeline and only execute when you call the
`execAsPipeline()` method on the pipeline object. Again, the
`then(...)` callback is optional.

```js
await client.multi()
    .set('seat:3', '#3')
    .set('seat:4', '#4')
    .set('seat:5', '#5')
    .execAsPipeline()
    .then((results) => {
        console.log(results);
        // >>> ['OK', 'OK', 'OK']
    });
```

The two approaches are almost equivalent, but they have different behavior
when the connection is lost during the execution of the pipeline. After
the connection is re-established, a `Promise.all()` pipeline will
continue execution from the point where the interruption happened,
but a `multi()` pipeline will discard any remaining commands that
didn't execute.

## Execute a transaction

A transaction works in a similar way to a pipeline. Create a
transaction object with the `multi()` command, call command methods
on that object, and then call the transaction object's 
`exec()` method to execute it.

```js
const [res1, res2, res3] = await client.multi()
    .incrBy("counter:1", 1)
    .incrBy("counter:2", 2)
    .incrBy("counter:3", 3)
    .exec();

console.log(res1); // >>> 1
console.log(res2); // >>> 2
console.log(res3); // >>> 3
```

## Watch keys for changes

Redis supports *optimistic locking* to avoid inconsistent updates
to different keys. The basic idea is to watch for changes to any
keys that you use in a transaction while you are are processing the
updates. If the watched keys do change, you must restart the updates
with the latest data from the keys. See
[Transactions]({{< relref "develop/using-commands/transactions" >}})
for more information about optimistic locking.

The code below reads a string
that represents a `PATH` variable for a command shell, then appends a new
command path to the string before attempting to write it back. If the watched
key is modified by another client before writing, the transaction aborts.
Note that you should call read-only commands for the watched keys synchronously on
the usual `client` object but you still call commands for the transaction on the
transaction object created with `multi()`.

For production usage, you would generally call code like the following in
a loop to retry it until it succeeds or else report or log the failure.

```js
// Set initial value of `shellpath`.
client.set('shellpath', '/usr/syscmds/');

// Watch the key we are about to update.
await client.watch('shellpath');

const currentPath = await client.get('shellpath');
const newPath = currentPath + ':/usr/mycmds/';

// Attempt to write the watched key.
await client.multi()    
    .set('shellpath', newPath)
    .exec()
    .then((result) => {
        // This is called when the pipeline executes
        // successfully.
        console.log(result);
    }, (err) => {
        // This is called when a watched key was changed.
        // Handle the error here.
        console.log(err);
    });

const updatedPath = await client.get('shellpath');
console.log(updatedPath);
// >>> /usr/syscmds/:/usr/mycmds/
```

In an environment where multiple concurrent requests are sharing a connection
(such as a web server), you must use a connection pool to get an isolated connection,
as shown below:

```js
import { createClientPool } from 'redis';

const pool = await createClientPool()
  .on('error', err => console.error('Redis Client Pool Error', err));

try {
  await pool.execute(async client => {
    await client.watch('key');

    const multi = client.multi()
      .ping()
      .get('key');

    if (Math.random() > 0.5) {
      await client.watch('another-key');
      multi.set('another-key', await client.get('another-key') / 2);
    }

    return multi.exec();
  });
} catch (err) {
  if (err instanceof WatchError) {
    // the transaction aborted
  }
}
```

This is important because the server tracks the state of the WATCH on a
per-connection basis, and concurrent WATCH and MULTI/EXEC calls on the same
connection will interfere with one another. See
[`RedisClientPool`](https://github.com/redis/node-redis/blob/master/docs/pool.md)
for more information.
