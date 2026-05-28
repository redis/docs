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

To create a Data Integration workspace for an existing [Pro subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}):

1. From the Redis Cloud console, select **Pipelines** from the left-hand menu. If you don't have any workspaces yet, select **Create workspace** to go to the **Create workspace** page.

    {{<image filename="images/rc/rdi/rdi-create-workspace-button.png" alt="The create workspace button." width=200px >}}

    If you already have a workspace deployed, you'll see your current workspaces. Select **New workspace** to go to the **Create workspace** page.

    {{<image filename="images/rc/rdi/rdi-new-workspace-button.png" alt="The new workspace button." width=150px >}}

    You can also go to the **Pipelines** tab from your subscription page and select **Create workspace** to go to the **Create workspace** page for your subscription.

    {{<image filename="images/rc/rdi/rdi-create-workspace-button.png" alt="The create workspace button." width=200px >}}

2. Select your Pro subscription from the list if it's not already selected.

    {{<image filename="images/rc/rdi/rdi-rdi-create-workspace-select-subscription.png" alt="The select pro subscription drop down." width=80% >}}

3. A **Data Integration subnet (CIDR)** is automatically generated for you. If, for any reason, a CIDR is not generated, enter a valid CIDR that does not conflict with your applications or other databases.

    {{<image filename="images/rc/rdi/rdi-create-workspace-cidr.png" alt="The select pro subscription drop down." width=80% >}}

4. Select **Create workspace** to create your workspace.

    {{<image filename="images/rc/rdi/rdi-create-workspace-button.png" alt="The create workspace button." width=200px >}}

Your workspace will be created in the background. You can select **Create pipeline** to [create your pipeline]({{<relref "/operate/rc/rdi/define">}}) while the workspace is provisioning, or you can select **Create pipeline later** to go back to the Redis Cloud console.

## View workspace status and details



## Delete workspace