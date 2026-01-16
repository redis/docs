---
Title: Certificates object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a certificate
linkTitle: certificates
weight: $weight
---

An API object that represents a certificate used by a Redis Enterprise Software cluster.

| Name | Type/Value | Description |
|------|------------|-------------|
| name | "cm"<br />"api"<br />"mtls_trusted_ca"<br />"proxy"<br />"metrics_exporter"<br />"syncer"<br />"ldap_client"<br />"ccs_internode_encryption"<br />"data_internode_encryption"<br />"sso_service"<br />"sso_issuer" | Certificate type.<br />See the [certificates table]({{< relref "/operate/rs/security/certificates" >}}) for the list of cluster certificates and their descriptions. |
| certificate | string | The certificate in PEM format |
| key | string | The private key in PEM format |
