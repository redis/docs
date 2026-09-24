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

## Create a Data Integration workspace

{{< embed-md "rc-rdi-create-rdi-workspace.md" >}}

{{<image filename="images/rc/rdi/rdi-workspace-add-pipeline.png" alt="The Add pipeline control is available while the workspace is being created." width=80% >}}

## View workspace status and details

You can view your workspace in one of the following ways:

- From the Redis Cloud console, go to the **Data integration** page, or
- From your subscription, select the **Data Integration** tab

{{<image filename="images/rc/rdi/rdi-2-workspace-sources.png" alt="Workspace pipeline list showing a streaming pipeline and its Sources column." width=100% >}}

There, you'll see your workspace and its pipelines. The **Sources** column lists each pipeline's source names and database types. A source with unfinished configuration is marked **Pending setup**. Open its draft to continue setup. To see your workspace details, including the deployment CIDR and region information, select **Workspace actions > Workspace details**.

{{<image filename="images/rc/rdi/rdi-2-workspace-actions.png" alt="Workspace actions menu with Workspace details and Delete workspace." width=240px >}}

## Delete workspace

{{< warning >}}
Make sure to [delete your data pipeline]({{<relref "/operate/rc/rdi/view-edit#delete-pipeline">}}) before deleting your workspace.
{{< /warning >}}

To delete your workspace, select **Workspace actions > Delete workspace** from your workspace.

{{<image filename="images/rc/rdi/rdi-2-workspace-actions.png" alt="Workspace actions menu with Workspace details and Delete workspace." width=240px >}}
