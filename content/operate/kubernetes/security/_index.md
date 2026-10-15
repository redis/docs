---
Title: Security
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure security settings for Redis Software clusters and databases on Kubernetes.
hideListLinks: true
linkTitle: Security
weight: 50
---

Configure security settings for Redis for Kubernetes. Security covers access control, cluster credentials, external identity providers, TLS certificates and encryption, and external secret management.

## Access control

- [Access control](/content/operate/kubernetes/security/access-control/_index.md) — manage Redis Software users, roles, ACLs, and role bindings as Kubernetes custom resources.

## Authentication

- [Authentication](/content/operate/kubernetes/security/authentication/_index.md) — manage cluster credentials, LDAP, SAML SSO, and configuration secrets.

## Certificates and encryption

- [Certificates and encryption](/content/operate/kubernetes/security/certificates/_index.md) — provision TLS certificates, integrate cert-manager, add client certificates, and enable internode encryption.

## Secret management

- [HashiCorp Vault integration](/content/operate/kubernetes/security/vault.md) — use HashiCorp Vault as the centralized secret store for Redis for Kubernetes.

## Resource management

- [Allow resource adjustment](/content/operate/kubernetes/security/allow-resource-adjustment.md) — enable automatic adjustment of system resources for security compliance.

## Compliance

- [FIPS compliance](/content/operate/kubernetes/security/fips.md) — run your cluster in FIPS 140-3 compliance mode.
