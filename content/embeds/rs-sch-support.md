| Upgrade method | SCH support | Expected behavior |
| --- | --- | --- |
| [Rolling upgrade]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#rolling-upgrade" >}}) | Full | New nodes and old ones removed sequentially. SCH pre-handoffs and relaxed timeouts greatly reduce disruptions during the upgrade. |
| [In-place upgrade]({{< relref "/operate/rs/installing-upgrading/upgrading/upgrade-cluster#in-place-upgrade" >}}) | Partial | Relaxed timeouts reduce errors but there are no pre-handoffs. Disconnections occur when processes are replaced during the upgrade, so clients should rely on auto-reconnect, which will cause brief lapses in service. |
| [Maintenance mode]({{< relref "/operate/rs/clusters/maintenance-mode" >}}) | Full | SCH is fully supported during hardware or OS patching operations. Pre-handoffs and relaxed timeouts minimize application impact. |
