---
LinkTitle: Sessions
Title: Store sessions with Spring Session
alwaysopen: false
categories:
- docs
- integrate
- stack
- oss
- rs
- rc
- oss
- client
description: Keep HTTP session data in Redis with Spring Session Data Redis.
group: framework
summary: Spring Session Data Redis stores web application sessions in Redis, so several application instances share them and sessions survive a restart.
type: integration
weight: 18
---

[Spring Session](https://spring.io/projects/spring-session) replaces the servlet
container's in-memory HTTP session with one stored in Redis. Several instances of your
application share the same sessions, and sessions survive a restart. See the
[session store use case](/content/develop/use-cases/session-store/_index.md) for more
about this pattern.

## Enable Redis-backed sessions

With Spring Boot, add the Spring Session starter for Redis next to the
[Spring Data Redis starter](/content/integrate/spring-framework-cache/_index.md#requirements)
and a web starter:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-session-data-redis</artifactId>
</dependency>
```

Spring Boot then stores your `HttpSession` data in Redis with no further code:

```java
@RestController
public class SessionController {
    @GetMapping("/hit")
    int hit(HttpSession session) {
        Integer count = (Integer) session.getAttribute("count");
        int next = count == null ? 1 : count + 1;
        session.setAttribute("count", next);
        return next;
    }
}
```

Two requests that share a session cookie return `1` and then `2`. Spring Session stores
the session as a hash under the key `spring:session:sessions:<session-id>`, with a
time to live (TTL) equal to the session timeout. The default timeout is 30 minutes.

## Choose a repository type

Spring Session provides two Redis repositories. Set the type with a property:

```properties
spring.session.data.redis.repository-type=indexed
```

| Type | Behavior |
| --- | --- |
| `default` | Stores each session as one hash with a TTL equal to the timeout. |
| `indexed` | Also keeps an expiration entry for each session and a set of expirations, and supports looking up sessions by index, such as by user name. |

With the `indexed` type, Spring Session sets the Redis `notify-keyspace-events`
configuration to `gxE` at startup, so it can publish session expiry events. It also
sets the TTL of the session hash to the timeout plus 5 minutes, so the expiry handling
can still read the session when it expires. See
[Keyspace notifications](/content/develop/pubsub/keyspace-notifications.md) for
more about the setting.

## Configure the namespace and timeout

Use these properties to change the key prefix and the session timeout:

```properties
spring.session.data.redis.namespace=myapp:sessions
server.servlet.session.timeout=15m
```

With this namespace, sessions are stored under `myapp:sessions:sessions:<session-id>`,
and a 15-minute timeout gives the session hash a 15-minute TTL (20 minutes with the
`indexed` type).

## Use a service that doesn't allow configuration changes

If your Redis service doesn't let clients change the server configuration, tell Spring
Session not to set `notify-keyspace-events`:

```properties
spring.session.data.redis.configure-action=none
```

Spring Session then leaves the setting alone, and sessions work as before. You must
enable keyspace notifications yourself if you want session expiry events.
