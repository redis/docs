---
title: RedisEnterpriseCluster API Reference
alwaysopen: false
categories:
- docs
- operate
- kubernetes
linkTitle: REC API
weight: 30
aliases: [ /operate/kubernetes/reference/cluster-options, ]
---

apiVersion:


- [app.redislabs.com/v1](#appredislabscomv1)




# app.redislabs.com/v1




RedisEnterpriseCluster is the Schema for the redisenterpriseclusters API

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
      <td>apiVersion</td>
      <td>string</td>
      <td>app.redislabs.com/v1</td>
      <td>true</td>
      </tr>
      <tr>
      <td>kind</td>
      <td>string</td>
      <td>RedisEnterpriseCluster</td>
      <td>true</td>
      </tr>
      <tr>
      <td><a href="https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.27/#objectmeta-v1-meta">metadata</a></td>
      <td>object</td>
      <td>Refer to the Kubernetes API documentation for the fields of the `metadata` field.</td>
      <td>true</td>
      </tr><tr>
        <td><a href="#spec">spec</a></td>
        <td>object</td>
        <td>
          RedisEnterpriseClusterSpec defines the desired state of RedisEnterpriseCluster<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#status">status</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec
<sup><sup>[↩ Parent](#)</sup></sup>

RedisEnterpriseClusterSpec defines the desired state of RedisEnterpriseCluster

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specactiveactive">activeActive</a></td>
        <td>object</td>
        <td>
          Specification for ActiveActive setup. At most one of ingressOrRouteSpec or activeActive fields can be set at the same time.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>antiAffinityAdditionalTopologyKeys</td>
        <td>[]string</td>
        <td>
          Additional antiAffinity terms in order to support installation on different zones/vcenters<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbackup">backup</a></td>
        <td>object</td>
        <td>
          Cluster-wide backup configurations<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbootstrapperimagespec">bootstrapperImageSpec</a></td>
        <td>object</td>
        <td>
          Specification for Bootstrapper container image<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specbootstrapperresources">bootstrapperResources</a></td>
        <td>object</td>
        <td>
          Compute resource requirements for bootstrapper containers<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#speccertificates">certificates</a></td>
        <td>object</td>
        <td>
          RS Cluster Certificates. Used to modify the certificates used by the cluster. See the "RSClusterCertificates" struct described above to see the supported certificates.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>clusterCredentialSecretName</td>
        <td>string</td>
        <td>
          Secret Name/Path to use for Cluster Credentials. To be used only if ClusterCredentialSecretType is vault. If left blank, will use cluster name.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>clusterCredentialSecretRole</td>
        <td>string</td>
        <td>
          Used only if ClusterCredentialSecretType is vault, to define vault role to be used.  If blank, defaults to "redis-enterprise-operator"<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>clusterCredentialSecretType</td>
        <td>enum</td>
        <td>
          Type of Secret to use for ClusterCredential, Vault, Kuberetes,... If left blank, will default ot kubernetes secrets<br/>
          <br/>
            <i>Enum</i>: vault, kubernetes<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>clusterRecovery</td>
        <td>boolean</td>
        <td>
          ClusterRecovery initiates cluster recovery when set to true. Note that this field is cleared automatically after the cluster is recovered<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#speccontainertimezone">containerTimezone</a></td>
        <td>object</td>
        <td>
          Container timezone configuration. While the default timezone on all containers is UTC, this setting can be used to set the timezone on services rigger/bootstrapper/RS containers. You can either propagate the hosts timezone to RS pods or set it manually via timezoneName.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>createServiceAccount</td>
        <td>boolean</td>
        <td>
          Whether to create service account<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>dataInternodeEncryption</td>
        <td>boolean</td>
        <td>
          Internode encryption (INE) cluster wide policy. An optional boolean setting. Specifies if INE should be on/off for new created REDBs. May be overridden for specific REDB via similar setting, please view the similar setting for REDB for more info.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>encryptPkeys</td>
        <td>boolean</td>
        <td>
          Private key encryption Possible values: true/false<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>enforceIPv4</td>
        <td>boolean</td>
        <td>
          Sets ENFORCE_IPV4 environment variable<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsindex">extraEnvVars</a></td>
        <td>[]object</td>
        <td>
          ADVANCED USAGE: use carefully. Add environment variables to RS StatefulSet's containers.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>extraLabels</td>
        <td>map[string]string</td>
        <td>
          Labels that the user defines for their convenience<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#spechostaliasesindex">hostAliases</a></td>
        <td>[]object</td>
        <td>
          Adds hostAliases entries to the Redis Enterprise pods<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specingressorroutespec">ingressOrRouteSpec</a></td>
        <td>object</td>
        <td>
          Access configurations for the Redis Enterprise Cluster and Databases. At most one of ingressOrRouteSpec or activeActive fields can be set at the same time.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specldap">ldap</a></td>
        <td>object</td>
        <td>
          Cluster-level LDAP configuration, such as server addresses, protocol, authentication and query settings.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>license</td>
        <td>string</td>
        <td>
          Redis Enterprise License<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>licenseSecretName</td>
        <td>string</td>
        <td>
          K8s secret or Vault Secret Name/Path to use for Cluster License. When left blank, the license is read from the "license" field. Note that you can't specify non-empty values in both "license" and "licenseSecretName", only one of these fields can be used to pass the license string. The license needs to be stored under the key "license".<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeSelector</td>
        <td>map[string]string</td>
        <td>
          Selector for nodes that could fit Redis Enterprise pod<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodes</td>
        <td>integer</td>
        <td>
          Number of Redis Enterprise nodes (pods)<br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specocspconfiguration">ocspConfiguration</a></td>
        <td>object</td>
        <td>
          An API object that represents the cluster's OCSP configuration. To enable OCSP, the cluster's proxy certificate should contain the OCSP responder URL.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpersistentspec">persistentSpec</a></td>
        <td>object</td>
        <td>
          Specification for Redis Enterprise Cluster persistence<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>podAnnotations</td>
        <td>map[string]string</td>
        <td>
          annotations for the service rigger and redis enterprise pods<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodantiaffinity">podAntiAffinity</a></td>
        <td>object</td>
        <td>
          Override for the default anti-affinity rules of the Redis Enterprise pods. More info: https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#an-example-of-a-pod-that-uses-pod-affinity<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>podSecurityPolicyName</td>
        <td>string</td>
        <td>
          DEPRECATED PodSecurityPolicy support is removed in Kubernetes v1.25 and the use of this field is invalid for use when running on Kubernetes v1.25+. Future versions of the RedisEnterpriseCluster API will remove support for this field altogether. For migration instructions, see https://kubernetes.io/docs/tasks/configure-pod-container/migrate-from-psp/ 
 Name of pod security policy to use on pods<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodstartingpolicy">podStartingPolicy</a></td>
        <td>object</td>
        <td>
          Mitigation setting for STS pods stuck in "ContainerCreating"<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodtolerationsindex">podTolerations</a></td>
        <td>[]object</td>
        <td>
          Tolerations that are added to all managed pods. More information: https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>priorityClassName</td>
        <td>string</td>
        <td>
          Adds the priority class to pods managed by the operator<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpullsecretsindex">pullSecrets</a></td>
        <td>[]object</td>
        <td>
          PullSecrets is an optional list of references to secrets in the same namespace to use for pulling any of the images. If specified, these secrets will be passed to individual puller implementations for them to use. More info: https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>rackAwarenessNodeLabel</td>
        <td>string</td>
        <td>
          Node label that specifies rack ID - if specified, will create rack aware cluster. Rack awareness requires node label must exist on all nodes. Additionally, operator needs a special cluster role with permission to list nodes.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributes">redisEnterpriseAdditionalPodSpecAttributes</a></td>
        <td>object</td>
        <td>
          ADVANCED USAGE USE AT YOUR OWN RISK - specify pod attributes that are required for the statefulset - Redis Enterprise pods. Pod attributes managed by the operator might override these settings. Also make sure the attributes are supported by the K8s version running on the cluster - the operator does not validate that.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisEnterpriseIPFamily</td>
        <td>enum</td>
        <td>
          Reserved, future use, only for use if instructed by Redis. IPFamily dictates what IP family to choose for pods' internal and external communication.<br/>
          <br/>
            <i>Enum</i>: IPv4, IPv6<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseimagespec">redisEnterpriseImageSpec</a></td>
        <td>object</td>
        <td>
          Specification for Redis Enterprise container image<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterprisenoderesources">redisEnterpriseNodeResources</a></td>
        <td>object</td>
        <td>
          Compute resource requirements for Redis Enterprise containers<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisEnterprisePodAnnotations</td>
        <td>map[string]string</td>
        <td>
          annotations for redis enterprise pod<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesconfiguration">redisEnterpriseServicesConfiguration</a></td>
        <td>object</td>
        <td>
          RS Cluster optional services settings<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesriggerimagespec">redisEnterpriseServicesRiggerImageSpec</a></td>
        <td>object</td>
        <td>
          Specification for Services Rigger container image<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesriggerresources">redisEnterpriseServicesRiggerResources</a></td>
        <td>object</td>
        <td>
          Compute resource requirements for Services Rigger pod<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisEnterpriseTerminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          The TerminationGracePeriodSeconds value for the (STS created) REC pods<br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterprisevolumemountsindex">redisEnterpriseVolumeMounts</a></td>
        <td>[]object</td>
        <td>
          additional volume mounts within the redis enterprise containers. More info: https://kubernetes.io/docs/concepts/storage/volumes/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisonflashspec">redisOnFlashSpec</a></td>
        <td>object</td>
        <td>
          Stores configurations specific to redis on flash. If provided, the cluster will be capable of creating redis on flash databases.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisUpgradePolicy</td>
        <td>enum</td>
        <td>
          Redis upgrade policy to be set on the Redis Enterprise Cluster. Possible values: major/latest This value is used by the cluster to choose the Redis version of the database when an upgrade is performed. The Redis Enterprise Cluster includes multiple versions of OSS Redis that can be used for databases.<br/>
          <br/>
            <i>Enum</i>: major, latest<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>resp3Default</td>
        <td>boolean</td>
        <td>
          Whether databases will turn on RESP3 compatibility upon database upgrade. Note - Deleting this property after explicitly setting its value shall have no effect. Please view the corresponding field in RS doc for more info.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>serviceAccountName</td>
        <td>string</td>
        <td>
          Name of the service account to use<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservices">services</a></td>
        <td>object</td>
        <td>
          Customization options for operator-managed service resources created for Redis Enterprise clusters and databases<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspec">servicesRiggerSpec</a></td>
        <td>object</td>
        <td>
          Specification for service rigger<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindex">sideContainersSpec</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specslaveha">slaveHA</a></td>
        <td>object</td>
        <td>
          Slave high availability mechanism configuration.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>uiAnnotations</td>
        <td>map[string]string</td>
        <td>
          Annotations for Redis Enterprise UI service. This annotations will override the overlapping global annotations set under spec.services.servicesAnnotations The specified annotations will not override annotations that already exist and didn't originate from the operator, except for the 'redis.io/last-keys' annotation which is reserved.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>uiServiceType</td>
        <td>enum</td>
        <td>
          Type of service used to expose Redis Enterprise UI (https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types)<br/>
          <br/>
            <i>Enum</i>: ClusterIP, NodePort, LoadBalancer, ExternalName<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specupgradespec">upgradeSpec</a></td>
        <td>object</td>
        <td>
          Specification for upgrades of Redis Enterprise<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>username</td>
        <td>string</td>
        <td>
          Username for the admin user of Redis Enterprise<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>vaultCASecret</td>
        <td>string</td>
        <td>
          K8s secret name containing Vault's CA cert - defaults to "vault-ca-cert"<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindex">volumes</a></td>
        <td>[]object</td>
        <td>
          additional volumes<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.activeActive
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specification for ActiveActive setup. At most one of ingressOrRouteSpec or activeActive fields can be set at the same time.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>apiIngressUrl</td>
        <td>string</td>
        <td>
          RS API URL<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>dbIngressSuffix</td>
        <td>string</td>
        <td>
          DB ENDPOINT SUFFIX - will be used to set the db host. ingress <db name><db ingress suffix> Creates a host name so it should be unique if more than one db is created on the cluster with the same name<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>method</td>
        <td>enum</td>
        <td>
          Used to distinguish between different platforms implementation<br/>
          <br/>
            <i>Enum</i>: openShiftRoute, ingress<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>ingressAnnotations</td>
        <td>map[string]string</td>
        <td>
          Used for ingress controllers such as ha-proxy or nginx in GKE<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.backup
<sup><sup>[↩ Parent](#spec)</sup></sup>

Cluster-wide backup configurations

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specbackups3">s3</a></td>
        <td>object</td>
        <td>
          Configurations for backups to s3 and s3-compatible storage<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.backup.s3
<sup><sup>[↩ Parent](#specbackup)</sup></sup>

Configurations for backups to s3 and s3-compatible storage

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>caCertificateSecretName</td>
        <td>string</td>
        <td>
          Secret name that holds the S3 CA certificate, which contains the TLS certificate mapped to the key in the secret 'cert'<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>url</td>
        <td>string</td>
        <td>
          Specifies the URL for S3 export and import<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.bootstrapperImageSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specification for Bootstrapper container image

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>digestHash</td>
        <td>string</td>
        <td>
          The digest hash of the container image to pull. When specified, the container image is pulled according to the digest hash instead of the image tag. The versionTag field must also be specified with the image tag matching this digest hash. Note: This field is only supported for OLM deployments.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          The image pull policy to be applied to the container image. One of Always, Never, IfNotPresent.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>repository</td>
        <td>string</td>
        <td>
          The repository (name) of the container image to be deployed.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>versionTag</td>
        <td>string</td>
        <td>
          The tag of the container image to be deployed.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.bootstrapperResources
<sup><sup>[↩ Parent](#spec)</sup></sup>

Compute resource requirements for bootstrapper containers

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specbootstrapperresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          Limits describes the maximum amount of compute resources allowed. More info: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          Requests describes the minimum amount of compute resources required. If Requests is omitted for a container, it defaults to Limits if that is explicitly specified, otherwise to an implementation-defined value. More info: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.bootstrapperResources.claims[index]
<sup><sup>[↩ Parent](#specbootstrapperresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.certificates
<sup><sup>[↩ Parent](#spec)</sup></sup>

RS Cluster Certificates. Used to modify the certificates used by the cluster. See the "RSClusterCertificates" struct described above to see the supported certificates.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>apiCertificateSecretName</td>
        <td>string</td>
        <td>
          Secret name to use for cluster's API certificate. If left blank, a cluster-provided certificate will be used.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>cmCertificateSecretName</td>
        <td>string</td>
        <td>
          Secret name to use for cluster's CM (Cluster Manager) certificate. If left blank, a cluster-provided certificate will be used.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ldapClientCertificateSecretName</td>
        <td>string</td>
        <td>
          Secret name to use for cluster's LDAP client certificate. If left blank, LDAP client certificate authentication will be disabled.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>metricsExporterCertificateSecretName</td>
        <td>string</td>
        <td>
          Secret name to use for cluster's Metrics Exporter certificate. If left blank, a cluster-provided certificate will be used.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>proxyCertificateSecretName</td>
        <td>string</td>
        <td>
          Secret name to use for cluster's Proxy certificate. If left blank, a cluster-provided certificate will be used.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>syncerCertificateSecretName</td>
        <td>string</td>
        <td>
          Secret name to use for cluster's Syncer certificate. If left blank, a cluster-provided certificate will be used.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.containerTimezone
<sup><sup>[↩ Parent](#spec)</sup></sup>

Container timezone configuration. While the default timezone on all containers is UTC, this setting can be used to set the timezone on services rigger/bootstrapper/RS containers. You can either propagate the hosts timezone to RS pods or set it manually via timezoneName.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>propagateHost</td>
        <td>object</td>
        <td>
          Identifies that container timezone should be in sync with the host, this option mounts a hostPath volume onto RS pods that could be restricted in some systems.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timezoneName</td>
        <td>string</td>
        <td>
          POSIX-style timezone name as a string to be passed as EnvVar to RE pods, e.g. "Europe/London".<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[index]
<sup><sup>[↩ Parent](#spec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsindexvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[index].valueFrom
<sup><sup>[↩ Parent](#specextraenvvarsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specextraenvvarsindexvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsindexvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsindexvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsindexvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[index].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specextraenvvarsindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[index].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specextraenvvarsindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[index].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specextraenvvarsindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[index].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specextraenvvarsindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.hostAliases[index]
<sup><sup>[↩ Parent](#spec)</sup></sup>

HostAlias holds the mapping between IP and hostnames that will be injected as an entry in the pod's hosts file.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>hostnames</td>
        <td>[]string</td>
        <td>
          Hostnames for the above IP address.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ip</td>
        <td>string</td>
        <td>
          IP address of the host file entry.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.ingressOrRouteSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Access configurations for the Redis Enterprise Cluster and Databases. At most one of ingressOrRouteSpec or activeActive fields can be set at the same time.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>apiFqdnUrl</td>
        <td>string</td>
        <td>
          RS API URL<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>dbFqdnSuffix</td>
        <td>string</td>
        <td>
          DB ENDPOINT SUFFIX - will be used to set the db host ingress <db name><db fqdn suffix>. Creates a host name so it should be unique if more than one db is created on the cluster with the same name<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>method</td>
        <td>enum</td>
        <td>
          Used to distinguish between different platforms implementation.<br/>
          <br/>
            <i>Enum</i>: openShiftRoute, ingress, istio<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>ingressAnnotations</td>
        <td>map[string]string</td>
        <td>
          Additional annotations to set on ingress resources created by the operator<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.ldap
<sup><sup>[↩ Parent](#spec)</sup></sup>

Cluster-level LDAP configuration, such as server addresses, protocol, authentication and query settings.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specldapauthenticationquery">authenticationQuery</a></td>
        <td>object</td>
        <td>
          Configuration of authentication queries, mapping between the username, provided to the cluster for authentication, and the LDAP Distinguished Name.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specldapauthorizationquery">authorizationQuery</a></td>
        <td>object</td>
        <td>
          Configuration of authorization queries, mapping between a user's Distinguished Name and its group memberships.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>protocol</td>
        <td>enum</td>
        <td>
          Specifies the LDAP protocol to use. One of: LDAP, LDAPS, STARTTLS.<br/>
          <br/>
            <i>Enum</i>: LDAP, LDAPS, STARTTLS<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specldapserversindex">servers</a></td>
        <td>[]object</td>
        <td>
          One or more LDAP servers. If multiple servers are specified, they must all share an identical organization tree structure.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>bindCredentialsSecretName</td>
        <td>string</td>
        <td>
          Name of a secret within the same namespace, holding the credentials used to communicate with the LDAP server for authentication queries. The secret must have a key named 'dn' with the Distinguished Name of the user to execute the query, and 'password' with its password. If left blank, credentials-based authentication is disabled.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>caCertificateSecretName</td>
        <td>string</td>
        <td>
          Name of a secret within the same namespace, holding a PEM-encoded CA certificate for validating the TLS connection to the LDAP server. The secret must have a key named 'cert' with the certificate data. This field is applicable only when the protocol is LDAPS or STARTTLS.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>cacheTTLSeconds</td>
        <td>integer</td>
        <td>
          The maximum TTL of cached entries.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>enabledForControlPlane</td>
        <td>boolean</td>
        <td>
          Whether to enable LDAP for control plane access. Disabled by default.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>enabledForDataPlane</td>
        <td>boolean</td>
        <td>
          Whether to enable LDAP for data plane access. Disabled by default.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.ldap.authenticationQuery
<sup><sup>[↩ Parent](#specldap)</sup></sup>

Configuration of authentication queries, mapping between the username, provided to the cluster for authentication, and the LDAP Distinguished Name.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specldapauthenticationqueryquery">query</a></td>
        <td>object</td>
        <td>
          Configuration for a search query. Mutually exclusive with the 'template' field. The substring '%u' in the query filter will be replaced with the username.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>template</td>
        <td>string</td>
        <td>
          Configuration for a template query. Mutually exclusive with the 'query' field. The substring '%u' will be replaced with the username, e.g., 'cn=%u,ou=dev,dc=example,dc=com'.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.ldap.authenticationQuery.query
<sup><sup>[↩ Parent](#specldapauthenticationquery)</sup></sup>

Configuration for a search query. Mutually exclusive with the 'template' field. The substring '%u' in the query filter will be replaced with the username.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>base</td>
        <td>string</td>
        <td>
          The Distinguished Name of the entry at which to start the search, e.g., 'ou=dev,dc=example,dc=com'.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>filter</td>
        <td>string</td>
        <td>
          An RFC-4515 string representation of the filter to apply in the search. For an authentication query, the substring '%u' will be replaced with the username, e.g., '(cn=%u)'. For an authorization query, the substring '%D' will be replaced with the user's Distinguished Name, e.g., '(members=%D)'.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>scope</td>
        <td>enum</td>
        <td>
          The search scope for an LDAP query. One of: BaseObject, SingleLevel, WholeSubtree<br/>
          <br/>
            <i>Enum</i>: BaseObject, SingleLevel, WholeSubtree<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.ldap.authorizationQuery
<sup><sup>[↩ Parent](#specldap)</sup></sup>

Configuration of authorization queries, mapping between a user's Distinguished Name and its group memberships.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>attribute</td>
        <td>string</td>
        <td>
          Configuration for an attribute query. Mutually exclusive with the 'query' field. Holds the name of an attribute of the LDAP user entity that contains a list of the groups that the user belongs to, e.g., 'memberOf'.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specldapauthorizationqueryquery">query</a></td>
        <td>object</td>
        <td>
          Configuration for a search query. Mutually exclusive with the 'attribute' field. The substring '%D' in the query filter will be replaced with the user's Distinguished Name.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.ldap.authorizationQuery.query
<sup><sup>[↩ Parent](#specldapauthorizationquery)</sup></sup>

Configuration for a search query. Mutually exclusive with the 'attribute' field. The substring '%D' in the query filter will be replaced with the user's Distinguished Name.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>base</td>
        <td>string</td>
        <td>
          The Distinguished Name of the entry at which to start the search, e.g., 'ou=dev,dc=example,dc=com'.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>filter</td>
        <td>string</td>
        <td>
          An RFC-4515 string representation of the filter to apply in the search. For an authentication query, the substring '%u' will be replaced with the username, e.g., '(cn=%u)'. For an authorization query, the substring '%D' will be replaced with the user's Distinguished Name, e.g., '(members=%D)'.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>scope</td>
        <td>enum</td>
        <td>
          The search scope for an LDAP query. One of: BaseObject, SingleLevel, WholeSubtree<br/>
          <br/>
            <i>Enum</i>: BaseObject, SingleLevel, WholeSubtree<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.ldap.servers[index]
<sup><sup>[↩ Parent](#specldap)</sup></sup>

Address of an LDAP server.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>host</td>
        <td>string</td>
        <td>
          Host name of the LDAP server<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          Port number of the LDAP server. If unspecified, defaults to 389 for LDAP and STARTTLS protocols, and 636 for LDAPS protocol.<br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.ocspConfiguration
<sup><sup>[↩ Parent](#spec)</sup></sup>

An API object that represents the cluster's OCSP configuration. To enable OCSP, the cluster's proxy certificate should contain the OCSP responder URL.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>ocspFunctionality</td>
        <td>boolean</td>
        <td>
          Whether to enable/disable OCSP mechanism for the cluster.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>queryFrequency</td>
        <td>integer</td>
        <td>
          Determines the interval (in seconds) in which the control plane will poll the OCSP responder for a new status for the server certificate. Minimum value is 60. Maximum value is 86400.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>recoveryFrequency</td>
        <td>integer</td>
        <td>
          Determines the interval (in seconds) in which the control plane will poll the OCSP responder for a new status for the server certificate when the current staple is invalid. Minimum value is 60. Maximum value is 86400.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>recoveryMaxTries</td>
        <td>integer</td>
        <td>
          Determines the maximum number for the OCSP recovery attempts. After max number of tries passed, the control plane will revert back to the regular frequency. Minimum value is 1. Maximum value is 100.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>responseTimeout</td>
        <td>integer</td>
        <td>
          Determines the time interval (in seconds) for which the request waits for a response from the OCSP responder. Minimum value is 1. Maximum value is 60.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.persistentSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specification for Redis Enterprise Cluster persistence

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enablePersistentVolumeResize</td>
        <td>boolean</td>
        <td>
          Whether to enable PersistentVolumes resize. Disabled by default. Read the instruction in pvc_expansion readme carefully before using this feature.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Whether to add persistent volume to Redis Enterprise pods<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storageClassName</td>
        <td>string</td>
        <td>
          Storage class for persistent volume in Redis Enterprise pods. Leave empty to use the default. If using the default this way, make sure the Kubernetes Cluster has a default Storage Class configured. This can be done by running a `kubectl get storageclass` and see if one of the Storage Classes' names contains a `(default)` mark.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeSize</td>
        <td>int or string</td>
        <td>
          To enable resizing after creating the cluster - please follow the instructions in the pvc_expansion readme<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity
<sup><sup>[↩ Parent](#spec)</sup></sup>

Override for the default anti-affinity rules of the Redis Enterprise pods. More info: https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#an-example-of-a-pod-that-uses-pod-affinity

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindex">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindex">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specpodantiaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm">podAffinityTerm</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>weight</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specpodantiaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podStartingPolicy
<sup><sup>[↩ Parent](#spec)</sup></sup>

Mitigation setting for STS pods stuck in "ContainerCreating"

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          Whether to detect and attempt to mitigate pod startup issues<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>startingThresholdSeconds</td>
        <td>integer</td>
        <td>
          Time in seconds to wait for a pod to be stuck while starting up before action is taken. If set to 0, will be treated as if disabled.<br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.podTolerations[index]
<sup><sup>[↩ Parent](#spec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>effect</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tolerationSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.pullSecrets[index]
<sup><sup>[↩ Parent](#spec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Secret name<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes
<sup><sup>[↩ Parent](#spec)</sup></sup>

ADVANCED USAGE USE AT YOUR OWN RISK - specify pod attributes that are required for the statefulset - Redis Enterprise pods. Pod attributes managed by the operator might override these settings. Also make sure the attributes are supported by the K8s version running on the cluster - the operator does not validate that.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>activeDeadlineSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinity">affinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>automountServiceAccountToken</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesdnsconfig">dnsConfig</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>dnsPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>enableServiceLinks</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex">ephemeralContainers</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributeshostaliasesindex">hostAliases</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostIPC</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostNetwork</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostPID</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostUsers</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostname</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesimagepullsecretsindex">imagePullSecrets</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindex">initContainers</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeSelector</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesos">os</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>overhead</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>preemptionPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>priority</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>priorityClassName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesreadinessgatesindex">readinessGates</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesresourceclaimsindex">resourceClaims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>restartPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runtimeClassName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>schedulerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesschedulinggatesindex">schedulingGates</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributessecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>serviceAccount</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>serviceAccountName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>setHostnameAsFQDN</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shareProcessNamespace</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subdomain</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributestolerationsindex">tolerations</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintsindex">topologySpreadConstraints</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindex">volumes</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinity">nodeAffinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinity">podAffinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinity">podAntiAffinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindex">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecution">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreference">preference</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>weight</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].preference
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreferencematchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreferencematchfieldsindex">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].preference.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreference)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].preference.matchFields[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreference)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindex">nodeSelectorTerms</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindexmatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindexmatchfieldsindex">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[index].matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[index].matchFields[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindex">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindex">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm">podAffinityTerm</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>weight</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindex">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindex">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm">podAffinityTerm</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>weight</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.dnsConfig
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>nameservers</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesdnsconfigoptionsindex">options</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>searches</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.dnsConfig.options[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesdnsconfig)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>args</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindex">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvfromindex">envFrom</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexportsindex">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobe">startupProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdin</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdinOnce</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>targetContainerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tty</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexvolumedevicesindex">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexvolumemountsindex">volumeMounts</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>workingDir</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].env[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].envFrom[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvfromindexconfigmapref">configMapRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>prefix</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvfromindexsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].envFrom[index].configMapRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].envFrom[index].secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststarthttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststarthttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestophttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestophttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].ports[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>containerPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>hostIP</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protocol</td>
        <td>string</td>
        <td>
          <br/>
          <br/>
            <i>Default</i>: TCP<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].resources
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].resources.claims[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>allowPrivilegeEscalation</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontextcapabilities">capabilities</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>privileged</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>procMount</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnlyRootFilesystem</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsNonRoot</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUser</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.capabilities
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>add</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>drop</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>level</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>localhostProfile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gmsaCredentialSpec</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>gmsaCredentialSpecName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostProcess</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUserName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].volumeDevices[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>devicePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[index].volumeMounts[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>mountPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mountPropagation</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPathExpr</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.hostAliases[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>hostnames</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ip</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.imagePullSecrets[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>args</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindex">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvfromindex">envFrom</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexportsindex">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobe">startupProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdin</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdinOnce</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tty</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexvolumedevicesindex">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexvolumemountsindex">volumeMounts</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>workingDir</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].env[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].envFrom[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvfromindexconfigmapref">configMapRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>prefix</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvfromindexsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].envFrom[index].configMapRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].envFrom[index].secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststarthttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststarthttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestophttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestophttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].livenessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].livenessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].livenessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].livenessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].ports[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>containerPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>hostIP</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protocol</td>
        <td>string</td>
        <td>
          <br/>
          <br/>
            <i>Default</i>: TCP<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].readinessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].readinessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].readinessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].readinessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].resources
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].resources.claims[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].securityContext
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>allowPrivilegeEscalation</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontextcapabilities">capabilities</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>privileged</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>procMount</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnlyRootFilesystem</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsNonRoot</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUser</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].securityContext.capabilities
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>add</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>drop</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>level</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>localhostProfile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gmsaCredentialSpec</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>gmsaCredentialSpecName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostProcess</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUserName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].startupProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].startupProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].startupProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].startupProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].startupProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].volumeDevices[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>devicePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[index].volumeMounts[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>mountPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mountPropagation</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPathExpr</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.os
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.readinessGates[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>conditionType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.resourceClaims[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesresourceclaimsindexsource">source</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.resourceClaims[index].source
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesresourceclaimsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resourceClaimName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>resourceClaimTemplateName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.schedulingGates[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.securityContext
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsGroupChangePolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsNonRoot</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUser</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributessecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributessecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>supplementalGroups</td>
        <td>[]integer</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributessecuritycontextsysctlsindex">sysctls</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributessecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>level</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.securityContext.seccompProfile
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>localhostProfile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.securityContext.sysctls[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.securityContext.windowsOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gmsaCredentialSpec</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>gmsaCredentialSpecName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostProcess</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUserName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.tolerations[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>effect</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tolerationSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.topologySpreadConstraints[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>maxSkew</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>whenUnsatisfiable</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintsindexlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabelKeys</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>minDomains</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeAffinityPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeTaintsPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.topologySpreadConstraints[index].labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintsindexlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.topologySpreadConstraints[index].labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintsindexlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexawselasticblockstore">awsElasticBlockStore</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexazuredisk">azureDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexazurefile">azureFile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexcephfs">cephfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexcinder">cinder</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexcsi">csi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexemptydir">emptyDir</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeral">ephemeral</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexfc">fc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexflexvolume">flexVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexflocker">flocker</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexgcepersistentdisk">gcePersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexgitrepo">gitRepo</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexglusterfs">glusterfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexhostpath">hostPath</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexiscsi">iscsi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexnfs">nfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexpersistentvolumeclaim">persistentVolumeClaim</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexphotonpersistentdisk">photonPersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexportworxvolume">portworxVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojected">projected</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexquobyte">quobyte</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexrbd">rbd</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexscaleio">scaleIO</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexsecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexstorageos">storageos</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexvspherevolume">vsphereVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].awsElasticBlockStore
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>partition</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].azureDisk
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>diskName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>diskURI</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>cachingMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>kind</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].azureFile
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>secretName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>shareName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].cephfs
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>monitors</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>secretFile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexcephfssecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].cephfs.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexcephfs)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].cinder
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexcindersecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].cinder.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexcinder)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].configMap
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexconfigmapitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].configMap.items[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexconfigmap)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].csi
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>driver</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexcsinodepublishsecretref">nodePublishSecretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeAttributes</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].csi.nodePublishSecretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexcsi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].downwardAPI
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexdownwardapiitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].downwardAPI.items[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexdownwardapi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexdownwardapiitemsindexfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexdownwardapiitemsindexresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].downwardAPI.items[index].fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].downwardAPI.items[index].resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].emptyDir
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>medium</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>sizeLimit</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplate">volumeClaimTemplate</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeral)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec">spec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>metadata</td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplate)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>accessModes</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecdatasource">dataSource</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecdatasourceref">dataSourceRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecselector">selector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storageClassName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.dataSource
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>kind</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiGroup</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.dataSourceRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>kind</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiGroup</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespace</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.resources
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.resources.claims[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.selector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.selector.matchExpressions[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].fc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lun</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>targetWWNs</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>wwids</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].flexVolume
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>driver</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>options</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexflexvolumesecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].flexVolume.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexflexvolume)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].flocker
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>datasetName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>datasetUUID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].gcePersistentDisk
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>pdName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>partition</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].gitRepo
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>repository</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>directory</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>revision</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].glusterfs
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>endpoints</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].hostPath
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].iscsi
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>iqn</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>lun</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>targetPortal</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>chapAuthDiscovery</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>chapAuthSession</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initiatorName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>iscsiInterface</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>portals</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexiscsisecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].iscsi.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexiscsi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].nfs
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>server</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].persistentVolumeClaim
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>claimName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].photonPersistentDisk
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>pdID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].portworxVolume
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindex">sources</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojected)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexsecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexserviceaccounttoken">serviceAccountToken</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].configMap
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexconfigmapitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].configMap.items[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexconfigmap)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI.items[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindexfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindexresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI.items[index].fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI.items[index].resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].secret
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexsecretitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].secret.items[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindexsecret)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].projected.sources[index].serviceAccountToken
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>audience</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>expirationSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].quobyte
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>registry</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>volume</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>group</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tenant</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].rbd
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>monitors</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>keyring</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>pool</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexrbdsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].rbd.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexrbd)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].scaleIO
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gateway</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexscaleiosecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>system</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protectionDomain</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>sslEnabled</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storageMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePool</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].scaleIO.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexscaleio)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].secret
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexsecretitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>secretName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].secret.items[index]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexsecret)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].storageos
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesindexstorageossecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeNamespace</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].storageos.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindexstorageos)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[index].vsphereVolume
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePolicyID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePolicyName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseImageSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specification for Redis Enterprise container image

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>digestHash</td>
        <td>string</td>
        <td>
          The digest hash of the container image to pull. When specified, the container image is pulled according to the digest hash instead of the image tag. The versionTag field must also be specified with the image tag matching this digest hash. Note: This field is only supported for OLM deployments.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          The image pull policy to be applied to the container image. One of Always, Never, IfNotPresent.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>repository</td>
        <td>string</td>
        <td>
          The repository (name) of the container image to be deployed.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>versionTag</td>
        <td>string</td>
        <td>
          The tag of the container image to be deployed.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseNodeResources
