---
Title: Configure Istio for external routing
alwaysOpen: false
categories:
- docs
- operate
- kubernetes
description: Configure Istio as an ingress controller for access to your Redis Enterprise
  databases from outside the Kubernetes cluster.
linkTitle: Istio ingress routing
weight: 20
url: '/operate/kubernetes/7.8.4/networking/istio-ingress/'
---

Redis Enterprise for Kubernetes has the ability to use an Istio Ingress gateway as an alternative to NGINX or HaProxy Ingress controllers.

Istio can also understand Ingress resources, but using that mechanism takes away the advantages and options that the native Istio resources provide. Istio offers its own configuration methods using custom resources.

To configure Istio to work with the Redis Kubernetes operator, we will use two custom resources: a `Gateway` and a `VirtualService`. Then you'll be able to establish external access to your database.

## Install and configure Istio for Redis Enterprise

1. [Download](https://istio.io/latest/docs/setup/getting-started/) and [install](https://istio.io/latest/docs/setup/getting-started/) Istio (see instructions from Istio's [Getting Started](https://istio.io/latest/docs/setup/getting-started/) guide).

    Once the installation is complete, all the deployments, pods, and services will be deployed in a namespace called `istio-system`. This namespace contains a `LoadBalancer` type service called `service/istio-ingressgateway` that exposes the external IP address.

1. Find the `EXTERNAL-IP` for the `istio-ingressgateway` service.

    ```sh
    kubectl get svc istio-ingressgateway -n istio-system

    NAME                   TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)                                                                      AGE
    istio-ingressgateway   LoadBalancer   10.34.67.89   10.145.78.91   15021:12345/TCP,80:67891/TCP,443:23456/TCP,31400:78901/TCP,15443:10112/TCP   3h8m
    ```

1. Create a DNS entry that resolves your chosen database hostname (or a wildcard `*` followed by your domain) to the Istio `EXTERNAL-IP`. Use this hostname to access your database from outside the cluster.

    In this example, any hostname that ends with `.istio.k8s.my.example.com` will resolve to the Istio LoadBalancer's external IP of `10.145.78.91`. Substitute your own values accordingly.

1. Verify the record was created successfully.

    ```sh
    dig api.istio.k8s.my.example.com
    ```

    Look in the `ANSWER SECTION` for the record you just created.

    ```sh
    ;; ANSWER SECTION:
    api.istio.k8s.my.example.com 0 IN    A       10.145.78.91
    ```

## Create custom resources

### `Gateway` custom resource

1. On a different namespace from `istio-system`, create a `Gateway` custom resource file (`redis-gateway.yaml` in this example).

    - Replace `.istio.k8s.my.example.com` with the domain that matches your DNS record.
    - Replace `<selector-label>` with the label set on your Istio ingress gateway pod (most common is `istio: ingress`).
    - TLS passthrough mode is required to allow secure access to the database.

    ```yaml
    apiVersion: networking.istio.io/v1beta1
    kind: Gateway
    metadata:
      name: redis-gateway
    spec:
      selector:
        istio: <selector-label>
      servers:
      - hosts:
        - '*.istio.k8s.my.example.com'
        port:
          name: https
          number: 443
          protocol: HTTPS
        tls:
          mode: PASSTHROUGH
    ```



1. Apply the `Gateway` custom resource file to create the Ingress gateway.

    ```sh
    kubectl apply -f redis-gateway.yaml
    ```

1. Verify the gateway was created successfully.

      ```sh
      kubectl get gateway

      NAME            AGE
      redis-gateway   3h33m
      ```

### `VirtualService` custom resource

1. On a different namespace than `istio-system`, create the `VirtualService` custom resource file (`redis-vs.yaml` in this example).

    ```yaml
    apiVersion: networking.istio.io/v1beta1
    kind: VirtualService
    metadata:
      name: redis-vs
    spec:
      gateways:
      - redis-gateway
      hosts:
      - "*.istio.k8s.my.example.com"
      tls:
      - match:
        - port: 443
          sniHosts:
          - api.istio.k8s.my.example.com
        route:
        - destination:
            host: rec1
            port:
              number: 9443
      - match:
        - port: 443
          sniHosts:
          - db1.istio.k8s.my.example.com
        route:
        - destination:
            host: db1
    ```

    This creates both a route to contact the API server on the REC (`rec1`) and a route to contact one of the databases (`db1`).

    - Replace `.istio.k8s.my.example.com` with the domain that matches your DNS record.
    - The gateway's metadata name must be similar to the gateway's spec name (`redis-gateway` in this example).
   
1. Apply `VirtualService` custom resource file to create the virtual service.

    ```sh
    kubectl apply -f redis-vs.yaml
    ```

1. Verify the virtual service was created successfully.

    ```sh
    kubectl get vs

    NAME       GATEWAYS            HOSTS                              AGE
    redis-vs   ["redis-gateway"]   ["*.istio.k8s.my.example.com"]   3h33m
    ```

1. [Deploy the operator]({{< relref "/operate/kubernetes/deployment/quick-start.md" >}}), Redis Enterprise Cluster (REC), and Redis Enterprise Database (REDB) on the same namespace as the gateway and virtual service.

## Test your external access to the database

To [test your external access]({{< relref "/operate/kubernetes/networking/ingress.md" >}}) to the database, you need a client that supports [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) and [SNI](https://en.wikipedia.org/wiki/Server_Name_Indication).

See [Test your access with Openssl]({{< relref "/operate/kubernetes/networking/ingress#test-your-access-with-openssl" >}}) or [Test your access with Python]({{< relref "/operate/kubernetes/networking/ingress#test-your-access-with-python" >}}) for more info.
