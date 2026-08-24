---
Title: Prepare source database
aliases:
    - /operate/rc/databases/rdi/setup/
    - /operate/rc/databases/rdi/setup
alwaysopen: false
categories:
- docs
- operate
- rc
description: Prepare your source database, network setup, and database credentials for Data integration.
hideListLinks: true
weight: 3
---

## Prepare source database

Before using the pipeline, you must first prepare your source database to use the Debezium connector for change data capture (CDC). See [Prerequisites]({{<relref "/operate/rc/rdi#prerequisites">}}) to find a list of supported source databases and database versions.

See [Prepare source databases]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/">}}) to find steps for your database type:
- [MongoDB Atlas]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/mongodb">}})
- [Snowflake]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/snowflake">}})
- [Supabase]({{<relref "/operate/rc/rdi/supabase">}})
- Hosted on an AWS EC2 instance:
    - [MySQL and mariaDB]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/my-sql-mariadb">}})
    - [Oracle]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/oracle">}})
    - [SQL Server]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/sql-server">}})
    - [PostgreSQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/postgresql">}})
- Hosted on AWS RDS or AWS Aurora:
    - [AWS Aurora PostgreSQL and AWS RDS PostgreSQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aurora-rds/aws-aur-pgsql">}})
    - [AWS Aurora MySQL and AWS RDS MySQL]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aurora-rds/aws-aur-mysql">}})
    - [AWS RDS SQL Server]({{<relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs/aws-aurora-rds/aws-rds-sqlserver">}})

See the [RDI architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}}) for more information about CDC.

## Get cluster account ID

Before you can set up your source connectivity and secrets, you need the AWS Account ID for your Redis Cloud cluster so that you can give it access to your connectivity and secrets. 

1. On the [Redis Cloud console](https://cloud.redis.io/), go to your target database and select the **Data Integration** tab.
1. Select **Add pipeline**.
    {{<image filename="images/rc/rdi/rdi-workspace-add-pipeline.png" alt="The workspace section of the Data Integration tab for a database. Select Add pipeline to add a pipeline." width=80% >}}
1. Select your source database type. The following database types are supported:
    - MySQL
    - mariaDB
    - Oracle
    - SQL Server
    - PostgreSQL
    - MongoDB
    - Snowflake
    {{<image filename="images/rc/rdi/rdi-select-source-db.png" alt="The select source database type list." width=80% >}}
1. Enter a name for your source database in the **Source name** field. This is a name for the source database that will appear on Redis Cloud.
1. Select **Continue to source** to move to the **Source configuration** step.

    {{<image filename="images/rc/rdi/rdi-continue-to-source-button.png" alt="The select source database type list." width=200px >}}

1. Under **Source connectivity**, save the provided ARN and extract the AWS account ID for the account associated with your Redis Cloud cluster from it. 

    {{<image filename="images/rc/rdi/rdi-setup-connectivity-arn.png" alt="The Private Link Role ARN and availability zones." width=80% >}}

    The AWS account ID is the string of numbers after `arn:aws:iam::` in the ARN. For example, if the ARN is `arn:aws:iam::123456789012:role/redis-data-pipeline`, the AWS account ID is `123456789012`.

1. If your source database is accessible via the public endpoint and you want to use public connectivity for your data pipeline, select **Public endpoint** and save the **Redis Cloud outbound IP address** to add to your source database's allow list. 

Select **Save & exit** to exit pipeline setup. You'll come back here when you [define your source connection and data pipeline]({{<relref "/operate/rc/rdi/define">}}).

## Set up AWS Private Link connectivity {#set-up-connectivity}

{{< note >}}
If your source database is accessible via a public endpoint and you want to use public connectivity for your data pipeline, proceed to [Share source database credentials](#share-source-database-credentials).
{{< /note >}} 

If your source database is not accessible via a public endpoint, you need to set up an endpoint service through AWS PrivateLink to be able to connect to it. See [Set up AWS PrivateLink connectivity]({{<relref "/operate/rc/rdi/networking/aws-privatelink-nlb">}}) for the full steps for databases hosted on AWS RDS or Aurora, an AWS EC2 instance, MongoDB Atlas, or on premises, including how to automate failover handling.

## Share source database credentials

You need to share your source database credentials and certificates in an Amazon secret with Redis Cloud so that the pipeline can connect to your database.

To do this, you need to:
1. [Create an encryption key](#create-encryption-key) using AWS Key Management Service with the right permissions.
1. [Create secrets](#create-database-credentials-secrets) containing the source database credentials encrypted using that key.

### Create encryption key

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Key Management Service**. [Create an encryption key](https://docs.aws.amazon.com/kms/latest/developerguide/create-symmetric-cmk.html) with the following settings:

1. In **Step 1 - Configure key**:
    - **Key type**: Select **Symmetric**.
    - **Key usage**: Select **Encrypt and decrypt**.
    - Under **Advanced options**, set the following:
        - **Key material origin**: Select **KMS - recommended**.
        - **Regionality**: Select **Single-Region key**.
1. In **Step 2 - Add labels**, add an alias and description for the key.
1. In **Step 3 - Define key administrative permissions**, under **Key deletion**, select **Allow key administrators to delete this key**.
1. In **Step 4 - Define key usage permissions**, under **Other AWS accounts**, select **Add another AWS account**. Enter the AWS account ID for the Redis Cloud cluster that you saved earlier.

Review the key policy and key settings, and then select **Finish** to create the key.

### Create database credentials secrets

To let Redis Cloud access your source database, you need to create AWS secrets for the source database's credentials and certificates. 

The required secrets depend on your source database's security configuration. The following table shows the required secrets for each configuration:

| Security configuration | Required secrets |
| :-- | :-- |
| Username and password only | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li></ul> |
| Username and key pair only *(Snowflake source databases only)* | <ul><li>Credentials secret (username for the RDI pipeline user)</li><li>Private key secret</li></ul> |
| TLS connection | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li><li>CA Certificate secret (server certificate)</li></ul> |
| mTLS connection | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li><li>CA Certificate secret (server certificate)</li><li>Client certificate secret</li><li>Client key secret</li></ul> |
| mTLS connection with client key passphrase | <ul><li>Credentials secret (username and password for the RDI pipeline user)</li><li>CA Certificate secret (server certificate)</li><li>Client certificate secret</li><li>Client key secret</li><li>Client key passphrase secret</li></ul> |

{{< note >}}
{{< embed-md "rdi-tls-secrets.md" >}}
{{< /note >}}

Select a tab to learn how to create the required secret.

{{< multitabs id="rdi-cloud-secrets"
      tab1="Credentials secret"
      tab2="CA Certificate secret"
      tab3="Client certificate secret"
      tab4="Client key secret"
      tab5="Client key passphrase secret"
      tab6="Private key secret" >}}

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Enter the following key/value pairs.

    - `username`: Database username for the RDI pipeline user
    - `password`: Database password for the RDI pipeline user

    {{< note >}}
Snowflake source databases that use user/key pair authentication should only enter the `username` for the database.
    {{< /note >}}

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

--tab-sep--

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Select **Plaintext** and enter the server certificate.

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

--tab-sep--

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Select **Plaintext** and enter the client certificate.

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

--tab-sep--

Use the [AWS CLI create-secret command](https://docs.aws.amazon.com/cli/latest/reference/secretsmanager/create-secret.html) or the [AWS CreateSecret API endpoint](https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_CreateSecret.html) to create a binary secret containing the client key.

For example, using the AWS CLI, run the following command:

```sh
aws secretsmanager create-secret \
    --name <secret-name> \
    --secret-binary fileb://<path-to-client-key> \
    --kms-key-id <encryption-key-arn> 
```

Where:
- `<secret-name>` - Name of the secret
- `<path-to-client-key>` - Path to the client key file
- `<encryption-key-arn>` - ARN of the [encryption key](#create-encryption-key) you created earlier

After you create the secret, you need to add permissions to allow the data pipeline to access it. 

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. Select the private key secret you just created and then select **Edit permissions**. 

Add the following permissions to your secret. Replace `<AWS ACCOUNT ID>` with the AWS account ID for the Redis Cloud cluster that you saved earlier.

{{< embed-md "rc-rdi-secrets-permissions.md" >}}

--tab-sep--

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Select **Plaintext** and enter the client key passphrase.

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

--tab-sep--

This secret is required for Snowflake source databases that use key-pair authentication.

In the [AWS Management Console](https://console.aws.amazon.com/), use the **Services** menu to locate and select **Security, Identity, and Compliance** > **Secrets Manager**. [Create a secret](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html) of type **Other type of secret** with the following settings:

- **Key/value pairs**: Select **Plaintext** and enter the private key in plain text PEM format.

{{< embed-md "rc-rdi-secrets-encryption-permissions.md" >}}

{{< /multitabs >}}

## Next steps

After you have set up your source database and prepared connectivity and credentials, select **Define source database** to [define your source connection and data pipeline]({{<relref "/operate/rc/rdi/define">}}).

{{<image filename="images/rc/rdi/rdi-define-source-database.png" alt="The define source database button." width=200px >}}
