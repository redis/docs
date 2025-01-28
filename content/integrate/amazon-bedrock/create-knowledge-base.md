---
LinkTitle: Create Bedrock knowledge base
Title: Create a Bedrock knowledge base
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Shows how to set up your Knowledge base in Amazon Bedrock.
group: cloud-service
summary: With Amazon Bedrock, users can access foundational AI models from a variety
  of vendors through a single API, streamlining the process of leveraging generative
  artificial intelligence.
type: integration
weight: 2
---

After you have set up a vector database with Redis Cloud, you can use it to create a knowledge base for your models.

Before you begin this guide, you will need:

- An [AWS S3 Bucket](https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-buckets-s3.html) with text data that you want to use to train your models.

- An [AWS IAM Role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-service.html) with permissions for the Bedrock knowledge base.

- A Redis database that is [set up for Amazon Bedrock]({{< relref "/integrate/amazon-bedrock/set-up-redis" >}})

## Create knowledge base 

To use your Redis database to create a knowledge base on Amazon Bedrock:

1. Sign in to the [AWS console](https://console.aws.amazon.com/). 

1. Use the **Services** menu to locate and select **Machine Learning** > **Amazon Bedrock**.  This takes you to the Amazon Bedrock admin panel.

1. Select **Knowledge base** > **Create knowledge base** to create your knowledge base.

    {{<image filename="images/rc/bedrock-aws-button-create-knowledge-base.png" width="200px" alt="The Create knowledge base button." >}}

1. In the **Knowledge base details** section, enter a name and description for your knowledge base. 

1. Select the IAM role for the Bedrock knowledge base in the **IAM Permissions** section. Select **Next** to add the data source.

1. Enter a name for the data source and connect your S3 bucket in the **Data source** section.

1. In the **Vector database** section, select **Redis Cloud** and select the checkbox to agree with the legal disclaimer.

    {{<image filename="images/rc/bedrock-aws-select-redis-vector-db.png" width="500px" alt="The Redis Cloud selection for your vector database." >}}

    Fill in the fields with the following information:

    - **Endpoint URL**: Public endpoint of your database. This can be found in the [Redis Cloud console](https://cloud.redis.io/) from the database list or from the **General** section of the **Configuration** tab for the source database.
    - **Credentials Secret ARN**: [Amazon Resource Name (ARN)](https://docs.aws.amazon.com/secretsmanager/latest/userguide/reference_iam-permissions.html#iam-resources) of your [database credentials secret]({{< relref "/integrate/amazon-bedrock/set-up-redis#store-secret" >}}).
    - **Vector Index name**: Name of the [vector index]({{< relref "/integrate/amazon-bedrock/set-up-redis#create-vector-index" >}}) 
    - **Vector field**: Name of the [vector field]({{< relref "/integrate/amazon-bedrock/set-up-redis#create-vector-index" >}}) of the vector index
    - **Text field**: Name of the [text field]({{< relref "/integrate/amazon-bedrock/set-up-redis#create-vector-index" >}}) of the vector index
    - **Metadata field**: Name of the [metadata field]({{< relref "/integrate/amazon-bedrock/set-up-redis#create-vector-index" >}}) of the vector index

    Select **Next** to review your settings.

1. Review your knowledge base before you create it. Select **Create knowledge base** to finish creation.

    {{<image filename="images/rc/bedrock-aws-button-create-knowledge-base.png" width="200px" alt="The Create knowledge base button." >}}

Amazon Bedrock will sync the data from the S3 bucket and load it into your Redis database. This will take some time.

Your knowledge base will have a status of **Ready** when it is ready to be connected to an Agent.

{{<image filename="images/rc/bedrock-aws-status-knowledge-base-ready.png" width="500px" alt="A Bedrock knowledge base with a Ready status." >}}

Select the name of your knowledge base to view the syncing status of your data sources. The data source will have a status of **Ready** when it is synced to the vector database.

{{<image filename="images/rc/bedrock-aws-status-data-source-ready.png" width="600px" alt="A Bedrock data source with a Ready status." >}}

After the knowledge base is ready, you can use it to [Create an agent]({{< relref "/integrate/amazon-bedrock/create-agent" >}}).
