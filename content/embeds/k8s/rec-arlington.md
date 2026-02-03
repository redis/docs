```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: rec-arlington
  namespace: ns-virginia
spec:
  nodes: 3
  persistentSpec:
    enabled: true
    volumeSize: 20Gi
  redisEnterpriseNodeResources:
    requests:
      cpu: 2
      memory: 4Gi
    limits:
      cpu: 2
      memory: 4Gi
```
