---
Title: Enable TLS
alwaysopen: false
categories:
- docs
- operate
- rs
description: Shows how to enable TLS.
linkTitle: Enable TLS
weight: 40
---

You can use TLS authentication for one or more of the following types of communication:

- Communication from clients (applications) to your database
- Communication from your database to other clusters for replication using [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of/" >}})
- Communication to and from your database to other clusters for synchronization using [Active-Active]({{< relref "/operate/rs/databases/active-active/_index.md" >}})

{{<note>}}
When you enable or turn off TLS, the change applies to new connections but does not affect existing connections. Clients must close existing connections and reconnect to apply the change.
{{</note>}}

## Enable TLS for client connections {#client}

To enable TLS for client connections:

1. From your database's **Security** tab, select **Edit**.

1. In the **TLS - Transport Layer Security for secure connections** section, make sure the checkbox is selected.

1. In the **Apply TLS for** section, select **Clients and databases + Between databases**.

1. Select **Save**.

To enable mutual TLS for client connections:

1. Select **Mutual TLS (Client authentication)**.

    {{<image filename="images/rs/screenshots/databases/security-mtls-clients-7-8-2.png"  alt="Mutual TLS authentication configuration.">}}

1. For each client certificate, select **+ Add certificate**, paste or upload the client certificate, then select **Done**.

    If your database uses Replica Of, you also need to add the syncer certificates for the participating clusters. See [Enable TLS for Replica Of cluster connections](#enable-tls-for-replica-of-cluster-connections) for instructions.

1. You can configure **Additional certificate validations** to further limit connections to clients with valid certificates.

    Additional certificate validations occur only when loading a [certificate chain](https://en.wikipedia.org/wiki/Chain_of_trust#Computer_security) that includes the [root certificate](https://en.wikipedia.org/wiki/Root_certificate) and intermediate [CA](https://en.wikipedia.org/wiki/Certificate_authority) certificate but does not include a leaf (end-entity) certificate. If you include a leaf certificate, mutual client authentication skips any additional certificate validations.

    1. Select a certificate validation option.

        | Validation option | Description |
        |-------------------|-------------|
        | _No validation_ | Authenticates clients with valid certificates. No additional validations are enforced. |
        | _By Subject Alternative Name_ | A client certificate is valid only if its Common Name (CN) matches an entry in the list of valid subjects. Ignores other [`Subject`](https://datatracker.ietf.org/doc/html/rfc5280#section-4.1.2.6) attributes. |
        | _By full Subject Name_ | A client certificate is valid only if its [`Subject`](https://datatracker.ietf.org/doc/html/rfc5280#section-4.1.2.6) attributes match an entry in the list of valid subjects. |

    1. If you selected **No validation**, you can skip this step. Otherwise, select **+ Add validation** to create a new entry and then enter valid [`Subject`](https://datatracker.ietf.org/doc/html/rfc5280#section-4.1.2.6) attributes for your client certificates. All `Subject` attributes are case-sensitive.

        | Subject attribute<br />(case-sensitive) | Description |
        |-------------------|-------------|
        | _Common Name (CN)_ | Name of the client authenticated by the certificate (_required_) |
        | _Organization (O)_ | The client's organization or company name |
        | <nobr>_Organizational Unit (OU)_</nobr> | Name of the unit or department within the organization |
        | _Locality (L)_ | The organization's city |
        | _State / Province (ST)_ | The organization's state or province |
        | _Country (C)_ | 2-letter code that represents the organization's country |

        You can only enter a single value for each field, except for the _Organizational Unit (OU)_ field. If your client certificate has a `Subject` with multiple  _Organizational Unit (OU)_ values, press the `Enter` or `Return` key after entering each value to add multiple Organizational Units.

        {{<image filename="images/rs/screenshots/databases/security-mtls-add-cert-validation-multi-ou.png" width="350px" alt="An example that shows adding a certificate validation with multiple organizational units.">}}

        **Breaking change:** If you use the [REST API]({{< relref "/operate/rs/references/rest-api" >}}) instead of the Cluster Manager UI to configure additional certificate validations, note that `authorized_names` is deprecated as of Redis Enterprise v6.4.2. Use `authorized_subjects` instead. See the [BDB object reference]({{< relref "/operate/rs/references/rest-api/objects/bdb" >}}) for more details.

1. Select **Save**.

By default, Redis Enterprise Software validates client certificate expiration dates.  You can use `rladmin` to turn off this behavior.

```sh
rladmin tune db < db:id | name > mtls_allow_outdated_certs enabled
```

## Enable TLS for Active-Active cluster connections

You cannot enable or turn off TLS after the Active-Active database is created, but you can change the TLS configuration.

To enable TLS for Active-Active cluster connections:

1. During [database creation]({{<relref "/operate/rs/databases/active-active/create">}}), expand the **TLS** configuration section.

1. Select **On** to enable TLS.

    {{<image filename="images/rs/screenshots/databases/active-active-databases/enable-tls-for-active-active-db.png" alt="TLS is enabled on the Cluster Manager UI screen.">}}

1. Click **Create**.

If you also want to require TLS for client connections, you must edit the Active-Active database configuration after creation. See [Enable TLS for client connections](#client) for instructions.

## Enable TLS for Replica Of cluster connections

{{<embed-md "replica-of-tls-config.md">}}
