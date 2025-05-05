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
        <td><a href="#specextraenvvars">extraEnvVars</a></td>
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
        <td><a href="#spechostaliases">hostAliases</a></td>
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
        <td><a href="#specpodstartingpolicy">podStartingPolicy</a></td>
        <td>object</td>
        <td>
          Mitigation setting for STS pods stuck in "ContainerCreating"<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodtolerations">podTolerations</a></td>
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
        <td><a href="#specpullsecrets">pullSecrets</a></td>
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
        <td><a href="#specredisenterprisevolumemounts">redisEnterpriseVolumeMounts</a></td>
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
        <td><a href="#specsecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          The security configuration that will be applied to RS pods.<br/>
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
        <td><a href="#specsidecontainersspec">sideContainersSpec</a></td>
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
        <td><a href="#specusagemeter">usageMeter</a></td>
        <td>object</td>
        <td>
          The configuration of the usage meter.<br/>
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
        <td><a href="#specvolumes">volumes</a></td>
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
        <td><a href="#specbootstrapperresourcesclaims">claims</a></td>
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


### spec.bootstrapperResources.claims[]
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


### spec.extraEnvVars[]
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
        <td><a href="#specextraenvvarsvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[].valueFrom
<sup><sup>[↩ Parent](#specextraenvvars)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specextraenvvarsvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specextraenvvarsvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.extraEnvVars[].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specextraenvvarsvaluefrom)</sup></sup>



<table>
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


### spec.extraEnvVars[].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specextraenvvarsvaluefrom)</sup></sup>



<table>
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


### spec.extraEnvVars[].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specextraenvvarsvaluefrom)</sup></sup>



<table>
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


### spec.extraEnvVars[].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specextraenvvarsvaluefrom)</sup></sup>



<table>
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


### spec.hostAliases[]
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
        <td><a href="#specldapservers">servers</a></td>
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
        <td>directoryTimeoutSeconds</td>
        <td>integer</td>
        <td>
          The connection timeout to the LDAP server when authenticating a user, in seconds<br/>
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


### spec.ldap.servers[]
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
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecution">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecution">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm">podAffinityTerm</a></td>
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


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecution)</sup></sup>



<table>
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
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector">namespaceSelector</a></td>
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


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector)</sup></sup>



<table>
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


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specpodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector)</sup></sup>



<table>
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


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector">namespaceSelector</a></td>
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


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselector)</sup></sup>



<table>
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


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specpodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specpodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector)</sup></sup>



<table>
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


### spec.podTolerations[]
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


