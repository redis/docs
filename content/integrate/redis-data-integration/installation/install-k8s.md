---
Title: Install on Kubernetes
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to install RDI on Kubernetes
group: di
hideListLinks: false
linkTitle: Install on K8s
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 20
---

This guide explains how to use the RDI [Helm chart](https://helm.sh/docs/topics/charts/)
to install on [Kubernetes](https://kubernetes.io/) (K8s). You can also
[Install RDI on VMs]({{< relref "/integrate/redis-data-integration/installation/install-vm" >}}).

The installation creates the following K8s objects:

-   A K8s [namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) named `rdi`.
-   [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) for the 
    [RDI operator]({{< relref "/integrate/redis-data-integration/architecture#how-rdi-is-deployed" >}}),
    [metrics exporter]({{< relref "/integrate/redis-data-integration/observability" >}}), and API server.
-   A [service account](https://kubernetes.io/docs/concepts/security/service-accounts/) along with a
    [role](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#restrictions-on-role-creation-or-update)
    and [role binding](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding) for the RDI operator.
-   A [Configmap](https://kubernetes.io/docs/concepts/configuration/configmap/)
    for the different components with RDI Redis database details.
-   [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
    with the RDI Redis database credentials and TLS certificates.

You can use this installation on [OpenShift](https://docs.openshift.com/) and other K8s distributions
including cloud providers' K8s managed clusters.

You can pull the RDI images from the 
[download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-1.6.6.tgz)
or from your own [private image registry](#using-a-private-image-registry).

## Before you install

Complete the following steps before running Helm:

-   [Create the RDI database](#create-the-rdi-database) on your Redis Enterprise cluster.
-   Create a [user]({{< relref "/operate/rs/security/access-control/create-users" >}})
    for the RDI database if you prefer not to use the default password (see
    [Access control]({{< relref "/operate/rs/security/access-control" >}}) for
    more information).
-   Download the RDI helm chart tar file from the
    [download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-1.6.6.tgz).
-   If you want to use a private image registry,
    [prepare it with the RDI images](#using-a-private-image-registry).

### Create the RDI database

RDI uses a database on your Redis Enterprise cluster to store its state
information. Use the Redis console to create the RDI database with the following
requirements:

{{< embed-md "rdi-db-reqs.md" >}}

You should then provide the details of this database in the [`values.yaml`](#the-valuesyaml-file)
file as described below.

### Using a private image registry

Add the RDI images from the
[download center](https://redis-enterprise-software-downloads.s3.amazonaws.com/redis-di/rdi-1.6.6.tgz)
to your local registry.
The example below shows how to specify the registry and image pull secret in the
[`values.yaml`](#the-valuesyaml-file) file for the Helm chart:

```yaml
global:
 imagePullSecrets: []
 # - name: "image-pull-secret"

 image:
   registry: docker.io
   repository: redis
```

To pull images from a local registry, you must provide the image pull secret and in some cases also set the permissions. Follow the links below to learn how to use a private registry with:

-   [Rancher](https://ranchermanager.docs.rancher.com/how-to-guides/new-user-guides/kubernetes-resources-setup/kubernetes-and-docker-registries#using-a-private-registry)
-   [OpenShift](https://docs.openshift.com/container-platform/4.17/openshift_images/managing_images/using-image-pull-secrets.html)
-   [Amazon Elastic Kubernetes Service (EKS)](https://docs.aws.amazon.com/AmazonECR/latest/userguide/ECR_on_EKS.html)
-   [Google Kubernetes Engine (GKE)](https://cloud.google.com/artifact-registry/docs/pull-cached-dockerhub-images)
-   [Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration?tabs=azure-cli)

## Supported versions of Kubernetes and OpenShift

{{< embed-md "rdi-k8s-reqs.md" >}}

## Install the RDI Helm chart

1.  Scaffold the default `values.yaml` file from the chart into a local
    `rdi-values.yaml` file:

    ```bash
    helm show values rdi-<rdi-tag>.tar.gz > rdi-values.yaml
    ```

1.  Open the `rdi-values.yaml` file you just created and set the appropriate
    values for your installation
    (see [The `values.yaml` file](#the-valuesyaml-file) below for the full set of
    available values).

1.  Start the installation:

    ```bash
    helm install rdi rdi-<rdi-tag>.tar.gz -f rdi-values.yaml
    ```

    {{< note >}}By default, RDI will be installed in a namespace called
    `rdi`. If you want to use a custom namespace, pass the option
    `--namespace <custom-namespace>` to the `helm install` command.
    {{< /note >}} 

### The `values.yaml` file

The annotated [`values.yaml`](https://helm.sh/docs/topics/charts/#templates-and-values)
file below describes the values you can set for the RDI Helm installation.

At a minimum, you must set the values of `RDI_REDIS_HOST` and `RDI_REDIS_PORT`
in the `global.rdiSysConfig` section and also `RDI_REDIS_PASSWORD` and
`JWT_SECRET_KEY` in `global.rdiSysSecret` to enable the basic connection to the
RDI database. RDI uses the value in `JWT_SECRET_KEY` to encrypt the
[JSON web token (JWT)](https://jwt.io/) token used by RDI API. Best practice is
to generate a value containing 32 random bytes of data (equivalent to 256
bits) and then encode this value as ASCII characters. Use the following
command to generate the random key from the
[`urandom` special file](https://en.wikipedia.org/wiki//dev/random):

```bash
head -c 32 /dev/urandom | base64
```

{{< note >}}If you want to use
[Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}})
to connect to your RDI deployment from outside the K8s cluster, you
must enable TLS.
{{< /note >}}

The full `values.yaml` file is shown below:

```yaml
# Default RDI values in YAML format.
# Variables to template configuration.

global:
  # Set this property when using a private image repository.
  # Provide an array of image pull secrets.
  # Example:
  # imagePullSecrets:
  #   - name: pullSecret1
  #   - name: pullSecret2
  imagePullSecrets:
    - name: docker-config-jfrog

  # DO NOT modify this value.
  vmMode: false

  # Indicates whether the deployment is intended for an OpenShift environment.
  openShift: false

  image:
    # Overrides the image tag for all RDI components.
    # tag: 0.0.0

    # If using a private repository, update the default values accordingly.
    # Docker registry.
    registry: docker.io

    # Docker image repository.
    repository: redis

  # Configuration for the RDI ConfigMap.
  rdiSysConfig:
    # Log level for all RDI components. Valid options: DEBUG, INFO, ERROR.
    # If specific component log levels are not set, this value will be used.
    RDI_LOG_LEVEL: INFO

    # Log level for the RDI API. Valid options: DEBUG, INFO, ERROR.
    # If not set, RDI_LOG_LEVEL will be used.
    # RDI_LOG_LEVEL_API: INFO

    # Log level for the RDI Operator. Valid options: DEBUG, INFO, ERROR.
    # If not set, RDI_LOG_LEVEL will be used.
    # RDI_LOG_LEVEL_OPERATOR: INFO

    # Log level for the RDI processor. Valid options: DEBUG, INFO, ERROR.
    # If not set, RDI_LOG_LEVEL will be used.
    # RDI_LOG_LEVEL_PROCESSOR: INFO

    # Specifies whether the RDI is configured to use TLS.
    RDI_REDIS_SSL: false

    # RDI_IMAGE_REPO: redis

    # This value must be set to the same tag as global.image.tag.
    # RDI_IMAGE_TAG: ""

    # If using a private repository, set this value to the same secret name as in global.imagePullSecrets.
    # RDI_IMAGE_PULL_SECRET: []

    # The service IP of the RDI database.
    # RDI_REDIS_HOST: ""

    # The port for the RDI database.
    # RDI_REDIS_PORT: ""

    # Enable authentication for the RDI API.
    # RDI_API_AUTH_ENABLED: "1"

    # Specifies whether the API Collector should be deployed.
    # RDI_API_COLLECTOR_ENABLED: "0"

  # Configuration for the RDI Secret.
  rdiSysSecret:
    # Username and password for RDI database.
    # If using the default password, keep the username as an empty string.
    # RDI_REDIS_USERNAME: ""
    # RDI_REDIS_PASSWORD: ""

    # Uncomment this property when using a TLS connection from RDI to its Redis database.
    # DO NOT modify this value.
    # RDI_REDIS_CACERT: /etc/certificates/rdi_db/cacert

    # Uncomment these properties when using an mTLS connection from RDI to its Redis database.
    # DO NOT modify these values.
    # RDI_REDIS_CERT: /etc/certificates/rdi_db/cert
    # RDI_REDIS_KEY: /etc/certificates/rdi_db/key

    # The passphrase used to get the private key stored in the secret store when using mTLS.
    # RDI_REDIS_KEY_PASSPHRASE: ""

    # The key used to encrypt the JWT token used by RDI API. Best practice is for this
    # to contain 32 random bytes encoded as ASCII characters (equivalent to 256 bits of
    # data). See `The values.yaml file` section above to learn how to generate the key.
    # JWT_SECRET_KEY: ""

  rdiDbSSLSecret:
    # Set to `true` when using a TLS connection from RDI to its Redis database.
    enabled: false

    # The content of the CA certificate PEM file.
    # Uncomment and set this property when using a TLS connection from RDI to its Redis database.
    # cacert: ""

    # The content of the certificate PEM file.
    # Uncomment and set this property when using an mTLS connection from RDI to its Redis database.
    # cert: ""

    # The content of the private key PEM file.
    # Uncomment and set this property when using an mTLS connection from RDI to its Redis database.
    # key: ""

  # Container default security context.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#set-the-security-context-for-a-container
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 1000
    allowPrivilegeEscalation: false

# Set `isOpenshift` to `true` if deploying on OpenShift.
reloader:
  reloader:
    isOpenshift: false
    deployment:
      containerSecurityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop:
            - ALL
      securityContext:
        runAsUser: null

# Configuration of the RDI Operator.
operator:
  image:
    name: rdi-operator

    # Specify an imagePullPolicy.
    # ref: https://kubernetes.io/docs/concepts/containers/images/#pre-pulled-images
    pullPolicy: IfNotPresent

  # Extra optional options for liveness probe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
  liveness:
    failureThreshold: 6
    periodSeconds: 10

  # Extra optional options for readiness probe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
  readiness:
    failureThreshold: 6
    periodSeconds: 30

  # Extra optional options for startup probe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
  startup:
    failureThreshold: 60
    periodSeconds: 5

fluentd:
  image:
    name: rdi-fluentd

    # Specify an imagePullPolicy.
    # ref: https://kubernetes.io/docs/concepts/containers/images/#pre-pulled-images
    pullPolicy: IfNotPresent

  rdiLogsHostPath: "/opt/rdi/logs"
  podLogsHostPath: "/var/log/pods"
  logrotateMinutes: "5"

rdiMetricsExporter:
  image:
    name: rdi-monitor

    # Specify an imagePullPolicy.
    # ref: https://kubernetes.io/docs/concepts/containers/images/#pre-pulled-images
    pullPolicy: IfNotPresent

  # The RDI metrics service is set to ClusterIP, allowing access only from within the cluster.
  # ref: http://kubernetes.io/docs/user-guide/services/
  service:
    protocol: TCP
    port: 9121
    targetPort: 9121
    type: ClusterIP

  # Configure extra options for liveness probe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#configure-probes
  liveness:
    failureThreshold: 6
    periodSeconds: 10

  # Configure extra options for readiness probe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#configure-probes
  readiness:
    failureThreshold: 6
    periodSeconds: 30

  # Configure extra options for startupProbe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#configure-probes
  startup:
    failureThreshold: 60
    periodSeconds: 5

  # Configuration for the ServiceMonitor, which is used to scrape metrics from the RDI metrics service.
  serviceMonitor:
    # Set to `true` to activate the ServiceMonitor.
    enabled: false

    # The endpoint from which Prometheus will scrape metrics.
    path: /metrics

# Configuration of the RDI API.
apiServer:
  image:
    name: rdi-api

    # Specify an imagePullPolicy.
    # ref: https://kubernetes.io/docs/concepts/containers/images/#pre-pulled-images
    pullPolicy: IfNotPresent

  # The RDI API service is set to ClusterIP, allowing access only from within the cluster.
  # ref: http://kubernetes.io/docs/user-guide/services/
  service:
    type: ClusterIP
    name: rdi-api
    port: 8080
    targetPort: 8081

  # Configure extra options for liveness probe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#configure-probes
  liveness:
    failureThreshold: 6
    periodSeconds: 10

  # Configure extra options for readiness probe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#configure-probes
  readiness:
    failureThreshold: 6
    periodSeconds: 30

  # Configure extra options for startupProbe.
  # ref: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/#configure-probes
  startup:
    failureThreshold: 60
    periodSeconds: 5

# Expose the RDI API service to be accessed from outside the cluster.
# ref: http://kubernetes.io/docs/user-guide/services/
ingress:
  # When `enabled` is set to `true`, RDI API Ingress will be created.
  enabled: false

  # ref: https://kubernetes.io/blog/2020/04/02/improvements-to-the-ingress-api-in-kubernetes-1.18/#specifying-the-class-of-an-ingress
  # className: ""

  # Ingress resources configure routes based on the requested host.
  # The optional Host field defines the hosts for routing. If omitted, it matches all hosts.
  # Example:
  # hosts:
  #   - example.com
  #   - another-example.com

  # Annotations to be added to the IngressClass resource.
  # Example:
  # annotations:
  #   kubernetes.io/ingress.class: "nginx"
  #   nginx.ingress.kubernetes.io/rewrite-target: /

  tls:
    # Specifies whether the Ingress should be configured to use TLS.
    enabled: false

    # When `enabled` is set to `true`, set this property to the content of the crt file.
    # crt: ""

    # When `enabled` is set to `true`, set this property to the content of the key file.
    # key: ""

# When `openShift` is set to `true`, Route will be created automatically.
# Route exposes RDI API outside the cluster.
route:
  tls:
    # Specifies whether the Route should be configured to use TLS.
    enabled: false

    # When `enabled` is set to `true`, set this property to the content of the crt file.
    # crt: ""

    # When `enabled` is set to `true`, set this property to the content of the key file.
    # key: ""

collectorSourceMetricsExporter:
  # The collector-source metrics service is set to ClusterIP, allowing access only from within the cluster.
  # ref: http://kubernetes.io/docs/user-guide/services/
  service:
    type: ClusterIP
    port: 9092
    targetPort: 19000

  # Configuration for the ServiceMonitor, which is used to scrape metrics from the collector-source metrics service.
  serviceMonitor:
    # Set to `true` to activate the ServiceMonitor.
    enabled: false

    # The endpoint from which Prometheus will scrape metrics.
    path: /metrics
```

## Check the installation

To verify the status of the K8s deployment, run the following command:

```bash
helm list -n monitoring -n rdi
```

The output looks like the following. Check that `<logical_chart_name>` is listed.

```
NAME 	             NAMESPACE    REVISION    UPDATED                STATUS    CHART   	 APP VERSION
<logical_chart_name>    rdi 		   1      2024-10-10 16:53... +0300   IDT    deployed    rdi-1.0.0        	
```

Also, check that the following pods have `Running` status:

```bash
kubectl get pod -n rdi

NAME                              READY  STATUS  	RESTARTS   AGE
rdi-api-<id>                       1/1 	 Running 	   0      	29m
rdi-metric-<id>l                   1/1    Running 	   0      	29m
rdi-operator-<id>                  1/1 	 Running 	   0      	29m
<logical_chart_name>-reloader-<id> 1/1 	 Running 	   0      	29m
collector-api-<id>                 1/1    Running       0        29m
```

You can verify that the RDI API works by adding the server in
[Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}}).

## Using ingress controllers

You must ensure that an appropriate
[ingress controller](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
is available in your K8s cluster to expose the RDI API service via the K8s
[`Ingress`](https://kubernetes.io/docs/concepts/services-networking/ingress/)
resource. Follow the documentation of your cloud provider or of
the ingress controller to install the controller correctly.

### Using the `nginx` ingress controller on AKS

On AKS, if you want to use the open source
[`nginx`](https://nginx.org/)
[ingress controller](https://github.com/kubernetes/ingress-nginx/blob/main/README.md#readme)
rather than the
[AKS application routing add-on](https://learn.microsoft.com/en-us/azure/aks/app-routing),
follow the AKS documentation for
[creating an unmanaged ingress controller](https://learn.microsoft.com/en-us/troubleshoot/azure/azure-kubernetes/load-bal-ingress-c/create-unmanaged-ingress-controller?tabs=azure-cli).
Specifically, ensure that one or both of the following Helm chart values is set:

- `controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz`
- `controller.service.externalTrafficPolicy=Local`

## Prepare your source database

You must also configure your source database to use the CDC connector. See the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
section to learn how to do this.

## Deploy a pipeline

When the Helm installation is complete and you have prepared the source database for CDC,
you are ready to start using RDI.
Use [Redis Insight]({{< relref "/develop/tools/insight/rdi-connector" >}}) to
[configure]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines" >}}) and
[deploy]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
your pipeline.

## Uninstall RDI

If you want to remove your RDI K8s installation, first run
the following commands. (If you installed with a custom namespace then
replace `rdi` with the name of your namespace.)

```bash
helm uninstall rdi -n rdi
kubectl delete namespace rdi
```

If you also want to delete the keys from your RDI database, connect to it with
[`redis-cli`]({{< relref "/develop/tools/cli" >}}) and run a
[`FLUSHALL`]({{< relref "/commands/flushall" >}}) command.
