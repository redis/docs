---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Connect to RDI from Redis Insight, and configure pipelines, and more.
linkTitle: RDI in Redis Insight
stack: true
title: RDI in Redis Insight
weight: 4
---

Redis Data Integration (RDI) and its [ingest pipeline capability]({{< relref "/integrate/redis-data-integration/ingest" >}}) is an end-to-end solution for mirroring your application's primary database in Redis using a capture data change mechanism, and it includes a stream processor to map and transform source data such as relational tables into fast Redis data structures that match your use cases.
You can read more about RDI's ingest architecture [on these pages]({{< relref "/integrate/redis-data-integration/ingest/architecture" >}}).

As of version `2.54.0`, Redis Insight includes RDI connectivity, which allows you to connect to an [RDI management plane]({{< relref "/integrate/redis-data-integration/ingest/architecture" >}}#how-rdi-is-deployed), and create, test, and deploy [RDI pipelines]({{< relref "/integrate/redis-data-integration/ingest/data-pipelines/data-pipelines" >}}).

## Connect

Open Redis Insight, click on the **Redis Data Integration** tab, and then click on one of the two **+ Add RDI Endpoint** buttons as shown below.

<img src="../images/ri-rdi-add-endpoint1.png">

Enter your RDI server details in the dialog. The **RDI Alias** field can be any name you choose and it will be used as the primary name in the **RDI Instances** list view.

<img src="../images/ri-rdi-add-endpoint2.png">

You'll receive notification if your connection is successful.

<img src="../images/ri-rdi-endpoint-added.png">

## Create, test, and deploy RDI pipelines

Begin by clicking the alias of your newly configured RDI connection in the **RDI Instances** view (for example, **Test connection** in the above image). You'll see the following dialog.

<img src="../images/ri-rdi-pl-start.png">

Choose from the following options:

- **Download from server** - Download already-defined pipelines from your RDI configuration.
- **Upload from file** - Upload YAML pipeline files from your local computer.
- **Create new pipeline** - Use Redis Insight's built-in editors to create new pipelines either from scratch or using one of the built-in templates.

Each of these menu options will be described in more detail in subsequent sections.

There are also equivalent buttons at the top of the editor pane for the first two of these functions.

<img src="../images/ri-rdi-pl-editor-minibuttons.png">

If you'd rather start with an empty configuration, exit the dialog, which will leave you in the **Configuration file** editor where you can begin editing your configuration pipeline.

### Download pipelines from your RDI configuration

Click the **Download from server** button in the **Start with your pipeline** dialog to download previously defined configuration and transformation job pipelines from your RDI server. The downloaded pipelines will be displayed in the **Pipeline management** pane. The configuration pipeline file will be displayed in the center panel.

<img src="../images/ri-rdi-pl-dl.png">

### Upload pipelines from your local machine

Click the **Upload from file** button in the **Start with your pipeline** dialog to upload your YAML files from your local machine. The files must be stored in a zip file that has the following structure.

```
├── config.yaml
└── jobs
    └── job1.yaml
```

The `config.yaml` file, your configuration pipeline YAML file, is required. The `jobs` directory can be empty, as job pipelines are not required, but the empty directory must exist in the zip file. Otherwise, the `jobs` folder might include one or more transformation job pipeline files.

### Create a new configuration pipeline using the built-in editor

Click the **Create new pipeline** button in the **Start with your pipeline** dialog to create new pipeline data using the editor in Redis Insight. After doing so, you'll enter the **Configuration file** editor and you'll see a **Select a template** dialog in the upper right-hand corner of the editor.

<img src="../images/ri-rdi-pl-editor-dlg.png">

Make your selections in the provided fields:

- **Pipeline type** is set to **Ingest**. This is the only available option.
- **Database type** has six options:
  - mongodb
  - cassandra
  - mysql
  - oracle
  - postgresql
  - sqlserver

After you make your selections and click **Apply**, Redis Insight will populate the editor window with an appropriate template. To start from scratch, click **Cancel**.

<img src="../images/ri-rdi-pl-editor-template.png">

### Create a new transformation job pipeline using the built-in editor

In the **Pipeline Management** pane, click the `+` next to the **Jobs** folder and enter a name for the new job.
Next, click the job name you just created.
This will take you to the transformation job editor with the template selection menu open. There's only one template available: **Ingest**. Click **Apply** and Redis Insight will populate the editor windows with an appropriate template. To start from scratch, click **Cancel**.

<img src="../images/ri-rdi-job-editor-template.png">

{{< warning >}}
Any changes you make in the editors will be lost if you exit Redis Insight without saving your work. To save any changes you made to your pipeline files, deploy them to your RDI server (see below) or download the modified files as a zip file to your local disk using the **Download** button in the top right of the RDI window.
{{< /warning >}}

## Use the built-in editors

The Redis Insight pipeline editors are context-aware. They provide auto-completion and syntax highlighting for:

- YAML files in the configuration and job file editors
- JMESPath and SQL function snippets in a dedicated editor. To open the JMESPath and SQL editor, click the **SQL and JMESPathEditor** button as shown above. A new editor window will open in the lower half of the screen.

For example, if you decided to write your own configuration pipeline without using a template, you would see auto-completion prompts such as the one shown below.

<img src="../images/ri-rdi-pl-editor-autoc.png">

While this isn't a replacement for the RDI documentation, it can help speed you along after you have basic familiarity with the building blocks of RDI pipeline files.

Here's an example showing the SQL and JMESPath editor pane. Note the toggle in the bottom left corner of this editor pane. Clicking it allows you to select from:

- SQLite functions
- JMESPath

After constructing your SQLite or JMESPath code, copy it to the main editor window.

<img src="../images/ri-rdi-pl-editor-sql-minie.png">

## Dry run transformation job pipelines

After you've created a transformation job pipeline, you can execute a dry run on the RDI server. To do that, click on **Dry Run** in the lower right side of the editor pane. A new **Test transformation logic** panel will open to the side. There are two vertically-stacked panes: **Input** and **Results**. In the **Input** section, enter JSON data that will trigger the transformation. Any results will be displayed in the **Results** section.

There are two tabs in the **Results** section:

1. **Transformations** - this is where you'll see JSON output from your dry run.
1. **Output** - (not shown) this is where you'll see the Redis commands that would have been run in a real scenario.

Here's an example.

<img src="../images/ri-rdi-pl-dryrun.png">

## Deploy pipelines and view statistics

If you're satisfied with your configuration and transformation job pipelines, you can deploy them to the RDI management plane. Click the **Deploy Pipeline** button to proceed.

After your pipelines have been deployed, you can view various statistics for your RDI deployment. To do so, click  the **Pipeline Status** menu button in the left side menu panel.

<img src="../images/ri-rdi-stats-view.png">

Each statistics section is either static or refreshed automatically at a particular interval that you set.
The first section, **Processing performance information** is set by default to refresh every 5 seconds.
The other sections are static and need to be refreshed manually by pressing the refresh button at the top right of each section.
You can also set up automatic refresh for the other sections.

To set up automatic refresh for one or more statistics sections, click on the downward arrow at the end of the **Last refresh** line.
Then enable the **Auto Refresh** setting and set your desired refresh interval in seconds. This is shown in the previous image.
