```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRemoteCluster
metadata:
  name: rerc-raegan
spec:
  recName: rec-arlington
  recNamespace: ns-virginia
  apiFqdnUrl: test-example-api-rec-arlington-ns-virginia.example.com
  dbFqdnSuffix: -example-cluster-rec-arlington-ns-virginia.example.com
  secretName: redis-enterprise-rerc-raegan
```
