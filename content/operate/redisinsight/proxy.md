---
categories:
- docs
- operate
- redisinsight
linkTitle: Proxy settings
title: Subpath proxy
weight: 7
---

You can enable the subpath proxy by setting the `RI_PROXY_PATH` environment variable.


When `RI_PROXY_PATH` is being set with a path, Redis Insight is
accessible only on that subpath. The default routes are given the
provided prefix subpath. There isn’t any way to add another proxy behind
this one unless the same subpath is used for the new one.

{{<note>}}
Once you set the static subpath environment variable, Redis Insight is only reachable on the provided subpath. The default endpoint won't work.
{{</note>}}

## Using Redis Insight behind a reverse proxy

When you configure Redis Insight to run behind a reverse proxy like NGINX, set the request timeout to over 30 seconds on the reverse proxy because some requests can be long-running.

Redis Insight also allows you to manage its connection timeout on the form to configure the connection details. The default timeout is 30 seconds.

Hosting Redis Insight behind a prefix path (path-rewriting) is not supported.


## Example

### Docker compose file

```yaml
version: "3.7"
services:
  redis-stack:
    image: redis/redis-stack-server
    networks:
      - redis-network

  redisinsight:
    image: redis/redisinsight
    environment:
      - RIPORT=${RIPORT:-5540}
      - RITRUSTEDORIGINS=http://localhost:9000
    depends_on:
      - redis-stack
    networks:
      - redis-network

  nginx-basicauth:
    image: nginx
    volumes:
      - ./nginx-basic-auth.conf.template:/etc/nginx/templates/nginx-basic-auth.conf.template
    ports:
      - "${NGINX_PORT:-9000}:${NGINX_PORT:-9000}"
    environment:
      - FORWARD_HOST=redisinsight
      - FORWARD_PORT=${RIPORT:-5540}
      - NGINX_PORT=${NGINX_PORT:-9000}
      - BASIC_USERNAME=${BASIC_USERNAME:-redis}
      - BASIC_PASSWORD=${BASIC_PASSWORD:-password}
    command:
      - bash
      - -c
      - |
        printf "$$BASIC_USERNAME:$$(openssl passwd -1 $$BASIC_PASSWORD)\n" >> /etc/nginx/.htpasswd
        /docker-entrypoint.sh nginx -g "daemon off;"
    depends_on:
      - redisinsight
    networks:
      - redis-network
```

### nginx config

```
server {
 listen ${NGINX_PORT} default_server;

 location / {
     auth_basic             "redisinsight";
     auth_basic_user_file   .htpasswd;

     proxy_pass             http://${FORWARD_HOST}:${FORWARD_PORT};
     proxy_read_timeout     900;
 }
}

```

### Login page

{{< image filename="/images/ri/ri-reverse-proxy-login.png" alt="RedisInsight login page" >}}


### After login

{{< image filename="/images/ri/ri-reverse-proxy-post-login.png" alt="RedisInsight after login" >}}

