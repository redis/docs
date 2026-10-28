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

Before you can create your first Data Integration pipeline for a Redis Cloud subscription, you must first deploy the cloud infrastructure needed to host the pipeline and run the workers associated with the pipeline. In Redis Cloud, this is called a **Workspace**. Each Pro subscription can have one Data integration workspace. You only need to set up the workspace once - any pipelines you create for your subscription will run on the workspace until you delete it. A workspace can run several pipelines. See [Add pipelines to a workspace](#add-pipelines-to-a-workspace). You won't be charged for a workspace until you deploy your first Data Integration pipeline.

## Create a Data Integration workspace

For multiple source databases or Redis subscriptions, see [Plan source connectivity](/content/operate/rc/rdi/networking/_index.md). It explains which endpoint services you can reuse and which connections you configure for each workspace.

{{< embed-md "rc-rdi-create-rdi-workspace.md" >}}

![The Add pipeline control is available while the workspace is being created.](/images/rc/rdi/rdi-workspace-add-pipeline.png)
{width="80%"}

## View workspace status and details

You can view your workspace in one of the following ways:

- From the Redis Cloud console, go to the **Data integration** page, or
- From your subscription, select the **Data Integration** tab

![A workspace with a draft, a running, and a stopped pipeline, with their sources, target databases, and billing. Add pipeline is unavailable while the draft exists.](/images/rc/rdi/rdi-2-workspace-pipelines.png)
{width="100%"}

There, you'll see your workspace and its pipelines, one row per pipeline. The **Status** column shows **Draft** for a pipeline that you have not deployed yet, and the state of a deployed pipeline otherwise, such as **Running**, **Stopped**, or **Error**. The **Sources** column lists each pipeline's source names and database types. A source with unfinished configuration is marked **Pending setup**. Open its draft to continue setup. The **Billing** column shows **Not billed** for a draft, and the hourly rate of a deployed pipeline. A stopped pipeline is still billed and shows **Billing continues**. See [How does stopping sources or the pipeline affect billing?](/content/operate/rc/rdi/faq.md#stopping-and-billing) To see your workspace details, including the deployment CIDR and region information, select **Workspace actions > Workspace details**.

![Workspace actions menu with Workspace details and Delete workspace.](/images/rc/rdi/rdi-2-workspace-actions.png)
{width="240px"}

## Add pipelines to a workspace

A workspace can run several pipelines. Each pipeline has its own sources, target database, processor, and settings, so you can deploy, stop, reset, or delete one pipeline without affecting the others. Use separate pipelines when the data goes to different target databases, or when you want to manage some of the data independently. To capture several source databases into the same target as one unit, [add sources to one pipeline](/content/operate/rc/rdi/view-edit.md#add-source) instead.

To add a pipeline:

1. Open your workspace from the **Data Integration** page or from the **Data Integration** tab of your subscription or database.
1. Select **Add pipeline** at the bottom of the workspace.
1. Enter a **Pipeline name**. Use 3 to 20 characters: lowercase letters, numbers, and hyphens. Start with a lowercase letter, end with a letter or number, and don't use two hyphens in a row. The name `rdi` is reserved, and each pipeline in the workspace must have a different name. You can't change the name later.

    ![The Create new pipeline dialog with a pipeline name.](/images/rc/rdi/rdi-2-create-pipeline.png)
    {width="376px"}

1. Select **Create pipeline**.

The new pipeline appears in the workspace with the **Draft** status, next to the other pipelines of the workspace, like `inventory-propagation` in the example in [View workspace status and details](#view-workspace-status-and-details). Redis Cloud doesn't bill a pipeline until you deploy it.

Continue with [Create data pipeline](/content/operate/rc/rdi/define.md) to configure the pipeline's settings and sources and deploy it. You can set up one pipeline at a time. Until you deploy the new pipeline or delete its draft, **Add pipeline** is unavailable, and the console shows **A new pipeline can be added only when the current pending pipeline setup is complete.**

The pipelines of a workspace share its resources:

- The workspace [CIDR range](/content/operate/rc/rdi/scale-pipeline.md#plan-workspace-network-capacity). Plan it for all the sources and processor replicas of all your pipelines.
- The workspace's AWS PrivateLink connections. A pipeline can use an endpoint service that another pipeline of the workspace already uses. See [Plan source connectivity](/content/operate/rc/rdi/networking/_index.md).
- The Role ARNs for source connectivity and secrets, which are the same for every pipeline of the workspace.
- The workspace's [RDI database](/content/operate/rc/rdi/scale-pipeline.md#increase-rdi-database-throughput), which holds the change records of every pipeline until its processor writes them to the target.

Each pipeline is billed for its own collectors and processor replicas, and the workspace charge applies once, however many pipelines you deploy. See [How is RDI usage calculated?](/content/operate/rc/rdi/faq.md#how-is-rdi-usage-calculated)

## Delete workspace

> [!WARNING]
> Make sure to [delete your data pipelines](/content/operate/rc/rdi/view-edit.md#delete-pipeline) before deleting your workspace.

When you delete the last pipeline of a workspace, you can delete the workspace in the same step. See [Delete pipeline](/content/operate/rc/rdi/view-edit.md#delete-pipeline).

To delete your workspace, select **Workspace actions > Delete workspace** from your workspace.
