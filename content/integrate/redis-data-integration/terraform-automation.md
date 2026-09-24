---
Title: Provision source infrastructure with Terraform
aliases: []
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn what the rdi-cloud-automation Terraform repository provisions
  and which module or example to start from.
group: di
hideListLinks: false
linkTitle: Terraform automation
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 42
---

The [`rdi-cloud-automation` GitHub repository](https://github.com/redis/rdi-cloud-automation)
contains Terraform modules and examples that provision a source database and
the networking needed to connect it to a Redis Data Integration (RDI) pipeline
on Redis Cloud. Use it to stand up a source database for a demo or proof of
concept, or as a reference for a production Amazon Web Services (AWS) deployment
with automatic failover.

{{< note >}}
This repository provisions source-side infrastructure for connecting to
Cloud RDI. It doesn't provision the Cloud RDI service itself.
{{< /note >}}

For a runnable walkthrough that uses this repository, see
[RDI on Redis Cloud quick start]({{< relref "/operate/rc/rdi/quick-start" >}}).
This page describes the full set of modules and examples so you can choose
the one that fits your source database and environment.

## Supported source databases

| Database | Engine | Module |
|:--|:--|:--|
| PostgreSQL | Aurora PostgreSQL | [`aws-rds-chinook`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rds-chinook), [`aws-rdi-database`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-database) |
| PostgreSQL | Standalone RDS | [`aws-rdi-database`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-database) |
| PostgreSQL | Amazon Elastic Compute Cloud (EC2) | [`aws-rdi-quickstart-postgres`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-quickstart-postgres) |
| MySQL | Aurora MySQL 8.0 | [`aws-rds-mysql-chinook`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rds-mysql-chinook), [`aws-rdi-database`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-database) |
| MySQL | Standalone RDS | [`aws-rdi-database`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-database) |
| SQL Server | RDS SQL Server SE | [`aws-rds-sqlserver-chinook`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rds-sqlserver-chinook), [`aws-rdi-database`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-database) |
| Oracle | Standalone RDS | [`aws-rdi-database`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-database) |

<!-- Confirm the Oracle row and the exact RDS engine versions against the repo before publishing; sourced from an AI-summarized README fetch, not a verified read of the module source. -->

## Modules

The repository organizes reusable infrastructure into modules under
`modules/`. Combine them yourself, or start from one of the
[examples](#examples) below, which already combine the modules you need for a
common scenario.

| Module | Provisions |
|:--|:--|
| [`aws-rdi-network`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-network) | A Virtual Private Cloud (VPC) with public, private, and database subnets |
| [`aws-rdi-database`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-database) | A source database on Amazon Relational Database Service (RDS), for any of the [supported engines](#supported-source-databases) |
| [`aws-rdi-quickstart-postgres`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rdi-quickstart-postgres) | A PostgreSQL database running on an EC2 instance |
| [`aws-privatelink`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-privatelink) | A Network Load Balancer (NLB) and AWS PrivateLink endpoint service in front of the source database |
| [`aws-rds-lambda`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rds-lambda) | Automatic failover detection that updates NLB targets when RDS fails over |
| [`aws-secret-manager`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-secret-manager) | Source database credentials in AWS Secrets Manager, encrypted with an AWS Key Management Service (KMS) key |

[`aws-rds-chinook`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rds-chinook),
[`aws-rds-mysql-chinook`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rds-mysql-chinook), and
[`aws-rds-sqlserver-chinook`](https://github.com/redis/rdi-cloud-automation/tree/main/modules/aws-rds-sqlserver-chinook) are
earlier, single-engine equivalents of `aws-rdi-database`. They still work, but
`aws-rdi-database` covers all of the same engines from one module.

## Examples

| Example | Use it for |
|:--|:--|
| [`aws-ec2-privatelink`](https://github.com/redis/rdi-cloud-automation/tree/main/examples/aws-ec2-privatelink) | A demo or proof of concept: a single PostgreSQL database on EC2, connected through PrivateLink. This is the example used in the [quick start]({{< relref "/operate/rc/rdi/quick-start" >}}). |
| [`aws-rds-privatelink-failover`](https://github.com/redis/rdi-cloud-automation/tree/main/examples/aws-rds-privatelink-failover) | A production-oriented reference: a Multi-AZ RDS database (PostgreSQL, MySQL, or SQL Server) with automatic failover, connected through PrivateLink. |

{{< note >}}
The `aws-ec2-privatelink` example is for demonstration purposes only. It isn't
recommended for production use.
{{< /note >}}

Each example includes its own `README.md` and `example.tfvars` file with the
variables you need to set. See
[RDI on Redis Cloud quick start]({{< relref "/operate/rc/rdi/quick-start" >}})
for a full walkthrough of [`aws-ec2-privatelink`](https://github.com/redis/rdi-cloud-automation/tree/main/examples/aws-ec2-privatelink),
including how to get the Role ARN values that Cloud RDI expects.
