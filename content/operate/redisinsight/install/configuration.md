---
categories:
- docs
- operate
- redisinsight
linkTitle: Configuration settings
title: Configuration settings
weight: 5
---
To configure Redis Insight with environment variables:

1. Follow the instructions to set environment variables for your operating system:

    - [macOS](https://apple.stackexchange.com/a/106814)
    - [Windows](https://www.architectryan.com/2018/08/31/how-to-change-environment-variables-on-windows-10/)
    - [Linux](https://askubuntu.com/a/58828)
    - [Docker](https://docs.docker.com/engine/reference/commandline/run/#set-environment-variables--e---env---env-file)

1. Restart Redis Insight.

## Redis Insight environment variables

Use the following environment variables to configure Redis Insight:

### RIPORT

**Description:** Which port should Redis Insight listen on.

**Type:**        Number

**Default:**     `8001`

### RIHOST

**Description:** Which host should Redis Insight bind to.

**Type:**        String

**Default:**     `"0.0.0.0"` on Docker and `"127.0.0.1"` on Windows, macOS, and Linux.

### RIHOMEDIR

**Description:** Sets the storage directory where Redis Insight stores application data (such as local database, log files, and snapshot files).

**Type:**        String

**Default:**     `"~/.redisinsight"` on desktop, `"/db"` on Docker.

### RILOGDIR

**Description:** Sets the directory where Redis Insight stores application logs.

**Type:**        String

**Default:**     `"~/.redisinsight"` on desktop, `"/db"` on Docker.


### RILOGLEVEL

**Description:** Configures the log level of the application. Possible values are `"DEBUG"`, `"INFO"`, `"WARNING"`, `"ERROR`", and `"CRITICAL"`.

**Type:**        String

**Default:**     `"WARNING"`


### RITRUSTEDORIGINS

**Description:** Configures the trusted origins of the application.

**Type:**        String

**Default:**     `""`

**Examples:**     `"https://my-website.com,https://my-another-website.com,http://my-third-website.com"`
 
### RIPROXYENABLE

**Description:** Enables Sub-path Proxy for the application.

**Type:**        Bool

**Default:**    `False`


### RIPROXYPATH

**Description:** Configures Sub-path Proxy path for the application. 

**Type:**        String

**Default:**     `""`

**Examples:**     `"/redisinsight"`, `"/myapp"`

### RIPROXYPREFIX

**Description:** Sets the Sub-path proxy prefix HTTP header field name for the application. The application uses the value from this HTTP header key as the proxy sub-path. 

**Type:**        String

**Default:**     `"X-Forwarded-Prefix"`

**Examples:**     `"X-Forwarded-Prefix"`, `"X-Forwarded-Path"` 

### RIAUTHPROMPT

**Description:** Enables an authentication prompt that asks for authentication before opening an instance or when the user is idle.

**Type:** Bool

**Default:** `false`


### RIAUTHTIMER

**Description:** Idle timer value for the authentication prompt in minutes.

**Type:** Bool

**Default:** `30`


### REDISINSIGHT_PORT (DEPRECATED)

**Description:** Which port should Redis Insight listen on.

**Type:**        Number

**Default:**     `8001`

**Deprecated in:** `v1.9.0`

### REDISINSIGHT_HOST (DEPRECATED)

**Description:** Which host should Redis Insight bind to.

**Type:**        String

**Default:**     `"0.0.0.0"`

**Deprecated in:** `v1.9.0`

### REDISINSIGHT_HOME_DIR (DEPRECATED)

**Description:** Sets the storage directory where Redis Insight stores application data (such as local database, log files, and snapshot files).

**Type:**          String

**Default:**       `"~/.redisinsight"` on desktop, `"/db"` on docker.

**Deprecated in:** `v1.9.0`

### LOG_DIR (DEPRECATED)

**Description:** Sets the directory where Redis Insight stores application logs.

**Type:**        String

**Default:**     `"~/.redisinsight"` on desktop, `"/db"` on docker.