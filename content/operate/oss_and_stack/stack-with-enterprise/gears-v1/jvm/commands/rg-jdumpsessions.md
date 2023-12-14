---
Title: RG.JDUMPSESSIONS
alwaysopen: false
categories:
- docs
- operate
- stack
description: Outputs information about existing Java sessions.
linkTitle: RG.JDUMPSESSIONS
weight: 40
---

```sh
RG.JDUMPSESSIONS [VERBOSE] [SESSIONS s1 s2 ...]
```

Outputs information about existing Java sessions.

{{<note>}}
When you run the `RG.JEXECUTE` command, it creates a Java session.
{{</note>}}

## Arguments

| Name | Description |
|------|-------------|
| VERBOSE | Output more details about registrations. |
| SESSIONS | Only output information about sessions that appears in the given list. Can only be the last argument. |

## Returns

Returns information about existing Java sessions.

## Examples

Get information for all sessions:

```sh
> redis-cli RG.JDUMPSESSIONS
1)  1) "mainClass"
    2) "gears_experiments.test"
    3) "version"
    4) (integer) 1
    5) "description"
    6) "foo"
    7) "upgradeData"
    8) (nil)
    9) "jar"
   10) "/home/user/work/RedisGears/plugins/jvmplugin/-jars/6876b8b78ccfc2ad764edc7ede590f573bd7260b.jar"
   11) "refCount"
   12) (integer) 2
   13) "linked"
   14) "true"
   15) "ts"
   16) "false"
   17) "registrations"
   18) 1) "0000000000000000000000000000000000000000-1"
```

Get more detailed information about a specific session:

```sh
> redis-cli RG.JDUMPSESSIONS VERBOSE SESSIONS gears_experiments.test
1)  1) "mainClass"
    2) "gears_experiments.test"
    3) "version"
    4) (integer) 1
    5) "description"
    6) "foo"
    7) "upgradeData"
    8) (nil)
    9) "jar"
   10) "/home/user/work/RedisGears/plugins/jvmplugin/-jars/6876b8b78ccfc2ad764edc7ede590f573bd7260b.jar"
   11) "refCount"
   12) (integer) 2
   13) "linked"
   14) "true"
   15) "ts"
   16) "false"
   17) "registrations"
   18) 1)  1) "id"
           2) "0000000000000000000000000000000000000000-1"
           3) "reader"
           4) "CommandReader"
           5) "desc"
           6) (nil)
           7) "RegistrationData"
           8)  1) "mode"
               2) "async"
               3) "numTriggered"
               4) (integer) 0
               5) "numSuccess"
               6) (integer) 0
               7) "numFailures"
               8) (integer) 0
               9) "numAborted"
              10) (integer) 0
              11) "lastRunDurationMS"
              12) (integer) 0
              13) "totalRunDurationMS"
              14) (integer) 0
              15) "avgRunDurationMS"
              16) "-nan"
              17) "lastError"
              18) (nil)
              19) "args"
              20) 1) "trigger"
                  2) "test"
                  3) "inorder"
                  4) (integer) 0
           9) "ExecutionThreadPool"
          10) "JVMPool"
```

