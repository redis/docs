---
Title: Redis Enterprise Software logs on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This section provides information about how logs are stored and accessed.
hideListLinks: true
linkTitle: Logs
weight: 60
---

## Logs

Each redis-enterprise container stores its logs under `/var/opt/redislabs/log`.
When using persistent storage this path is automatically mounted to the
`redis-enterprise-storage` volume.
This volume can easily be accessed by a sidecar, i.e. a container residing on the same pod.

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
