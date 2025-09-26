---
Title: Integrate Redis Enterprise operator with HashiCorp Vault
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure HashiCorp Vault as the centralized secret management system for Redis Enterprise for Kubernetes.
linkTitle: HashiCorp Vault integration
weight: 97
---

# Integrate Redis Enterprise operator with HashiCorp Vault

## Overview

HashiCorp Vault can be configured as the centralized secret management system for the Redis Enterprise Kubernetes operator, replacing the default Kubernetes secrets. This integration provides enhanced security, centralized secret management, and advanced features like secret rotation and audit logging.

### What secrets are managed by Vault?

When Vault integration is enabled, all secrets referenced in Redis Enterprise custom resources are retrieved from Vault instead of Kubernetes secrets, including:

- Cluster credentials - Admin username/password for Redis Enterprise clusters
- Database credentials - Passwords for Redis databases
- TLS certificates - API, cluster management, proxy, syncer, and LDAP client certificates
- License keys - Redis Enterprise license information
- Backup credentials - Access keys for S3, Azure Blob, GCS, Swift, and SFTP storage
- LDAP credentials - Authentication details for LDAP servers
- Replica source credentials - TLS certificates for cross-cluster replication

For complete details on supported secrets, see the [RedisEnterpriseCluster API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}) and [RedisEnterpriseDatabase API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}).

### Key benefits

- Centralized secret management - Single source of truth for all secrets
- Enhanced security - Vault's encryption, access controls, and audit logging
- Secret rotation - Automated credential rotation capabilities
- Compliance - Meet regulatory requirements with comprehensive audit trails
- Multi-environment support - Consistent secret management across dev/staging/prod

{{<note>}}
When using OpenShift, replace `kubectl` commands with `oc` throughout this guide.
{{</note>}}
## Prerequisites

Before integrating Redis Enterprise operator with HashiCorp Vault, ensure you have the following components properly configured:

### HashiCorp Vault Requirements

- Vault Instance: Deploy HashiCorp Vault with network connectivity from your Kubernetes cluster
  - Tested Version: HashiCorp Vault v1.15.2 (other versions may work but are not officially tested)
  - TLS Required: Vault must be configured with TLS encryption
  - High Availability: Recommended for production environments

