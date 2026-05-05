---
title: Certificate-based authentication for LDAP
linkTitle: Certificate-based authentication for LDAP
description: Learn how to set up certificate-based authentication for LDAP in Redis Software.
weight: 40
---

You can configure Redis Software to use certificate-based authentication in combination with LDAP to authenticate and authorize users.

Here's how it works:

1. Users authenticate to the database using client certificates.

1. Redis Software extracts the user identity from the certificate.

1. Redis Software looks up the user in LDAP.

1. LDAP group mappings and database ACLs determine authorization.

## Prerequisites

Before enabling certificate-based authentication for LDAP, you must complete the following prerequisites:

1. [Set up certificate-based authentication for databases]({{<relref "/operate/rs/security/certificates/certificate-based-authentication#certificate-based-authentication-for-databases">}}).

1. [Set up LDAP for the cluster]({{< relref "/operate/rs/security/access-control/ldap/enable-role-based-ldap#set-up-ldap-connection" >}}).

1. [Map LDAP users to appropriate cluster roles]({{< relref "/operate/rs/security/access-control/ldap/map-ldap-groups-to-roles" >}}).

1. [Configure database ACLs]({{< relref "/operate/rs/security/access-control/ldap/update-database-acls" >}}) to authorize LDAP users.

## Set up certificate-based authentication for LDAP

To set up certificate-based authentication for LDAP:

1. Enable certificate-based authentication in the cluster LDAP configuration using an [update LDAP configuration]({{<relref "/operate/rs/references/rest-api/api-reference/#tag/Cluster/operation/cluster_update_ldap_config">}}) REST API request.

    To perform LDAP lookup for certificate-authenticated users:
    
    - Redis Software must extract an identity from the client certificate's subject line, using either the subject CN or a custom OID. Extracting user identity from SAN is not currently supported.
    
    - The certificate subject must follow [RFC 4514](https://datatracker.ietf.org/doc/html/rfc4514) formatting.

    {{<multitabs id="set-up-cba-ldap"
        tab1="Subject CN"
        tab2="Subject OID" >}}

To enable certificate-based authentication and use the certificate subject CN as the LDAP identifier:

```sh
PUT https://<host>:<port>/v1/cluster/ldap
{
  "cba": true,
  "cba_identity_source": "subject_cn",
  "control_plane": true,
  "data_plane": true
}
```

-tab-sep-

To enable certificate-based authentication and use a custom subject OID as the LDAP identifier:

```sh
PUT https://<host>:<port>/v1/cluster/ldap
{
  "cba": true,
  "cba_identity_source": "subject_oid",
  "cba_identity_oid": "1.2.3.4",
  "control_plane": true,
  "data_plane": true
}
```

The certificate subject must include the OID.

    {{</multitabs>}}

1. Enable external certificate-based authentication in cluster settings using an [update cluster settings]({{<relref "/operate/rs/references/rest-api/requests/cluster#put-cluster">}}) REST API request:

    ```sh
    PUT https://<host>:<port>/v1/cluster
    {
      "dmc_external_cba_authentication": true
    }
    ```

## Verify your setup

After configuration is complete, try to [connect to the database with certificate-based authentication]({{<relref "/operate/rs/security/certificates/certificate-based-authentication#authenticate-database-connections">}}) and verify your setup.
