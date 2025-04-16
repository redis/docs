---
Title: Connect to the admin console
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Connect to the Redis Enterprise admin console to manage your Redis Enterprise
  cluster.
linkTitle: Connect to the admin console
weight: 10
url: '/operate/kubernetes/7.8.4/re-clusters/connect-to-admin-console/'
---

The username and password for the Redis Enterprise Software [admin console]({{< relref "/operate/rs/" >}}) are stored in a Kubernetes [secret](https://kubernetes.io/docs/concepts/configuration/secret/). After retrieving your credentials, you can use port forwarding to connect to the admin console.

{{<note>}}
There are several methods for accessing the admin console. Port forwarding is the simplest, but not the most efficient method for long-term use. You could also use a load balancer service or Ingress. 
{{</note>}}

1. Switch to the namespace with your Redis Enterprise cluster (REC).

    ```sh
    kubectl config set-context --current --namespace=<namespace-of-rec>
    ```

1. Find your cluster name from your list of secrets.

    ```sh
    kubectl get secret
    ```

    In this example, the cluster name is `rec`.

1. Extract and decode your credentials from the secret.

    ```sh
    kubectl get secret <cluster-name> -o jsonpath='{.data.username}' | base64 --decode
    kubectl get secret <cluster-name> -o jsonpath='{.data.password}' | base64 --decode
    ```

1. Find the port for the REC UI service in the `spec:ports` section of the service definition file.

    ```sh
    kubectl get service/<cluster-name>-ui -o yaml
    ```

    {{<note>}}
    The default port is 8443.
    {{</note>}}

1. Use `kubectl port-forward` to forward your local port to the service port.

    ```sh
    kubectl port-forward service/<cluster-name>-ui <local-port>:<service-port>
   ```

1. View the admin console from a web browser on your local machine at `https://localhost:8443`.