### spec.pullSecrets[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainers">ephemeralContainers</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributeshostaliases">hostAliases</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesimagepullsecrets">imagePullSecrets</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainers">initContainers</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesreadinessgates">readinessGates</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesresourceclaims">resourceClaims</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesschedulinggates">schedulingGates</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributestolerations">tolerations</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributestopologyspreadconstraints">topologySpreadConstraints</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumes">volumes</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecution">preferredDuringSchedulingIgnoredDuringExecution</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreference">preference</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[].preference
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreferencematchexpressions">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreferencematchfields">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[].preference.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreference)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[].preference.matchFields[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreference)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectorterms">nodeSelectorTerms</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsmatchexpressions">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsmatchfields">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[].matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectorterms)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[].matchFields[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectorterms)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecution">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecution">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm">podAffinityTerm</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecution)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector">namespaceSelector</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector">namespaceSelector</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionlabelselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecution">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecution">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm">podAffinityTerm</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecution)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector">namespaceSelector</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector">namespaceSelector</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesdnsconfigoptions">options</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.dnsConfig.options[]
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenv">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvfrom">envFrom</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersports">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobe">startupProbe</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersvolumedevices">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersvolumemounts">volumeMounts</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].env[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersenv)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].envFrom[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvfromconfigmapref">configMapRef</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvfromsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].envFrom[].configMapRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvfrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].envFrom[].secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersenvfrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststart)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststarthttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststarthttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestop)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestophttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestophttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobeexec">exec</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobehttpget">httpGet</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobetcpsocket">tcpSocket</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobehttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].ports[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobeexec">exec</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobehttpget">httpGet</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobetcpsocket">tcpSocket</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobehttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].resources
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersresourcesclaims">claims</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].resources.claims[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersresources)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].securityContext
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontextcapabilities">capabilities</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.capabilities
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobeexec">exec</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobehttpget">httpGet</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobetcpsocket">tcpSocket</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobehttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].volumeDevices[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.ephemeralContainers[].volumeMounts[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.hostAliases[]
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.imagePullSecrets[]
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenv">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvfrom">envFrom</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersports">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobe">startupProbe</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersvolumedevices">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersvolumemounts">volumeMounts</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].env[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].env[].valueFrom
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersenv)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].envFrom[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvfromconfigmapref">configMapRef</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersenvfromsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].envFrom[].configMapRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersenvfrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].envFrom[].secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersenvfrom)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststart)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststarthttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststarthttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestop)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestophttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestophttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].livenessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobeexec">exec</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobehttpget">httpGet</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobetcpsocket">tcpSocket</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].livenessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].livenessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].livenessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobehttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].ports[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].readinessProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobeexec">exec</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobehttpget">httpGet</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobetcpsocket">tcpSocket</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].readinessProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].readinessProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].readinessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobehttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].resources
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersresourcesclaims">claims</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].resources.claims[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersresources)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].securityContext
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontextcapabilities">capabilities</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].securityContext.capabilities
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].startupProbe
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobeexec">exec</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobehttpget">httpGet</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobetcpsocket">tcpSocket</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].startupProbe.exec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].startupProbe.grpc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].startupProbe.httpGet
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].startupProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobehttpget)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].volumeDevices[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.initContainers[].volumeMounts[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.readinessGates[]
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.resourceClaims[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesresourceclaimssource">source</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.resourceClaims[].source
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesresourceclaims)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.schedulingGates[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributessecuritycontextsysctls">sysctls</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.securityContext.sysctls[]
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.tolerations[]
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.topologySpreadConstraints[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintslabelselector">labelSelector</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.topologySpreadConstraints[].labelSelector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributestopologyspreadconstraints)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintslabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.topologySpreadConstraints[].labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributestopologyspreadconstraintslabelselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[]
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesawselasticblockstore">awsElasticBlockStore</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesazuredisk">azureDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesazurefile">azureFile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumescephfs">cephfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumescinder">cinder</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumescsi">csi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesemptydir">emptyDir</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeral">ephemeral</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesfc">fc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesflexvolume">flexVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesflocker">flocker</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesgcepersistentdisk">gcePersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesgitrepo">gitRepo</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesglusterfs">glusterfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumeshostpath">hostPath</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesiscsi">iscsi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesnfs">nfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumespersistentvolumeclaim">persistentVolumeClaim</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesphotonpersistentdisk">photonPersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesportworxvolume">portworxVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojected">projected</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesquobyte">quobyte</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesrbd">rbd</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesscaleio">scaleIO</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumessecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesstorageos">storageos</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesvspherevolume">vsphereVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].awsElasticBlockStore
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].azureDisk
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].azureFile
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].cephfs
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumescephfssecretref">secretRef</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].cephfs.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumescephfs)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].cinder
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumescindersecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].cinder.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumescinder)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].configMap
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesconfigmapitems">items</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].configMap.items[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesconfigmap)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].csi
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumescsinodepublishsecretref">nodePublishSecretRef</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].csi.nodePublishSecretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumescsi)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].downwardAPI
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesdownwardapiitems">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].downwardAPI.items[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesdownwardapi)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesdownwardapiitemsfieldref">fieldRef</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesdownwardapiitemsresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].downwardAPI.items[].fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesdownwardapiitems)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].downwardAPI.items[].resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesdownwardapiitems)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].emptyDir
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplate">volumeClaimTemplate</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeral)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec">spec</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplate)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecdatasource">dataSource</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecdatasourceref">dataSourceRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecselector">selector</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.dataSource
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.dataSourceRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.resources
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecresourcesclaims">claims</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.resources.claims[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecresources)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.selector
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecselectormatchexpressions">matchExpressions</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.selector.matchExpressions[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecselector)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].fc
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].flexVolume
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesflexvolumesecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].flexVolume.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesflexvolume)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].flocker
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].gcePersistentDisk
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].gitRepo
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].glusterfs
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].hostPath
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].iscsi
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesiscsisecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].iscsi.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesiscsi)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].nfs
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].persistentVolumeClaim
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].photonPersistentDisk
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].portworxVolume
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsources">sources</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojected)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcessecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesserviceaccounttoken">serviceAccountToken</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].configMap
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesconfigmapitems">items</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].configMap.items[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesconfigmap)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesdownwardapiitems">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI.items[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesdownwardapi)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesdownwardapiitemsfieldref">fieldRef</a></td>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesdownwardapiitemsresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI.items[].fieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesdownwardapiitems)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI.items[].resourceFieldRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcesdownwardapiitems)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].secret
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcessecretitems">items</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].secret.items[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsourcessecret)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].projected.sources[].serviceAccountToken
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].quobyte
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].rbd
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesrbdsecretref">secretRef</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].rbd.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesrbd)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].scaleIO
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesscaleiosecretref">secretRef</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].scaleIO.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesscaleio)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].secret
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumessecretitems">items</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].secret.items[]
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumessecret)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].storageos
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterpriseadditionalpodspecattributesvolumesstorageossecretref">secretRef</a></td>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].storageos.secretRef
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumesstorageos)</sup></sup>



<table>
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


