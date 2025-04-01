---
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: Configure TLS protocol
title: Configure TLS protocol
weight: 50
url: '/operate/rs/7.8/security/encryption/tls/tls-protocols/'
---

You can change TLS protocols to improve the security of your Redis Enterprise cluster and databases. The default settings are in line with industry best practices, but you can customize them to match the security policy of your organization.

## Configure TLS protocol

The communications for which you can modify TLS protocols are:

- Control plane - The TLS configuration for cluster administration.
- Data plane - The TLS configuration for the communication between applications and databases.
- Discovery service (Sentinel) - The TLS configuration for the [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}}).

You can configure TLS protocols with the [Cluster Manager UI](#edit-tls-ui), [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin/cluster/config" >}}), or the [REST API]({{< relref "/operate/rs/references/rest-api/requests/cluster#put-cluster" >}}).

{{<warning>}}
- After you set the minimum TLS version, Redis Enterprise Software does not accept communications with TLS versions older than the specified version.

- If you set TLS 1.3 as the minimum TLS version, clients must support TLS 1.3 to connect to Redis Enterprise.
{{</warning>}}

TLS support depends on the operating system. You cannot enable support for protocols or versions that aren't supported by the operating system running Redis Enterprise Software.  In addition, updates to the operating system or to Redis Enterprise Software can impact protocol and version support.  

If you have trouble enabling specific versions of TLS, verify that they're supported by your operating system and that they're configured correctly.

{{<note>}}
TLSv1.2 is generally recommended as the minimum TLS version for encrypted communications. Check with your security team to confirm which TLS protocols meet your organization's policies.
{{</note>}}

### Edit TLS settings in the UI {#edit-tls-ui}

To configure minimum TLS versions using the Cluster Manager UI:

1. Go to **Cluster > Security**, then select the **TLS** tab.

1. Click **Edit**.

1. Select the minimum TLS version for cluster connections, database connections, and the discovery service:

    {{<image filename="images/rs/screenshots/cluster/security-tls-protocols-edit.png" alt="Cluster > Security > TLS settings in edit mode in the Cluster Manager UI." >}}
  
1. Select the TLS mode for the discovery service:

    - **Allowed** - Allows both TLS and non-TLS connections
    - **Required** - Allows only TLS connections
    - **Disabled** - Allows only non-TLS connections

1. Click **Save**.

### Control plane TLS

To set the minimum TLS protocol for the control plane using `rladmin`:

- Default minimum TLS protocol: TLSv1.2
- Syntax: `rladmin cluster config min_control_TLS_version <TLS_Version>`
- TLS versions available:
  - For TLSv1.2 - 1.2
  - For TLSv1.3 - 1.3

For example:

```sh
rladmin cluster config min_control_TLS_version 1.2
```

### Data plane TLS

To set the minimum TLS protocol for the data path using `rladmin`:

- Default minimum TLS protocol: TLSv1.2
- Syntax: `rladmin cluster config min_data_TLS_version <TLS_Version>`
- TLS versions available:
  - For TLSv1.2 - 1.2
  - For TLSv1.3 - 1.3

For example:

```sh
rladmin cluster config min_data_TLS_version 1.2
```


### Discovery service TLS

To enable TLS for the discovery service using `rladmin`:

- Default: Allows both TLS and non-TLS connections
- Syntax: `rladmin cluster config sentinel_tls_mode <ssl_policy>`
- `ssl_policy` values available:
  - `allowed` - Allows both TLS and non-TLS connections
  - `required` - Allows only TLS connections
  - `disabled` - Allows only non-TLS connections

To set the minimum TLS protocol for the discovery service using `rladmin`:

- Default minimum TLS protocol: TLSv1.2
- Syntax: `rladmin cluster config min_sentinel_TLS_version <TLS_Version>`
- TLS versions available:
  - For TLSv1.2 - 1.2
  - For TLSv1.3 - 1.3

To enforce a minimum TLS version for the discovery service, run the following commands:

1. Allow only TLS connections:

    ```sh
    rladmin cluster config sentinel_tls_mode required
    ```

1. Set the minimal TLS version:

    ```sh
    rladmin cluster config min_sentinel_TLS_version 1.2
    ```

1. Restart the discovery service on all cluster nodes to apply your changes:

    ```sh
    supervisorctl restart sentinel_service
    ```
