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
description: Handle command replies with `hiredis`.
linkTitle: Handle command replies
title: Handle command replies
weight: 10
---

The `redisCommand()` and `redisCommandArgv()` functions return
a pointer to a `redisReply` object when you issue a command (see
[Issue commands]({{< relref "/develop/clients/hiredis/issue-commands" >}})
for more information). This type supports all
reply formats defined in the
[RESP2 and RESP3]({{< relref "/develop/reference/protocol-spec#resp-protocol-description" >}})
protocols, so its content varies greatly between calls.

A simple example is the status response returned by the [`SET`]({{< relref "/commands/set" >}})
command. The code below shows how to get this from the `redisReply`
object:

```c
redisReply *reply = redisCommand(c, "SET greeting Hello");

// Check and free the reply.
if (reply != NULL) {
    printf("Reply: %s\n", reply->str);
    freeReplyObject(reply);
    reply = NULL;
}
```

A null reply indicates an error, so you should always check for this.
If an error does occur, then the `redisContext` object will have a
non-zero error number in its integer `err` field and a textual
description of the error in its `errstr` field.

For `SET`, a successful call will simply return an "OK" string that you
can access with the `reply->str` field. The code in the example prints
this to the console, but you should check for the specific value to ensure
the command executed correctly.

The `redisCommand()` call allocates memory for the reply, so you should
always free it using `freeReplyObject()` when you have finished using
the reply. If you want to reuse the reply variable then it is wise to
set it to `NULL` after you free it, so that you don't accidentally use
the stale pointer later.

## Reply formats

The Redis
[`RESP`]({{< relref "/develop/reference/protocol-spec#resp-protocol-description" >}})
protocols support several different reply formats for commands.

You can find the reply format for a command at the end of its
reference page in the RESP2/RESP3 Reply section (for example, the
[`INCRBY`]({{< relref "/commands/incrby" >}}) page shows that the
command has an integer result). You can also determine the format
using the `type` field of the reply object. This contains a
different integer value for each type. The `hiredis.h` header file
defines constants for all of these integer values (for example `REDIS_REPLY_STRING`).

The `redisReply` struct has several fields to contain different
types of replies, with different fields being set depending on
the value of the `type` field. The table below shows the type
constants, the corresponding reply type, and the fields you can
use to access the reply value:

| Constant | Type | Relevant fields of `redisReply` | RESP protocol |
| :- | :- |:- | :- |
| `REDIS_REPLY_STATUS` | [Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) | `reply->str`: the string value (`char*`)<br/> `reply->len`: the string length (`size_t`) | 2, 3 |
| `REDIS_REPLY_ERROR` | [Simple error]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) | `reply->str`: the string value (`char*`)<br/> `reply->len`: the string length (`size_t`) | 2, 3 |
| `REDIS_REPLY_INTEGER` | [Integer]({{< relref "/develop/reference/protocol-spec#integers" >}}) | `reply->integer`: the integer value (`long long`)| 2, 3 |
| `REDIS_REPLY_NIL` | [Null]({{< relref "/develop/reference/protocol-spec#nulls" >}}) | No data | 2, 3 |
| `REDIS_REPLY_STRING` | [Bulk string]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) |`reply->str`: the string value (`char*`)<br/> `reply->len`: the string length (`size_t`) | 2, 3 |
| `REDIS_REPLY_ARRAY` | [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) | `reply->elements`: number of elements (`size_t`)<br/> `reply->element`: array elements (`redisReply`) | 2, 3 |
| `REDIS_REPLY_DOUBLE` | [Double]({{< relref "/develop/reference/protocol-spec#doubles" >}}) | `reply->str`: double value as string (`char*`)<br/> `reply->len`: the string length (`size_t`) | 3 |
| `REDIS_REPLY_BOOL` | [Boolean]({{< relref "/develop/reference/protocol-spec#booleans" >}}) | `reply->integer`: the boolean value, 0 or 1 (`long long`) | 3 |
| `REDIS_REPLY_MAP` | [Map]({{< relref "/develop/reference/protocol-spec#maps" >}}) | `reply->elements`: number of elements (`size_t`)<br/> `reply->element`: array elements (`redisReply`) | 3 |
| `REDIS_REPLY_SET` | [Set]({{< relref "/develop/reference/protocol-spec#sets" >}}) | `reply->elements`: number of elements (`size_t`)<br/> `reply->element`: array elements (`redisReply`) | 3 |
| `REDIS_REPLY_PUSH` | [Push]({{< relref "/develop/reference/protocol-spec#pushes" >}}) | `reply->elements`: number of elements (`size_t`)<br/> `reply->element`: array elements (`redisReply`) | 3 |
| `REDIS_REPLY_BIGNUM` | [Big number]({{< relref "/develop/reference/protocol-spec#big-numbers" >}}) | `reply->str`: number value as string (`char*`)<br/> `reply->len`: the string length (`size_t`) | 3 |
| `REDIS_REPLY_VERB` | [Verbatim string]({{< relref "/develop/reference/protocol-spec#verbatim-strings" >}}) |`reply->str`: the string value (`char*`)<br/> `reply->len`: the string length (`size_t`)<br/> `reply->vtype`: content type (`char[3]`) | 3 |

