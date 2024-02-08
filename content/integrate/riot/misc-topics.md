---
title: Other topics
linkTitle: Other topics
type: integration
description: PING and generate-completion
weight: 9
---

## Ping

The `ping` command can be used to test connectivity to a Redis database.

```
riot -h <host> -p <port> ping <options>
```

When the command is complete you will see statistics like these:

```
[min=0, max=19, percentiles={50.0=1, 90.0=3, 95.0=6, 99.0=10, 99.9=17}]
```

## Generate completion

```
$ riot generate-completion --help
RIOT is a data import/export tool for Redis.

Usage: riot generate-completion [-hV]
Generate bash/zsh completion script for riot.
Run the following command to give `riot` TAB completion in the current shell:

  source <(riot generate-completion)

Options:
  -h, --help      Show this help message and exit.
  -V, --version   Print version information and exit.

Documentation found at https://developer.redis.com/riot
```