---
LinkTitle: Amazon Bedrock
Title: Amazon Bedrock
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Shows how to use your Redis database with Amazon Bedrock to customize
  foundational models.
group: cloud-service
summary: With Amazon Bedrock, users can access foundational AI models from a variety
  of vendors through a single API, streamlining the process of leveraging generative
  artificial intelligence.
type: integration
weight: 3
---

[Amazon Bedrock](https://aws.amazon.com/bedrock/) is a service that allows you to securely customize foundational models (FMs) with your own data, and to use these models without having to build complex infrastructure management. With Amazon Bedrock, users can access FMs from a variety of vendors through a single API, streamlining the process of creating generative artificial intelligence (AI).

Amazon Bedrock allows you to choose Redis Cloud as the [vector database](https://redis.com/solutions/use-cases/vector-database/) for your knowledge base. After your database is set up and connected to Amazon Bedrock, it will import text data from an Amazon Simple Storage Service (S3) bucket into Redis Cloud and use it to extract relevant information when prompted.

For more information about the Redis integration with Amazon Bedrock, see the [Amazon Bedrock integration blog post](https://redis.com/blog/amazon-bedrock-integration-with-redis-enterprise/).

To fully set up Bedrock with Redis Cloud, you will need to do the following:

1. [Set up a Redis Cloud subscription and vector database]({{< relref "/integrate/amazon-bedrock/set-up-redis" >}}) for Bedrock.

1. [Create a knowledge base]({{< relref "/integrate/amazon-bedrock/create-knowledge-base" >}}) connected to your vector database.

1. [Create an agent]({{< relref "/integrate/amazon-bedrock/create-agent" >}}) connected to your knowledge base.

## More info

- [Amazon Bedrock integration blog post](https://redis.com/blog/amazon-bedrock-integration-with-redis-enterprise/)
- [Detailed steps](https://github.com/RedisVentures/aws-redis-bedrock-stack/blob/main/README.md)
