```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseCluster
metadata:
  name: rack-aware-cluster
  labels:
    app: redis-enterprise
spec:
  nodes: 3
  rackAwarenessNodeLabel: topology.kubernetes.io/zone
```