## Reply format processing examples

The sections below explain how to process specific reply types in
more detail.

### Integers

The `REDIS_REPLY_INTEGER` and `REDIS_REPLY_BOOL` reply types both
contain values in `reply->integer`. However, `REDIS_REPLY_BOOL` is
rarely used. Even when the command essentially returns a boolean value,
the reply is usually reported as an integer. 

```c
// Add some values to a set.
redisReply *reply = redisCommand(c, "SADD items bread milk peas");

if (reply->type == REDIS_REPLY_INTEGER) {
    // Report status.
    printf("Integer reply\n");
    printf("Number added: %lld\n", reply->integer);
    // >>> Number added: 3
}

freeReplyObject(reply);
reply = NULL;


reply = redisCommand(c, "SISMEMBER items bread");

// This also gives an integer reply but you should interpret
// it as a boolean value.
if (reply->type == REDIS_REPLY_INTEGER) {
    // Respond to boolean integer value.
    printf("Integer reply\n");
    
    if (reply->integer == 0) {
        printf("Items set has no member 'bread'\n");
    } else {
        printf("'Bread' is a member of items set\n");
    }
    // >>> 'Bread' is a member of items set
}

freeReplyObject(reply);
reply = NULL;
```

### Strings

The `REDIS_REPLY_STATUS`, `REDIS_REPLY_ERROR`, `REDIS_REPLY_STRING`,
`REDIS_REPLY_DOUBLE`, `REDIS_REPLY_BIGNUM`, and `REDIS_REPLY_VERB`
are all returned as strings, with the main difference lying in how
you interpret them. For all these types, the string value is
returned in `reply->str` and the length of the string is in
`reply->len`. The example below shows some of the possibilities.

```c
// Set a numeric value in a string.
reply = redisCommand(c, "SET number 1.5");

// This gives a status reply.
if (reply->type == REDIS_REPLY_STATUS) {
    // Report status.
    printf("Status reply\n");
    printf("Reply: %s\n", reply->str); // >>> Reply: OK
}

freeReplyObject(reply);
reply = NULL;


// Attempt to interpret the key as a hash.
reply = redisCommand(c, "HGET number field1");

// This gives an error reply.
if (reply->type == REDIS_REPLY_ERROR) {
    // Report the error.
    printf("Error reply\n");
    printf("Reply: %s\n", reply->str);
    // >>> Reply: WRONGTYPE Operation against a key holding the wrong kind of value
}

freeReplyObject(reply);
reply = NULL;


reply = redisCommand(c, "GET number");

// This gives a simple string reply.
if (reply->type == REDIS_REPLY_STRING) {
    // Display the string.
    printf("Simple string reply\n");
    printf("Reply: %s\n", reply->str); // >>> Reply: 1.5
}

freeReplyObject(reply);
reply = NULL;


reply = redisCommand(c, "ZADD prices 1.75 bread 5.99 beer");

// This gives an integer reply.
if (reply->type == REDIS_REPLY_INTEGER) {
    // Display the integer.
    printf("Integer reply\n");
    printf("Number added: %lld\n", reply->integer);
    // >>> Number added: 2
}

freeReplyObject(reply);
reply = NULL;


reply = redisCommand(c, "ZSCORE prices bread");

// This gives a string reply with RESP2 and a double reply
// with RESP3, but you handle it the same way in either case.
if (reply->type == REDIS_REPLY_STRING) {
    printf("String reply\n");
    
    char *endptr; // Not used.
    double price = strtod(reply->str, &endptr);
    double discounted = price * 0.75;
    printf("Discounted price: %.2f\n", discounted);
    // >>> Discounted price: 1.31
}

freeReplyObject(reply);
reply = NULL;
```

