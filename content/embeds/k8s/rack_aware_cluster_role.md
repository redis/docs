```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: redis-enterprise-operator
rules:
  # needed for rack awareness
  - apiGroups: [""]
    resources: ["nodes"]
    verbs: ["list", "get", "watch"]
```