- Authentication Method: Configure Kubernetes authentication method in Vault
  - Enables Kubernetes service accounts to authenticate with Vault
  - See [HashiCorp's Kubernetes Auth documentation](https://developer.hashicorp.com/vault/docs/auth/kubernetes)

- Secret Engine: Enable and configure KV version 2 secret engine
  - Default mount path: `secret/` (configurable)
  - Used to store all Redis Enterprise secrets
  - Supports versioning and metadata

### Kubernetes Requirements

- Vault Agent Injector: Deploy the HashiCorp Vault Agent Injector
  - Enables automatic secret injection into pods
  - See [Vault Agent Injector tutorial](https://developer.hashicorp.com/vault/tutorials/kubernetes/kubernetes-sidecar)

- Network Access: Ensure Kubernetes cluster can reach Vault
  - Configure appropriate network policies and firewall rules
  - Vault typically runs on port 8200 (HTTPS)

- Service Accounts: Proper RBAC configuration for operator service accounts

### Vault Enterprise considerations

This guide assumes HashiCorp Vault Enterprise with namespace support:
- **Vault namespaces**: Logical isolation within Vault (not Kubernetes namespaces)
- **Multi-tenancy**: Separate Redis Enterprise deployments by Vault namespace
- **Advanced features**: Audit logging, performance replication, disaster recovery

{{<note>}}
For Vault Community Edition, omit all `VAULT_NAMESPACE` parameters and `-namespace` flags from commands.
{{</note>}}

### Minimum token TTL

Configure Vault token policies with minimum TTL of 1 hour:
- Prevents frequent token renewal overhead
- Ensures stable operation during maintenance windows
- See [Vault token management](https://developer.hashicorp.com/vault/tutorials/tokens/token-management)

## Authentication flow

1. **Service Account Authentication**: Redis Enterprise operator uses its Kubernetes service account token
2. **Vault Authentication**: Operator authenticates with Vault using Kubernetes auth method
3. **Token Acquisition**: Vault issues a time-limited token with appropriate policies
4. **Secret Retrieval**: Operator fetches secrets from Vault KV store using the token
5. **Caching**: Secrets are cached locally with configurable expiration times
6. **Token Renewal**: Tokens are automatically renewed before expiration

### Secret path structure

Vault secrets follow a hierarchical path structure:
```
<VAULT_SECRET_ROOT>/<VAULT_SECRET_PREFIX>/<secret-name>
```

**Default Example**:
```
secret/data/redisenterprise-redis-ns/my-cluster
secret/data/redisenterprise-redis-ns/my-database-password
secret/data/redisenterprise-redis-ns/tls-certificates
```

## Installation and setup

### Deployment scenarios

This guide covers the most common deployment scenario with the following assumptions:

- **Vault Enterprise** with namespace support (adapt for Community Edition by removing namespace parameters)
- **Multiple Redis Enterprise clusters** in the same Kubernetes cluster
- **Namespace isolation** using Kubernetes namespace suffixes for Vault configurations
- **Production security** with proper RBAC and network policies

{{<note>}}
**Multi-cluster considerations**: When deploying across multiple Kubernetes clusters with identical namespace names, additional prefixing may be required to avoid Vault path conflicts.
{{</note>}}

## Configure the operator

### Step 1: Configure Vault policies and roles

#### Create Vault policy

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

**Parameter explanation:**
- `<VAULT_NAMESPACE>`: Your Vault Enterprise namespace (omit for Community Edition)
- `<K8S_NAMESPACE>`: Kubernetes namespace where Redis Enterprise operator is deployed

#### Create Vault role

Configure a Vault role that binds the operator's service account to the policy:

```bash
vault write -namespace=<VAULT_NAMESPACE> auth/<AUTH_PATH>/role/redis-enterprise-operator-<K8S_NAMESPACE> \
        bound_service_account_names="redis-enterprise-operator" \
        bound_service_account_namespaces=<K8S_NAMESPACE> \
        policies=redisenterprise-<K8S_NAMESPACE>
```

**Parameter explanation:**
- `<AUTH_PATH>`: Kubernetes auth method path in Vault (default: `kubernetes`)
- Role name includes namespace for multi-tenant isolation

### Step 2: Configure operator environment

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

#### Configuration parameters

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

{{<note>}}
**Secret path construction**: Secrets are stored at `<VAULT_SECRET_ROOT>/data/<VAULT_SECRET_PREFIX>/<secret-name>`
{{</note>}}

### Step 3: Deploy the operator

Deploy the Redis Enterprise operator following the [standard installation guide]({{< relref "/operate/kubernetes/deployment" >}}).

{{<warning>}}
The operator pod will not be ready until the admission controller secret is stored in Vault (covered in the next step).
{{</warning>}}

### Step 4: Configure admission controller secret

Generate and store the admission controller TLS certificate in Vault:

#### Generate TLS certificate

```bash
kubectl exec -it $(kubectl get pod -l name=redis-enterprise-operator -o jsonpath='{.items[0].metadata.name}') \
  -c redis-enterprise-operator -- /usr/local/bin/generate-tls -infer | tail -4 > output.json
```

#### Store certificate in Vault

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

### Step 5: Create Vault CA certificate secret

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

### Step 1: Generate cluster credentials

Unlike standard deployments, Vault integration requires manually creating cluster credentials:

#### Generate strong password

```bash
# Generate a secure random password
openssl rand -base64 32
```

#### Store credentials in Vault

```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<REC_NAME> \
  username=<YOUR_USERNAME> \
  password=<YOUR_PASSWORD>
```

{{<note>}}
**Important notes:**

- The username field in the REC spec is ignored when using Vault
- The username from the Vault secret takes precedence
- Use strong, unique passwords for each cluster
{{</note>}}

### Step 2: Create cluster service account role

Configure a Vault role for the Redis Enterprise cluster's service account:

```bash
vault write -namespace=<VAULT_NAMESPACE> \
  auth/<AUTH_PATH>/role/redis-enterprise-rec-<K8S_NAMESPACE> \
  bound_service_account_names=<REC_NAME> \
  bound_service_account_namespaces=<K8S_NAMESPACE> \
  policies=redisenterprise-<K8S_NAMESPACE>
```

### Step 3: Deploy Redis Enterprise cluster

Create the RedisEnterpriseCluster resource with Vault configuration:

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

#### Key configuration fields

| Field | Description | Example |
|-------|-------------|---------|
| `clusterCredentialSecretName` | Name of the secret in Vault containing cluster credentials | `rec` |
| `clusterCredentialSecretType` | Must be set to `vault` | `vault` |
| `clusterCredentialSecretRole` | Vault role for cluster authentication | `redis-enterprise-rec-<K8S_NAMESPACE>` |
| `vaultCASecret` | Kubernetes secret containing Vault's CA certificate | `vault-ca-cert` |
| `podAnnotations` | Vault agent annotations for pod-level configuration | See example above |

## Manage database secrets

### Redis Enterprise database secrets

Redis Enterprise databases support various types of secrets stored in Vault:

#### Database password

Store database passwords in Vault using the database name as the secret key:

```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<DATABASE_NAME> \
  password=<DATABASE_PASSWORD>
```

#### Backup storage credentials

Configure backup storage credentials for different providers:

AWS S3:
```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<BACKUP_SECRET_NAME> \
  AWS_ACCESS_KEY_ID=<access_key> \
  AWS_SECRET_ACCESS_KEY=<secret_key>
```

Azure Blob Storage:
```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<BACKUP_SECRET_NAME> \
  AZURE_ACCOUNT_NAME=<account_name> \
  AZURE_ACCOUNT_KEY=<account_key>
```

Google Cloud Storage:
```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<BACKUP_SECRET_NAME> \
  GOOGLE_APPLICATION_CREDENTIALS=<service_account_json>
```

#### TLS certificates

Store TLS certificates for secure database connections:

```bash
vault kv put -namespace=<VAULT_NAMESPACE> \
  <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<CERT_SECRET_NAME> \
  tls.crt=<certificate_content> \
  tls.key=<private_key_content>
```

### Redis Enterprise cluster secrets

The following secrets can be stored in Vault for cluster configuration:

#### Required secrets

- **Cluster credentials**: `clusterCredentialSecretName` - Admin username/password
- **License**: `licenseSecretName` - Redis Enterprise license key

#### Optional certificates

- **API certificate**: `apiCertificateSecretName` - REST API TLS certificate
- **Cluster manager certificate**: `cmCertificateSecretName` - Internal cluster communication
- **Metrics exporter certificate**: `metricsExporterCertificateSecretName` - Prometheus metrics
- **Proxy certificate**: `proxyCertificateSecretName` - Database proxy TLS
- **Syncer certificate**: `syncerCertificateSecretName` - Cross-cluster replication
- **LDAP client certificate**: `ldapClientCertificateSecretName` - LDAP authentication

{{<note>}}
Complete field documentation is available in the [RedisEnterpriseCluster API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}}).
{{</note>}}



### Example REC configuration with all certificates

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

### Create Redis Enterprise databases

To create a Redis Enterprise database (REDB) with Vault integration:

1. **Create database password in Vault**:

   ```bash
   vault kv put -namespace=<VAULT_NAMESPACE> \
     <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/redb-<DATABASE_NAME> \
     password=<DATABASE_PASSWORD>
   ```

2. **Create the REDB custom resource**:

   Follow the standard [database creation process]({{< relref "/operate/kubernetes/re-databases" >}}). The REC configuration automatically enables Vault integration for all databases.

3. **Configure additional secrets** (optional):

   Store additional REDB secrets in the path `redisenterprise-<K8S_NAMESPACE>/`. Secrets must comply with the [REDB secrets schema]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}).