### Arrays and maps

Arrays (reply type `REDIS_REPLY_ARRAY`) and maps (reply type `REDIS_REPLY_MAP`)
are returned by commands that retrieve several values at the
same time. For both types, the number of elements in the reply is contained in
`reply->elements` and the pointer to the array itself is is `reply->element`.
Each item in the array is of type `redisReply`. The array elements
are typically simple types rather than arrays or maps.

The example below shows how to get the items from a
[list]({{< relref "/develop/data-types/lists" >}}):

```c
reply = redisCommand(c, "RPUSH things thing0 thing1 thing2 thing3");

printf("Added %lld items\n", reply->integer);
// >>> Added 4 items
freeReplyObject(reply);
reply = NULL;


reply = redisCommand(c, "LRANGE things 0 -1");

for (int i = 0; i < reply->elements; ++i) {
    if (reply->element[i]->type == REDIS_REPLY_STRING) {
        printf("List item %d: %s\n", i, reply->element[i]->str);
    }
}
// >>> List item 0: thing0
// >>> List item 1: thing1
// >>> List item 2: thing2
// >>> List item 3: thing3
```

A map is essentially the same as an array but it has the extra
guarantee that the items will be listed in key-value pairs.
The example below shows how to get all the fields from a
[hash]({{< relref "/develop/data-types/hashes" >}}) using
[`HGETALL`]({{< relref "/commands/hgetall" >}}):

```c
const char *hashCommand[] = {
    "HSET", "details",
    "name", "Mr Benn",
    "address", "52 Festive Road",
    "hobbies", "Cosplay"
};

reply = redisCommandArgv(c, 8, hashCommand, NULL);

printf("Added %lld fields\n", reply->integer);
// >>> Added 3 fields

freeReplyObject(reply);
reply = NULL;


reply = redisCommand(c, "HGETALL details");

// This gives an array reply with RESP2 and a map reply with
// RESP3, but you handle it the same way in either case.
if (reply->type == REDIS_REPLY_ARRAY) {        
    for (int i = 0; i < reply->elements; i += 2) {
        char *key = reply->element[i]->str;
        char *value = reply->element[i + 1]->str;
        printf("Key: %s, value: %s\n", key, value);
    }
    // >>> Key: name, value: Mr Benn
    // >>> Key: address, value: 52 Festive Road
    // >>> Key: hobbies, value: Cosplay
}
```

## Handling errors

When a command executes successfully, the `err` field of the context
object will be set to zero. If a command fails, it will return either
`NULL` or `REDIS_ERR`, depending on which function and command you used. When
this happens, `context->err` will contain an error code

-   `REDIS_ERR_IO`: There was an I/O error while creating the connection,
    or while trying to write or read data. Whenever `context->err` contains
    `REDIS_ERR_IO`, you can use the features of the standard library file
    [`errno.h`](https://en.wikipedia.org/wiki/Errno.h) to find out more
    information about the error.
-   `REDIS_ERR_EOF`: The server closed the connection which resulted in an empty read.
-   `REDIS_ERR_PROTOCOL`: There was an error while parsing the
    [RESP protocol]({{< relref "/develop/reference/protocol-spec" >}}).
-   `REDIS_ERR_OTHER`: Any other error. Currently, it is only used when the connection
    hostname can't be resolved.

The context object also has an `errstr` field that contains a descriptive error message.
