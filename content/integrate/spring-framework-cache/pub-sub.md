---
LinkTitle: Pub/sub
Title: Publish and subscribe to messages with Spring
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
description: Send and receive Redis pub/sub messages in a Spring application.
group: framework
summary: Use StringRedisTemplate to publish messages and RedisMessageListenerContainer to subscribe to channels and patterns.
type: integration
weight: 14
---

Spring Data Redis supports Redis [pub/sub](/content/develop/pubsub/_index.md) with
two parts: the template publishes messages, and a message listener container
receives them. See the
[pub/sub use case](/content/develop/use-cases/pub-sub/_index.md) for when to
choose pub/sub.

## Subscribe to channels

Define a `RedisMessageListenerContainer` bean. Add one listener for each channel or
pattern you want to receive. This example subscribes to the `news` channel and to every
channel that matches `alerts:*`:

```java
@Configuration
public class PubSubConfig {
    @Bean
    RedisMessageListenerContainer listenerContainer(RedisConnectionFactory connectionFactory) {
        MessageListener listener = (message, pattern) -> {
            String channel = new String(message.getChannel(), StandardCharsets.UTF_8);
            String body = new String(message.getBody(), StandardCharsets.UTF_8);
            System.out.println(channel + ": " + body);
        };

        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listener, new ChannelTopic("news"));
        container.addMessageListener(listener, new PatternTopic("alerts:*"));
        return container;
    }
}
```

The container subscribes when the application starts and delivers each message to your
listener on a separate thread.

> [!NOTE]
> If you use a `MessageListenerAdapter` to call a method on your own class, the
> second `String` argument of the handler method is the pattern that matched, not the
> channel. For a pattern subscription such as `alerts:*`, the adapter passes
> `alerts:*` rather than `alerts:disk`. Read the channel from `message.getChannel()`
> in a `MessageListener`, as in the example.

## Publish messages

Call `convertAndSend` on the template:

```java
template.convertAndSend("news", "hello");
template.convertAndSend("alerts:disk", "full");
```

With the listener container above, the listener receives `news: hello` and
`alerts:disk: full`.

## Delivery guarantees

Redis pub/sub is fire-and-forget. A message published while your application isn't
subscribed is lost. If you need to keep messages until a consumer processes them, use a
[stream](/content/integrate/spring-framework-cache/streams.md) instead.
