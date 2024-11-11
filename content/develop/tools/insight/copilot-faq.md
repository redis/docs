---
aliases: /develop/connect/insight/copilot-faq
categories:
- docs
- operate
- redisinsight
linkTitle: Redis Copilot FAQ
title: Redis Copilot FAQ
weight: 3
---

## General questions

### What is Redis Copilot?
Redis Copilot is an AI-powered developer assistant that helps you learn about Redis, explore your Redis data, and build search queries in a conversational manner.  It is available in our flagship visual GUI developer tool, Redis Insight, as well as within the Redis public documentation (general chatbot). 

### How does Redis Copilot work?
Redis Copilot is powered by the [OpenAI API](https://platform.openai.com/docs/overview) platform. When it needs to provide context-aware assistance, such as within the **my data** chat in Redis Insight, Redis Copilot will use data from your connected database. Some of that data, such as indexing schemas and sample keys, may be transmitted to the Redis Copilot backend and OpenAI for processing.

### What kind of tasks can Redis Copilot perform?

Currently, Redis Copilot provides two primary features: a general chatbot and a context-aware data chatbot.

**General chatbot**: the knowledge-based chatbot serves as an interactive and dynamic documentation interface to simplify the learning process. You can ask specific questions about Redis commands, concepts, and products, and get responses on the fly. The general chatbot is also available in our public docs.

**My data chatbot**: the context-aware chatbot available in Redis Insight lets you construct search queries using everyday language rather than requiring specific programming syntax. This feature lets you query and explore data easily and interactively without extensive technical knowledge.

### How do I get started with Redis Copilot in Redis Insight?

The Redis Copilot instance within our public documentation is free for anyone to use and is available now to answer general questions about Redis.

The Redis Copilot instance that is embedded in Redis Insight is gradually being rolled out to the user base. Once you are granted access to Redis Copilot in the app, you need to sign in with your Redis Cloud account before you can start using it. If you don’t have an account with Redis Cloud yet, it will be automatically created when you sign in at no extra cost to you. 

## Data and Privacy

### What data does Redis Copilot have access to in my database?

Redis Copilot will have access to any relevant data stored in your database to provide context-aware assistance.
However, this only impacts the **my data** chat in Redis Insight.

### Will OpenAI use my data to train their models? 

OpenAI states that the data provided via OpenAI API is not used for training. Please see the [OpenAI API data privacy page](https://openai.com/api-data-privacy) for the latest information.

### What are the Redis Copilot terms? 

Redis Copilot terms apply to your use of or access to Redis Copilot. They set out what you can expect from Redis Copilot concerning its capabilities and limitations and how Redis Copilot handles your data.

## Feedback

### How can I provide feedback or report a bug?

Redis Copilot is released as Beta in Redis Insight. We welcome your feedback and bug reports. You can submit them through the feedback form available in the [Redis Insight GitHub repository](https://github.com/RedisInsight/RedisInsight).


