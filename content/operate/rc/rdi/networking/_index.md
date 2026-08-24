---
Title: Networking
alwaysopen: false
categories:
- docs
- operate
- rc
description: Connect your Data Integration pipeline to your source database.
hideListLinks: true
linkTitle: Networking
weight: 4
---

Your Data Integration pipeline runs on Redis Cloud and needs a network path to your source database. Redis Cloud supports two ways to connect:

- **Public endpoint**: If your source database is accessible from the internet, you can connect to it directly. Select **Public endpoint** during [pipeline setup]({{<relref "/operate/rc/rdi/setup#get-cluster-account-id">}}) and add the Redis Cloud outbound IP address to your database's allow list.

- **AWS PrivateLink**: If your source database is not publicly accessible, connect it through an [AWS PrivateLink](https://aws.amazon.com/privatelink/) endpoint service that you create in your AWS account. RDI only works with AWS PrivateLink and not VPC Peering or other private connectivity options.

See the following guides to set up private connectivity:

- [Set up AWS PrivateLink connectivity]({{<relref "/operate/rc/rdi/networking/aws-privatelink-nlb">}}): Connect a pipeline to a database hosted on AWS RDS or Aurora, AWS EC2, or MongoDB Atlas. You can also use these steps for an on-premises database that your AWS VPC can reach over AWS Direct Connect.
