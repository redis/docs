```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: redis-enterprise-operator-consumer-ns
  labels:
    app: redis-enterprise
subjects:
- kind: ServiceAccount
  name: redis-enterprise-operator
  namespace: NAMESPACE_OF_SERVICE_ACCOUNT
roleRef:
  kind: ClusterRole
  name: redis-enterprise-operator-consumer-ns
  apiGroup: rbac.authorization.k8s.io
```