### spec.redisEnterpriseAdditionalPodSpecAttributes.volumes[].vsphereVolume
<sup><sup>[↩ Parent](#specredisenterpriseadditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specredisenterprisenoderesourcesclaims">claims</a></td>
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


### spec.redisEnterpriseNodeResources.claims[]
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
          Deprecated: The PDNS Server is now disabled by the operator. This field will be ignored.<br/>
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
        <td><a href="#specredisenterpriseservicesriggerresourcesclaims">claims</a></td>
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


### spec.redisEnterpriseServicesRiggerResources.claims[]
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


### spec.redisEnterpriseVolumeMounts[]
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


### spec.securityContext
<sup><sup>[↩ Parent](#spec)</sup></sup>

The security configuration that will be applied to RS pods.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsecuritycontextreadonlyrootfilesystempolicy">readOnlyRootFilesystemPolicy</a></td>
        <td>object</td>
        <td>
          Policy controlling whether to enable read-only root filesystem for the Redis Enterprise software containers. Note that certain filesystem paths remain writable through mounted volumes to ensure proper functionality.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsecuritycontextresourcelimits">resourceLimits</a></td>
        <td>object</td>
        <td>
          Settings pertaining to resource limits management by the Redis Enterprise Node container.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.securityContext.readOnlyRootFilesystemPolicy
<sup><sup>[↩ Parent](#specsecuritycontext)</sup></sup>

Policy controlling whether to enable read-only root filesystem for the Redis Enterprise software containers. Note that certain filesystem paths remain writable through mounted volumes to ensure proper functionality.

<table>
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
          Whether to enable read-only root filesystem for the Redis Enterprise software containers. Default is false.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.securityContext.resourceLimits
<sup><sup>[↩ Parent](#specsecuritycontext)</sup></sup>

Settings pertaining to resource limits management by the Redis Enterprise Node container.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>allowAutoAdjustment</td>
        <td>boolean</td>
        <td>
          Allow Redis Enterprise to adjust resource limits, like max open file descriptors, of its data plane processes. When this option is enabled, the SYS_RESOURCE capability is added to the Redis Enterprise pods, and their allowPrivilegeEscalation field is set. Turned off by default.<br/>
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
        <td>databaseServicePortPolicy</td>
        <td>enum</td>
        <td>
          databaseServicePortPolicy instructs how to determine the service ports for REDB services. Defaults to DatabasePortForward, if not specified otherwise. DatabasePortForward - The service port will be the same as the database port. RedisDefaultPort - The service port will be the default Redis port (6379).<br/>
          <br/>
            <i>Enum</i>: DatabasePortForward, RedisDefaultPort<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>databaseServiceType</td>
        <td>string</td>
        <td>
          Service types for access to databases. should be a comma separated list. The possible values are cluster_ip, headless and load_balancer.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvars">extraEnvVars</a></td>
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


### spec.servicesRiggerSpec.extraEnvVars[]
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
        <td><a href="#specservicesriggerspecextraenvvarsvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          Source for the environment variable's value. Cannot be used if value is not empty.<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[].valueFrom
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvars)</sup></sup>

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
        <td><a href="#specservicesriggerspecextraenvvarsvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          Selects a key of a ConfigMap.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          Selects a field of the pod<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          Selects a resource of the container: only resources limits and requests are currently supported.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecextraenvvarsvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          Selects a key of a secret in the pod's namespace<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.extraEnvVars[].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsvaluefrom)</sup></sup>

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


### spec.servicesRiggerSpec.extraEnvVars[].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsvaluefrom)</sup></sup>

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


### spec.servicesRiggerSpec.extraEnvVars[].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsvaluefrom)</sup></sup>

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


### spec.servicesRiggerSpec.extraEnvVars[].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecextraenvvarsvaluefrom)</sup></sup>

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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers">ephemeralContainers</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributeshostaliases">hostAliases</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesimagepullsecrets">imagePullSecrets</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers">initContainers</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesreadinessgates">readinessGates</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesresourceclaims">resourceClaims</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesschedulinggates">schedulingGates</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestolerations">tolerations</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraints">topologySpreadConstraints</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes">volumes</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecution">preferredDuringSchedulingIgnoredDuringExecution</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreference">preference</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[].preference
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreferencematchexpressions">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreferencematchfields">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[].preference.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreference)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.preferredDuringSchedulingIgnoredDuringExecution[].preference.matchFields[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinitypreferredduringschedulingignoredduringexecutionpreference)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectorterms">nodeSelectorTerms</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsmatchexpressions">matchExpressions</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectortermsmatchfields">matchFields</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[].matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectorterms)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms[].matchFields[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitynodeaffinityrequiredduringschedulingignoredduringexecutionnodeselectorterms)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecution">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecution">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm">podAffinityTerm</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecution)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector">namespaceSelector</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector">namespaceSelector</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionlabelselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecution">preferredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecution">requiredDuringSchedulingIgnoredDuringExecution</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm">podAffinityTerm</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecution)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector">namespaceSelector</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermlabelselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinityterm)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.preferredDuringSchedulingIgnoredDuringExecution[].podAffinityTerm.namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinitypreferredduringschedulingignoredduringexecutionpodaffinitytermnamespaceselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselector">labelSelector</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector">namespaceSelector</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionlabelselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecution)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.affinity.podAntiAffinity.requiredDuringSchedulingIgnoredDuringExecution[].namespaceSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesaffinitypodantiaffinityrequiredduringschedulingignoredduringexecutionnamespaceselector)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesdnsconfigoptions">options</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.dnsConfig.options[]
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenv">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvfrom">envFrom</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersports">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobe">startupProbe</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersvolumedevices">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersvolumemounts">volumeMounts</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].env[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenv)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].env[].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].envFrom[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvfromconfigmapref">configMapRef</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvfromsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].envFrom[].configMapRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvfrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].envFrom[].secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersenvfrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststart)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststarthttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststarthttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestop)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestophttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestophttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobeexec">exec</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobehttpget">httpGet</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobetcpsocket">tcpSocket</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobehttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].ports[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobeexec">exec</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobehttpget">httpGet</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobetcpsocket">tcpSocket</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobehttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].resources
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersresourcesclaims">claims</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].resources.claims[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersresources)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].securityContext
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontextcapabilities">capabilities</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.capabilities
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobeexec">exec</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobehttpget">httpGet</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobetcpsocket">tcpSocket</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobehttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainersstartupprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].volumeDevices[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.ephemeralContainers[].volumeMounts[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesephemeralcontainers)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.hostAliases[]
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.imagePullSecrets[]
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenv">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvfrom">envFrom</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersports">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobe">startupProbe</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersvolumedevices">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersvolumemounts">volumeMounts</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].env[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].env[].valueFrom
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenv)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].env[].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvvaluefrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].envFrom[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvfromconfigmapref">configMapRef</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvfromsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].envFrom[].configMapRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvfrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].envFrom[].secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersenvfrom)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststart)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststarthttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststarthttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecyclepoststart)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestop)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestophttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestophttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslifecycleprestop)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].livenessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobeexec">exec</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobehttpget">httpGet</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobetcpsocket">tcpSocket</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].livenessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].livenessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].livenessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobehttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerslivenessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].ports[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].readinessProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobeexec">exec</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobehttpget">httpGet</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobetcpsocket">tcpSocket</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].readinessProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].readinessProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].readinessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobehttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersreadinessprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].resources
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersresourcesclaims">claims</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].resources.claims[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersresources)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].securityContext
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontextcapabilities">capabilities</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].securityContext.capabilities
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainerssecuritycontext)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].startupProbe
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobeexec">exec</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobehttpget">httpGet</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobetcpsocket">tcpSocket</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].startupProbe.exec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].startupProbe.grpc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].startupProbe.httpGet
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].startupProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobehttpget)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainersstartupprobe)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].volumeDevices[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.initContainers[].volumeMounts[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesinitcontainers)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.readinessGates[]
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.resourceClaims[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesresourceclaimssource">source</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.resourceClaims[].source
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesresourceclaims)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.schedulingGates[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributessecuritycontextsysctls">sysctls</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.securityContext.sysctls[]
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.tolerations[]
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.topologySpreadConstraints[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintslabelselector">labelSelector</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.topologySpreadConstraints[].labelSelector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraints)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintslabelselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.topologySpreadConstraints[].labelSelector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributestopologyspreadconstraintslabelselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[]
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesawselasticblockstore">awsElasticBlockStore</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesazuredisk">azureDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesazurefile">azureFile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescephfs">cephfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescinder">cinder</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescsi">csi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesemptydir">emptyDir</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeral">ephemeral</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesfc">fc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesflexvolume">flexVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesflocker">flocker</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesgcepersistentdisk">gcePersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesgitrepo">gitRepo</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesglusterfs">glusterfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumeshostpath">hostPath</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesiscsi">iscsi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesnfs">nfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumespersistentvolumeclaim">persistentVolumeClaim</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesphotonpersistentdisk">photonPersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesportworxvolume">portworxVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojected">projected</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesquobyte">quobyte</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesrbd">rbd</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesscaleio">scaleIO</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumessecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesstorageos">storageos</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesvspherevolume">vsphereVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].awsElasticBlockStore
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].azureDisk
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].azureFile
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].cephfs
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescephfssecretref">secretRef</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].cephfs.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescephfs)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].cinder
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescindersecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].cinder.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescinder)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].configMap
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesconfigmapitems">items</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].configMap.items[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesconfigmap)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].csi
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescsinodepublishsecretref">nodePublishSecretRef</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].csi.nodePublishSecretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumescsi)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].downwardAPI
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesdownwardapiitems">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].downwardAPI.items[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesdownwardapi)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesdownwardapiitemsfieldref">fieldRef</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesdownwardapiitemsresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].downwardAPI.items[].fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesdownwardapiitems)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].downwardAPI.items[].resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesdownwardapiitems)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].emptyDir
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplate">volumeClaimTemplate</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeral)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec">spec</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplate)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecdatasource">dataSource</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecdatasourceref">dataSourceRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecselector">selector</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.dataSource
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.dataSourceRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.resources
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecresourcesclaims">claims</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.resources.claims[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecresources)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.selector
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecselectormatchexpressions">matchExpressions</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].ephemeral.volumeClaimTemplate.spec.selector.matchExpressions[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesephemeralvolumeclaimtemplatespecselector)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].fc
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].flexVolume
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesflexvolumesecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].flexVolume.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesflexvolume)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].flocker
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].gcePersistentDisk
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].gitRepo
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].glusterfs
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].hostPath
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].iscsi
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesiscsisecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].iscsi.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesiscsi)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].nfs
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].persistentVolumeClaim
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].photonPersistentDisk
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].portworxVolume
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsources">sources</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojected)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcessecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesserviceaccounttoken">serviceAccountToken</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].configMap
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesconfigmapitems">items</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].configMap.items[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesconfigmap)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesdownwardapiitems">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI.items[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesdownwardapi)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesdownwardapiitemsfieldref">fieldRef</a></td>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesdownwardapiitemsresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI.items[].fieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesdownwardapiitems)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].downwardAPI.items[].resourceFieldRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcesdownwardapiitems)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].secret
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcessecretitems">items</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].secret.items[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsourcessecret)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].projected.sources[].serviceAccountToken
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesprojectedsources)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].quobyte
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].rbd
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesrbdsecretref">secretRef</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].rbd.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesrbd)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].scaleIO
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesscaleiosecretref">secretRef</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].scaleIO.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesscaleio)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].secret
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumessecretitems">items</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].secret.items[]
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumessecret)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].storageos
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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
        <td><a href="#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesstorageossecretref">secretRef</a></td>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].storageos.secretRef
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumesstorageos)</sup></sup>



