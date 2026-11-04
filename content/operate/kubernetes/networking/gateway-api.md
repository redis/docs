---
Title: Route external traffic with Gateway API
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Expose the cluster API, Cluster Manager UI, metrics, and Active-Active databases through a Kubernetes Gateway.
linkTitle: Gateway API routing
weight: 35
---

Redis Software for Kubernetes can expose your RedisEnterpriseCluster (REC) endpoints and Active-Active databases through the [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/). You add a `spec.gateway` section to the REC, and the operator creates a `TLSRoute` for each exposed endpoint and attaches it to a Gateway that you own. The operator never creates or changes the Gateway itself.

Traffic uses TLS passthrough. The Gateway routes each connection by its Server Name Indication (SNI) hostname and never terminates TLS, so one Gateway listener can serve many endpoints.

You can expose the following through Gateway API:

- The cluster API
- The Cluster Manager UI
- The metrics endpoint
- Active-Active databases (REAADB)

Regular databases (REDB) can't be exposed through Gateway API. To expose them, use [Ingress routing](/content/operate/kubernetes/networking/ingress.md), [Istio ingress routing](/content/operate/kubernetes/networking/istio-ingress.md), or [OpenShift routes](/content/operate/kubernetes/networking/routes.md).

## Prerequisites

Before you configure Gateway API routing, you need:

- Gateway API custom resource definitions (CRDs) version 1.5 or later, installed from the standard channel. The operator requires `TLSRoute` v1, which earlier versions don't provide.
- A Gateway controller that supports `TLSRoute` with TLS passthrough.
- A Gateway with listeners that use protocol `TLS` and TLS mode `Passthrough`.
- Gateway listeners that accept routes from the REC namespace. By default, a listener accepts routes only from the Gateway's own namespace. If the Gateway is in another namespace, set `allowedRoutes.namespaces.from` to `All`, or to `Selector` with a selector that matches the REC namespace. Otherwise, the Gateway rejects every route with reason `NotAllowedByListeners`.
- DNS records that resolve each fully qualified domain name (FQDN) you expose to the Gateway's address. For Active-Active databases, every participating cluster must also be able to resolve these names, because replication traffic uses them.

The following example shows the listeners of a Gateway that uses one listener for the cluster endpoints and one for databases:

```yaml
spec:
  listeners:
  - name: https
    port: 443
    protocol: TLS
    tls:
      mode: Passthrough
    allowedRoutes:
      namespaces:
        from: All
  - name: redis-tls
    port: <database-listener-port>
    protocol: TLS
    tls:
      mode: Passthrough
    allowedRoutes:
      namespaces:
        from: All
```

## Set cluster-wide defaults

Use `spec.gateway.default` to set values that every exposed endpoint inherits:

