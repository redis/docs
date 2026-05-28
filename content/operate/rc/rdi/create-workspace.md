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

## View workspace status and details



## Delete workspace