{{<note>}}
When using the Redis Enterprise Vault plugin, set `defaultUser: false` and associate users through ACL bindings to the REDB.
{{</note>}}

### Additional database secret types

Redis Enterprise databases support several types of secrets that can be stored in Vault:

1. **Database password** - Required for database access
2. **Replica source credentials** (optional) - For cross-cluster replication:
   - `clientKeySecret` - Client TLS key
   - `serverCertSecret` - Server certificate
3. **Backup credentials** (optional) - For database backups:
   - **S3 storage**: `awsSecretName`
   - **SFTP storage**: `sftpSecretName`
   - **Swift storage**: `swiftSecretName`
   - **Azure Blob storage**: `absSecretName`
   - **Google Cloud storage**: `gcsSecretName`
4. **Client authentication certificates** (optional) - TLS client certificates for authentication

For complete field documentation, see the [Redis Enterprise database API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}}).

### Redis Enterprise Remote Cluster secrets

The `secretName` field is supported and should be stored in HashiCorp Vault when the Redis Enterprise cluster uses Vault as a secret source.

### Redis Enterprise Active-Active database secrets

REAADB resources include REDB specifications in the `globalConfigurations` field. All secret names specified in these configurations are supported and should be stored in HashiCorp Vault when the Redis Enterprise cluster uses Vault as a secret source.

## Troubleshooting

### Common Issues and Solutions

#### Operator pod not ready

**Symptoms**: Operator pod remains in `Pending` or `CrashLoopBackOff` state

**Causes and solutions**:

1. **Missing admission controller secret**

   ```bash
   # Check if admission-tls secret exists in Vault
   vault kv get -namespace=<VAULT_NAMESPACE> <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/admission-tls
   ```

