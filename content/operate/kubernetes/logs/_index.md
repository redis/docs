---
Title: Logs
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Access and manage Redis Enterprise logs on Kubernetes for monitoring and troubleshooting.
hideListLinks: true
linkTitle: Logs
weight: 60
---

Access and manage Redis Enterprise logs on Kubernetes for monitoring, troubleshooting, and debugging your Redis Enterprise deployment. Logs provide valuable insights into cluster operations, database performance, and system health.

## Log collection and access

Learn how to collect and access logs from your Redis Enterprise deployment:

- [Collect logs]({{< relref "/operate/kubernetes/logs/collect-logs" >}}) - Methods for collecting logs from Redis Enterprise pods and containers
- [Log collector RBAC]({{< relref "/operate/kubernetes/logs/log-collector-rbac" >}}) - RBAC configurations for log collection in restricted and all modes

## Log storage and access

Each Redis Enterprise container stores its logs under `/var/opt/redislabs/log`. When using persistent storage, this path is automatically mounted to the `redis-enterprise-storage` volume, making logs accessible through sidecar containers or external log collection tools.

For example, in the REC (Redis Enterprise Cluster) spec you can add a sidecar container, such as a busybox, and mount the logs to there:

```yaml
sideContainersSpec:
  - name: busybox
    image: busybox
    args:
      - /bin/sh
      - -c
      - while true; do echo "hello"; sleep 1; done

    volumeMounts:
    - name: redis-enterprise-storage
      mountPath: /home/logs
      subPath: logs
```

Now the logs can be accessed from in the sidecar. For example by running

```kubectl exec -it <pod-name> -c busybox tail home/logs/supervisord.log```

The sidecar container is user determined and can be used to format, process and share logs in a specified format and protocol.
