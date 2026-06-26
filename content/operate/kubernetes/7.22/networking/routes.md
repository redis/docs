---
Title: Use OpenShift routes for external database access
alwaysOpen: false
categories:
- docs
- operate
- kubernetes
description: null
linkTitle: OpenShift routes
weight: 15
url: '/operate/kubernetes/7.22/networking/routes/'
---

OpenShift routes allow requests to be routed to the database or cluster API from outside the cluster. For more information about routes, see [OpenShift documentation](https://docs.openshift.com/container-platform/4.13/networking/routes/route-configuration.html).

## Prerequisites

* Before you can connect to your database from outside the cluster, you'll need the root CA certificate of the DMC Proxy server to validate the server certificate.

  By default, the DMC Proxy uses a self-signed certificate.  You can retrieve it from the Redis Enterprise admin console, or from the machine at `/etc/opt/redislabs/proxy_cert.pem` (default location), and save it as a file (for example, named "ca.pem") on the client machine.

* Your database also needs TLS encryption enabled.

## Create OpenShift route

1. Select the **Networking/Routes** section of the OpenShift web console.

1. Select **Create route** and fill out the following fields:

   * **Name**: Choose any name you want as the first part of your generated hostname
   * **Hostname**: Leave blank
   * **Path**: Leave as is ("/")
   * **Service**: Select the service for the database you want to access
   * **TLS Termination**: Choose "passthrough"
   * **Insecure Traffic**: Select "None"

1. Select **Create**.

1. Find the hostname for your new route. After route creation, it appears in the "Host" field.

1. Verify you have a DNS entry to resolve the hostname for your new route to the cluster's load balancer.

## Access database

Access the database from outside the cluster using `redis-cli` or `openssl`.

To connect with `redis-cli`:
  
   ```sh
   redis-cli -h <hostname> -p 443 --tls --cacert ./ca.pem --sni <hostname>
   ```

Replace the `<hostname>` value with the hostname for your new route.

To connect with `openssl`:

   ```sh
   openssl s_client -connect <hostname>:443 -crlf -CAfile ./ca.pem -servername <hostname>
   ```
