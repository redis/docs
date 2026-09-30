---
Title: Certificates and encryption
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Manage TLS certificates, client certificates, and internode encryption for Redis Software on Kubernetes.
hideListLinks: true
linkTitle: Certificates and encryption
weight: 30
---

Certificates and encryption use Kubernetes Secrets and cert-manager integration to provision, distribute, and rotate the TLS certificates that Redis Software relies on. The operator distributes referenced certificates across every cluster node.

## How certificates work on Redis for Kubernetes

- **Cluster certificates** live in Kubernetes Secrets that the `RedisEnterpriseCluster` spec references. The operator distributes them to every cluster node.
- **cert-manager** can issue and rotate certificates automatically.
- **Client certificates** live in a Secret that the database references for mutual TLS authentication.
- **Internode encryption** is configured on the REC spec. The operator places the certificates on each node.

## What's the same as Redis Software

The underlying certificate roles, requirements, and TLS behavior are unchanged. For concepts and reference details, see the existing Redis Software docs:

- [Certificate roles and types](/content/operate/rs/security/certificates/_index.md) — which certificate is used for what.
- [Create certificates](/content/operate/rs/security/certificates/create-certificates.md) — certificate requirements (SAN, CN, validity).
- [Update certificates](/content/operate/rs/security/certificates/updating-certificates.md) — rotation considerations on Redis Software.
- [Monitor certificates](/content/operate/rs/security/certificates/monitor-certificates.md) — certificate expiration alerts.
- [Client certificate authentication](/content/operate/rs/security/certificates/certificate-based-authentication.md) — how the cluster validates client certificates.
- [TLS protocols](/content/operate/rs/security/encryption/tls/tls-protocols.md) and [ciphers](/content/operate/rs/security/encryption/tls/ciphers.md) — protocol and cipher selection.
- [Enable TLS](/content/operate/rs/security/encryption/tls/enable-tls.md) — TLS for management, replication, and client connections.
- [Internode encryption](/content/operate/rs/security/encryption/internode-encryption.md) — purpose and scope.
- [PEM encryption](/content/operate/rs/security/encryption/pem-encryption.md) — encrypted private keys.

## What's different on Kubernetes

- **You capture certificates in Kubernetes Secrets and reference them declaratively in the REC spec.** The operator applies them to the cluster through the Redis Software REST API — the same way certificates are applied on Redis Software, cluster-wide rather than file-by-file on each node.
- **cert-manager can issue and rotate certificates automatically**, replacing manual rotation steps.

## In this section

- [Manage REC certificates](/content/operate/kubernetes/security/certificates/manage-rec-certificates.md) — configure cluster TLS certificates.
- [cert-manager integration](/content/operate/kubernetes/security/certificates/cert-manager.md) — automate certificate issuance and rotation with cert-manager.
- [Add client certificates](/content/operate/kubernetes/security/certificates/add-client-certificates.md) — enable client certificate authentication for databases.
- [Internode encryption](/content/operate/kubernetes/security/certificates/internode-encryption.md) — enable encryption between cluster nodes.