<table>
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


### spec.servicesRiggerSpec.servicesRiggerAdditionalPodSpecAttributes.volumes[].vsphereVolume
<sup><sup>[↩ Parent](#specservicesriggerspecservicesriggeradditionalpodspecattributesvolumes)</sup></sup>



<table>
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


### spec.sideContainersSpec[]
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
        <td><a href="#specsidecontainersspecenv">env</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecenvfrom">envFrom</a></td>
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
        <td><a href="#specsidecontainersspeclifecycle">lifecycle</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspeclivenessprobe">livenessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecports">ports</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecreadinessprobe">readinessProbe</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecresources">resources</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecsecuritycontext">securityContext</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecstartupprobe">startupProbe</a></td>
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
        <td><a href="#specsidecontainersspecvolumedevices">volumeDevices</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecvolumemounts">volumeMounts</a></td>
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


### spec.sideContainersSpec[].env[]
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
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
        <td><a href="#specsidecontainersspecenvvaluefrom">valueFrom</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[].env[].valueFrom
<sup><sup>[↩ Parent](#specsidecontainersspecenv)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecenvvaluefromconfigmapkeyref">configMapKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecenvvaluefromfieldref">fieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecenvvaluefromresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecenvvaluefromsecretkeyref">secretKeyRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[].env[].valueFrom.configMapKeyRef
<sup><sup>[↩ Parent](#specsidecontainersspecenvvaluefrom)</sup></sup>



<table>
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


### spec.sideContainersSpec[].env[].valueFrom.fieldRef
<sup><sup>[↩ Parent](#specsidecontainersspecenvvaluefrom)</sup></sup>



<table>
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


### spec.sideContainersSpec[].env[].valueFrom.resourceFieldRef
<sup><sup>[↩ Parent](#specsidecontainersspecenvvaluefrom)</sup></sup>



<table>
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


### spec.sideContainersSpec[].env[].valueFrom.secretKeyRef
<sup><sup>[↩ Parent](#specsidecontainersspecenvvaluefrom)</sup></sup>



<table>
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


### spec.sideContainersSpec[].envFrom[]
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecenvfromconfigmapref">configMapRef</a></td>
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
        <td><a href="#specsidecontainersspecenvfromsecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[].envFrom[].configMapRef
<sup><sup>[↩ Parent](#specsidecontainersspecenvfrom)</sup></sup>



<table>
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


### spec.sideContainersSpec[].envFrom[].secretRef
<sup><sup>[↩ Parent](#specsidecontainersspecenvfrom)</sup></sup>



<table>
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


### spec.sideContainersSpec[].lifecycle
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspeclifecyclepoststart">postStart</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspeclifecycleprestop">preStop</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[].lifecycle.postStart
<sup><sup>[↩ Parent](#specsidecontainersspeclifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspeclifecyclepoststartexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspeclifecyclepoststarthttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspeclifecyclepoststarttcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[].lifecycle.postStart.exec
<sup><sup>[↩ Parent](#specsidecontainersspeclifecyclepoststart)</sup></sup>



<table>
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


### spec.sideContainersSpec[].lifecycle.postStart.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspeclifecyclepoststart)</sup></sup>



<table>
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
        <td><a href="#specsidecontainersspeclifecyclepoststarthttpgethttpheaders">httpHeaders</a></td>
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


### spec.sideContainersSpec[].lifecycle.postStart.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specsidecontainersspeclifecyclepoststarthttpget)</sup></sup>



<table>
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


### spec.sideContainersSpec[].lifecycle.postStart.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspeclifecyclepoststart)</sup></sup>



<table>
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


### spec.sideContainersSpec[].lifecycle.preStop
<sup><sup>[↩ Parent](#specsidecontainersspeclifecycle)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspeclifecycleprestopexec">exec</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspeclifecycleprestophttpget">httpGet</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspeclifecycleprestoptcpsocket">tcpSocket</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[].lifecycle.preStop.exec
<sup><sup>[↩ Parent](#specsidecontainersspeclifecycleprestop)</sup></sup>



<table>
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


### spec.sideContainersSpec[].lifecycle.preStop.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspeclifecycleprestop)</sup></sup>



<table>
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
        <td><a href="#specsidecontainersspeclifecycleprestophttpgethttpheaders">httpHeaders</a></td>
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


### spec.sideContainersSpec[].lifecycle.preStop.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specsidecontainersspeclifecycleprestophttpget)</sup></sup>



<table>
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


### spec.sideContainersSpec[].lifecycle.preStop.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspeclifecycleprestop)</sup></sup>



<table>
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


### spec.sideContainersSpec[].livenessProbe
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspeclivenessprobeexec">exec</a></td>
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
        <td><a href="#specsidecontainersspeclivenessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspeclivenessprobehttpget">httpGet</a></td>
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
        <td><a href="#specsidecontainersspeclivenessprobetcpsocket">tcpSocket</a></td>
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


### spec.sideContainersSpec[].livenessProbe.exec
<sup><sup>[↩ Parent](#specsidecontainersspeclivenessprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].livenessProbe.grpc
<sup><sup>[↩ Parent](#specsidecontainersspeclivenessprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].livenessProbe.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspeclivenessprobe)</sup></sup>



<table>
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
        <td><a href="#specsidecontainersspeclivenessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.sideContainersSpec[].livenessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specsidecontainersspeclivenessprobehttpget)</sup></sup>



<table>
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


### spec.sideContainersSpec[].livenessProbe.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspeclivenessprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].ports[]
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
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


### spec.sideContainersSpec[].readinessProbe
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecreadinessprobeexec">exec</a></td>
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
        <td><a href="#specsidecontainersspecreadinessprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecreadinessprobehttpget">httpGet</a></td>
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
        <td><a href="#specsidecontainersspecreadinessprobetcpsocket">tcpSocket</a></td>
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


### spec.sideContainersSpec[].readinessProbe.exec
<sup><sup>[↩ Parent](#specsidecontainersspecreadinessprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].readinessProbe.grpc
<sup><sup>[↩ Parent](#specsidecontainersspecreadinessprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].readinessProbe.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspecreadinessprobe)</sup></sup>



<table>
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
        <td><a href="#specsidecontainersspecreadinessprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.sideContainersSpec[].readinessProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specsidecontainersspecreadinessprobehttpget)</sup></sup>



<table>
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


### spec.sideContainersSpec[].readinessProbe.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspecreadinessprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].resources
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecresourcesclaims">claims</a></td>
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


### spec.sideContainersSpec[].resources.claims[]
<sup><sup>[↩ Parent](#specsidecontainersspecresources)</sup></sup>



<table>
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


### spec.sideContainersSpec[].securityContext
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
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
        <td><a href="#specsidecontainersspecsecuritycontextcapabilities">capabilities</a></td>
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
        <td><a href="#specsidecontainersspecsecuritycontextselinuxoptions">seLinuxOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecsecuritycontextseccompprofile">seccompProfile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecsecuritycontextwindowsoptions">windowsOptions</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.sideContainersSpec[].securityContext.capabilities
<sup><sup>[↩ Parent](#specsidecontainersspecsecuritycontext)</sup></sup>



<table>
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


### spec.sideContainersSpec[].securityContext.seLinuxOptions
<sup><sup>[↩ Parent](#specsidecontainersspecsecuritycontext)</sup></sup>



<table>
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


### spec.sideContainersSpec[].securityContext.seccompProfile
<sup><sup>[↩ Parent](#specsidecontainersspecsecuritycontext)</sup></sup>



<table>
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


### spec.sideContainersSpec[].securityContext.windowsOptions
<sup><sup>[↩ Parent](#specsidecontainersspecsecuritycontext)</sup></sup>



<table>
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


### spec.sideContainersSpec[].startupProbe
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specsidecontainersspecstartupprobeexec">exec</a></td>
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
        <td><a href="#specsidecontainersspecstartupprobegrpc">grpc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specsidecontainersspecstartupprobehttpget">httpGet</a></td>
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
        <td><a href="#specsidecontainersspecstartupprobetcpsocket">tcpSocket</a></td>
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


### spec.sideContainersSpec[].startupProbe.exec
<sup><sup>[↩ Parent](#specsidecontainersspecstartupprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].startupProbe.grpc
<sup><sup>[↩ Parent](#specsidecontainersspecstartupprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].startupProbe.httpGet
<sup><sup>[↩ Parent](#specsidecontainersspecstartupprobe)</sup></sup>



<table>
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
        <td><a href="#specsidecontainersspecstartupprobehttpgethttpheaders">httpHeaders</a></td>
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


### spec.sideContainersSpec[].startupProbe.httpGet.httpHeaders[]
<sup><sup>[↩ Parent](#specsidecontainersspecstartupprobehttpget)</sup></sup>



<table>
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


### spec.sideContainersSpec[].startupProbe.tcpSocket
<sup><sup>[↩ Parent](#specsidecontainersspecstartupprobe)</sup></sup>



<table>
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


### spec.sideContainersSpec[].volumeDevices[]
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
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


### spec.sideContainersSpec[].volumeMounts[]
<sup><sup>[↩ Parent](#specsidecontainersspec)</sup></sup>



<table>
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


### spec.usageMeter
<sup><sup>[↩ Parent](#spec)</sup></sup>

The configuration of the usage meter.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specusagemetercallhomeclient">callHomeClient</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.usageMeter.callHomeClient
<sup><sup>[↩ Parent](#specusagemeter)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>disabled</td>
        <td>boolean</td>
        <td>
          Whether to disable the call home client. Enabled by default.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specusagemetercallhomeclientimagespec">imageSpec</a></td>
        <td>object</td>
        <td>
          Image specification<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specusagemetercallhomeclientresources">resources</a></td>
        <td>object</td>
        <td>
          Compute resource requirements for Call Home Client pod<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.usageMeter.callHomeClient.imageSpec
<sup><sup>[↩ Parent](#specusagemetercallhomeclient)</sup></sup>

Image specification

<table>
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


### spec.usageMeter.callHomeClient.resources
<sup><sup>[↩ Parent](#specusagemetercallhomeclient)</sup></sup>

Compute resource requirements for Call Home Client pod

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specusagemetercallhomeclientresourcesclaims">claims</a></td>
        <td>[]object</td>
        <td>
          Claims lists the names of resources, defined in spec.resourceClaims, that are used by this container. 
 This is an alpha field and requires enabling the DynamicResourceAllocation feature gate. 
 This field is immutable. It can only be set for containers.<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>limits</td>
        <td>map[string]int or string</td>
        <td>
          Limits describes the maximum amount of compute resources allowed. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>requests</td>
        <td>map[string]int or string</td>
        <td>
          Requests describes the minimum amount of compute resources required. If Requests is omitted for a container, it defaults to Limits if that is explicitly specified, otherwise to an implementation-defined value. Requests cannot exceed Limits. More info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/<br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.usageMeter.callHomeClient.resources.claims[]
<sup><sup>[↩ Parent](#specusagemetercallhomeclientresources)</sup></sup>

ResourceClaim references one entry in PodSpec.ResourceClaims.

<table>
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
          Name must match the name of one entry in pod.spec.resourceClaims of the Pod where this field is used. It makes that resource available inside a container.<br/>
        </td>
        <td>true</td>
      </tr></tbody>
</table>


### spec.volumes[]
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
        <td><a href="#specvolumesawselasticblockstore">awsElasticBlockStore</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesazuredisk">azureDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesazurefile">azureFile</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumescephfs">cephfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumescinder">cinder</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumescsi">csi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesemptydir">emptyDir</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesfc">fc</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesflexvolume">flexVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesflocker">flocker</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesgcepersistentdisk">gcePersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesgitrepo">gitRepo</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesglusterfs">glusterfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumeshostpath">hostPath</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesiscsi">iscsi</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesnfs">nfs</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumespersistentvolumeclaim">persistentVolumeClaim</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesphotonpersistentdisk">photonPersistentDisk</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesportworxvolume">portworxVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesprojected">projected</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesquobyte">quobyte</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesrbd">rbd</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesscaleio">scaleIO</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumessecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesstorageos">storageos</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesvspherevolume">vsphereVolume</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].awsElasticBlockStore
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].azureDisk
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].azureFile
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].cephfs
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumescephfssecretref">secretRef</a></td>
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


### spec.volumes[].cephfs.secretRef
<sup><sup>[↩ Parent](#specvolumescephfs)</sup></sup>



<table>
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


### spec.volumes[].cinder
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumescindersecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].cinder.secretRef
<sup><sup>[↩ Parent](#specvolumescinder)</sup></sup>



<table>
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


### spec.volumes[].configMap
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumesconfigmapitems">items</a></td>
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


### spec.volumes[].configMap.items[]
<sup><sup>[↩ Parent](#specvolumesconfigmap)</sup></sup>



<table>
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


### spec.volumes[].csi
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumescsinodepublishsecretref">nodePublishSecretRef</a></td>
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


### spec.volumes[].csi.nodePublishSecretRef
<sup><sup>[↩ Parent](#specvolumescsi)</sup></sup>



<table>
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


### spec.volumes[].downwardAPI
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumesdownwardapiitems">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].downwardAPI.items[]
<sup><sup>[↩ Parent](#specvolumesdownwardapi)</sup></sup>



<table>
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
        <td><a href="#specvolumesdownwardapiitemsfieldref">fieldRef</a></td>
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
        <td><a href="#specvolumesdownwardapiitemsresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].downwardAPI.items[].fieldRef
<sup><sup>[↩ Parent](#specvolumesdownwardapiitems)</sup></sup>



<table>
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


### spec.volumes[].downwardAPI.items[].resourceFieldRef
<sup><sup>[↩ Parent](#specvolumesdownwardapiitems)</sup></sup>



<table>
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


### spec.volumes[].emptyDir
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].fc
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].flexVolume
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumesflexvolumesecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].flexVolume.secretRef
<sup><sup>[↩ Parent](#specvolumesflexvolume)</sup></sup>



<table>
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


### spec.volumes[].flocker
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].gcePersistentDisk
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].gitRepo
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].glusterfs
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].hostPath
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].iscsi
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumesiscsisecretref">secretRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].iscsi.secretRef
<sup><sup>[↩ Parent](#specvolumesiscsi)</sup></sup>



<table>
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


### spec.volumes[].nfs
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].persistentVolumeClaim
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].photonPersistentDisk
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].portworxVolume
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].projected
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesprojectedsources">sources</a></td>
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


### spec.volumes[].projected.sources[]
<sup><sup>[↩ Parent](#specvolumesprojected)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesprojectedsourcesconfigmap">configMap</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesprojectedsourcesdownwardapi">downwardAPI</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesprojectedsourcessecret">secret</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#specvolumesprojectedsourcesserviceaccounttoken">serviceAccountToken</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].projected.sources[].configMap
<sup><sup>[↩ Parent](#specvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesprojectedsourcesconfigmapitems">items</a></td>
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


### spec.volumes[].projected.sources[].configMap.items[]
<sup><sup>[↩ Parent](#specvolumesprojectedsourcesconfigmap)</sup></sup>



<table>
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


### spec.volumes[].projected.sources[].downwardAPI
<sup><sup>[↩ Parent](#specvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesprojectedsourcesdownwardapiitems">items</a></td>
        <td>[]object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].projected.sources[].downwardAPI.items[]
<sup><sup>[↩ Parent](#specvolumesprojectedsourcesdownwardapi)</sup></sup>



<table>
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
        <td><a href="#specvolumesprojectedsourcesdownwardapiitemsfieldref">fieldRef</a></td>
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
        <td><a href="#specvolumesprojectedsourcesdownwardapiitemsresourcefieldref">resourceFieldRef</a></td>
        <td>object</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr></tbody>
</table>


### spec.volumes[].projected.sources[].downwardAPI.items[].fieldRef
<sup><sup>[↩ Parent](#specvolumesprojectedsourcesdownwardapiitems)</sup></sup>



<table>
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


### spec.volumes[].projected.sources[].downwardAPI.items[].resourceFieldRef
<sup><sup>[↩ Parent](#specvolumesprojectedsourcesdownwardapiitems)</sup></sup>



<table>
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


### spec.volumes[].projected.sources[].secret
<sup><sup>[↩ Parent](#specvolumesprojectedsources)</sup></sup>



<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td><a href="#specvolumesprojectedsourcessecretitems">items</a></td>
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


### spec.volumes[].projected.sources[].secret.items[]
<sup><sup>[↩ Parent](#specvolumesprojectedsourcessecret)</sup></sup>



<table>
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


### spec.volumes[].projected.sources[].serviceAccountToken
<sup><sup>[↩ Parent](#specvolumesprojectedsources)</sup></sup>



<table>
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


### spec.volumes[].quobyte
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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


### spec.volumes[].rbd
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumesrbdsecretref">secretRef</a></td>
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


### spec.volumes[].rbd.secretRef
<sup><sup>[↩ Parent](#specvolumesrbd)</sup></sup>



<table>
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


### spec.volumes[].scaleIO
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumesscaleiosecretref">secretRef</a></td>
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


### spec.volumes[].scaleIO.secretRef
<sup><sup>[↩ Parent](#specvolumesscaleio)</sup></sup>



<table>
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


### spec.volumes[].secret
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumessecretitems">items</a></td>
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


### spec.volumes[].secret.items[]
<sup><sup>[↩ Parent](#specvolumessecret)</sup></sup>



<table>
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


### spec.volumes[].storageos
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#specvolumesstorageossecretref">secretRef</a></td>
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


### spec.volumes[].storageos.secretRef
<sup><sup>[↩ Parent](#specvolumesstorageos)</sup></sup>



<table>
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


### spec.volumes[].vsphereVolume
<sup><sup>[↩ Parent](#specvolumes)</sup></sup>



<table>
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
        <td><a href="#statusbundleddatabaseversions">bundledDatabaseVersions</a></td>
        <td>[]object</td>
        <td>
          Versions of open source databases bundled by Redis Enterprise Software - please note that in order to use a specific version it should be supported by the ‘upgradePolicy’ - ‘major’ or ‘latest’ according to the desired version (major/minor)<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td><a href="#statuscertificatesstatus">certificatesStatus</a></td>
        <td>object</td>
        <td>
          Stores information about cluster certificates and their update process. In Active-Active databases, this is used to detect updates to the certificates, and trigger synchronization across the participating clusters.<br/>
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
        <td><a href="#statusmodules">modules</a></td>
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


### status.bundledDatabaseVersions[]
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


### status.certificatesStatus
<sup><sup>[↩ Parent](#status)</sup></sup>

Stores information about cluster certificates and their update process. In Active-Active databases, this is used to detect updates to the certificates, and trigger synchronization across the participating clusters.

<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
        </tr>
    </thead>
    <tbody><tr>
        <td>generation</td>
        <td>integer</td>
        <td>
          Generation stores the version of the cluster's Proxy and Syncer certificate secrets. In Active-Active databases, when a user updates the proxy or syncer certificate, a crdb-update command needs to be triggered to avoid potential sync issues. This helps the REAADB controller detect a change in a certificate and trigger a crdb-update. The version of the cluster's Proxy certificate secret.<br/>
          <br/>
            <i>Format</i>: int64<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>updateStatus</td>
        <td>string</td>
        <td>
          The status of the cluster's certificates update<br/>
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
        <td>features</td>
        <td>[]string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>flashShards</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>flashShardsLimit</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
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
        <td>owner</td>
        <td>string</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ramShards</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>ramShardsLimit</td>
        <td>integer</td>
        <td>
          <br/>
          <br/>
            <i>Format</i>: int32<br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardsLimit</td>
        <td>integer</td>
        <td>
          <br/>
        </td>
        <td>false</td>
      </tr><tr>
        <td>shardsUsage</td>
        <td>string</td>
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


### status.modules[]
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
