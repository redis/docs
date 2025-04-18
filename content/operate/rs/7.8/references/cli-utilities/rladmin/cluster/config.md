---
Title: rladmin cluster config
alwaysopen: false
categories:
- docs
- operate
- rs
description: Updates the cluster's configuration.
headerRange: '[1-2]'
linkTitle: config
tags:
- configured
toc: 'true'
weight: $weight
url: '/operate/rs/7.8/references/cli-utilities/rladmin/cluster/config/'
---

Updates the cluster configuration.

```sh
 rladmin cluster config 
        [ auditing db_conns audit_protocol { TCP | local } 
           audit_address <audit_address> audit_port <audit_port> ]
        [bigstore_driver {speedb | rocksdb} ]
        [ control_cipher_suites <BoringSSL cipher list> ]
        [ cm_port <number> ]
        [ cm_session_timeout_minutes <minutes> ]
        [ cnm_http_port <number> ]
        [ cnm_https_port <number> ]
        [ crdb_coordinator_port <number> ]
        [ data_cipher_list <openSSL cipher list> ]
        [ data_cipher_suites_tls_1_3 <openSSL cipher list> ]
        [ debuginfo_path <filepath> ]
        [ encrypt_pkeys { enabled | disabled } ]
        [ envoy_admin_port <new-port> ]
        [ envoy_mgmt_server_port <new-port> ]
        [ gossip_envoy_admin_port <new-port> ]
        [ handle_redirects { enabled | disabled } ]
        [ handle_metrics_redirects { enabled | disabled } ]
        [ http_support { enabled | disabled } ]
        [ ipv6 { enabled | disabled } ]
        [ min_control_TLS_version { 1.2 | 1.3 } ]
        [ min_data_TLS_version { 1.2 | 1.3 } ]
        [ min_sentinel_TLS_version { 1.2 | 1.3 } ]
        [ reserved_ports <list of ports/port ranges> ]
        [ s3_url <URL> ]
        [ s3_ca_cert <filepath> ]
        [ saslauthd_ldap_conf </tmp/ldap.conf> ]
        [ sentinel_tls_mode { allowed | required | disabled } ]
        [ sentinel_cipher_suites <golang cipher list> ]
        [ services { cm_server | crdb_coordinator | crdb_worker | 
                     mdns_server | pdns_server | saslauthd | 
                     stats_archiver } { enabled | disabled } ]
        [ upgrade_mode { enabled | disabled } ]
```

### Parameters

| Parameter | Type/Value | Description |
|-----------|------------|-------------|
| audit_address | string | TCP/IP address where a listener can capture [audit event notifications]({{< relref "/operate/rs/7.8/security/audit-events" >}}) |
| audit_port | string | Port where a listener can capture [audit event notifications]({{< relref "/operate/rs/7.8/security/audit-events" >}}) |
| audit_protocol | `tcp`<br/>`local` | Protocol used for [audit event notifications]({{< relref "/operate/rs/7.8/security/audit-events" >}})<br/>For production systems, only `tcp` is supported. |
| control_cipher_suites | list of ciphers | Cipher suites used for TLS connections to the Cluster Manager UI (specified in the format understood by the BoringSSL library)<br />(previously named `cipher_suites`) |
| cm_port | integer | UI server listening port |
| cm_session_timeout_minutes | integer | Timeout in minutes for the CM session
| cnm_http_port | integer | HTTP REST API server listening port |
| cnm_https_port | integer | HTTPS REST API server listening port |
| crdb_coordinator_port | integer, (range:&nbsp;1024-65535) (default:&nbsp;9081) | CRDB coordinator port |
| data_cipher_list | list of ciphers | Cipher suites used by the the data plane (specified in the format understood by the OpenSSL library) |
| data_cipher_suites_tls_1_3 |  list of ciphers | Specifies the enabled TLS 1.3 ciphers for the data plane |
| debuginfo_path | filepath | Local directory to place generated support package files |
| encrypt_pkeys | `enabled`<br />`disabled` | Enable or turn off encryption of private keys |
| envoy_admin_port | integer, (range:&nbsp;1024-65535) | Envoy admin port. Changing this port during runtime might result in an empty response because envoy serves as the cluster gateway.|
| envoy_mgmt_server_port | integer, (range:&nbsp;1024-65535) | Envoy management server port|
| gossip_envoy_admin_port | integer, (range:&nbsp;1024-65535) | Gossip envoy admin port|
| handle_redirects | `enabled`<br />`disabled` | Enable or turn off handling DNS redirects when DNS is not configured and running behind a load balancer |
| handle_metrics_redirects | `enabled`<br />`disabled` | Enable or turn off handling cluster redirects internally for Metrics API |
| http_support | `enabled`<br />`disabled` | Enable or turn off using HTTP for REST API connections |
| ipv6 | `enabled`<br />`disabled` | Enable or turn off IPv6 connections to the Cluster Manager UI |
| min_control_TLS_version | `1.2`<br />`1.3` | The minimum TLS protocol version that is supported for the control path |
| min_data_TLS_version | `1.2`<br />`1.3` | The minimum TLS protocol version that is supported for the data path |
| min_sentinel_TLS_version | `1.2`<br />`1.3` | The minimum TLS protocol version that is supported for the discovery service |
| reserved_ports | list of ports/port ranges | List of reserved ports and/or port ranges to avoid using for database endpoints (for example `reserved_ports 11000 13000-13010`) |
| s3_url | string | The URL of S3 export and import |
| s3_ca_cert | string | The CA certificate filepath for S3 export and import |
| saslauthd_ldap_conf | filepath | Updates LDAP authentication configuration for the cluster |
| sentinel_cipher_suites | list of ciphers | Cipher suites used by the discovery service (supported ciphers are implemented by the [cipher_suites.go](<https://golang.org/src/crypto/tls/cipher_suites.go>) package) |
| sentinel_tls_mode | `allowed`<br />`required`<br />`disabled` | Define the SSL policy for the discovery service<br />(previously named `sentinel_ssl_policy`) |
| services | `cm_server`<br />`crdb_coordinator`<br />`crdb_worker`<br />`mdns_server`<br />`pdns_server`<br />`saslauthd`<br />`stats_archiver`<br /><br />`enabled`<br />`disabled` | Enable or turn off selected cluster services |
| upgrade_mode | `enabled`<br />`disabled` | Enable or turn off upgrade mode on the cluster |

### Returns

Reports whether the cluster was configured successfully. Displays an error message if the configuration attempt fails.

### Example

```sh
$ rladmin cluster config cm_session_timeout_minutes 20
Cluster configured successfully
```
