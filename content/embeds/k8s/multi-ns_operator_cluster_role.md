```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: redis-enterprise-operator-consumer-ns
  labels:
    app: redis-enterprise
rules:
  - apiGroups: [""]
    resources: ["namespaces"]
    verbs: ["list", "watch"]
```
