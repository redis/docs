---
categories:
- docs
- operate
- redisinsight
description: How to install Redis Insight on Docker
linkTitle: Install on Docker
title: Install on Docker
weight: 2
---
This tutorial shows how to install Redis Insight on [Docker](https://www.docker.com/) so you can use Redis Insight in development.
See a separate guide for installing [Redis Insight on AWS]({{< relref "/operate/redisinsight/install/install-on-aws" >}}).

## Install Docker

The first step is to [install Docker for your operating system](https://docs.docker.com/install/). 

## Run Redis Insight Docker image

You can install Redis Insight using one of the options described below.

1. If you do not want to persist your Redis Insight data:

```bash
docker run -d --name redisinsight -p 5540:5540 redis/redisinsight:latest
```
2. If you want to persist your Redis Insight data, first attach the Docker volume to the `/data` path and then run the following command:

```bash
docker run -d --name redisinsight -p 5540:5540 -v redisinsight:/data redis/redisinsight:latest
```

If the previous command returns a permission error, ensure that the user with `ID = 1000` has the necessary permissions to access the volume provided (`redisinsight` in the command above).

Next, point your browser to `http://localhost:5540`.

Redis Insight also provides a health check endpoint at `http://localhost:5540/api/health/` to monitor the health of the running container.
