```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRemoteCluster
metadata:
  name: rerc-raegan
spec:
  recName: rec-arlington
  recNamespace: ns-virginia
  apiFqdnUrl: api-rec-arlington-ns-virginia.example.com
  dbFqdnSuffix: -db-rec-arlington-ns-virginia.example.com
  secretName: redis-enterprise-rerc-raegan
```
