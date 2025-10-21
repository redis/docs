---
Title: Integrate HashiCorp Vault with Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure HashiCorp Vault as the centralized secret management system for Redis Enterprise for Kubernetes.
linkTitle: HashiCorp Vault integration
weight: 97
---

You can configure HashiCorp Vault as the centralized secret management system for the Redis Enterprise Kubernetes operator, replacing the default Kubernetes secrets. This integration provides enhanced security, centralized secret management, and advanced features like secret rotation and audit logging.

## What secrets are managed by Vault?

When Vault integration is enabled, all secrets referenced in Redis Enterprise custom resources are retrieved from Vault instead of Kubernetes secrets, including:

### Cluster secrets

- [**Cluster credentials**]({{< relref "/operate/kubernetes/deployment/quick-start" >}}) ([`clusterCredentialSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))
- [**License**]({{< relref "/operate/kubernetes/deployment/quick-start#install-the-license" >}}) ([`licenseSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))
- [**API certificate**]({{< relref "/operate/kubernetes/security/tls" >}}) ([`apiCertificateSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))
- [**Cluster manager certificate**]({{< relref "/operate/kubernetes/security/tls" >}}) ([`cmCertificateSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))
- [**Metrics exporter certificate**]({{< relref "/operate/kubernetes/observability/prometheus-metrics-exporter" >}}) ([`metricsExporterCertificateSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))
- [**Proxy certificate**]({{< relref "/operate/kubernetes/security/tls" >}}) ([`proxyCertificateSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))
- [**Syncer certificate**]({{< relref "/operate/kubernetes/active-active" >}}) ([`syncerCertificateSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))
- [**LDAP client certificate**]({{< relref "/operate/kubernetes/security/ldap" >}})([`ldapClientCertificateSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#redisenterprisespec" >}}))

### Database secrets

- [**Database passwords**]({{< relref "/operate/kubernetes/re-databases" >}}) - Passwords for Redis databases
- [**Replica source credentials**]({{< relref "/operate/kubernetes/active-active" >}}) - For cross-cluster replication:
  - Client TLS key ([`clientKeySecret`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisenterprisedbspec" >}}))
  - Server certificate ([`serverCertSecret`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisenterprisedbspec" >}}))
- [**Backup credentials**]({{< relref "/operate/kubernetes/re-databases/db-backup" >}}) - For database backups:
  - S3 storage ([`awsSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisenterprisedbspec" >}}))
  - SFTP storage ([`sftpSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisenterprisedbspec" >}}))
  - Swift storage ([`swiftSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisenterprisedbspec" >}}))
  - Azure Blob storage ([`absSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisenterprisedbspec" >}}))
  - Google Cloud storage ([`gcsSecretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api#redisenterprisedbspec" >}}))
- [**Client authentication certificates**]({{< relref "/operate/kubernetes/security/tls" >}}) - TLS client certificates for authentication

### Other secrets
- [**Remote cluster secrets**]({{< relref "/operate/kubernetes/remote-clusters" >}}) ([`secretName`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api#redisenterpriseremoteclusterspec" >}})) - For Redis Enterprise Remote Cluster (RERC) configurations
- [**Active-Active database secrets**]({{< relref "/operate/kubernetes/active-active" >}}) - All secret names specified in REAADB [`globalConfigurations`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api#redisenterpriseactiveactivedatabasespec" >}})

For complete details on supported secrets, see the [`RedisEnterpriseCluster` API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) and [`RedisEnterpriseDatabase` API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}).

### Secret path structure

Vault secrets follow a hierarchical path structure:
```
<VAULT_SECRET_ROOT>/<VAULT_SECRET_PREFIX>/<secret-name>
```

Default example:
```
secret/data/redisenterprise-redis-ns/my-cluster
secret/data/redisenterprise-redis-ns/my-database-password
secret/data/redisenterprise-redis-ns/tls-certificates
```

{{<note>}}
When using OpenShift, replace `kubectl` commands with `oc` throughout this guide.
{{</note>}}

## Prerequisites

Before integrating Redis Enterprise operator with HashiCorp Vault, ensure you have the following components properly configured:

**HashiCorp Vault Requirements:**

- Vault instance: HashiCorp Vault v1.15.2+ with TLS and network connectivity to your Kubernetes cluster
- Authentication method: Configure Kubernetes authentication method in Vault (see [HashiCorp's Kubernetes Auth documentation](https://developer.hashicorp.com/vault/docs/auth/kubernetes))
- Secret engine: Enable and configure KV version 2 secret engine
  - Default mount path: `secret/` (configurable)
  - Used to store all Redis Enterprise secrets
  - Supports versioning and metadata

**Kubernetes Requirements:**

- Vault Agent Injector: Deploy the HashiCorp Vault Agent Injector
  - Enables automatic secret injection into pods
  - See [Vault Agent Injector tutorial](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-sidecar)
- Network access: Ensure Kubernetes cluster can reach Vault
  - Configure appropriate network policies and firewall rules
  - Vault typically runs on port 8200 (HTTPS)
- Service accounts: Proper RBAC configuration for operator service accounts

**Vault editions:**

This guide supports both Vault Community and Enterprise editions:

- Vault Community: Use all commands without `-namespace` flags or `VAULT_NAMESPACE` parameters
- Vault Enterprise: Supports namespaces for logical isolation and multi-tenancy (separate from Kubernetes namespaces)

**Minimum token TTL:**

Configure Vault token policies with minimum TTL of 1 hour:
- Prevents frequent token renewal overhead
- Ensures stable operation during maintenance windows
- See [Vault token management](https://developer.hashicorp.com/vault/tutorials/tokens/token-management)

### Deployment scenarios

This guide covers the most common deployment scenario with the following assumptions:

- Vault Enterprise with namespace support (adapt for Community Edition by removing namespace parameters)
- Multiple Redis Enterprise clusters in the same Kubernetes cluster
- Namespace isolation using Kubernetes namespace suffixes for Vault configurations
- Production security with proper RBAC and network policies

{{<note>}}
Multi-cluster considerations: When deploying across multiple Kubernetes clusters with identical namespace names, additional prefixing may be required to avoid Vault path conflicts.
{{</note>}}

## Configure the operator

1. **Configure Vault policies and roles**

   Create a policy that grants the Redis Enterprise operator read access to secrets:

   ```bash
   vault policy write -namespace=<VAULT_NAMESPACE> redisenterprise-<K8S_NAMESPACE> - <<EOF
   path "secret/data/redisenterprise-<K8S_NAMESPACE>/*" {
     capabilities = ["create", "read", "update", "delete", "list"]
   }
   path "secret/metadata/redisenterprise-<K8S_NAMESPACE>/*" {
     capabilities = ["list"]
   }
   EOF
   ```

   Parameter explanation:
   - `<VAULT_NAMESPACE>`: Your Vault Enterprise namespace (omit for Community Edition)
   - `<K8S_NAMESPACE>`: Kubernetes namespace where Redis Enterprise operator is deployed

   Configure a Vault role that binds the operator's service account to the policy:

   ```bash
   vault write -namespace=<VAULT_NAMESPACE> auth/<AUTH_PATH>/role/redis-enterprise-operator-<K8S_NAMESPACE> \
           bound_service_account_names="redis-enterprise-operator" \
           bound_service_account_namespaces=<K8S_NAMESPACE> \
           policies=redisenterprise-<K8S_NAMESPACE>
   ```

   Parameter explanation:
   - `<AUTH_PATH>`: Kubernetes auth method path in Vault (default: `kubernetes`)
   - Role name includes namespace for multi-tenant isolation

2. **Configure operator environment**

   Create a ConfigMap with Vault configuration for the Redis Enterprise operator:

   ```yaml
   # operator-environment-config.yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: operator-environment-config
     namespace: <K8S_NAMESPACE>
   data:
     CREDENTIAL_TYPE: "vault"
     VAULT_SERVER_FQDN: "<VAULT_FQDN>"
     VAULT_SERVICE_PORT_HTTPS: "8200"
     VAULT_SECRET_ROOT: "secret"
     VAULT_SECRET_PREFIX: "redisenterprise-<K8S_NAMESPACE>"
     VAULT_ROLE: "redis-enterprise-operator-<K8S_NAMESPACE>"
     VAULT_AUTH_PATH: "<AUTH_PATH>"
     VAULT_NAMESPACE: "<VAULT_NAMESPACE>"
     VAULT_CACHE_SECRET_EXPIRATION_SECONDS: "120"
   ```

   Apply the configuration:

   ```bash
   kubectl apply -f operator-environment-config.yaml
   ```

   **Configuration parameters:**

   | Parameter | Description | Default | Required |
   |-----------|-------------|---------|----------|
   | `CREDENTIAL_TYPE` | Must be set to `"vault"` to enable Vault integration | - | Yes |
   | `VAULT_SERVER_FQDN` | Vault server hostname (e.g., `vault.vault-ns.svc.cluster.local`) | - | Yes |
   | `VAULT_SERVICE_PORT_HTTPS` | Vault HTTPS port | `8200` | Yes |
   | `VAULT_SECRET_ROOT` | KV-v2 secret engine mount path | `secret` | Yes |
   | `VAULT_SECRET_PREFIX` | Prefix for all Redis Enterprise secrets | `redisenterprise` | Yes |
   | `VAULT_ROLE` | Vault role for operator authentication | `redis-enterprise-operator` | Yes |
   | `VAULT_AUTH_PATH` | Kubernetes auth method path | `kubernetes` | Yes |
   | `VAULT_NAMESPACE` | Vault Enterprise namespace | - | Enterprise only |
   | `VAULT_CACHE_SECRET_EXPIRATION_SECONDS` | Secret cache duration | `120` | No |

   **Secret path construction:** Secrets are stored at `<VAULT_SECRET_ROOT>/data/<VAULT_SECRET_PREFIX>/<secret-name>`

   <br>

3. **Deploy the operator**

   Deploy the Redis Enterprise operator following the [standard installation guide]({{< relref "/operate/kubernetes/deployment" >}}).

   {{<warning>}}
   The operator pod will not be ready until the admission controller secret is stored in Vault (covered in the next step).
   {{</warning>}}

   <br>

4. **Configure admission controller secret**

   Generate and store the admission controller TLS certificate in Vault:

   ```bash
   kubectl exec -it $(kubectl get pod -l name=redis-enterprise-operator -o jsonpath='{.items[0].metadata.name}') \
     -c redis-enterprise-operator -- /usr/local/bin/generate-tls -infer | tail -4 > output.json
   ```

   Copy the certificate file to Vault (if Vault is running in Kubernetes):

   ```bash
   kubectl cp output.json vault-0:/tmp -n vault
   ```

   Store the certificate in Vault:

   ```bash
   vault kv put -namespace=<VAULT_NAMESPACE> <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/admission-tls @output.json
   ```

   {{<note>}}
   Once the operator is running with Vault integration, proceed to create Redis Enterprise clusters. Do not create clusters before completing this setup.
   {{</note>}}

   <br>

5. **Create Vault CA certificate secret**

   Create a Kubernetes secret containing the Certificate Authority certificate used by your Vault instance:

   ```bash
   kubectl create secret generic vault-ca-cert \
           --namespace <K8S_NAMESPACE> \
           --from-file=vault.ca=<vault-ca-cert-file-path>
   ```

   {{<warning>}}
   The Vault server certificate must be signed by the Certificate Authority provided in this secret.
   {{</warning>}}

## Create Redis Enterprise clusters

1. **Generate cluster credentials**

   Unlike standard deployments, Vault integration requires manually creating cluster credentials:

   ```bash
   # Generate a secure random password
   openssl rand -base64 32
   ```

   Store credentials in Vault:

   ```bash
   vault kv put -namespace=<VAULT_NAMESPACE> \
     <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<REC_NAME> \
     username=<YOUR_USERNAME> \
     password=<YOUR_PASSWORD>
   ```

   {{<note>}}
   Important notes:
   - The username field in the REC spec is ignored when using Vault
   - The username from the Vault secret takes precedence
   - Use strong, unique passwords for each cluster
   {{</note>}}

   <br>

2. **Create cluster service account role**

   Configure a Vault role for the Redis Enterprise cluster's service account:

   ```bash
   vault write -namespace=<VAULT_NAMESPACE> \
     auth/<AUTH_PATH>/role/redis-enterprise-rec-<K8S_NAMESPACE> \
     bound_service_account_names=<REC_NAME> \
     bound_service_account_namespaces=<K8S_NAMESPACE> \
     policies=redisenterprise-<K8S_NAMESPACE>
   ```

   <br>

3. **Deploy Redis Enterprise cluster**

   Create the `RedisEnterpriseCluster` resource with Vault configuration:

   ```yaml
   apiVersion: app.redislabs.com/v1
   kind: RedisEnterpriseCluster
   metadata:
     name: rec
     namespace: <K8S_NAMESPACE>
     labels:
       app: redis-enterprise
   spec:
     nodes: 3
     clusterCredentialSecretName: rec
     clusterCredentialSecretType: vault
     clusterCredentialSecretRole: redis-enterprise-rec-<K8S_NAMESPACE>
     vaultCASecret: vault-ca-cert
     podAnnotations:
       vault.hashicorp.com/auth-path: auth/<AUTH_PATH>
       vault.hashicorp.com/namespace: <VAULT_NAMESPACE>
   ```

   Apply the configuration:

   ```bash
   kubectl apply -f redis-enterprise-cluster.yaml
   ```

   **Key configuration fields:**

   | Field | Description | Example |
   |-------|-------------|---------|
   | `clusterCredentialSecretName` | Name of the secret in Vault containing cluster credentials | `rec` |
   | `clusterCredentialSecretType` | Must be set to `vault` | `vault` |
   | `clusterCredentialSecretRole` | Vault role for cluster authentication | `redis-enterprise-rec-<K8S_NAMESPACE>` |
   | `vaultCASecret` | Kubernetes secret containing Vault's CA certificate | `vault-ca-cert` |
   | `podAnnotations` | Vault agent annotations for pod-level configuration | See example above |



## Create Redis Enterprise databases

To create a Redis Enterprise database (REDB) with Vault integration:

1. Create database password in Vault:
   ```bash
   vault kv put -namespace=<VAULT_NAMESPACE> \
     <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/redb-<DATABASE_NAME> \
     password=<DATABASE_PASSWORD>
   ```

   <br>

2. Create the REDB custom resource:
   Follow the standard [database creation process]({{< relref "/operate/kubernetes/re-databases" >}}). The REC configuration automatically enables Vault integration for all databases.

   <br>

3. Configure additional secrets (optional):
   Store additional REDB secrets in the path `redisenterprise-<K8S_NAMESPACE>/`. Secrets must comply with the [REDB secrets schema]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}).

{{<note>}}
When using the Redis Enterprise Vault plugin, set `defaultUser: false` and associate users through ACL bindings to the REDB.
{{</note>}}

For complete field documentation, see the [Redis Enterprise database API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}).

### Redis Enterprise Remote Cluster secrets

The `secretName` field is supported and should be stored in HashiCorp Vault when the Redis Enterprise cluster uses Vault as a secret source.

### Redis Enterprise Active-Active database secrets

REAADB resources include REDB specifications in the `globalConfigurations` field. All secret names specified in these configurations are supported and should be stored in HashiCorp Vault when the Redis Enterprise cluster uses Vault as a secret source.

## Manage secrets

{{<note>}}
Complete field documentation is available in the [`RedisEnterpriseCluster` API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) and [`RedisEnterpriseDatabase` API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}).
{{</note>}}

### Redis Enterprise cluster secrets

#### Example REC configuration with all certificates

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec
  labels:
    app: redis-enterprise
spec:
  nodes: 3
  licenseSecretName: <VAULT_SECRET_NAME>
  clusterCredentialSecretName: <VAULT_SECRET_NAME>
  certificates:
    apiCertificateSecretName: <VAULT_SECRET_NAME>
    cmCertificateSecretName: <VAULT_SECRET_NAME>
    metricsExporterCertificateSecretName: <VAULT_SECRET_NAME>
    proxyCertificateSecretName: <VAULT_SECRET_NAME>
    syncerCertificateSecretName: <VAULT_SECRET_NAME>
    ldapClientCertificateSecretName: <VAULT_SECRET_NAME>
  # Vault configuration
  clusterCredentialSecretType: vault
  clusterCredentialSecretRole: redis-enterprise-rec-<K8S_NAMESPACE>
  vaultCASecret: vault-ca-cert
  podAnnotations:
    vault.hashicorp.com/auth-path: auth/<AUTH_PATH>
    vault.hashicorp.com/namespace: <VAULT_NAMESPACE>
```

You can also update certificates using `kubectl patch`:

```bash
kubectl patch rec rec --type merge --patch '{"spec": {"certificates": {"apiCertificateSecretName": "<VAULT_SECRET_NAME>"}}}'
```

### Database secrets

#### Database passwords
Store database passwords in Vault using the database name as the secret key:

```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<DATABASE_NAME> \
  password=<DATABASE_PASSWORD>
```

#### Backup storage credentials
Store backup storage credentials for Redis Enterprise databases:

```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<BACKUP_SECRET_NAME> \
  AWS_ACCESS_KEY_ID=<access_key> \
  AWS_SECRET_ACCESS_KEY=<secret_key>
```

#### TLS certificates
Store TLS certificates for database connections:

```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<CERT_SECRET_NAME> \
  tls.crt=<certificate_content> \
  tls.key=<private_key_content>
```

## Troubleshooting

### Common Issues and Solutions

#### Operator pod not ready

Symptoms: Operator pod remains in `Pending` or `CrashLoopBackOff` state

Causes and solutions:

1. Missing admission controller secret:
   ```bash
   # Check if admission-tls secret exists in Vault
   vault kv get -namespace=<VAULT_NAMESPACE> <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/admission-tls
   ```

2. Vault CA certificate issues:
   ```bash
   # Verify vault-ca-cert secret exists
   kubectl get secret vault-ca-cert -n <K8S_NAMESPACE>

   # Check certificate content
   kubectl get secret vault-ca-cert -n <K8S_NAMESPACE> -o jsonpath='{.data.vault\.ca}' | base64 -d
   ```

3. Network connectivity:
   ```bash
   # Test Vault connectivity from operator pod
   kubectl exec -it <operator-pod> -c redis-enterprise-operator -- \
     curl -k https://<VAULT_FQDN>:8200/v1/sys/health
   ```

#### Authentication failures

Symptoms: `Failed to authenticate with Vault` errors in operator logs

Solutions:

1. Verify Vault role configuration:
   ```bash
   vault read -namespace=<VAULT_NAMESPACE> auth/<AUTH_PATH>/role/redis-enterprise-operator-<K8S_NAMESPACE>
   ```

2. Check service account token:
   ```bash
   # Verify service account exists
   kubectl get serviceaccount redis-enterprise-operator -n <K8S_NAMESPACE>

   # Check token mount
   kubectl describe pod <operator-pod> -n <K8S_NAMESPACE> | grep -A5 "Mounts:"
   ```

#### Secret retrieval failures

Symptoms: `Failed to read Vault secret` errors

Solutions:

1. Verify secret exists:
   ```bash
   vault kv get -namespace=<VAULT_NAMESPACE> <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<secret-name>
   ```

2. Check policy permissions:
   ```bash
   vault policy read -namespace=<VAULT_NAMESPACE> redisenterprise-<K8S_NAMESPACE>
   ```

3. Validate secret format:
   ```bash
   # Cluster credentials must have 'username' and 'password' keys
   vault kv get -format=json -namespace=<VAULT_NAMESPACE> <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<cluster-name>
   ```

### Debugging commands

Check operator logs:
```bash
kubectl logs -f deployment/redis-enterprise-operator -n <K8S_NAMESPACE> -c redis-enterprise-operator
```

Verify Vault configuration:
```bash
kubectl get configmap operator-environment-config -n <K8S_NAMESPACE> -o yaml
```

Test Vault authentication:
```bash
# From within operator pod
kubectl exec -it <operator-pod> -n <K8S_NAMESPACE> -c redis-enterprise-operator -- \
  cat /var/run/secrets/kubernetes.io/serviceaccount/token
```
