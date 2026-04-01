```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseRemoteCluster
metadata:
  name: rerc-ohare
spec:
  recName: rec-chicago
  recNamespace: ns-illinois
  apiFqdnUrl: api-rec-chicago-ns-illinois.example.com
  dbFqdnSuffix: -db-rec-chicago-ns-illinois.example.com
  secretName: redis-enterprise-rerc-ohare
```
