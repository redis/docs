To set up a Redis Context Retriever on Redis Cloud, you need a database on Redis Cloud that already has relevant data. If you use a relational database, use [Redis Data Integration (RDI)]({{< relref "/operate/rc/databases/rdi" >}}) to ingest data into a Redis Cloud database.

When you have a database, [Create a context retriever service]({{< relref "/operate/rc/context-engine/context-retriever/create-service" >}}) for your database on Redis Cloud.

After you set up Context Retriever, you can [view your service]({{< relref "/operate/rc/context-engine/context-retriever/view-service" >}}). See the [Context Surfaces Python Client](https://pypi.org/project/context-surfaces/) for more information on how to call your tools.