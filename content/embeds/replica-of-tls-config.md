---
{}
---
To enable TLS for Replica Of cluster connections:

1. For each cluster hosting a replica:

    1. Go to **Cluster > Security > Certificates**.

    1. Expand the **Replica Of and Active-Active authentication (Syncer certificate)** section.

        {{<image filename="images/rs/screenshots/cluster/security-syncer-cert.png"  alt="Syncer certificate for Replica Of and Active-Active authentication.">}}
    
    1. Download or copy the syncer certificate.

1. From the **Security** tab of the Replica Of source database, select **Edit**.

1. In the **TLS - Transport Layer Security for secure connections** section, make sure the checkbox is selected.

1. In the **Apply TLS for** section, select **Between databases only**.

1. Select **Mutual TLS (Client authentication)**.

    {{<image filename="images/rs/screenshots/databases/security-tls-replica-of.png"  alt="Replica Of TLS authentication configuration.">}}

1. Select **+ Add certificate**, paste or upload the syncer certificate, then select **Done**.

    Repeat this process, adding the syncer certificate for each cluster hosting a replica of this database.

1. _(Optional)_ To require TLS for client connections, change **Apply TLS for** to **Clients and databases + Between databases** and add client certificates.

1. Select **Save**.