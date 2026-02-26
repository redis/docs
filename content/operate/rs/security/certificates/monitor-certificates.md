---
alwaysopen: false
categories:
- docs
- operate
- rs
description: Monitor certificates on a Redis Software cluster.
linkTitle: Monitor certificates
title: Monitor certificates
weight: 10
---

Redis Software exposes the expiration time in seconds of each certificate on each node. You can use Prometheus to monitor these certificates.

To learn how to monitor Redis Software metrics using Prometheus, see [Monitoring with metrics and alerts]({{<relref "/operate/rs/monitoring">}}) and the [Prometheus integration quick start]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}}).

## V1 metrics

The [v1 metrics]({{<relref "/operate/rs/monitoring/v1_monitoring">}}) endpoint (`https://<cluster_name>:8070/`) uses `node_cert_expiration_seconds`.

### Certificate expiration in seconds {#v1-cert-expire-seconds}

```sh
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="cm",node="1",path="/etc/opt/redislabs/cm_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="api",node="1",path="/etc/opt/redislabs/api_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="proxy",node="1",path="/etc/opt/redislabs/proxy_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="metrics_exporter",node="1",path="/etc/opt/redislabs/metrics_exporter_cert.pem"} 31104000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="syncer",node="1",path="/etc/opt/redislabs/syncer_cert.pem"} 31104000.0
```

The following certificates relate to [internode communication TLS encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) and are automatically rotated by Redis Software:

```sh
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="ccs_internode_encryption",node="1",path="/etc/opt/redislabs/ccs_internode_encryption_cert.pem"} 2592000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="data_internode_encryption",node="1",path="/etc/opt/redislabs/data_internode_encryption_cert.pem"} 2592000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="mesh_ca_signed",node="1",path="/etc/opt/redislabs/mesh_ca_signed_cert.pem"} 2592000.0
node_cert_expiration_seconds{cluster="mycluster.local",logical_name="gossip_ca_signed",node="1",path="/etc/opt/redislabs/gossip_ca_signed_cert.pem"} 2592000.0
```

## V2 metrics

The [v2 metrics]({{<relref "/operate/rs/monitoring/metrics_stream_engine">}}) endpoint (`https://<cluster_name>:8070/v2`) uses `node_cert_expires_in_seconds`.

### Certificate expiration in seconds {#v2-cert-expire-seconds}

```sh
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="cm",node="1",path="/etc/opt/redislabs/cm_cert.pem"} 31104000.0
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="api",node="1",path="/etc/opt/redislabs/api_cert.pem"} 31104000.0
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="proxy",node="1",path="/etc/opt/redislabs/proxy_cert.pem"} 31104000.0
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="metrics_exporter",node="1",path="/etc/opt/redislabs/metrics_exporter_cert.pem"} 31104000.0
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="syncer",node="1",path="/etc/opt/redislabs/syncer_cert.pem"} 31104000.0
```

The following certificates relate to [internode communication TLS encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) and are automatically rotated by Redis Software:

```sh
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="ccs_internode_encryption",node="1",path="/etc/opt/redislabs/ccs_internode_encryption_cert.pem"} 2592000.0
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="data_internode_encryption",node="1",path="/etc/opt/redislabs/data_internode_encryption_cert.pem"} 2592000.0
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="mesh_ca_signed",node="1",path="/etc/opt/redislabs/mesh_ca_signed_cert.pem"} 2592000.0
node_cert_expires_in_seconds{cluster="mycluster.local",logical_name="gossip_ca_signed",node="1",path="/etc/opt/redislabs/gossip_ca_signed_cert.pem"} 2592000.0
```

### Certificate expiration in days {#v2-cert-expire-days}

```sh
max by(filename) (
  max_over_time(node_cert_expires_in_seconds{cluster="$cluster", filename=~"api_cert.pem|cm_cert.pem|metrics_exporter_cert.pem|proxy_cert.pem|syncer_cert.pem|trusted_ca.pem"}[5m])
) / 86400
```

The following certificates relate to [internode communication TLS encryption]({{< relref "/operate/rs/security/encryption/internode-encryption" >}}) and are automatically rotated by Redis Software:

```sh
max by(filename) (
  max_over_time(node_cert_expires_in_seconds{cluster="$cluster", filename=~"ccs_internode_encryption_cert.pem|data_internode_encryption_cert.pem|mesh_ca_signed_cert.pem|gossip_ca_signed_cert.pem"}[5m])
) / 86400
```

