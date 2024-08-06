
Redis Enterprise Software is supported on several operating systems, cloud environments, and virtual environments.

## Supported platforms

<span title="Check mark icon">&#x2705;</span> Supported – The platform is supported for this version of Redis Enterprise Software and Redis Stack modules.

<span title="Warning icon" class="font-serif">:warning:</span> Deprecation warning – The platform is still supported for this version of Redis Enterprise Software, but support will be removed in a future release.

| Redis Software<br />major versions | 7.6 | 7.4 | 7.2 | 6.4 | 6.2 |
|---------------------------------|:-----:|:-----:|:-----:|:-----:|:-----:|
| **Release date** | Aug 2024 | Feb 2024 | Aug 2023 | Feb 2023 | Aug 2021 |
| [**End-of-life date**]({{< relref "/operate/rs/installing-upgrading/product-lifecycle#endoflife-schedule" >}}) | Determined after<br />next major release | TBA | Feb 2026 | Aug 2025 | Feb 2025 |
| **Platforms** | | | | | |
| RHEL 9 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – | – | – |
| RHEL 8 &<br />compatible distros<sup>[1](#table-note-1)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| RHEL 7 &<br />compatible distros<sup>[1](#table-note-1)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 20.04<sup>[2](#table-note-2)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Ubuntu 18.04<sup>[2](#table-note-2)</sup> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Ubuntu 16.04<sup>[2](#table-note-2)</sup> | – | – | <span title="Deprecated" class="font-serif">:warning:</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Amazon Linux 2 | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | – |
| Amazon Linux 1 | – | – | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Kubernetes<sup>[3](#table-note-3)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |
| Docker<sup>[4](#table-note-4)</sup> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> | <span title="Supported">&#x2705;</span> |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>The RHEL-compatible distributions CentOS, CentOS Stream, Alma, and Rocky are supported if they have full RHEL compatibility. Oracle Linux running the Red Hat Compatible Kernel (RHCK) is supported, but the Unbreakable Enterprise Kernel (UEK) is not supported.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>The server version of Ubuntu is recommended for production installations. The desktop version is only recommended for development deployments.

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>See the [Redis Enterprise for Kubernetes documentation]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}}) for details about support per version and Kubernetes distribution.

4. <a name="table-note-4" style="display: block; height: 80px; margin-top: -80px;"></a>
[Docker images]({{< relref "/operate/rs/installing-upgrading/quickstarts/docker-quickstart" >}}) of Redis Enterprise Software are certified for development and testing only.

The following table shows which Redis Enterprise Software version first tested and added support for each RHEL version:

| RHEL version | Redis Enterprise version |
|--------------|--------------------------|
| 8.4 | 6.2.8 |
| 8.5 | 6.2.10 |
| 8.6 | 6.2.10 |
| 8.7 | 6.4.2 |
| 8.8 | 6.4.2 |
| 8.9 | 7.2.4 |
| 9.3 | 7.4.2 |

## Operating system compatibility policy

Redis maintains a list of [supported operating systems](#supported-platforms) for each major version of Redis Enterprise Software and the specific OS versions tested with Redis Enterprise releases. Because the list is updated as new OS versions are introduced and old ones become obsolete, we encourage you to check the list and plan upgrades accordingly. We also suggest you keep Redis Enterprise and corresponding supported OS versions up to date.

We thoroughly test the most recent minor version of each supported major OS to ensure the best compatibility and performance with every Redis Enterprise release. This process helps detect and address potential compatibility issues early on.

Due to the vast array of minor updates and variations across operating systems, we cannot test compatibility with every minor OS version and each Redis Enterprise version. However, because OS vendors each have an Application Binary Interface (ABI) they support and avoid breaking, except to address severe security issues, newer minor OS versions are generally expected to work correctly. We will add a note to this document if specific OS minor versions have significant ABI or dependency changes. An earlier OS minor version also might work, although it is not guaranteed.

Despite our rigorous testing, we recommend users test their Redis applications with any new OS update before deploying it in a production environment. This additional testing layer can help identify any unique issues in your setup.

### Red Hat Enterprise Linux (RHEL) 

Red Hat has a well-defined lifecycle for support. For details, see [Red Hat Enterprise Linux Life Cycle](https://access.redhat.com/support/policy/updates/errata#RHEL8_and_9_Life_Cycle).

Redis supports and tests RHEL 8 and 9 minor releases and extended update support timeframes. However, none of the longer Red Hat support cycles, such as SAP and EEUS, are supported.

We only support what the vendor supports in accordance with their policies. When Red Hat no longer supports a particular release, it is no longer supported by Redis as well. If future Redis Enterprise releases will not support a major RHEL version, the release notes and the [supported platforms](#supported-platforms) table will include deprecation warnings.

### RHEL clones and equivalent Enterprise OS 

The [supported platforms](#supported-platforms) table lists the versions of Red Hat Enterprise Linux (RHEL) that Redis supports. This support extends to the ABI and package compatibility with RHEL of the same version.

The RHEL-compatible distributions CentOS, CentOS Stream, Alma Linux, Rocky Linux, and Oracle Linux running the Red Hat Compatible Kernel (RHCK) are supported if they provide full RHEL compatibility. If Redis identifies or questions some incompatibility from a clone, you might be asked to test on another clone or RHEL directly.

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

### OpenSSL compatibility issue for 7.4.2 modules on Amazon Linux 2

Due to an OpenSSL 1.1 compatibility issue between modules and clusters, Redis Enterprise Software version 7.4.2-54 is not fully supported on Amazon Linux 2 clusters with databases that use the following modules: RedisGears, RediSearch, or RedisTimeSeries.

This issue will be fixed in a future maintenance release.

### RedisGraph prevents upgrade to RHEL 9 

You cannot upgrade from a prior RHEL version to RHEL 9 if the Redis Enterprise cluster contains a RedisGraph module, even if unused by any database. The [RedisGraph module has reached End-of-Life](https://redis.com/blog/redisgraph-eol/) and is completely unavailable in RHEL 9.

## Virtualization platforms

Redis Enterprise Software is compatible with VMware and other similar virtualization platforms. Make sure to do the following:

- Configure your memory, CPU, network, and storage settings to allow for optimal Redis Enterprise performance.
- Pin each Redis Enterprise shard to a specific ESX or ESXi host by setting the appropriate affinity rules.
- If you must manually migrate a virtual machine to another host, follow the best practices for [shard maintenance]({{<relref "/operate/rs/clusters/maintenance-mode">}}) and contact support if you have questions.
- Turn off VMware VMotion because Redis Enterprise is not compatible with VMotion.
- Don't use snapshots because Redis Enterprise cluster manages states dynamically, so a snapshot might not have the correct node and cluster states.
