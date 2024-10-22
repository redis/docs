---
Title: Define data pipeline
alwaysopen: false
categories:
- docs
- operate
- rc
description: Define your data pipeline by selecting which tables to sync.
hideListLinks: true
weight: 3
---

After you have [provisioned your data pipeline]({{<relref "/operate/rc/databases/rdi/provision">}}), you need to define it. You will select the database schemas and columns that you want to import and synchronize with your primary database.

## Configure a new pipeline

1. In the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Pipeline** tab. If your pipeline is already provisioned, select **Complete setup** to go to the **Pipeline definition** section.
1. For the **Configure a new pipeline** option, select the Redis data type to write keys to the target. You can choose **Hash** or **JSON**. 

    Select **Continue**. 
1. Select the Schema and Tables you want to migrate to the target database from the **Source data selection** list. You can select any number of columns from a table. 

    If any tables are missing a unique constraint, the **Missing unique constraint** list will appear. Select the columns that define a unique constraint for those tables from the list.

    Select **Add schema** to add additional database schemas. 
    
    Select **Delete** to delete a schema. You must have at least one schema to continue.

    After you've selected the schemas and tables you want to sync, select **Continue**.

1. Review the tables you selected in the **Summary**. If everything looks correct, select **Start ingest** to start ingesting data from your source database. 

At this point, the data pipeline will ingest data from the source database to your target Redis database. This process will take time, especially if you have a lot of records in your source database. 

After this initial sync is complete, the data pipeline enters the *change streaming* phase, where changes are captured as they happen. Changes in the source database are added to the target within a few seconds of capture. 

You can view the status of your data pipeline in the **Data pipeline** tab of your database. See [View and edit data pipeline]({{<relref "/operate/rc/databases/rdi/view-edit">}}) to learn more.