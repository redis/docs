---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Update certificates in a Redis Enterprise cluster.
linkTitle: Update certificates
title: Update certificates
weight: 20
url: '/operate/rs/7.22/security/certificates/updating-certificates/'
---

{{<warning>}}
When you update the certificates, the new certificate replaces the same certificates on all nodes in the cluster.
{{</warning>}}

## How to update certificates

You can use the [`rladmin`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin" >}}) command-line interface (CLI) or the [REST API]({{< relref "/operate/rs/7.22/references/rest-api" >}}) to update certificates. The Cluster Manager UI lets you update proxy, syncer, and internode encryption certificates on the **Cluster > Security > Certificates** screen.

{{< multitabs id="update-certs" 
tab1="Cluster Manager UI"
tab2="rladmin"
tab3="REST API" >}}

To replace proxy, syncer, or internode encryption certificates using the Cluster Manager UI:

1. Go to **Cluster > Security > Certificates**.

1. Expand the section for the certificate you want to update:
    - For internode encryption certificates, expand **Internode encryption certificates**.
    - For the proxy certificate, expand **Server authentication**.
    - For the syncer certificate, expand **Replica Of and Active-Active authentication**.

    <img src="../../../../../images/rs/screenshots/cluster/security-certs-with-ine-expand-proxy-cert.png" alt="Expanded proxy certificate for server authentication.">

1. Click **Replace Certificate** to open the dialog.

    <img src="../../../../../images/rs/screenshots/cluster/security-replace-proxy-cert.png" alt="Replace proxy certificate dialog.">

1. Upload the key file.

1. Upload the new certificate.

1. Click **Save**.

-tab-sep-

To replace certificates with the `rladmin` CLI, run the [`cluster certificate set`]({{< relref "/operate/rs/7.22/references/cli-utilities/rladmin/cluster/certificate" >}}) command:

```sh
 rladmin cluster certificate set <cert-name> certificate_file <cert-file-name>.pem key_file <key-file-name>.pem
```

Replace the following variables with your own values:

- `<cert-name>` - The name of the certificate you want to replace. See the [certificates table]({{< relref "/operate/rs/7.22/security/certificates" >}}) for the list of valid certificate names.
- `<cert-file-name>` - The name of your certificate file
- `<key-file-name>` - The name of your key file

For example, to replace the Cluster Manager UI (`cm`) certificate with the private key `key.pem` and the certificate file `cluster.pem`:

```sh
rladmin cluster certificate set cm certificate_file cluster.pem key_file key.pem
```

-tab-sep-

To replace a certificate using the REST API, use an [update cluster certificates]({{<relref "/operate/rs/7.22/references/rest-api/requests/cluster/certificates">}}) request.

For Redis Enterprise Software versions 7.22.2 and later, use:

```sh
PUT https://<host>:<port>/v1/cluster/certificates
{
  "certificates": [
    {
      "name": "<cert_name>",
      "certificate": "<cert>",
      "key": "<key>"
    }
  ]
}
```

For Redis Enterprise Software versions 7.22.0 and earlier, use:

```sh
PUT https://<host>:<port>/v1/cluster/update_cert
    '{ "name": "<cert_name>", "key": "<key>", "certificate": "<cert>" }'
```

Replace the following variables with your own values:

- `<cert_name>` - The name of the certificate to replace. See the [certificates table]({{< relref "/operate/rs/7.22/security/certificates" >}}) for the list of valid certificate names.
- `<key>` - The contents of the \*\_key.pem file

    {{< tip >}}

  The key file contains `\n` end of line characters (EOL) that you cannot paste into the API call.
  You can use `sed -z 's/\n/\\\n/g'` to escape the EOL characters.
  {{< /tip >}}

- `<cert>` - The contents of the \*\_cert.pem file

{{< /multitabs >}}

New proxy and syncer certificates are used the next time clients connect to the database. For internode encryption certificates, the new certificates are used after they are replaced on all existing nodes in the cluster.

When you add a new node to the cluster, the certificates are automatically copied to the new node.

{{<note>}}
Don't manually overwrite the files located in `/etc/opt/redislabs`. Instead, upload new certificates to a temporary location on one of the cluster nodes, such as the `/tmp` directory.
{{</note>}}

## Replica Of database certificates

This section describes how to update certificates for Replica Of databases.

### Update proxy certificates {#update-ap-proxy-certs}

To update the proxy certificate on clusters running Replica Of databases:

1. Use the Cluster Manager UI, `rladmin`, or the REST API to update the proxy certificate on the source database cluster.

1. From the Cluster Manager UI, update the destination database (_replica_) configuration with the [new certificate]({{< relref "/operate/rs/7.22/databases/import-export/replica-of/create#encrypt-replica-database-traffic" >}}).

{{<note>}}
- Perform step 2 as quickly as possible after performing step 1.  Connections using the previous certificate are rejected after applying the new certificate.  Until both steps are performed, recovery of the database sync cannot be established.
{{</note>}}

## Active-Active database certificates

### Update proxy certificates {#update-aa-proxy-certs}

To update proxy certificate on clusters running Active-Active databases:

1. Use the Cluster Manager UI, `rladmin`, or the REST API to update proxy certificates on a single cluster, multiple clusters, or all participating clusters.

1. Use the [`crdb-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli" >}}) utility to update Active-Active database configuration from the command line. Run the following command once for each Active-Active database residing on the modified clusters:

    ```sh
    crdb-cli crdb update --crdb-guid <CRDB-GUID> --force
    ```

{{<note>}}
- Perform step 2 as quickly as possible after performing step 1.  Connections using the previous certificate are rejected after applying the new certificate.  Until both steps are performed, recovery of the database sync cannot be established.<br/>
- Do not run any other `crdb-cli crdb update` operations between the two steps.
{{</note>}}

### Update syncer certificates {#update-aa-syncer-certs}

To update your syncer certificate on clusters running Active-Active databases, follow these steps:

1. Update your syncer certificate on one or more of the participating clusters using the Cluster Manager UI, `rladmin`, or the REST API. You can update a single cluster, multiple clusters, or all participating clusters.

1. Update the Active-Active database configuration from the command line with the [`crdb-cli`]({{< relref "/operate/rs/7.22/references/cli-utilities/crdb-cli" >}}) utility. Run this command once for each Active-Active database that resides on the modified clusters:

    ```sh
    crdb-cli crdb update --crdb-guid <CRDB-GUID> --force
    ```

{{<note>}}
- Run step 2 as quickly as possible after step 1. Between the two steps, new syncer connections that use the ‘old’ certificate will get rejected by the cluster that has been updated with the new certificate (in step 1).<br/>
- Do not run any other `crdb-cli crdb update` operations between the two steps.<br/>
{{</note>}}

## Troubleshoot RHEL 8 crypto policy and certificate key size

In RHEL 8, if the crypto policy is set to `FUTURE`, the system will not accept certificates with private key sizes smaller than 3072 bits. This affects the use of custom certificates with smaller keys (such as 2048-bit keys).

To use certificates with smaller key sizes, you need to change the crypto policy from `FUTURE` to `DEFAULT`. For more information about crypto policies, see the [Red Hat documentation on system-wide cryptographic policies](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/security_hardening/using-the-system-wide-cryptographic-policies_security-hardening).
