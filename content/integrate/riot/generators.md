---
title: Generators
linkTitle: Generators
type: integration
description: RIOT data generators
weight: 6
---

RIOT includes two data generators that can be used to quickly mock up a dataset in Redis.

## Faker

The `faker-import` command generates data using [Datafaker](http://www.datafaker.net).

```
riot -h <host> -p <port> faker-import SPEL... [REDIS COMMAND...]
```

where SpEL is a [Spring Expression Language](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#expressions) field in the form `field="expression"`.

To show the full usage, run:

```
riot faker-import --help
```

### Redis commands

You must specify at least one Redis command as a target.

The keys that will be written are constructed from input records by concatenating the keyspace prefix and key fields.

{{< alert title=Important >}}
Redis connection options apply to the root command (`riot`) and not to subcommands.

In the following example the redis options will not be taken into account:
{{< /alert >}}

```
riot file-import my.json hset -h myredis.com -p 6380
```

### Examples

**Hash example**

```
riot faker-import id="#index" firstName="name.firstName" lastName="name.lastName" address="address.fullAddress" hset --keyspace person --keys id
```

**Set example**

```
riot faker-import name="gameOfThrones.character" --count 1000 sadd --keyspace got:characters --members name
```

Most providers don’t take any arguments and can be called directly, for example:

```
riot faker-import firstName="name.firstName"
```

Some providers take parameters, for example:
```
riot faker-import lease="number.digits(2)"
```

Refer to [Datafaker Providers](http://www.datafaker.net/documentation/providers/#number-of-providers-per-datafaker-version) for complete documentation.

### RediSearch

You can infer Faker fields from a RediSearch index using the `--infer` option:

```
riot faker-import --infer beerIdx hset --keyspace beer --keys id
```
