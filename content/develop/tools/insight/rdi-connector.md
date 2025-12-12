---
aliases: /develop/connect/insight/rdi-connector
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
description: Connect to RDI from Redis Insight, configure pipelines, and more.
linkTitle: RDI in Redis Insight
stack: true
title: RDI in Redis Insight
weight: 4
---

Redis Data Integration (RDI) and its [ingest pipeline capability]({{< relref "/integrate/redis-data-integration" >}}) is an end-to-end solution for mirroring your application's primary database in Redis. RDI employs a capture data change mechanism and a stream processor to map and transform source data such as relational tables into fast Redis data structures that match your use cases.
You can read more about RDI's ingest architecture [on these pages]({{< relref "/integrate/redis-data-integration/architecture" >}}).

As of version `2.54.0`, Redis Insight includes RDI connectivity, which allows you to connect to [RDI management planes]({{< relref "/integrate/redis-data-integration/architecture" >}}#how-rdi-is-deployed), create, test, and deploy [RDI pipelines]({{< relref "/integrate/redis-data-integration/data-pipelines" >}}), and view RDI statistics.

{{< note >}}
Most of the screenshots on this page were taken using a previous version of Redis Insight. The functionality is the same in the current version, but the user interface has changed.
{{< /note >}}

## Connect

Open Redis Insight and then click on the **Redis Data Integration** tab, which looks like this:

{{< image filename="images/ri/ri-rdi-main.png" alt="Redis Data Integration tab" >}}

Next, click on **Let's connect to RDI**, which will open the **Add RDI Endpoint** dialog.

{{< image filename="images/ri/ri-rdi-add-ep.png" alt="Connect to RDI" >}}

Enter your RDI server details into the dialog. The **RDI Alias** field can be any name you choose and it will be used as the primary name in the **RDI Instances** list view. You'll receive notification if your connection is successful.

{{< image filename="images/ri/ri-rdi-endpoint-added.png" alt="RDI endpoint added" >}}

## Create, test, and deploy RDI pipelines

Begin by clicking the alias of your newly configured RDI endpoint in the **RDI Instances** view (for example, **Test connection** in the above image). You'll see the following dialog in the center of the screen.

{{< image filename="images/ri/ri-rdi-pl-start.png" alt="Start with your pipeline" >}}

Choose from the following options:

- **Download from server** - Download an existing pipeline from your RDI configuration.
- **Upload from file** - Upload YAML pipeline files from your local computer in zip format.
- **Create new pipeline** - Use Redis Insight's built-in editors to create a new pipeline either from scratch or using one of the built-in templates.

Each of these menu options will be described in more detail in subsequent sections.

There are also equivalent buttons at the top of the editor pane for the first two of these functions.

{{< image filename="images/ri/ri-rdi-pl-editor-minibuttons.png" alt="Editor minibuttons" >}}

If you'd rather start with an empty configuration, exit the dialog, which will leave you in the **Configuration file** editor where you can begin editing the configuration component of your pipeline; the `config.yaml` file.

### Download a pipeline from your RDI configuration

Click the **Download from server** button in the **Start with your pipeline** dialog to download a previously defined pipeline from your RDI configuration. The downloaded pipeline will be displayed in the **Pipeline management** pane. As shown below, each pipeline consists of a configuration file (`config.yaml`) and zero or more `job` YAML files. The configuration file will be displayed in the center editor panel.

{{< image filename="images/ri/ri-rdi-pl-dl.png" alt="Download a pipeline" >}}

### Upload a pipeline from your local machine

Click the **Upload from file** button in the **Start with your pipeline** dialog to upload your configuration and job YAML files from your local machine. The files must be stored in a zip file that has the following structure.

```
├── config.yaml
└── jobs
    └── job1.yaml
```

The `config.yaml` file, your configuration YAML file, is required. The `jobs` directory can be empty, as job pipelines are not required, but the empty directory must exist in the zip file. Otherwise, the `jobs` folder might contain one or more job YAML files.

### Create a new configuration file using the built-in editor

Click the **Create new pipeline** button in the **Start with your pipeline** dialog to create a new pipeline using the built-in editors. After doing so, you'll enter the **Configuration file** editor and you'll see an open **Select a template** dialog in the upper right-hand corner of the editor.

{{< image filename="images/ri/ri-rdi-pl-editor-dlg.png" alt="Select a template" >}}

Make your selections in the provided fields:

- **Pipeline type** is set to **Ingest** by default.
- **Database type** has six options:
  - mongodb
  - cassandra
  - mysql
  - oracle
  - postgresql
  - sqlserver

{{< note >}}
The options listed in the above menus depend on the capabilities of your RDI configuration.
{{< /note >}}

After you make your selections and click **Apply**, Redis Insight will populate the editor window with an appropriate template. To start from scratch, click **Cancel**.

See the [RDI documentation]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference" >}}) for information about required fields.

{{< image filename="images/ri/ri-rdi-pl-editor-template.png" alt="Editor template" >}}

### Test your target database connection

After you've created your **Target database configuration**, you can test the connection using the **Test Connection** button in the bottom right of the editor pane. A new panel will open to the right containing the test results as shown below.

{{< image filename="images/ri/ri-rdi-pl-test-cxn.png" alt="Test connection" >}}

### Create a new transformation job file using the built-in editor

In the **Pipeline Management** pane, click the `+` next to the **Jobs** folder and enter a name for the new transformation job.
Next, click the job name you just created.
This will take you to the job editor with the template selection menu open. Make your selection and click **Apply**. Redis Insight will populate the editor window with an appropriate template. To start from scratch, click **Cancel**.

{{< note >}}
The options listed in the above menu depend on the capabilities of your RDI configuration.
{{< /note >}}

The [RDI documentation]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}}) has several examples of transformation jobs that can help get you started. Note: RDI uses a very specific YAML format for job files. See [here]({{< relref "/integrate/redis-data-integration/data-pipelines" >}}#job-files) for more information.

{{< image filename="images/ri/ri-rdi-job-editor-template.png" alt="Job editor template" >}}

## Use the built-in editors

The Redis Insight pipeline file editors are context-aware. They provide auto-completion, syntax highlighting, and error detection for:

- YAML files in the configuration and job file editors
- JMESPath and SQL function snippets in a dedicated editor. To open the JMESPath and SQL editor, click the **SQL and JMESPathEditor** button as shown above. A new editor window will open in the lower half of the screen.

If you decided to write your own configuration pipeline without using a template, you would see auto-completion prompts such as the one shown below.

{{< image filename="images/ri/ri-rdi-pl-editor-autoc.png" alt="Editor autocompletion" >}}

While this isn't a replacement for the RDI documentation, it can help speed you along after you have basic familiarity with the building blocks of RDI pipeline files.

Redis Insight will also highlight any errors as shown below.

{{< image filename="images/ri/ri-rdi-pl-editor-errs.png" alt="Editor errors" >}}

Here's an example showing the SQL and JMESPath editor pane. Note the toggle in the bottom left corner of this editor pane. Clicking it allows you to select from:

- SQLite functions
- JMESPath

After constructing your SQLite or JMESPath code, copy it to the main editor window. Here's a [reference]({{< relref "/integrate/redis-data-integration/reference/jmespath-custom-functions" >}}) to the supported JMESPath extension functions and expressions that you can use in your job files.

{{< image filename="images/ri/ri-rdi-pl-editor-sql-minie.png" alt="Editor SQL minieditor" >}}

{{< warning >}}
Any changes you make in the editors will be lost if you exit Redis Insight without saving your work. To save any changes you made to your pipeline files, deploy them to your RDI server (see below) or download the modified files as a zip file to your local disk using the **Download** button in the top right of the RDI window. Redis Insight will prepend a green circle on unsaved/undeployed files.

{{< image filename="images/ri/ri-rdi-pl-unsaved.png" alt="Unsaved pipeline" >}}
{{< /warning >}}

## Dry run transformation job pipelines

After you've created a transformation job pipeline, you can execute a dry run on the RDI server. To do that, click on **Dry Run** in the lower right side of the editor pane. A new **Test transformation logic** panel will open to the side. There are two vertically-stacked panes: **Input** and **Results**. In the **Input** section, enter JSON data that will trigger the transformation. Any results will be displayed in the **Results** section.

There are two tabs in the **Results** section:

1. **Transformations** - this is where you'll see JSON output from your dry run.
1. **Output** - (not shown) this is where you'll see the Redis commands that would have been run in a real scenario.

Here's an example.

{{< image filename="images/ri/ri-rdi-pl-dryrun.png" alt="Dry run" >}}

## Deploy pipelines and add target DB to Redis Insight

If you're satisfied with your configuration and transformation job pipelines, you can deploy them to the RDI management plane. Click the **Deploy Pipeline** button to proceed.

After your pipelines have been deployed, you can add the RDI target Redis database defined in your `config.yaml` file to Redis Insight.
Doing so will allow you to monitor key creation from your RDI pipeline over time.

## View RDI statistics

You can view various statistics for your RDI deployment. To do so, click  the **Pipeline Status** menu button in the left side menu panel.

{{< image filename="images/ri/ri-rdi-stats-view.png" alt="RDI statistics" >}}

Each statistics section is either static or refreshed automatically at a particular interval that you set.
The first section, **Processing performance information** is set by default to refresh every 5 seconds.
The other sections are static and need to be refreshed manually by pressing the refresh button at the top right of each section.
You can also set up automatic refresh for the other sections.

To set up automatic refresh for one or more statistics sections, click on the downward arrow at the end of the **Last refresh** line.
Then enable the **Auto Refresh** setting and set your desired refresh interval in seconds. This is shown in the previous image.