- `gatewayRef`: The `name` and `namespace` of the Gateway to attach routes to. If you omit `namespace`, the operator uses the REC namespace.
- `fqdnSuffix`: The DNS suffix the operator uses to build each endpoint's hostname.
- `routeLabels` and `routeAnnotations`: Metadata to add to every route. See [Add labels and annotations to routes](#add-labels-and-annotations-to-routes).

Each endpoint section can set its own `gatewayRef`, which overrides the default.

## Expose the cluster API, UI, and metrics

The `spec.gateway.api`, `spec.gateway.ui`, and `spec.gateway.metrics` sections each expose one cluster endpoint. All three are off by default. Each section supports these fields:

- `enabled`: Set to `true` to expose the endpoint.
- `fqdn`: The endpoint's hostname. If you omit it, the operator uses `api.<fqdnSuffix>`, `ui.<fqdnSuffix>`, or `metrics.<fqdnSuffix>`.
- `listenerName`: The Gateway listener to attach to. It maps to the route's `parentRef.sectionName`. If you omit it, the Gateway controller selects a compatible listener.
- `listenerPort`: The Gateway listener port. It maps to the route's `parentRef.port`.
- `gatewayRef`, `routeLabels`, and `routeAnnotations`: Per-endpoint overrides of the defaults.

To expose the cluster endpoints:

1. Create a patch file, replacing the `<placeholders>` with your own values.

    ```yaml
    spec:
      gateway:
        default:
          gatewayRef:
            name: <gateway-name>
            namespace: <gateway-namespace>
          fqdnSuffix: <fqdn-suffix>
        api:
          enabled: true
          listenerName: https
          listenerPort: 443
        ui:
          enabled: true
          listenerName: https
          listenerPort: 443
        metrics:
          enabled: true
          listenerName: https
          listenerPort: 443
    ```

1. Apply the patch to the REC.

    ```sh
    kubectl patch rec <rec-name> --type merge --patch-file <patch-file>
    ```

1. Confirm that the operator created the routes. They're named `<rec-name>-api`, `<rec-name>-ui`, and `<rec-name>-metrics`.

    ```sh
    kubectl get tlsroute -n <rec-namespace>
    ```

1. Test access to the cluster API through the Gateway.

    ```sh
    curl -k -u "<username>:<password>" https://api.<fqdn-suffix>/v1/cluster
    ```

    The `-k` option skips certificate verification for this test. The REC admin credentials are stored in a secret named after the REC. See [Connect to the admin console](/content/operate/kubernetes/re-clusters/connect-to-admin-console.md).

> [!NOTE]
> - The UI endpoint requires the Cluster Manager server. If `spec.servicesConfiguration.cmServer.operatingMode` is set to `disabled`, enabling `spec.gateway.ui` makes the REC spec invalid.
> - Enabling `spec.gateway.metrics` changes the metrics service from a headless service to a ClusterIP service so that the Gateway can route to it. The service stays ClusterIP if you later turn off the metrics endpoint.

## Expose Active-Active databases

The `spec.gateway.activeActiveDatabases` section exposes Active-Active databases. Each exposed database gets one route, and that route carries both client traffic and replication traffic between participating clusters. Configure this section on every participating REC.

The section supports these fields:

- `autoEnable`: Which Active-Active databases to expose. `None` (the default) exposes none, `All` exposes every Active-Active database on the cluster, and `Selector` exposes databases whose labels match `selector`.
- `selector`: A label selector, required when `autoEnable` is `Selector`.
- `fqdnSuffix`: The DNS suffix for database hostnames. A database's hostname is `<database-name>.<fqdnSuffix>`. If you omit it, the hostname is `<database-name>.crdb.<default-fqdnSuffix>`.
- `listenerName` and `listenerPort`: The Gateway listener for databases.
- `gatewayRef`, `routeLabels`, and `routeAnnotations`: Overrides of the defaults.

Active-Active databases are configured only at the REC level. The REAADB has no Gateway settings of its own.

Each participating cluster needs its own `fqdnSuffix`, so that each database hostname is unique to its cluster and SNI routes it to the right cluster.

To expose Active-Active databases:

1. On each participating cluster, patch the REC with an `activeActiveDatabases` section, replacing the `<placeholders>` with your own values. This example also exposes the cluster API, so that participating clusters can reach each other's API through the Gateway.

    ```yaml
    spec:
      gateway:
        default:
          gatewayRef:
            name: <gateway-name>
            namespace: <gateway-namespace>
          fqdnSuffix: <fqdn-suffix>
        api:
          enabled: true
          listenerName: https
          listenerPort: 443
        activeActiveDatabases:
          autoEnable: Selector
          selector:
            matchLabels:
              <label-key>: "<label-value>"
          fqdnSuffix: <database-fqdn-suffix>
          listenerName: redis-tls
    ```

    ```sh
    kubectl patch rec <rec-name> --type merge --patch-file <patch-file>
    ```

1. Set `spec.replicationPort` on every RedisEnterpriseRemoteCluster (RERC), on every participating cluster. This is typically the same port as the database listener on the Gateway of the cluster that the RERC describes. One port serves all Active-Active databases on that cluster; the Gateway tells them apart by SNI.

    ```sh
    kubectl patch rerc <rerc-name> --type merge --patch '{"spec":{"replicationPort": <database-listener-port>}}'
    ```

    Unlike `apiFqdnUrl`, you can edit `replicationPort` on any copy of an RERC, not only on the RERC's local cluster.

1. If `autoEnable` is `Selector`, label each existing database on every participating cluster.

    ```sh
    kubectl label reaadb <reaadb-name> <label-key>=<label-value>
    ```

1. Confirm that each cluster created a route for the database. The route is named after the database.

    ```sh
    kubectl get tlsroute -n <rec-namespace>
    ```

A database you create after you enable Gateway exposure needs the label on the cluster where you create it, as long as the following conditions hold:

- That cluster's RERC for each peer has `replicationPort` set and no `externalReplicationPort`.
- Each peer REC uses `autoEnable: Selector`.

The operator then creates the route on each peer cluster automatically.

If the REAADB is in a consumer namespace, its route name and hostname use `<consumer-namespace>-<reaadb-name>` in place of the database name.

To test the database, write a key through one cluster's Gateway and read it through another's. Use each cluster's database hostname as both the host and the SNI value. This example uses a client certificate and key, which you need only if the database requires client authentication. The `--insecure` option skips certificate verification for the test.

```sh
redis-cli --tls --insecure --cert <client-cert-file> --key <client-key-file> \
  --sni <database-hostname-cluster-1> -h <database-hostname-cluster-1> \
  -p <database-listener-port> SET <key> <value>

redis-cli --tls --insecure --cert <client-cert-file> --key <client-key-file> \
  --sni <database-hostname-cluster-2> -h <database-hostname-cluster-2> \
  -p <database-listener-port> GET <key>
```

## Add labels and annotations to routes

Use `routeLabels` and `routeAnnotations` to add metadata to the routes the operator creates, for example an annotation that an external DNS controller reads. You can set them in `spec.gateway.default`, in each endpoint section, and in `spec.gateway.activeActiveDatabases`. Values in an endpoint section are merged over the defaults and win on key conflicts.

```yaml
spec:
  gateway:
    api:
      enabled: true
      routeAnnotations:
        external-dns.alpha.kubernetes.io/hostname: api.<fqdn-suffix>
```

Labels the operator manages always take precedence over your labels. The operator doesn't apply labels with the keys `role` or `bdb`.

## Check route status

The REC status reports each cluster endpoint under `status.gateway.api`, `status.gateway.ui`, and `status.gateway.metrics`, with the endpoint's `fqdn`, `routeName`, and `conditions`.

```sh
kubectl describe rec <rec-name>
```

A healthy endpoint has a condition of type `Ready` with status `True` and reason `RouteReady`, and the message `TLSRoute is accepted and its backend references are resolved`.

For Active-Active databases, the REAADB status shows the endpoint each participating cluster advertises to its peers, under `status.participatingClusters[].replicationEndpoint`. A cluster that uses Gateway API advertises `<database-hostname>:<database-listener-port>`.

```sh
kubectl get reaadb <reaadb-name> -o jsonpath='{.status.participatingClusters}'
```

Events with reason `GatewayEndpointCutover` on the REAADB show when a cluster is waiting for its route to be accepted and when it switches its advertised endpoint to the Gateway.

```sh
kubectl get events --field-selector involvedObject.name=<reaadb-name>
```

## Troubleshooting

| What you see | What it means | What to do |
| --- | --- | --- |
| REC endpoint condition reason `RoutePending`, message `Waiting for the Gateway controller to report route readiness` | The route exists, but the Gateway controller hasn't reported on it yet. | Check that `gatewayRef` names an existing Gateway and that your Gateway controller is running. |
| REC endpoint condition reason `RouteNotReady`, or a reason reported by the Gateway controller | The Gateway didn't accept the route, or the route's backend didn't resolve. | Check the route's `Accepted` and `ResolvedRefs` conditions with `kubectl get tlsroute <route-name> -o yaml`. |
| REC spec is invalid, with a message that names a `spec.gateway` field | A `spec.gateway` setting can't be resolved, for example an enabled endpoint with no hostname or no Gateway. | Fix the field the message names. |
| REC endpoint condition reason `RouteReconcileFailed` | The operator couldn't create or update the route. | Read the condition message for the cause. |
| REC endpoint condition reason `GatewayAPIUnavailable`, message `Gateway API TLSRoute v1 is not available; the operator requires Gateway API >= 1.5 (standard channel)` | The `TLSRoute` v1 CRD isn't installed. | Install Gateway API CRDs version 1.5 or later from the standard channel. |
| REAADB warning event reason `ParticipatingClusterRERCStatus`, message ending `does not set spec.replicationPort; gateway exposure is pending` | The database is selected for Gateway exposure, but an RERC has no `replicationPort`. If the database has an existing exposure method, it keeps serving through it. If it has none, this is an error. | Set `spec.replicationPort` on every RERC, on every participating cluster. |
| REAADB warning event reason `MissingOrInvalidLinkedRERC`, or a rejected `kubectl apply`, with a message containing `equals the legacy dbFqdnSuffix-derived FQDN` | During migration, the database's Gateway hostname is the same as its existing hostname, so the two can't be told apart. | Set `spec.gateway.activeActiveDatabases.fqdnSuffix` to a suffix that differs from the RERC `dbFqdnSuffix`. |
| REAADB warning event reason `MissingOrInvalidLinkedRERC`, or a rejected `kubectl apply`, with a message containing `refusing to tear down the gateway route` | You turned off Gateway exposure for a database on a cluster that has no other way to expose it. The route stays in place so replication keeps working. | Select the database for Gateway exposure again, or configure another exposure method on that cluster first. |

## Migrate from ingressOrRouteSpec

Gateway API routing works alongside an existing [`ingressOrRouteSpec`](/content/operate/kubernetes/networking/ingressorroutespec.md) configuration, so you can migrate without downtime. Both methods serve traffic during the migration, and each cluster switches each database to the Gateway only after its route is ready. Clusters switch independently.

1. Upgrade the operator on all participating clusters.

1. Set `spec.replicationPort` on every RERC, on every participating cluster.

1. On each REC, add `spec.gateway`. Use `autoEnable: Selector` to migrate one database at a time, or `All` to migrate every database. The Gateway hostnames must differ from your existing `dbFqdnSuffix` hostnames.

1. If you use `Selector`, label each database on every participating cluster.

1. Wait for each cluster to switch. A `GatewayEndpointCutover` event marks the switch, and the REAADB `replicationEndpoint` changes to the Gateway hostname. Move your Redis clients to the Gateway hostnames at any time; both methods serve traffic.

1. To move the API traffic between participating clusters, expose the cluster API through the Gateway. Then, one cluster at a time, update `apiFqdnUrl` in that cluster's local RERC to its Gateway API hostname. Wait for the REAADBs to return to `active` before you update the next cluster.

1. Remove `spec.ingressOrRouteSpec` from the REC last.

> [!WARNING]
> Removing `spec.ingressOrRouteSpec` deletes every Ingress or route the operator created for the REC at once, including the API route and every database route. Remove it only after all clients and participating clusters use the Gateway hostnames.

To roll back a database before you remove `spec.ingressOrRouteSpec`, remove its label, or set `autoEnable` to `None`. The operator deletes the database's route and returns to advertising the existing endpoint.

If a cluster exposes Active-Active databases through load balancer services with `externalReplicationPort` instead of `ingressOrRouteSpec`, you can migrate the same way. Keep `externalReplicationPort` set while the Gateway route becomes ready, and remove it after the cluster switches. This works only while the REC's `spec.servicesRiggerSpec.databaseServiceType` includes `load_balancer`. A REC with `ingressOrRouteSpec` can't combine `externalReplicationPort` with Gateway exposure.
