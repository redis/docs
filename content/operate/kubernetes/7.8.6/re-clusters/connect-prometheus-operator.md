---
Title: Connect the Prometheus operator to Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This article describes how to configure a Prometheus operator custom
  resource to allow it to export metrics from Redis Enterprise for Kubernetes.
linkTitle: Export metrics to Prometheus
weight: 92
url: '/operate/kubernetes/7.8.6/re-clusters/connect-prometheus-operator/'
---

To collect  metrics data from your databases and Redis Enterprise cluster (REC), you can connect your [Prometheus](https://prometheus.io/) server to an endpoint exposed on your REC. Redis Enterprise for Kubernetes creates a dedicated service to expose the `prometheus` port (8070) for data collection. A custom resource called `ServiceMonitor` allows the [Prometheus operator](https://github.com/prometheus-operator/prometheus-operator/tree/main/Documentation) to connect to this port and collect data from Redis Enterprise.

## Prerequisites

Before connecting Redis Enterprise to Prometheus on your Kubernetes cluster, make sure you've done the following:

- [Deploy Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/7.8.6/deployment/quick-start.md" >}}) (version 6.2.10-4 or newer)
- [Deploy the Prometheus operator](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/user-guides/getting-started.md) (version 0.19.0 or newer)
- [Create a Redis Enterprise cluster]({{< relref "/operate/kubernetes/7.8.6/deployment/quick-start#create-a-redis-enterprise-cluster-rec" >}})

## Create a `ServiceMonitor` custom resource

Below is an example `ServiceMonitor` custom resource file. By specifying the service label (`app: redis.io/service=prom-metrics`) in the `selector.matchLabels` section, you can point the Prometheus operator to the correct Redis Enterprise service (`<rec_name>-prom`).

You'll need to configure the following fields to connect Prometheus to Redis Enterprise:

| Section | Field | Value |
|---|---|---|
| `spec.endpoints` | `port` | Name of exposed port (`prometheus`) |
| `spec.namespaceSelector` | `matchNames` | Namespace for your REC |
| `spec.selector` | `matchLabels` | REC service label (`app: redis.io/service=prom-metrics`) |

Apply the file in the same namespace as your Redis Enterprise cluster (REC).
    {{<note>}}If Redis Enterprise and Prometheus are deployed in different namespaces, you'll also need to add the [`serviceMonitorNamespaceSelector`](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/api.md#namespaceselector) field to your Prometheus resource. See the [Prometheus operator documentation](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/user-guides/getting-started.md#related-resources) for more details on cross-namespace `ServiceMonitor` configuration.{{</note>}}


```YAML
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: redis-enterprise
spec:
  endpoints:
  - interval: 15s
    port: prometheus
    scheme: https
    tlsConfig:
      insecureSkipVerify: true
  namespaceSelector:
    matchNames:
    - <your_REC_namespace>
  selector:
    matchLabels:
      redis.io/service: prom-metrics
```

For more info about configuring the `ServiceMonitor` resource, see the [`ServiceMonitorSpec` API documentation](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/api.md#servicemonitorspec).

## More info

- github.com/prometheus-operator
  - [Getting started](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/user-guides/getting-started.md)
  - [Running exporters](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/user-guides/running-exporters.md)
  - [Related resources](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/user-guides/getting-started.md#related-resources)
  - [Troubleshooting ServiceMonitor changes](https://github.com/prometheus-operator/prometheus-operator/blob/main/Documentation/troubleshooting.md)
- redis.io/docs
  - [Metrics in Prometheus]({{< relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-definitions" >}})
  - [Monitoring and metrics]({{< relref "/operate/rs/monitoring/" >}})
