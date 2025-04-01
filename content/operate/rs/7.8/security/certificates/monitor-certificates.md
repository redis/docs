---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Monitor certificates on a Redis Enterprise cluster.
linkTitle: Monitor certificates
title: Monitor certificates
weight: 10
url: '/operate/rs/7.8/security/certificates/monitor-certificates/'
---

You can monitor certificates used by Redis Enterprise Software.

### Monitor certificates with Prometheus

Redis Enterprise Software exposes the expiration time (in seconds) of each certificate on each node. To learn how to monitor Redis Enterprise Software metrics using Prometheus, see the [Prometheus integration quick start]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}}).

Here are some examples of the `node_cert_expiration_seconds` metric:

```sh
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="cm",node="1",path="/etc/opt/redislabs/cm_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="api",node="1",path="/etc/opt/redislabs/api_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="proxy",node="1",path="/etc/opt/redislabs/proxy_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="metrics_exporter",node="1",path="/etc/opt/redislabs/metrics_exporter_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="syncer",node="1",path="/etc/opt/redislabs/syncer_cert.pem"} 31104000.0
```

The following certificates relate to [internode communication TLS encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) and are automatically rotated by Redis Enterprise Software:

```sh
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="ccs_internode_encryption",node="1",path="/etc/opt/redislabs/ccs_internode_encryption_cert.pem"} 2592000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="data_internode_encryption",node="1",path="/etc/opt/redislabs/data_internode_encryption_cert.pem"} 2592000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="mesh_ca_signed",node="1",path="/etc/opt/redislabs/mesh_ca_signed_cert.pem"} 2592000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="gossip_ca_signed",node="1",path="/etc/opt/redislabs/gossip_ca_signed_cert.pem"} 2592000.0
```
