## Allow public access

For [RDI on Redis Cloud]({{< relref "/operate/rc/databases/rdi" >}}), you must allow public access to your source database to allow the proxy to connect to it. 

To do this, [modify the database](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.DBInstance.Modifying.html) and set **Publicly accessible** to **Yes**.