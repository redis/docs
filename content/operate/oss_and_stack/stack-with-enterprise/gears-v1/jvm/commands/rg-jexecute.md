---
Title: RG.JEXECUTE
alwaysopen: false
categories:
- docs
- operate
- stack
description: Executes a Java function.
linkTitle: RG.JEXECUTE
weight: 40
---

```sh
RG.JEXECUTE <path.to.main.class> [UPGRADE] <JAR file>
```

Executes a Java function.

The code runs immediately if it uses [`GearsBuilder.run()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/run" >}}). Code that uses [`GearsBuilder.register()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/register" >}}) will run later, every time certain events occur in the database.

## Arguments

| Name | Description |
|------|-------------|
| path.to.main.class | The path to the main class in the JAR |
| JAR file | A JAR file that contains the RedisGears code to run or register |
| UPGRADE | Upgrades registered code to a new version |


## Returns

If the executed code calls [`GearsBuilder.run()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/run" >}}), it returns the output of the executed code.

For registered code, it returns the string "`OK`" instead.

## Examples

The executed code in this example [runs]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/run" >}}) immediately:

```sh
$ redis-cli -x RG.JEXECUTE com.domain.packagename.Reviews < /tmp/rgjvmtest-0.0.1-SNAPSHOT.jar
1) 1) "3.6666666666666665"
2) (empty array)
```

This example [registers]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/register" >}}) the RedisGears code to run every time certain database events occur:

```sh
$ redis-cli -x RG.JEXECUTE com.domain.packagename.App < /tmp/rgjvmtest-0.0.1-SNAPSHOT.jar
OK
```

Here's an example of how to upgrade registered code to a new version:

```sh
$ redis-cli -x RG.JEXECUTE com.domain.packagename.App UPGRADE < /tmp/rgjvmtest-0.0.2-SNAPSHOT.jar
OK
```