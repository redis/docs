---
Title: Connecting to Redis
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
draft: true
weight: null
url: '/operate/rs/7.22/references/connecting-to-redis/'
---
To establish a connection to a Redis database, you'll need the following information:

- The hostname or IP address of the Redis server
- The port number that the Redis server is listening at
- The database password (when configured with an authentication password which is **strongly recommended**)
- The SSL certificates (when configured with SSL authentication and encryption - see [this article](/kb/read-more-ssl) for more information)

The combination of `hostname:port` is commonly referred to as the "endpoint." This information is readily obtainable from your Redis Enterprise Cluster and Redis Cloud admin consoles. Unless otherwise specified, our Redis databases are accessible via a single managed endpoint to ensure high availability.

You can connect to a Redis database using a wide variety of tools and libraries depending on your needs. Here's a short list:

- Use one of the many [clients for Redis](redis.io/clients) - see below for client-specific information and examples
- Code your own Redis client based on the [Redis Serialization Protocol (RESP)](http://redis.io/topics/protocol)
- Make friends with Redis' own command line tool - `redis-cli` - to quickly connect and manage any Redis database (**tip:** you can also use `telnet` instead)
- Use tools that provide a [GUI for Redis](/blog/so-youre-looking-for-the-redis-gui)

## Basic connection troubleshooting

Connecting to a remote server can be challenging. Here’s a quick checklist for common pitfalls:

- Verify that the connection information was copy-pasted correctly <- more than 90% of connectivity issues are due to a single missing character.
- If you're using Redis in the cloud or not inside of a LAN, consider adjusting your client's timeout settings
- Try disabling any security measures that your database may have been set up with (e.g. Source IP/Subnet lists, Security Groups, SSL, etc...).
- Try using a command line tool to connect to the database from your server - it is possible that your host and/port are blocked by the network.
- If you've managed to open a connection, try sending the `INFO` command and act on its reply or error message.
- Redis Enterprise Software Redis databases only support connecting to the default database (0) and block some administrative commands. To learn more, see:
    - Redis Enterprise Cluster: [REC compatibility](/redis-enterprise-documentation/rlec-compatibility)
    - Redis Cloud FAQ: [Are you fully compatible with Redis Open Source](/faqs#are-you-fully-compatible-with-open-source-redis)

If you encounter any difficulties or have questions please feel free to [contact our help desk](mailto:support@redislabs.com).