2. **Vault CA certificate issues**

   ```bash
   # Verify vault-ca-cert secret exists
   kubectl get secret vault-ca-cert -n <K8S_NAMESPACE>

   # Check certificate content
   kubectl get secret vault-ca-cert -n <K8S_NAMESPACE> -o jsonpath='{.data.vault\.ca}' | base64 -d
   ```

3. **Network connectivity**

   ```bash
   # Test Vault connectivity from operator pod
   kubectl exec -it <operator-pod> -c redis-enterprise-operator -- \
     curl -k https://<VAULT_FQDN>:8200/v1/sys/health
   ```

#### Authentication failures

**Symptoms**: `Failed to authenticate with Vault` errors in operator logs

**Solutions**:

1. **Verify Vault role configuration**

   ```bash
   vault read -namespace=<VAULT_NAMESPACE> auth/<AUTH_PATH>/role/redis-enterprise-operator-<K8S_NAMESPACE>
   ```

2. **Check service account token**

   ```bash
   # Verify service account exists
   kubectl get serviceaccount redis-enterprise-operator -n <K8S_NAMESPACE>

   # Check token mount
   kubectl describe pod <operator-pod> -n <K8S_NAMESPACE> | grep -A5 "Mounts:"
   ```

#### Secret retrieval failures

**Symptoms**: `Failed to read Vault secret` errors

**Solutions**:

1. **Verify secret exists**

   ```bash
   vault kv get -namespace=<VAULT_NAMESPACE> <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<secret-name>
   ```

2. **Check policy permissions**

   ```bash
   vault policy read -namespace=<VAULT_NAMESPACE> redisenterprise-<K8S_NAMESPACE>
   ```

3. **Validate secret format**

   ```bash
   # Cluster credentials must have 'username' and 'password' keys
   vault kv get -format=json -namespace=<VAULT_NAMESPACE> <VAULT_SECRET_ROOT>/redisenterprise-<K8S_NAMESPACE>/<cluster-name>
   ```

### Debugging commands

#### Check operator logs

```bash
kubectl logs -f deployment/redis-enterprise-operator -n <K8S_NAMESPACE> -c redis-enterprise-operator
```

#### Verify Vault configuration

```bash
kubectl get configmap operator-environment-config -n <K8S_NAMESPACE> -o yaml
```

#### Test Vault authentication

```bash
# From within operator pod
kubectl exec -it <operator-pod> -n <K8S_NAMESPACE> -c redis-enterprise-operator -- \
  cat /var/run/secrets/kubernetes.io/serviceaccount/token
```

## Security best practices

### Vault configuration

1. **Enable audit logging**

   ```bash
   vault audit enable file file_path=/vault/logs/audit.log
   ```

2. **Use least privilege policies**
   - Grant only necessary permissions to Redis Enterprise policies
   - Regularly review and update access policies
   - Use separate policies for different environments

3. **Implement secret rotation**
   - Configure automatic rotation for database passwords
   - Use Vault's dynamic secrets when possible
   - Monitor secret access patterns

4. **Secure network communication**
   - Always use TLS for Vault communication
   - Implement network policies to restrict access
   - Use private networks when possible

### Kubernetes security

1. **Service account management**
   - Use dedicated service accounts for each Redis Enterprise deployment
   - Implement RBAC with minimal required permissions
   - Regularly audit service account usage

2. **Secret management**
   - Never store secrets in container images or configuration files
   - Use Kubernetes secrets only for Vault CA certificates
   - Implement secret scanning in CI/CD pipelines

3. **Network policies**

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: redis-enterprise-vault-access
   spec:
     podSelector:
       matchLabels:
         app: redis-enterprise-operator
     policyTypes:
     - Egress
     egress:
     - to:
       - namespaceSelector:
           matchLabels:
             name: vault
       ports:
       - protocol: TCP
         port: 8200
   ```

### Monitoring and alerting

1. **Monitor Vault access**
   - Set up alerts for failed authentication attempts
   - Monitor secret access patterns
   - Track token usage and expiration

2. **Redis Enterprise monitoring**
   - Monitor operator pod health and logs
   - Set up alerts for secret retrieval failures
   - Track cluster and database creation events

3. **Security scanning**
   - Regularly scan container images for vulnerabilities
   - Implement runtime security monitoring
   - Audit Vault policies and access patterns

### Compliance considerations

1. **Data encryption**
   - Ensure data is encrypted in transit and at rest
   - Use strong encryption algorithms
   - Regularly rotate encryption keys

2. **Access control**
   - Implement multi-factor authentication for Vault access
   - Use role-based access control (RBAC)
   - Maintain audit trails for all access

3. **Backup and recovery**
   - Regularly backup Vault data
   - Test disaster recovery procedures
   - Implement cross-region replication for high availability
