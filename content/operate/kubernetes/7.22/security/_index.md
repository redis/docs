---
Title: Security
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure security settings for Redis Enterprise clusters and databases on Kubernetes.
hideListLinks: true
linkTitle: Security
weight: 50
url: '/operate/kubernetes/7.22/security/'
---

Configure security settings for your Redis Enterprise deployment on Kubernetes. Redis Enterprise for Kubernetes provides comprehensive security features including TLS encryption, authentication, access control, and certificate management.

## Credentials and authentication

Manage cluster credentials and authentication settings:

- [Manage REC credentials]({{< relref "/operate/kubernetes/7.22/security/manage-rec-credentials" >}}) - Configure and manage Redis Enterprise cluster credentials
- [LDAP authentication]({{< relref "/operate/kubernetes/7.22/security/ldap" >}}) - Integrate with LDAP for centralized authentication

## Certificates and encryption

Configure TLS certificates and encryption for secure communications:

- [Manage REC certificates]({{< relref "/operate/kubernetes/7.22/security/manage-rec-certificates" >}}) - Configure cluster certificates for TLS encryption
- [Add client certificates]({{< relref "/operate/kubernetes/7.22/security/add-client-certificates" >}}) - Set up client certificate authentication for databases
- [Internode encryption]({{< relref "/operate/kubernetes/7.22/security/internode-encryption" >}}) - Enable encryption between cluster nodes and configure custom certificates

## Resource management

Configure security-related resource settings:

- [Allow resource adjustment]({{< relref "/operate/kubernetes/7.22/security/allow-resource-adjustment" >}}) - Enable automatic adjustment of system resources for security compliance
