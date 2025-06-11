---
Title: Using an external secret provider
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: |
    Configure RDI to obtain authentication secrets for your source and target databases
    from an external provider.
group: di
linkTitle: External secret providers
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 3
---

For K8s deployments, you can use an external secret provider, such as
[Vault](https://developer.hashicorp.com/vault) or
[AWS Secrets Manager](https://aws.amazon.com/secrets-manager/) to provide
the authentication secrets for your source and target databases.
See the sections below to learn how to do this. If you prefer to set the secrets for RDI manually, see
[Set secrets]({{< relref "/integrate/redis-data-integration/data-pipelines/set-secrets" >}})
for more information.

## Configure an external provider

### Vault

### AWS Secret Manager

## Secret rotation

*Secret rotation* is a technique where secrets are changed automatically
by the provider according to a schedule.
RDI versions 1.10.0 and above let you configure the pipeline to
restart the appropriate K8s pods automatically whenever a secret rotates in
the external provider that you have configured.
