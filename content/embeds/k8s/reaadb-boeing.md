```yaml
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseActiveActiveDatabase
metadata:
  name: reaadb-boeing
spec:
  globalConfigurations:
    databaseSecretName: <my-secret>
    memorySize: 200MB
    shardCount: 3
  participatingClusters:
      - name: rerc-ohare
      - name: rerc-raegan
```
