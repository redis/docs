---
Title: Create and manage Data Integration workspace
linkTitle: Create workspace
aliases:
    - /operate/rc/databases/rdi/create-workspace
    - /operate/rc/databases/rdi/create-workspace/
alwaysopen: false
categories:
- docs
- operate
- rc
description: Create and manage the infrastructure for your Data Integration pipelines.
hideListLinks: true
weight: 2
tocEmbedHeaders: true
---

Before you can create your first Data Integration pipeline for a Redis Cloud subscription, you must first deploy the cloud infrastructure needed to host the pipeline and run the workers associated with the pipeline. In Redis Cloud, this is called a **Workspace**. Each Pro subscription can have one Data integration workspace. You only need to set up the workspace once - any pipelines you create for your subscription will run on the workspace until you delete it. You won't be charged for a workspace until you start running your Data Integration pipeline.

To manage Data Integration workspaces programmatically, see the [Redis Cloud Data Integration API reference]({{< relref "/operate/rc/api/api-reference" >}}#tag/Subscriptions-Pro-Data-Integration).

## Create a Data Integration workspace

{{< embed-md "rc-rdi-create-rdi-workspace.md" >}}

## View workspace status and details

You can view your workspace in one of the following ways:

- From the Redis Cloud console, go to the **Data integration** page, or
- From your subscription, select the **Data Integration** tab

{{<image filename="images/rc/rdi/rdi-workspace-add-pipeline.png" alt="The workspace section of the Data Integration tab for a database" width=80% >}}

There, you'll see your workspace, as well as any pipeline that you've created in it. To see your workspace details, including the deployment CIDR and region information, select **More actions > Workspace details**.

{{<image filename="images/rc/rdi/rdi-workspace-more-actions.png" alt="The delete workspace button." width=50% >}}

## Delete workspace

{{< warning >}}
Make sure to [delete your data pipeline]({{<relref "/operate/rc/rdi/view-edit#delete-pipeline">}}) before deleting your workspace.
{{< /warning >}}

To delete your workspace, select **More actions > Delete workspace** from your workspace.

{{<image filename="images/rc/rdi/rdi-workspace-more-actions.png" alt="The delete workspace button." width=50% >}}
