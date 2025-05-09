```yaml
# The minimal Role and ClusterRole required for running the log collector in 'restricted' mode.
# The roles should be bound to the user executing the log collector, in each of the namespaces to be collected.
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: redis-enterprise-log-collector
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - pods/log
  verbs:
  - get
  - list
- apiGroups:
  - ""
  resources:
  - pods/exec
  verbs:
  - create
- apiGroups:
  - ""
  resources:
  - events
  - services
  - endpoints
  - configmaps
  - secrets
  - resourcequotas
  - limitranges
  - persistentvolumeclaims
  - replicationcontrollers
  verbs:
  - get
  - list
- apiGroups:
  - apps
  resources:
  - deployments
  - daemonsets
  - replicasets
  - statefulsets
  verbs:
  - get
  - list
- apiGroups:
  - batch
  resources:
  - cronjobs
  - jobs
  verbs:
  - get
  - list
- apiGroups:
  - rbac.authorization.k8s.io
  resources:
  - roles
  - rolebindings
  verbs:
  - get
  - list
- apiGroups:
  - autoscaling
  resources:
  - horizontalpodautoscalers
  verbs:
  - get
  - list
- apiGroups:
  - policy
  resources:
  - poddisruptionbudgets
  verbs:
  - get
  - list
- apiGroups:
  - app.redislabs.com
  resources:
  - "*"
  verbs:
  - get
  - list
- apiGroups:
  - networking.k8s.io
  resources:
  - ingresses
  - networkpolicies
  verbs:
  - get
  - list
- apiGroups:
  - route.openshift.io
  resources:
  - routes
  verbs:
  - get
  - list
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: redis-enterprise-log-collector
rules:
- apiGroups:
  - ""
  resources:
  - persistentvolumes
  verbs:
  - get
  - list
- apiGroups:
  - ""
  resources:
  - namespaces
  verbs:
  - get
- apiGroups:
  - rbac.authorization.k8s.io
  resources:
  - clusterroles
  - clusterrolebindings
  verbs:
  - get
  - list
- apiGroups:
  - apiextensions.k8s.io
  resources:
  - customresourcedefinitions
  resourceNames:
  - redisenterpriseclusters.app.redislabs.com
  - redisenterprisedatabases.app.redislabs.com
  - redisenterpriseremoteclusters.app.redislabs.com
  - redisenterpriseactiveactivedatabases.app.redislabs.com
  verbs:
  - list
  - get
- apiGroups:
  - admissionregistration.k8s.io
  resources:
  - validatingwebhookconfigurations
  verbs:
  - list
  - get
```
