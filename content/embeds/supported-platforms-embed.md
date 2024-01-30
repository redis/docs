---
{}
---

Redis Enterprise Software is supported on several operating systems, cloud environments, and virtual environments.

## Supported platforms

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software.

<span title="Warning icon">&#x26A0;&#xFE0F;</span> Deprecated – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

<span title="X icon">&#x274c;</span> End of life – Platform support ended in this version of Redis Enterprise Software.

| Redis Enterprise | 7.2.4 | 6.4.2 | 6.2.18 | 6.2.12 | 6.2.10 | 6.2.8 | 6.2.4 |
|------------------|-------|-------|--------|--------|--------|--------|-------|
| **Release date** | Aug<br />2023 | Feb<br />2023 | Sept<br />2022 | Aug<br />2022 | Feb<br />2022 | Oct<br />2021 | Aug<br />2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | – | Feb<br />2025 | Aug<br />2024 | Aug<br />2024 | Aug<br />2024 | Aug<br />2024 | Aug<br />2024 |
| **Ubuntu**<sup>[1](#table-note-1)</sup> |
| 20.04 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span><sup>[6](#table-note-6)</sup> | – | – | – | – | – |
| 18.04 | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported"><span title="Supported">&#x2705;</span></span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| 16.04 | <span title="End of life">&#x274c;</span> | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **RHEL & CentOS**<sup>[2](#table-note-2)</sup>
| 8.8 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span><sup>[8](#table-note-8)</sup> | – | – | – | – | – |
| 8.7 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – | – |
| 8.5-8.6 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – |
| 8.0-8.4 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| 7.0-7.9 | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Oracle Linux**<sup>[3](#table-note-3)</sup> |
| 8 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – |
| 7 | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Rocky Linux**<sup>[3](#table-note-3)</sup> |
| 8 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – | – |
| **Amazon Linux** |
| 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span><sup>[7](#table-note-7)</sup> | – | – | – | – | – |
| 1 | <span title="Deprecated">&#x26A0;&#xFE0F;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Docker**<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| **Kubernetes**<sup>[5](#table-note-5)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>RHEL and CentOS deployments require OpenSSL 1.0.2 and [firewall configuration]({{< relref "/operate/rs/installing-upgrading/configuring/centos-rhel-firewall" >}}).

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>Based on the corresponding RHEL version.

4. <a name="table-note-4" style="display: block; height: 80px; margin-top: -80px;"></a>
[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

5. <a name="table-note-5" style="display: block; height: 80px; margin-top: -80px;"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes" >}}).

6. <a name="table-note-6" style="display: block; height: 80px; margin-top: -80px;"></a>Ubuntu 20.04 support was added in Redis Enterprise Software [6.4.2-43]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-43" >}}).

7. <a name="table-note-7" style="display: block; height: 80px; margin-top: -80px;"></a>A release candidate for Amazon Linux 2 support was added in Redis Enterprise Software [6.4.2-61]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-61" >}}). Official support for Amazon Linux 2 was added in Redis Enterprise Software [6.4.2-69]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-69" >}}).

8. <a name="table-note-8" style="display: block; height: 80px; margin-top: -80px;"></a>Redis Enterprise Software [6.4.2-103]({{< relref "/operate/rs/release-notes/rs-6-4-2-releases/rs-6-4-2-103" >}}) and later supports RHEL 8.8.

## Operating system limitations

### TLS 1.0 and TLS 1.1

Redis Enterprise Software version 6.2.8 removed support for TLS 1.0 and TLS 1.1 on Red Hat Enterprise Linux 8 (RHEL 8) because that operating system [does not enable support](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/security_hardening/using-the-system-wide-cryptographic-policies_security-hardening) for these versions by default.  

### Ubuntu 20 rejects SHA1 certificates

With Ubuntu 20.04, you cannot use the SHA1 hash algorithm because [OpenSSL's security level is set to 2 by default](https://manpages.ubuntu.com/manpages/focal/man3/SSL_CTX_set_security_level.3ssl.html#notes). As a result, the operating system rejects SHA1 certificates, even if you enable the `mtls_allow_weak_hashing` option.

To avoid issues with SHA1 certificates, replace them with new certificates that use SHA-256. Note that certificates provided by Redis Enterprise Software use SHA-256.

### Upgrade RHEL when using modules

RHEL 7 clusters cannot be directly upgraded to RHEL 8 when hosting databases using modules, due to binary differences in modules between the two operating systems. Instead, you need to create a new cluster on RHEL 8 and then migrate existing data from your RHEL 7 cluster. This does not apply to clusters that do not use modules.

This limitation is fixed for clusters using Redis Enterprise Software version 7.2.4 and later.

### Modules cannot load in Oracle Linux 7 & 8

Databases hosted on Oracle Linux 7 & 8 cannot load modules.

As a temporary workaround, you can change the node's `os_name` in the Cluster Configuration Store (CCS):

```sh
ccs-cli hset node:<ID> os_name rhel
```

This limitation was fixed in [Redis Enterprise Software version 7.2.4-64]({{< relref "/operate/rs/release-notes/rs-7-2-4-releases/rs-7-2-4-64" >}}).

## Virtualization platforms

Redis Enterprise Software is compatible with VMware and other similar virtualization platforms. Make sure to do the following:

- Configure your memory, CPU, network, and storage settings to allow for optimal Redis Enterprise performance.
- Pin each Redis Enterprise shard to a specific ESX or ESXi host by setting the appropriate affinity rules.
- If you must manually migrate a virtual machine to another host, follow the best practices for shard maintenance and contact support if you have questions.
- Turn off VMware VMotion because Redis Enterprise is not compatible with VMotion.
- Don't use snapshots because Redis Enterprise cluster manages states dynamically, so a snapshot might not have the correct node and cluster states.