<sup><sup>[↩ Parent](#spec)</sup></sup>

Compute resource requirements for Redis Enterprise containers

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterprisenoderesourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          Limits describes the maximum amount of compute resources allowed. More info: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          Requests describes the minimum amount of compute resources required. If Requests is omitted for a container, it defaults to Limits if that is explicitly specified, otherwise to an implementation-defined value. More info: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseNodeResources.claims[index]
<sup><sup>[↩ Parent](#specredisenterprisenoderesources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration
<sup><sup>[↩ Parent](#spec)</sup></sup>

RS Cluster optional services settings

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseservicesconfigurationcmserver">cmServer</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesconfigurationcrdbcoordinator">crdbCoordinator</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesconfigurationcrdbworker">crdbWorker</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesconfigurationmdnsserver">mdnsServer</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesconfigurationpdnsserver">pdnsServer</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesconfigurationsaslauthd">saslauthd</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseservicesconfigurationstatsarchiver">statsArchiver</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration.cmServer
<sup><sup>[↩ Parent](#specredisenterpriseservicesconfiguration)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>operatingMode</td>
        <td>enum</td>
        <td>
          Whether to enable/disable the CM server<br/>
          <br/>
            <i>Enum</i>: enabled, disabled<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration.crdbCoordinator
<sup><sup>[↩ Parent](#specredisenterpriseservicesconfiguration)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>operatingMode</td>
        <td>enum</td>
        <td>
          Whether to enable/disable the crdb coordinator process<br/>
          <br/>
            <i>Enum</i>: enabled, disabled<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration.crdbWorker
<sup><sup>[↩ Parent](#specredisenterpriseservicesconfiguration)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>operatingMode</td>
        <td>enum</td>
        <td>
          Whether to enable/disable the crdb worker processes<br/>
          <br/>
            <i>Enum</i>: enabled, disabled<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration.mdnsServer
<sup><sup>[↩ Parent](#specredisenterpriseservicesconfiguration)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>operatingMode</td>
        <td>enum</td>
        <td>
          Whether to enable/disable the Multicast DNS server<br/>
          <br/>
            <i>Enum</i>: enabled, disabled<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration.pdnsServer
<sup><sup>[↩ Parent](#specredisenterpriseservicesconfiguration)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>operatingMode</td>
        <td>enum</td>
        <td>
          Whether to enable/disable the pdns server<br/>
          <br/>
            <i>Enum</i>: enabled, disabled<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration.saslauthd
<sup><sup>[↩ Parent](#specredisenterpriseservicesconfiguration)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>operatingMode</td>
        <td>enum</td>
        <td>
          Whether to enable/disable the saslauthd service<br/>
          <br/>
            <i>Enum</i>: enabled, disabled<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesConfiguration.statsArchiver
<sup><sup>[↩ Parent](#specredisenterpriseservicesconfiguration)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>operatingMode</td>
        <td>enum</td>
        <td>
          Whether to enable/disable the stats archiver service<br/>
          <br/>
            <i>Enum</i>: enabled, disabled<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesRiggerImageSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specification for Services Rigger container image

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>digestHash</td>
        <td>string</td>
        <td>
          The digest hash of the container image to pull. When specified, the container image is pulled according to the digest hash instead of the image tag. The versionTag field must also be specified with the image tag matching this digest hash. Note: This field is only supported for OLM deployments.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          The image pull policy to be applied to the container image. One of Always, Never, IfNotPresent.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>repository</td>
        <td>string</td>
        <td>
          The repository (name) of the container image to be deployed.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>versionTag</td>
        <td>string</td>
        <td>
          The tag of the container image to be deployed.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesRiggerResources
<sup><sup>[↩ Parent](#spec)</sup></sup>

Compute resource requirements for Services Rigger pod

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseservicesriggerresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          Limits describes the maximum amount of compute resources allowed. More info: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          Requests describes the minimum amount of compute resources required. If Requests is omitted for a container, it defaults to Limits if that is explicitly specified, otherwise to an implementation-defined value. More info: https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container/<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseServicesRiggerResources.claims[index]
<sup><sup>[↩ Parent](#specredisenterpriseservicesriggerresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseVolumeMounts[index]
<sup><sup>[↩ Parent](#spec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>mountPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mountPropagation</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPathExpr</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisOnFlashSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Stores configurations specific to redis on flash. If provided, the cluster will be capable of creating redis on flash databases.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>enabled</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>storageClassName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>bigStoreDriver</td>
        <td>enum</td>
        <td>
          <br/>
          <br/>
            <i>Enum</i>: rocksdb, speedb<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>flashDiskSize</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>flashStorageEngine</td>
        <td>enum</td>
        <td>
          <br/>
          <br/>
            <i>Enum</i>: rocksdb<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.services
<sup><sup>[↩ Parent](#spec)</sup></sup>

Customization options for operator-managed service resources created for Redis Enterprise clusters and databases

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesapiservice">apiService</a></td>
        <td>object</td>
        <td>
          Customization options for the REC API service.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>servicesAnnotations</td>
        <td>map[string]string</td>
        <td>
          Global additional annotations to set on service resources created by the operator. The specified annotations will not override annotations that already exist and didn't originate from the operator.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.services.apiService
<sup><sup>[↩ Parent](#specservices)</sup></sup>

Customization options for the REC API service.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>enum</td>
        <td>
          Type of service to create for the REC API service. Defaults to ClusterIP service, if not specified otherwise.<br/>
          <br/>
            <i>Enum</i>: ClusterIP, NodePort, LoadBalancer<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specification for service rigger

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>databaseServiceType</td>
        <td>string</td>
        <td>
          Service types for access to databases. should be a comma separated list. The possible values are cluster_ip, headless and load_balancer.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsindex">extraEnvVars</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>podAnnotations</td>
        <td>map[string]string</td>
        <td>
          annotations for the service rigger pod<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>serviceNaming</td>
        <td>enum</td>
        <td>
          Used to determine how to name the services created automatically when a database is created. When bdb_name is used, the database name will be also used for the service name. When redis-port is used, the service will be named redis-<port>.<br/>
          <br/>
            <i>Enum</i>: bdb_name, redis-port<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributes">servicesRiggerAdditionalPodSpecAttributes</a></td>
        <td>object</td>
        <td>
          ADVANCED USAGE USE AT YOUR OWN RISK - specify pod attributes that are required for the rigger deployment pod. Pod attributes managed by the operator might override these settings (Containers, serviceAccountName, podTolerations, ImagePullSecrets, nodeSelector, PriorityClassName, PodSecurityContext). Also make sure the attributes are supported by the K8s version running on the cluster - the operator does not validate that.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[index]
<sup><sup>[↩ Parent](#specservicesriggerspec)</sup></sup>

EnvVar represents an environment variable present in a Container. More info: https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Name of the environment variable.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsindexvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          Source for the environment variable's value. Cannot be used if value is not empty.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[index].valueFrom
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsindex)</sup></sup>

Source for the environment variable's value. Cannot be used if value is not empty.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecextraenvvarsindexvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          Selects a key of a ConfigMap.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsindexvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          Selects a field of the pod<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsindexvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          Selects a resource of the container: only resources limits and requests are currently supported.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsindexvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          Selects a key of a secret in the pod's namespace<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[index].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsindexvaluefrom)</sup></sup>

Selects a key of a ConfigMap.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          The key to select.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Name of the referent<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          Specify whether the ConfigMap or its key must be defined<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[index].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsindexvaluefrom)</sup></sup>

Selects a field of the pod

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          Path of the field to select in the specified API version.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          Version of the schema the FieldPath is written in terms of, defaults to "v1".<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[index].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsindexvaluefrom)</sup></sup>

Selects a resource of the container: only resources limits and requests are currently supported.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          Required: resource to select<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          Container name: required for volumes, optional for env vars<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          Specifies the output format of the exposed resources, defaults to "1"<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[index].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsindexvaluefrom)</sup></sup>

Selects a key of a secret in the pod's namespace

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          The key of the secret to select from.  Must be a valid secret key.<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          Name of the referent<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          Specify whether the Secret or its key must be defined<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes
<sup><sup>[↩ Parent](#specservicesriggerspec)</sup></sup>

ADVANCED USAGE USE AT YOUR OWN RISK - specify pod attributes that are required for the rigger deployment pod. Pod attributes managed by the operator might override these settings (Containers, serviceAccountName, podTolerations, ImagePullSecrets, nodeSelector, PriorityClassName, PodSecurityContext). Also make sure the attributes are supported by the K8s version running on the cluster - the operator does not validate that.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>activeDeadlineSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinity">affinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>automountServiceAccountToken</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesdnsconfig">dnsConfig</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>dnsPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>enableServiceLinks</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex">ephemeralContainers</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributeshostaliasesindex">hostAliases</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostIPC</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostNetwork</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostPID</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostUsers</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostname</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesimagepullsecretsindex">imagePullSecrets</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex">initContainers</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeSelector</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesos">os</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>overhead</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>preemptionPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>priority</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>priorityClassName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesreadinessgatesindex">readinessGates</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesresourceclaimsindex">resourceClaims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>restartPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runtimeClassName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>schedulerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesschedulinggatesindex">schedulingGates</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>serviceAccount</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>serviceAccountName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>setHostnameAsFQDN</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shareProcessNamespace</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subdomain</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestolerationsindex">tolerations</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintsindex">topologySpreadConstraints</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex">volumes</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinity">nodeAffinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinity">podAffinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinity">podAntiAffinity</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindex">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecution">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreference">preference</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>weight</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].preference
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreferencematchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreferencematchfieldsindex">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].preference.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreference)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].preference.matchFields[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionindexpreference)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindex">nodeSelectorTerms</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindexmatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindexmatchfieldsindex">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[index].matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[index].matchFields[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindex">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindex">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm">podAffinityTerm</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>weight</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindex">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindex">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm">podAffinityTerm</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>weight</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[index].podAffinityTerm.namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionindexpodaffinitytermnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinity)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector">namespaceSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespaces</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[index].namespaceSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionindexnamespaceselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.dnsConfig
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>nameservers</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesdnsconfigoptionsindex">options</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>searches</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.dnsConfig.options[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesdnsconfig)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>args</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindex">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvfromindex">envFrom</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexportsindex">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobe">startupProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdin</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdinOnce</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>targetContainerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tty</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexvolumedevicesindex">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexvolumemountsindex">volumeMounts</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>workingDir</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].env[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].env[index].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].envFrom[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvfromindexconfigmapref">configMapRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>prefix</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvfromindexsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].envFrom[index].configMapRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].envFrom[index].secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststarthttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststarthttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestophttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestophttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].ports[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>containerPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>hostIP</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protocol</td>
        <td>string</td>
        <td>
          <br/>
          <br/>
            <i>Default</i>: TCP<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].resources
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].resources.claims[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>allowPrivilegeEscalation</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontextcapabilities">capabilities</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>privileged</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>procMount</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnlyRootFilesystem</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsNonRoot</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUser</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.capabilities
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>add</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>drop</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>level</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>localhostProfile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gmsaCredentialSpec</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>gmsaCredentialSpecName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostProcess</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUserName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].volumeDevices[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>devicePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[index].volumeMounts[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>mountPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mountPropagation</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPathExpr</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.hostAliases[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>hostnames</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ip</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.imagePullSecrets[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>args</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindex">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvfromindex">envFrom</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexportsindex">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobe">startupProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdin</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdinOnce</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tty</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexvolumedevicesindex">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexvolumemountsindex">volumeMounts</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>workingDir</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].env[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].env[index].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].envFrom[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvfromindexconfigmapref">configMapRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>prefix</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvfromindexsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].envFrom[index].configMapRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].envFrom[index].secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststarthttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststarthttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestophttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestophttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].livenessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].livenessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].livenessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].livenessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].ports[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>containerPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>hostIP</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protocol</td>
        <td>string</td>
        <td>
          <br/>
          <br/>
            <i>Default</i>: TCP<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].readinessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].readinessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].readinessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].readinessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].resources
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].resources.claims[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].securityContext
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>allowPrivilegeEscalation</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontextcapabilities">capabilities</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>privileged</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>procMount</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnlyRootFilesystem</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsNonRoot</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUser</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].securityContext.capabilities
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>add</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>drop</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>level</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>localhostProfile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gmsaCredentialSpec</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>gmsaCredentialSpecName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostProcess</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUserName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].startupProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].startupProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].startupProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].startupProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].startupProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].volumeDevices[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>devicePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[index].volumeMounts[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>mountPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mountPropagation</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPathExpr</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.os
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.readinessGates[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>conditionType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.resourceClaims[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesresourceclaimsindexsource">source</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.resourceClaims[index].source
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesresourceclaimsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resourceClaimName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>resourceClaimTemplateName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.schedulingGates[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.securityContext
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsGroupChangePolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsNonRoot</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUser</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>supplementalGroups</td>
        <td>[]integer</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontextsysctlsindex">sysctls</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>level</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.securityContext.seccompProfile
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>localhostProfile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.securityContext.sysctls[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.securityContext.windowsOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gmsaCredentialSpec</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>gmsaCredentialSpecName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostProcess</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUserName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.tolerations[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>effect</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tolerationSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.topologySpreadConstraints[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>maxSkew</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>topologyKey</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>whenUnsatisfiable</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintsindexlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabelKeys</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>minDomains</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeAffinityPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nodeTaintsPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.topologySpreadConstraints[index].labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintsindexlabelselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.topologySpreadConstraints[index].labelSelector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintsindexlabelselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexawselasticblockstore">awsElasticBlockStore</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexazuredisk">azureDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexazurefile">azureFile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcephfs">cephfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcinder">cinder</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcsi">csi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexemptydir">emptyDir</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeral">ephemeral</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexfc">fc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexflexvolume">flexVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexflocker">flocker</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexgcepersistentdisk">gcePersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexgitrepo">gitRepo</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexglusterfs">glusterfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexhostpath">hostPath</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexiscsi">iscsi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexnfs">nfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexpersistentvolumeclaim">persistentVolumeClaim</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexphotonpersistentdisk">photonPersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexportworxvolume">portworxVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojected">projected</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexquobyte">quobyte</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexrbd">rbd</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexscaleio">scaleIO</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexsecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexstorageos">storageos</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexvspherevolume">vsphereVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].awsElasticBlockStore
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>partition</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].azureDisk
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>diskName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>diskURI</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>cachingMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>kind</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].azureFile
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>secretName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>shareName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].cephfs
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>monitors</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>secretFile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcephfssecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].cephfs.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcephfs)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].cinder
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcindersecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].cinder.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcinder)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].configMap
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexconfigmapitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].configMap.items[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexconfigmap)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].csi
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>driver</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcsinodepublishsecretref">nodePublishSecretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeAttributes</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].csi.nodePublishSecretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexcsi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].downwardAPI
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexdownwardapiitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].downwardAPI.items[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexdownwardapi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexdownwardapiitemsindexfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexdownwardapiitemsindexresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].downwardAPI.items[index].fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].downwardAPI.items[index].resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].emptyDir
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>medium</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>sizeLimit</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplate">volumeClaimTemplate</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeral)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec">spec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>metadata</td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplate)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>accessModes</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecdatasource">dataSource</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecdatasourceref">dataSourceRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecselector">selector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storageClassName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.dataSource
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>kind</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiGroup</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.dataSourceRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>kind</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiGroup</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>namespace</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.resources
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.resources.claims[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.selector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecselectormatchexpressionsindex">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>matchLabels</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].ephemeral.volumeClaimTemplate.spec.selector.matchExpressions[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexephemeralvolumeclaimtemplatespecselector)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>operator</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>values</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].fc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lun</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>targetWWNs</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>wwids</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].flexVolume
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>driver</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>options</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexflexvolumesecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].flexVolume.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexflexvolume)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].flocker
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>datasetName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>datasetUUID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].gcePersistentDisk
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>pdName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>partition</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].gitRepo
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>repository</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>directory</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>revision</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].glusterfs
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>endpoints</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].hostPath
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].iscsi
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>iqn</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>lun</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>targetPortal</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>chapAuthDiscovery</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>chapAuthSession</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initiatorName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>iscsiInterface</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>portals</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexiscsisecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].iscsi.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexiscsi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].nfs
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>server</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].persistentVolumeClaim
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>claimName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].photonPersistentDisk
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>pdID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].portworxVolume
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindex">sources</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojected)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexsecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexserviceaccounttoken">serviceAccountToken</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].configMap
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexconfigmapitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].configMap.items[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexconfigmap)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI.items[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindexfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindexresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI.items[index].fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].downwardAPI.items[index].resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].secret
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexsecretitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].secret.items[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindexsecret)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].projected.sources[index].serviceAccountToken
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>audience</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>expirationSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].quobyte
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>registry</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>volume</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>group</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tenant</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].rbd
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>monitors</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>keyring</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>pool</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexrbdsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].rbd.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexrbd)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].scaleIO
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gateway</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexscaleiosecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>system</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protectionDomain</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>sslEnabled</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storageMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePool</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].scaleIO.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexscaleio)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].secret
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexsecretitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>secretName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].secret.items[index]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexsecret)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].storageos
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexstorageossecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeNamespace</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].storageos.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindexstorageos)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[index].vsphereVolume
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePolicyID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePolicyName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index]
<sup><sup>[↩ Parent](#spec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>args</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexenvindex">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexenvfromindex">envFrom</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>imagePullPolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexportsindex">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexsecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexstartupprobe">startupProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdin</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>stdinOnce</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationMessagePolicy</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tty</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexvolumedevicesindex">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexvolumemountsindex">volumeMounts</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>workingDir</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].env[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexenvindexvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].env[index].valueFrom
<sup><sup>[↩ Parent](#specsidecontainersspecindexenvindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexenvindexvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexenvindexvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexenvindexvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexenvindexvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].env[index].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specsidecontainersspecindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].env[index].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specsidecontainersspecindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].env[index].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specsidecontainersspecindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].env[index].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specsidecontainersspecindexenvindexvaluefrom)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].envFrom[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexenvfromindexconfigmapref">configMapRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>prefix</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexenvfromindexsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].envFrom[index].configMapRef
<sup><sup>[↩ Parent](#specsidecontainersspecindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].envFrom[index].secretRef
<sup><sup>[↩ Parent](#specsidecontainersspecindexenvfromindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexlifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.postStart
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexlifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecyclepoststarthttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.postStart.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecyclepoststarthttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecyclepoststart)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.preStop
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexlifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlifecycleprestophttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.preStop.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecycleprestophttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspecindexlifecycleprestop)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].livenessProbe
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexlivenessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlivenessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlivenessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].livenessProbe.exec
<sup><sup>[↩ Parent](#specsidecontainersspecindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].livenessProbe.grpc
<sup><sup>[↩ Parent](#specsidecontainersspecindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspecindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexlivenessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].livenessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindexlivenessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspecindexlivenessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].ports[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>containerPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>hostIP</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostPort</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protocol</td>
        <td>string</td>
        <td>
          <br/>
          <br/>
            <i>Default</i>: TCP<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].readinessProbe
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexreadinessprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexreadinessprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexreadinessprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].readinessProbe.exec
<sup><sup>[↩ Parent](#specsidecontainersspecindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].readinessProbe.grpc
<sup><sup>[↩ Parent](#specsidecontainersspecindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspecindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexreadinessprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].readinessProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindexreadinessprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspecindexreadinessprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].resources
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexresourcesclaimsindex">claims</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].resources.claims[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindexresources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].securityContext
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>allowPrivilegeEscalation</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexsecuritycontextcapabilities">capabilities</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>privileged</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>procMount</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnlyRootFilesystem</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsGroup</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsNonRoot</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUser</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexsecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexsecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexsecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].securityContext.capabilities
<sup><sup>[↩ Parent](#specsidecontainersspecindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>add</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>drop</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specsidecontainersspecindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>level</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>role</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specsidecontainersspecindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>localhostProfile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specsidecontainersspecindexsecuritycontext)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gmsaCredentialSpec</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>gmsaCredentialSpecName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>hostProcess</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>runAsUserName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].startupProbe
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecindexstartupprobeexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>failureThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexstartupprobehttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initialDelaySeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>periodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>successThreshold</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexstartupprobetcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>terminationGracePeriodSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>timeoutSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].startupProbe.exec
<sup><sup>[↩ Parent](#specsidecontainersspecindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>command</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].startupProbe.grpc
<sup><sup>[↩ Parent](#specsidecontainersspecindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>service</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].startupProbe.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspecindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecindexstartupprobehttpgethttpheadersindex">httpHeaders</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>scheme</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].startupProbe.httpGet.httpHeaders[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindexstartupprobehttpget)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>value</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspecindexstartupprobe)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>port</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>host</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].volumeDevices[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>devicePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[index].volumeMounts[index]
<sup><sup>[↩ Parent](#specsidecontainersspecindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>mountPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mountPropagation</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>subPathExpr</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.slaveHA
<sup><sup>[↩ Parent](#spec)</sup></sup>

Slave high availability mechanism configuration.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>slaveHAGracePeriod</td>
        <td>integer</td>
        <td>
          Time in seconds between when a node fails, and when slave high availability mechanism starts relocating shards. If set to 0, will not affect cluster configuration.<br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.upgradeSpec
<sup><sup>[↩ Parent](#spec)</sup></sup>

Specification for upgrades of Redis Enterprise

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>autoUpgradeRedisEnterprise</td>
        <td>boolean</td>
        <td>
          Whether to upgrade Redis Enterprise automatically when operator is upgraded<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.volumes[index]
<sup><sup>[↩ Parent](#spec)</sup></sup>

Volume represents a named volume in a pod that may be accessed by any container in the pod. More info: https://kubernetes.io/docs/concepts/storage/volumes

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specvolumesindexawselasticblockstore">awsElasticBlockStore</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexazuredisk">azureDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexazurefile">azureFile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexcephfs">cephfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexcinder">cinder</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexcsi">csi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexemptydir">emptyDir</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexfc">fc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexflexvolume">flexVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexflocker">flocker</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexgcepersistentdisk">gcePersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexgitrepo">gitRepo</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexglusterfs">glusterfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexhostpath">hostPath</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexiscsi">iscsi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexnfs">nfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexpersistentvolumeclaim">persistentVolumeClaim</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexphotonpersistentdisk">photonPersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexportworxvolume">portworxVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexprojected">projected</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexquobyte">quobyte</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexrbd">rbd</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexscaleio">scaleIO</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexsecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexstorageos">storageos</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexvspherevolume">vsphereVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].awsElasticBlockStore
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>partition</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].azureDisk
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>diskName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>diskURI</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>cachingMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>kind</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].azureFile
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>secretName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>shareName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].cephfs
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>monitors</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>secretFile</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexcephfssecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].cephfs.secretRef
<sup><sup>[↩ Parent](#specvolumesindexcephfs)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].cinder
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexcindersecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].cinder.secretRef
<sup><sup>[↩ Parent](#specvolumesindexcinder)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].configMap
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexconfigmapitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].configMap.items[index]
<sup><sup>[↩ Parent](#specvolumesindexconfigmap)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].csi
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>driver</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexcsinodepublishsecretref">nodePublishSecretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeAttributes</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].csi.nodePublishSecretRef
<sup><sup>[↩ Parent](#specvolumesindexcsi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].downwardAPI
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexdownwardapiitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].downwardAPI.items[index]
<sup><sup>[↩ Parent](#specvolumesindexdownwardapi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specvolumesindexdownwardapiitemsindexfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexdownwardapiitemsindexresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].downwardAPI.items[index].fieldRef
<sup><sup>[↩ Parent](#specvolumesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].downwardAPI.items[index].resourceFieldRef
<sup><sup>[↩ Parent](#specvolumesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].emptyDir
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>medium</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>sizeLimit</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].fc
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>lun</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>targetWWNs</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>wwids</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].flexVolume
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>driver</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>options</td>
        <td>map[string]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexflexvolumesecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].flexVolume.secretRef
<sup><sup>[↩ Parent](#specvolumesindexflexvolume)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].flocker
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>datasetName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>datasetUUID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].gcePersistentDisk
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>pdName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>partition</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].gitRepo
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>repository</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>directory</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>revision</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].glusterfs
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>endpoints</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].hostPath
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>type</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].iscsi
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>iqn</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>lun</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>targetPortal</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>chapAuthDiscovery</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>chapAuthSession</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>initiatorName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>iscsiInterface</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>portals</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexiscsisecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].iscsi.secretRef
<sup><sup>[↩ Parent](#specvolumesindexiscsi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].nfs
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>server</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].persistentVolumeClaim
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>claimName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].photonPersistentDisk
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>pdID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].portworxVolume
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumeID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesindexprojectedsourcesindex">sources</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index]
<sup><sup>[↩ Parent](#specvolumesindexprojected)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexsecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexserviceaccounttoken">serviceAccountToken</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].configMap
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexconfigmapitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].configMap.items[index]
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindexconfigmap)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].downwardAPI
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexdownwardapiitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].downwardAPI.items[index]
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindexdownwardapi)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexdownwardapiitemsindexfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexdownwardapiitemsindexresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].downwardAPI.items[index].fieldRef
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fieldPath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>apiVersion</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].downwardAPI.items[index].resourceFieldRef
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindexdownwardapiitemsindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>resource</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>containerName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>divisor</td>
        <td>int or string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].secret
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesindexprojectedsourcesindexsecretitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].secret.items[index]
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindexsecret)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].projected.sources[index].serviceAccountToken
<sup><sup>[↩ Parent](#specvolumesindexprojectedsourcesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>audience</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>expirationSeconds</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].quobyte
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>registry</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>volume</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>group</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>tenant</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].rbd
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>image</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>monitors</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>keyring</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>pool</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexrbdsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>user</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].rbd.secretRef
<sup><sup>[↩ Parent](#specvolumesindexrbd)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].scaleIO
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>gateway</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td><a href="#specvolumesindexscaleiosecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>system</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>protectionDomain</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>sslEnabled</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storageMode</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePool</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].scaleIO.secretRef
<sup><sup>[↩ Parent](#specvolumesindexscaleio)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].secret
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>defaultMode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexsecretitemsindex">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>optional</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>secretName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].secret.items[index]
<sup><sup>[↩ Parent](#specvolumesindexsecret)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>key</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>path</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>mode</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].storageos
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>readOnly</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesindexstorageossecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>volumeNamespace</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].storageos.secretRef
<sup><sup>[↩ Parent](#specvolumesindexstorageos)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[index].vsphereVolume
<sup><sup>[↩ Parent](#specvolumesindex)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>volumePath</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>fsType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePolicyID</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>storagePolicyName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status
<sup><sup>[↩ Parent](#)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#statusbundleddatabaseversionsindex">bundledDatabaseVersions</a></td>
        <td>[]object</td>
        <td>
          Versions of open source databases bundled by Redis Enterprise Software - please note that in order to use a specific version it should be supported by the ‘upgradePolicy’ - ‘major’ or ‘latest’ according to the desired version (major/minor)<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ingressOrRouteMethodStatus</td>
        <td>string</td>
        <td>
          The ingressOrRouteSpec/ActiveActive spec method that exist<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statuslicensestatus">licenseStatus</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusmanagedapis">managedAPIs</a></td>
        <td>object</td>
        <td>
          Indicates cluster APIs that are being managed by the operator. This only applies to cluster APIs which are optionally-managed by the operator, such as cluster LDAP configuration. Most other APIs are automatically managed by the operator, and are not listed here.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusmodulesindex">modules</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statusocspstatus">ocspStatus</a></td>
        <td>object</td>
        <td>
          An API object that represents the cluster's OCSP status<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statuspersistencestatus">persistenceStatus</a></td>
        <td>object</td>
        <td>
          The status of the Persistent Volume Claims that are used for Redis Enterprise Cluster persistence. The status will correspond to the status of one or more of the PVCs (failed/resizing if one of them is in resize or failed to resize)<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>redisEnterpriseIPFamily</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>specStatus</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>state</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.bundledDatabaseVersions[index]
<sup><sup>[↩ Parent](#status)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>dbType</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>version</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr><tr>
        <td>major</td>
        <td>boolean</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.licenseStatus
<sup><sup>[↩ Parent](#status)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>activationDate</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>expirationDate</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>licenseState</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardsLimit</td>
        <td>integer</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.managedAPIs
<sup><sup>[↩ Parent](#status)</sup></sup>

Indicates cluster APIs that are being managed by the operator. This only applies to cluster APIs which are optionally-managed by the operator, such as cluster LDAP configuration. Most other APIs are automatically managed by the operator, and are not listed here.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>ldap</td>
        <td>boolean</td>
        <td>
          Indicate whether cluster LDAP configuration is managed by the operator. When this is enabled, the operator will reconcile the cluster LDAP configuration according to the '.spec.ldap' field in the RedisEnterpriseCluster resource.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.modules[index]
<sup><sup>[↩ Parent](#status)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>displayName</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>name</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>versions</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.ocspStatus
<sup><sup>[↩ Parent](#status)</sup></sup>

An API object that represents the cluster's OCSP status

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>certStatus</td>
        <td>string</td>
        <td>
          Indicates the proxy certificate status - GOOD/REVOKED/UNKNOWN.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>nextUpdate</td>
        <td>string</td>
        <td>
          The time at or before which newer information will be available about the status of the certificate (if available)<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>producedAt</td>
        <td>string</td>
        <td>
          The time at which the OCSP responder signed this response.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>responderUrl</td>
        <td>string</td>
        <td>
          The OCSP responder url from which this status came from.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>revocationTime</td>
        <td>string</td>
        <td>
          The time at which the certificate was revoked or placed on hold.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>thisUpdate</td>
        <td>string</td>
        <td>
          The most recent time at which the status being indicated is known by the responder to have been correct.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### status.persistenceStatus
<sup><sup>[↩ Parent](#status)</sup></sup>

The status of the Persistent Volume Claims that are used for Redis Enterprise Cluster persistence. The status will correspond to the status of one or more of the PVCs (failed/resizing if one of them is in resize or failed to resize)

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>status</td>
        <td>string</td>
        <td>
          The current status of the PVCs<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>succeeded</td>
        <td>string</td>
        <td>
          The number of PVCs that are provisioned with the expected size<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>
