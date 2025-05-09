---
Title: Recommended security practices
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: Recommended security practices
hideListLinks: true
weight: 5
url: '/operate/rs/7.8/security/recommended-security-practices/'
---

## Deployment security

When deploying Redis Enterprise Software to production, we recommend the following practices:

- **Deploy Redis Enterprise inside a trusted network**:  Redis Enterprise is database software and should be deployed on a trusted network not accessible to the public internet. Deploying Redis Enterprise in a trusted network reduces the likelihood that someone can obtain unauthorized access to your data or the ability to manage your database configuration.

- **Implement anti-virus exclusions**: To ensure that anti-virus solutions that scan files or intercept processes to protect memory do not interfere with Redis Enterprise software, you should ensure that anti-virus exclusions are implemented across all nodes in their Redis Enterprise cluster in a consistent policy. This helps ensure that anti-virus software does not impact the availability of your Redis Enterprise cluster.

    If you are replacing your existing antivirus solution or installing/supporting Redis Enterprise, make sure that the below paths are excluded:

    {{< note >}}
For antivirus solutions that intercept processes, binary files may have to be excluded directly depending on the requirements of your anti-virus vendor.
    {{< /note >}}

    | **Path** | **Description** |
    |------------|-----------------|
    | /opt/redislabs | Main installation directory for all Redis Enterprise Software binaries |
    | /opt/redislabs/bin | Binaries for all the utilities for command line access and managements such as "rladmin" or "redis-cli" |
    | /opt/redislabs/config | System configuration files |
    | /opt/redislabs/lib | System library files |
    | /opt/redislabs/sbin | System binaries for tweaking provisioning |

- **Send logs to a remote logging server**: Redis Enterprise is configured to send logs by default to syslog. To send these logs to a remote logging server you must [configure syslog]({{<relref "/operate/rs/7.8/clusters/logging/log-security">}}) based the requirements of the remote logging server vendor. Remote logging helps ensure that the logs are not deleted so that you can rotate the logs to prevent your server disk from filling up.

- **Deploy clusters with an odd number of 3 or more nodes**: Redis is an available and partition-tolerant database. We recommend that Redis Enterprise be deployed in a cluster of an odd number of 3 or more nodes so that you are able to successfully failover in the event of a failure.

- **Reboot nodes in a sequence rather than all at once**: It is best practice to frequently maintain reboot schedules. If you reboot too many servers at once, it is possible to cause a quorum failure that results in loss of availability of the database. We recommend that rebooting be done in a phased manner so that quorum is not lost. For example, to maintain quorum in a 3 node cluster, at least 2 nodes must be up at all times. Only one server should be rebooted at any given time to maintain quorum.

- **Implement client-side encryption**: Client-side encryption, or the practice of encrypting data within an application before storing it in a database, such as Redis, is the most widely adopted method to achieve encryption in memory. Redis is an in-memory database and stores data in-memory. If you require encryption in memory, better known as encryption in use, then client side encryption may be the right solution for you. Please be aware that database functions that need to operate on data — such as simple searching functions, comparisons, and incremental operations — don’t work with client-side encryption.

## Cluster security

- **Control the level of access to your system**: Redis Enterprise lets you decide which users can access the cluster, which users can access databases, and which users can access both. We recommend preventing database users from accessing the cluster. See [Access control]({{<relref "/operate/rs/7.8/security/access-control">}}) for more information.

- **Enable LDAP authentication**: If your organization uses the Lightweight Directory Access Protocol (LDAP), we recommend enabling Redis Enterprise Software support for role-based LDAP authentication.

- **Require HTTPS for API endpoints**: Redis Enterprise comes with a REST API to help automate tasks. This API is available in both an encrypted and unencrypted endpoint for backward compatibility. You can [disable the unencrypted endpoint]({{<relref "/operate/rs/7.8/references/rest-api/encryption#require-https-for-api-endpoints">}}) with no loss in functionality.

## Database security

Redis Enterprise offers several database security controls to help protect your data against unauthorized access and to improve the operational security of your database. The following section details configurable security controls available for implementation.

- **Use strong Redis passwords**: A frequent recommendation in the security industry is to use strong passwords to authenticate users. This helps to prevent brute force password guessing attacks against your database. Its important to check that your password aligns with your organizations security policy.

- **Deactivate default user access**: Redis Enterprise comes with a "default" user for backwards compatibility with applications designed with versions of Redis prior to Redis Enterprise 6. The default user is turned on by default. This allows you to access the database without specifying a username and only using a shared secret. For applications designed to use access control lists, we recommend that you [deactivate default user access]({{<relref "/operate/rs/7.8/security/access-control/manage-users/default-user#deactivate-default-user">}}).

- **Configure Transport Layer Security (TLS)**: Similar to the control plane, you can also [configure TLS protocols]({{<relref "/operate/rs/7.8/security/encryption/tls/tls-protocols">}}) to help support your security and compliance needs.

- **Enable client certificate authentication**: To prevent unauthorized access to your data, Redis Enterprise databases support the [TLS protocol]({{<relref "/operate/rs/7.8/security/encryption/tls#client-certificate-authentication">}}), which includes authentication and encryption. Client certificate authentication can be used to ensure only authorized hosts can access the database.

- **Install trusted certificates**: Redis implements self-signed certificates for the database proxy and replication service, but many organizations prefer to [use their own certificates]({{<relref "/operate/rs/7.8/security/certificates/create-certificates">}}).

- **Configure and verify database backups**: Implementing a disaster recovery strategy is an important part of data security. Redis Enterprise supports [database backups to many destinations]({{<relref "/operate/rs/7.8/databases/import-export/schedule-backups">}}).
