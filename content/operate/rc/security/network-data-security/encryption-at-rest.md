---
Title: Encryption at rest
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes when data is encrypted at rest.
weight: 5
aliases:
    - /operate/rc/security/encryption-at-rest/
---
Redis Cloud databases write their data to disk whenever [persistence]({{< relref "/operate/rc/databases/configuration/data-persistence.md" >}}) is enabled. 

Redis Cloud deployments are always encrypted at rest. 

## Encryption at rest on AWS {#aws}

Persistent data is written to encrypted EBS volumes. For more information, see [Amazon EBS encryption](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EBSEncryption.html). 

When Auto Tiering is enabled, the flash memory data is written to encrypted NVMe SSD volumes. For more information, see [SSD instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html).

## Disk encryption on Google Cloud {#gcp}

All data written to disk on Google Cloud-based Redis Cloud deployments is encrypted by default. When deploying
a Redis Cloud database on Google Cloud, you don't need to take any actions to enable this encryption.

To learn more, see the [Google Cloud Default encryption at rest](https://cloud.google.com/security/encryption-at-rest).

## Disk encryption on Azure {#azure}

All data written to disk on Azure-based Redis Cloud deployments is encrypted by default. When deploying
a Redis Cloud database on Azure, you don't need to take any actions to enable this encryption.

To learn more, see the [Azure Data Encryption at rest](https://docs.microsoft.com/en-us/azure/security/fundamentals/encryption-atrest).

## Continue learning with Redis University

{{< university-links >}}

