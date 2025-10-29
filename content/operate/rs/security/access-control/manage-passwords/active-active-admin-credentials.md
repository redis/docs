---
Title: Update admin credentials for Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
description: Update admin credentials for Active-Active databases.
linkTitle: Update Active-Active admin credentials
weight: 90
---

Active-Active databases use administrator credentials to manage operations. When you change the administrator password on clusters with Active-Active databases, you must update the Active-Active database configuration to prevent authentication failures during Active-Active operations and synchronization.

To update the administrator password on a cluster with Active-Active databases:

1. From the user management page, update the administrator user password on the clusters you want to update.

1. Run `crdb-cli crdb list` to find the `CRDB-GUID` that uniquely identifies each Active-Active database and the fully qualified domain names (`FQDN`) of each participating cluster:

    ```sh
    crdb-cli crdb list
    ```

    Example output:

    ```sh
    CRDB-GUID                             NAME        REPL-ID  FQDN
    4053a0dd-a4a5-4f38-b135-75b7a2dc7331  my-aa-db    1        fqdn1.example.com
    4053a0dd-a4a5-4f38-b135-75b7a2dc7331  my-aa-db    2        fqdn2.example.com
    ```

1. Update the Active-Active database credentials using the [`crdb-cli crdb update`]({{< relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/update" >}}) command:

    ```sh
    crdb-cli crdb update \
      --crdb-guid <CRDB-GUID> \
      --credentials id=<REPL-ID-1>,username=<admin-username>,password=<FQDN-1-password> \
      --credentials id=<REPL-ID-2>,username=<admin-username>,password=<FQDN-2-password> \
      --force
    ```

    Replace the following values:

    - `<CRDB-GUID>`: The `CRDB-GUID` from the `crdb-cli crdb list` output

    - `<cluster-admin-username>`: The administrator username for the clusters

    - `<REPL-ID-1>` and `REPL-ID-2`: The `REPL-ID` for the corresponding FQDNs

    - `<FQDN-1-password>` and `<FQDN-2-password>`: The current admin passwords for each cluster

{{<warning>}}
Do not perform any management operations on the databases until these steps are complete.
{{</warning>}}
