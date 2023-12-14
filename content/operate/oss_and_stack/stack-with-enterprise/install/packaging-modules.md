---
Title: Package modules
alwaysopen: false
categories:
- docs
- operate
- stack
description: null
linkTitle: Package modules
toc: 'true'
weight: 70
---

In addition to the modules packaged and certified by Redis, there are many custom modules that are compatible with Redis Enterprise. 

To use custom modules with a Redis Enterprise database, you need to package them with the [RAMP](https://github.com/RedisLabs/RAMP) (Redis Automatic Module Packaging) utility before you install them on the cluster.

{{<warning>}}
Redis does not officially support third-party modules or databases created with them.
{{</warning>}}

## Prerequisites

Install the `ramp-packer` utility:

```sh
pip install ramp-packer
```

## Package custom modules

Before you can install and enable a custom module in a new database, you need to download, compile, and package it with the RAMP utility.

### Download the module

Download the module source code:

```sh
git clone https://github.com/account/myModule.git
```

### Compile the module

Compile the module with the following command:

```sh
cd myModule/;make
```

### Package the module with RAMP

```sh
$ ramp pack <PATH_TO_myModule.so> -a "Your Name" \
    -e "yourname@emailaddress.com" -A "x86_64" -d "My Module" \
    -h "https://www.mymodule.com/" -l "LicenseType" -r "4.0.2"
```

See the [RAMP README](https://github.com/RedisLabsModules/RAMP#command-line-mode) for more information about RAMP's command-line options.

## Next steps

1. [Install the custom module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-cluster" >}}) on the cluster.
1. Create a database and [enable the custom module]({{< relref "/operate/oss_and_stack/stack-with-enterprise/install/add-module-to-database" >}}).