---
Title: BDB object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a database
hideListLinks: true
linkTitle: bdb
weight: $weight
---

An API object that represents a managed database in the cluster.

| Name | Type/Value & Description |
|------|-------------------------|
| uid | integer; Cluster unique ID of database. Can be set during creation but cannot be updated. |
| account_id | integer; SM account ID |
| action_uid | string; Currently running action's UID (read-only) |
| active_defrag_cycle_max | integer, (range: 1-99); Maximum CPU percentage used for defragmentation when the upper threshold is reached |
| active_defrag_cycle_min | integer, (range: 1-99) (default: 1); Minimal CPU percentage used for defragmentation when the lower threshold is reached |
| active_defrag_ignore_bytes | string (default: 100mb); Minimum amount of fragmentation waste to start active defragmentation |
| active_defrag_max_scan_fields | integer (default: 1000); Maximum number of set/hash/zset/list fields that will be processed from the main dictionary scan |
| active_defrag_threshold_lower | integer, (range: 0-1000) (default: 10); Minimum percentage of fragmentation to start active defragmentation |
| active_defrag_threshold_upper | integer, (range: 0-1000) (default: 100); Maximum percentage of fragmentation at which maximum effort is used |
| activedefrag | Enable or turn off active defragmentation functionality.<br />Values:<br />'yes'<br />**'no'** |
| aof_policy | Policy for Append-Only File data persistence<br />Values:<br />**'appendfsync-every-sec'** <br />'appendfsync-always' |
| authentication_admin_pass | string; Password for administrative access to the BDB (used for SYNC from the BDB) |
| authentication_redis_pass | string; Redis AUTH password authentication.  <br/>Use for Redis databases only.  Ignored for memcached databases. (deprecated as of Redis Enterprise v7.2, replaced with multiple passwords feature in version 6.0.X) |
| authentication_sasl_pass | string; Binary memcache SASL password |
| authentication_sasl_uname | string; Binary memcache SASL username (pattern does not allow special characters &,\<,>,") |
| authentication_ssl_client_certs | {{<code>}}[{<br />  "client_cert": string<br />}, ...]{{</code>}} List of authorized client certificates<br />**client_cert**: X.509 PEM (base64) encoded certificate |
| authentication_ssl_crdt_certs | {{<code>}}[{<br />  "client_cert": string<br />}, ...]{{</code>}} List of authorized CRDT certificates<br />**client_cert**: X.509 PEM (base64) encoded certificate |
| authorized_names | array of strings; Additional certified names (deprecated as of Redis Enterprise v6.4.2; use authorized_subjects instead) |
| authorized_subjects | {{<code>}}[{<br />  "CN": string,<br />  "O": string,<br />  "OU": [array of strings],<br />  "L": string,<br />  "ST": string,<br />  "C": string<br />}, ...]{{</code>}} A list of valid subjects used for additional certificate validations during TLS client authentication. All subject attributes are case-sensitive.<br />**Required subject fields**:<br />"CN" for Common Name<br />**Optional subject fields:**<br />"O" for Organization<br />"OU" for Organizational Unit (array of strings)<br />"L" for Locality (city)<br />"ST" for State/Province<br />"C" for 2-letter country code |
| auto_shards_balancing | boolean (default: false); Automatically balance database shards |
| <span class="break-all">auto_shards_balancing_grace_period</span> | integer (default: 120); Time to wait before auto sharding is initiated |
| auto_upgrade | boolean (default:&nbsp;false); Upgrade the database automatically after a cluster upgrade |
| avoid_nodes | array of strings; Cluster node UIDs to avoid when placing the database's shards and binding its endpoints |
| background_op | Deprecated as of Redis Enterprise Software v7.8.2. Use [`GET /v1/actions/bdb/<bdb_uid>`]({{<relref "/operate/rs/references/rest-api/requests/actions/bdb">}}) instead.<br />{{<code>}}[{<br />  "status": string,<br />  "name": string,<br />  "error": object,<br />  "progress": number<br />}, ...]{{</code>}} (read-only); **progress**: Percent of completed steps in current operation |
| backup | boolean (default:&nbsp;false); Policy for periodic database backup |
| backup_failure_reason | Reason of last failed backup process (read-only)<br />Values:<br />'no-permission'<br />'wrong-file-path'<br />'general-error' |
| backup_history | integer (default:&nbsp;0); Backup history retention policy (number of days, 0 is forever) |
| backup_interval | integer; Interval in seconds in which automatic backup will be initiated |
| backup_interval_offset | integer; Offset (in seconds) from round backup interval when automatic backup will be initiated (should be less than backup_interval) |
| backup_location | [complex object]({{< relref "/operate/rs/references/rest-api/objects/bdb/backup_location" >}});  Target for automatic database backups. <br />Call `GET`&nbsp;`/jsonschema` to retrieve the object's structure. |
| backup_progress | number, <nobr>(range: 0-100)</nobr>;  Database scheduled periodic backup progress (percentage) (read-only) |
| backup_status | Status of scheduled periodic backup process (read-only)<br />Values:<br />'exporting'<br />'succeeded'<br />'failed' |
| bigstore | boolean (default:&nbsp;false);  Database bigstore option |
| bigstore_ram_size | integer (default:&nbsp;0);  Memory size of bigstore RAM part. |
| bigstore_ram_weights | {{<code>}}[{<br />  "shard_uid": integer,<br />  "weight": number<br />}, ...]{{</code>}} List of shard UIDs and their bigstore RAM weights;<br /> **shard_uid**: Shard UID;<br /> **weight**: Relative weight of RAM distribution |
| bigstore_version | The database's `bigstore_version`:<br />• `1` for Auto Tiering (Redis on Flash version 1). Default version.<br/>• `2` for Redis Flex (Redis on Flash version 2) on databases that support it. Can only be used with the `speedb` driver.<br /><br />You can only choose the `bigstore_version` for databases with Redis version 7.4. Database versions earlier than 7.4 use `bigstore_version` `1`. Database versions 8.0 and later use `bigstore_version` `2`. |
| client_cert_subject_validation_type | Enables additional certificate validations that further limit connections to clients with valid certificates during TLS client authentication.<br />Values:<br />**disabled**: Authenticates clients with valid certificates. No additional validations are enforced.<br />**san_cn**: A client certificate is valid only if its Common Name (CN) matches an entry in the list of valid subjects. Ignores other Subject attributes.<br />**full_subject**: A client certificate is valid only if its Subject attributes match an entry in the list of valid subjects. |
| conns | integer (default&nbsp;5);  Number of internal proxy connections |
| <span class="break-all">conns_global_maximum_dedicated</span> | integer (default: 0); Defines the maximum number of dedicated server connections for a given database. The total number across all workers. The default is 0 for unlimited. |
| conns_minimum_dedicated | integer (default:&nbsp;2); Number of dedicated server connections the DMC has per worker per shard |
| conns_type | Connections limit type<br />Values:<br />**‘per-thread’**<br />‘per-shard’ |
| crdt | boolean (default:&nbsp;false);  Use CRDT-based data types for multi-master replication |
| crdt_causal_consistency | boolean (default:&nbsp;false);  Causal consistent CRDB. |
| crdt_config_version | integer;  Replica-set configuration version, for internal use only. |
| crdt_featureset_version | integer;  CRDB active FeatureSet version |
| crdt_ghost_replica_ids | string;  Removed replicas IDs, for internal use only. |
| crdt_guid | string;  GUID of CRDB this database belongs to, for internal use only. |
| crdt_modules | string;  CRDB modules information. The string representation of a JSON list, containing hashmaps. |
| crdt_protocol_version | integer;  CRDB active Protocol version |
| crdt_repl_backlog_size | string;  Active-Active replication backlog size ('auto' or size in bytes) |
| crdt_replica_id | integer;  Local replica ID, for internal use only. |
| crdt_replicas | string;  Replica set configuration, for internal use only. |
| crdt_sources | array of [syncer_sources]({{< relref "/operate/rs/references/rest-api/objects/bdb/syncer_sources" >}}) objects; Remote endpoints/peers of CRDB database to sync from. See the 'bdb -\> replica_sources' section |
| crdt_sync | Enable, disable, or pause syncing from specified crdt_sources. Applicable only for Active-Active databases. See [replica_sync]({{< relref "/operate/rs/references/rest-api/objects/bdb/replica_sync" >}}) for more details.<br />Values:<br />'enabled'<br /> **'disabled'** <br />'paused'<br />'stopped' |
| <span class="break-all">crdt_sync_connection_alarm_timeout_seconds</span> | integer (default: 0); If the syncer takes longer than the specified number of seconds to connect to an Active-Active database, raise a connection alarm |
| crdt_sync_dist | boolean;  Enable/disable distributed syncer in master-master |
| crdt_syncer_auto_oom_unlatch | boolean (default:&nbsp;true);  Syncer automatically attempts to recover synchronisation from peers after this database throws an Out-Of-Memory error. Otherwise, the syncer exits |
| crdt_xadd_id_uniqueness_mode | XADD strict ID uniqueness mode. CRDT only.<br />Values:<br />‘liberal’<br />**‘strict’**<br />‘semi-strict’ |
| created_time | string;  The date and time the database was created (read-only) |
| data_internode_encryption | boolean;  Should the data plane internode communication for this database be encrypted |
| data_persistence | Database on-disk persistence policy. For snapshot persistence, a [snapshot_policy]({{< relref "/operate/rs/references/rest-api/objects/bdb/snapshot_policy" >}}) must be provided<br />Values:<br />**'disabled'** <br />'snapshot'<br />'aof' |
| dataset_import_sources | [complex object]({{< relref "/operate/rs/references/rest-api/objects/bdb/dataset_import_sources" >}});  Array of source file location description objects to import from when performing an import action. This is write-only and cannot be read after set. <br />Call `GET /v1/jsonschema` to retrieve the object's structure. |
| db_conns_auditing | boolean;  Enables/deactivates [database connection auditing]({{< relref "/operate/rs/security/audit-events" >}}) |
| default_user | boolean (default:&nbsp;true); Allow/disallow a default user to connect |
| disabled_commands | string (default: ); Redis commands which are disabled in db |
| <span class="break-all">disconnect_clients_on_password_removal</span> | boolean (default: false); Controls whether client connections using removed, revoked, or rotated passwords are actively disconnected |
| dns_address_master | string;  Database private address endpoint FQDN (read-only) (deprecated as of Redis Enterprise v4.3.3) |
| email_alerts | boolean (default:&nbsp;false);  Send email alerts for this DB |
| endpoint | string;  Latest bound endpoint. Used when reconfiguring an endpoint via update |
| endpoint_ip | complex object;  External IP addresses of node hosting the BDB's endpoint. `GET`&nbsp;`/jsonschema` to retrieve the object's structure. (read-only) (deprecated as of Redis Enterprise v4.3.3) |
| endpoint_node | integer;  Node UID hosting the BDB's endpoint (read-only) (deprecated as of Redis Enterprise v4.3.3) |
| endpoints | array; List of database access endpoints (read-only)<br />**uid**: Unique identification of this source<br />**dns_name**: Endpoint’s DNS name<br />**port**: Endpoint’s TCP port number<br />**addr**: Endpoint’s accessible addresses<br />**proxy_policy**: The policy used for proxy binding to the endpoint<br />**exclude_proxies**: List of proxies to exclude<br />**include_proxies**: List of proxies to include<br />**addr_type**: Indicates if the endpoint is based on internal or external IPs<br /><span class="break-all">**oss_cluster_api_preferred_ip_type**</span>: Indicates preferred IP type in the OSS cluster API: internal/external<br /><span class="break-all">**oss_cluster_api_preferred_endpoint_type**</span>: Indicates preferred endpoint type in the OSS cluster API: ip/hostname |
| enforce_client_authentication | Require authentication of client certificates for SSL connections to the database. If set to 'enabled', a certificate should be provided in either authentication_ssl_client_certs or authentication_ssl_crdt_certs<br />Values:<br />**'enabled'** <br />'disabled' |
| eviction_policy | Database eviction policy (Redis style).<br />Values:<br />'volatile-lru'<br />'volatile-ttl'<br />'volatile-random'<br />'allkeys-lru'<br />'allkeys-random'<br />'noeviction'<br />'volatile-lfu'<br />'allkeys-lfu'<br />**Redis DB default**: 'volatile-lru'<br />**memcached DB default**: 'allkeys-lru' |
| export_failure_reason | Reason of last failed export process (read-only)<br />Values:<br />'no-permission'<br />'wrong-file-path'<br /> 'general-error' |
| export_progress | number, <nobr>(range: 0-100)</nobr>; Database manually triggered export progress (percentage) (read-only) |
| export_status | Status of manually triggered export process (read-only)<br />Values:<br />'exporting'<br />'succeeded'<br />'failed' |
| generate_text_monitor | boolean;  Enable/disable generation of syncer monitoring information |
| gradual_src_max_sources | integer (default:&nbsp;1); Sync a maximum N sources in parallel (gradual_src_mode should be enabled for this to take effect) |
| gradual_src_mode | Indicates if gradual sync (of sync sources) should be activated<br />Values:<br />'enabled'<br />'disabled' |
| gradual_sync_max_shards_per_source | integer (default:&nbsp;1); Sync a maximum of N shards per source in parallel (gradual_sync_mode should be enabled for this to take effect) |
| gradual_sync_mode | Indicates if gradual sync (of source shards) should be activated ('auto' for automatic decision)<br />Values:<br />'enabled'<br />'disabled'<br />'auto' |
| hash_slots_policy | The policy used for hash slots handling<br />Values:<br/> **'legacy'**: slots range is '1-4096'<br /> **'16k'**: slots range is '0-16383' |
| implicit_shard_key | boolean (default:&nbsp;false); Controls the behavior of what happens in case a key does not match any of the regex rules. <br /> **true**: if a key does not match any of the rules, the entire key will be used for the hashing function <br /> **false**: if a key does not match any of the rules, an error will be returned. |
| import_failure_reason | Import failure reason (read-only)<br />Values:<br />'download-error'<br />'file-corrupted'<br />'general-error'<br />'file-larger-than-mem-limit:\<n bytes of expected dataset>:\<n bytes configured bdb limit>'<br />'key-too-long'<br />'invalid-bulk-length'<br />'out-of-memory' |
| import_progress | number, <nobr>(range: 0-100)</nobr>; Database import progress (percentage) (read-only) |
| import_status | Database import process status (read-only)<br />Values:<br />'idle'<br />'initializing'<br />'importing'<br />'succeeded'<br />'failed' |
| internal | boolean (default:&nbsp;false); Is this a database used by the cluster internally |
| last_backup_time | string; Time of last successful backup (read-only) |
| last_changed_time | string; Last administrative configuration change (read-only) |
| last_export_time | string; Time of last successful export (read-only) |
| <span class="break-all">link_sconn_on_full_request</span> | Feature-flag for DMC behaviour on linking client request<br />Values:<br />'enabled'<br />**'disabled'**<br />'ssl_only' |
| max_aof_file_size | integer; Maximum size for shard's AOF file (bytes). Default 300GB, (on bigstore DB 150GB) |
| max_aof_load_time | integer (default:&nbsp;3600); Maximum time shard's AOF reload should take (seconds). |
| max_client_pipeline | integer (default:&nbsp;200); Maximum number of pipelined commands per connection. Maximum value is 2047. |
| max_connections | integer (default:&nbsp;0); Maximum number of client connections allowed (0 unlimited) |
| max_pipelined | integer (default:&nbsp;2000); Determines the maximum number of commands in the proxy’s pipeline per shard connection. |
| maxclients | integer (default: 10000); The maximum number of connected clients at the same time. By default the limit is 10000 clients. |
| master_persistence | boolean (default:&nbsp;false); If true, persists the primary shard in addition to replica shards in a replicated and persistent database. |
| memory_size | integer (default:&nbsp;0); Database memory limit (0 is unlimited), expressed in bytes. |
| metrics_export_all | boolean; Enable/disable exposing all shard metrics through the metrics exporter |
| mkms | boolean (default:&nbsp;true); Are MKMS (Multi Key Multi Slots) commands supported? |
| module_list | {{<code>}}[{<br />  "module_id": string,<br />  "module_args": [<br />    u'string',<br />    u'null'],<br />  "module_name": string,<br />  "semantic_version": string<br />}, ...]{{</code>}} List of modules associated with the database<br /><br />**module_id**: Module UID (deprecated; use `module_name` instead)<br />**module_args**: Module command-line arguments (deprecated; use the module objects for [search]({{<relref "/operate/rs/references/rest-api/objects/bdb/search">}}), [timeseries]({{<relref "/operate/rs/references/rest-api/objects/bdb/timeseries">}}), and [probabilistic]({{<relref "/operate/rs/references/rest-api/objects/bdb/probabilistic">}}) instead)<br />**module_name**: Module's name<br />**semantic_version**: Module's semantic version (deprecated; use `module_args` instead)<br /><br />**module_id** and **semantic_version** are optional as of Redis Enterprise Software v7.4.2 and deprecated as of v7.8.2.<br />**module_args** is deprecated as of Redis Enterprise Software v8.0. |
| mtls_allow_outdated_certs | boolean; An optional mTLS relaxation flag for certs verification |
| mtls_allow_weak_hashing | boolean; An optional mTLS relaxation flag for certs verification |
| multi_commands_opt | If set to `batch`, it reduces the overhead of transaction management by batching multiple commands into a single transaction.<br />Values:<br />**disabled**: Turns off the optimization.<br />**batch**: Enables the optimization.<br />**auto**: Uses the [cluster's `multi_commands_opt` setting]({{<relref "/operate/rs/references/rest-api/objects/cluster">}}). |
| name | string; Database name. Only letters, numbers, or hyphens are valid characters. The name must start and end with a letter or number. |
| oss_cluster | boolean (default:&nbsp;false); OSS Cluster mode option. Cannot be enabled with `'hash_slots_policy': 'legacy'` |
| <span class="break-all">oss_cluster_api_preferred_endpoint_type</span> | Endpoint type in the OSS cluster API<br />Values:<br />**‘ip’**<br />‘hostname’ |
| <span class="break-all">oss_cluster_api_preferred_ip_type</span> | Internal/external IP type in OSS cluster API. Default value for new endpoints<br />Values:<br />**'internal'** <br />'external' |
| oss_sharding | boolean (default:&nbsp;false); An alternative to `shard_key_regex` for using the common case of the OSS shard hashing policy |
| <span class="break-all">partial_request_timeout_seconds</span> | integer (default: 3); When a client connection sends a command, takes a server connection, and stops writing before the command is complete, it causes head-of-line blocking on this server connection. Such commands will time out after this many seconds and the client connection will be closed. |
| port | integer; TCP port on which the database is available. Generated automatically if omitted and returned as 0 |
| <span class="break-all">preemptive_drain_timeout_seconds</span> | integer (default: 2); Timeout in seconds for preemptive drain of client connections before a shard is taken down |
| probabilistic | [complex object]({{< relref "/operate/rs/references/rest-api/objects/bdb/probabilistic" >}}); Configuration fields for probabilistic data structures. |
| proxy_policy | The default policy used for proxy binding to endpoints<br />Values:<br />'single'<br />'all-master-shards'<br />'all-nodes' |
| query_performance_factor | [complex object]({{< relref "/operate/rs/references/rest-api/objects/bdb/query_performance_factor" >}}); Configures query performance factor and related fields |
| rack_aware | boolean (default:&nbsp;false); Require the database to always replicate across multiple racks |
| recovery_wait_time | integer (default:&nbsp;-1); Defines how many seconds to wait for the persistence file to become available during auto recovery. After the wait time expires, auto recovery completes with potential data loss. The default `-1` means to wait forever. |
| redis_version | string; Version of the redis-server processes: e.g. 6.0, 5.0-big |
| repl_backlog_size | string; Redis replication backlog size ('auto' or size in bytes) |
| replica_read_only | boolean (default: false); If `true`, enables an Active-Passive setup where Replica Of databases only allow read operations. Only configurable during database creation and cannot be changed later. |
| replica_sconns_on_demand | Reduces DMC internode connections by at least 50%, conserving sockets, file descriptors, and KEEPALIVE traffic.<br />Values:<br />**'enabled'** <br />'disabled' |
| replica_sources | array of [syncer_sources]({{< relref "/operate/rs/references/rest-api/objects/bdb/syncer_sources" >}}) objects; Remote endpoints of database to sync from. See the 'bdb -\> replica_sources' section |
| [replica_sync]({{< relref "/operate/rs/references/rest-api/objects/bdb/replica_sync" >}}) | Enable, disable, or pause syncing from specified replica_sources<br />Values:<br />'enabled'<br /> **'disabled'** <br />'paused'<br />'stopped' |
| <span class="break-all">replica_sync_connection_alarm_timeout_seconds</span> | integer (default: 0); If the syncer takes longer than the specified number of seconds to connect to a replica, raise a connection alarm |
| replica_sync_dist | boolean; Enable/disable distributed syncer in replica-of |
| replication | boolean (default:&nbsp;false); In-memory database replication mode |
| resp3 | boolean (default:&nbsp;true); Enables or deactivates RESP3 support |
| roles_permissions | {{<code>}}[{<br />  "role_uid": integer,<br />  "redis_acl_uid": integer<br />}, ...]{{</code>}} |
| sched_policy | Controls how server-side connections are used when forwarding traffic to shards.<br />Values:<br />**cmp**: Closest to max_pipelined policy. Pick the connection with the most pipelined commands that has not reached the max_pipelined limit.<br />**mru**: Try to use most recently used connections.<br />**spread**: Try to use all connections.<br />**mnp**: Minimal pipeline policy. Pick the connection with the least pipelined commands. |
| search | [complex object]({{< relref "/operate/rs/references/rest-api/objects/bdb/search" >}}); Configuration fields for search and query. |
| shard_block_crossslot_keys | boolean (default:&nbsp;false); In Lua scripts, prevent use of keys from different hash slots within the range owned by the current shard |
| shard_block_foreign_keys | boolean (default:&nbsp;true); In Lua scripts, `foreign_keys` prevent use of keys which could reside in a different shard (foreign keys) |
| shard_key_regex | Custom keyname-based sharding rules.<br />`[{"regex": string}, ...]`<br />To use the default rules you should set the value to: <br />`[{"regex": ".*\\{(?<tag>.*)\\}.*"}, {"regex": "(?<tag>.*)"}]` |
| <span class="break-all">shard_imbalance_threshold</span> | number (default: 314572800); Automatically balances shards only if their imbalance is greater than this threshold |
| <span class="break-all">shard_imbalance_threshold_percentage</span> | integer (default: 20); Automatically balances shards only if their imbalance percentage is greater than this threshold |
| shard_list | array of integers; Cluster unique IDs of all database shards. |
| sharding | boolean (default:&nbsp;false); Cluster mode (server-side sharding). When true, shard hashing rules must be provided by either `oss_sharding` or `shard_key_regex` |
| shards_count | integer, <nobr>(range: 1-512)</nobr> (default:&nbsp;1); Number of database server-side shards |
| shards_placement | Control the density of shards <br />Values:<br />**'dense'**: Shards reside on as few nodes as possible <br /> **'sparse'**: Shards reside on as many nodes as possible |
| skip_import_analyze | Enable/disable skipping the analysis stage when importing an RDB file<br />Values:<br />'enabled'<br />'disabled' |
| slave_buffer | Redis replica output buffer limits<br />Values:<br />'auto'<br />value in MB<br />hard:soft:time |
| slave_ha | boolean; Enable replica high availability mechanism for this database (default takes the cluster setting) |
| slave_ha_priority | integer; Priority of the BDB in replica high availability mechanism |
| snapshot_policy | array of [snapshot_policy]({{< relref "/operate/rs/references/rest-api/objects/bdb/snapshot_policy" >}}) objects; Policy for snapshot-based data persistence. A dataset snapshot will be taken every N secs if there are at least M writes changes in the dataset |
| ssl | boolean (default:&nbsp;false); Require SSL authenticated and encrypted connections to the database (deprecated as of Redis Enterprise v5.0.1) |
| [status]({{< relref "/operate/rs/references/rest-api/objects/bdb/status" >}}) | Database lifecycle status (read-only)<br />Values:<br />'pending'<br />'active'<br />'active-change-pending'<br />'delete-pending'<br />'import-pending'<br />'creation-failed'<br />'recovery' |
| support_syncer_reconf | boolean; Determines whether the syncer handles its own configuration changes. If false, the DMC restarts the syncer upon a configuration change. |
| sync | (deprecated as of Redis Enterprise v5.0.1, use [replica_sync]({{< relref "/operate/rs/references/rest-api/objects/bdb/replica_sync" >}}) or crdt_sync instead) Enable, disable, or pause syncing from specified sync_sources<br />Values:<br />'enabled'<br /> **'disabled'** <br />'paused'<br />'stopped' |
| sync_dedicated_threads | integer (range:&nbsp;0-10) (default:&nbsp;5); Number of dedicated Replica Of threads |
| sync_sources | {{<code>}}[{<br />  "uid": integer,<br />  "uri": string,<br />  "compression": integer,<br />  "status": string,<br />  "rdb_transferred": integer,<br />  "rdb_size": integer,<br />  "last_update": string,<br />  "lag": integer,<br />  "last_error": string<br />}, ...]{{</code>}} (deprecated as of Redis Enterprise v5.0.1, instead use replica_sources or crdt_sources) Remote endpoints of database to sync from. See the 'bdb -\> replica_sources' section<br />**uid**: Numeric unique identification of this source<br />**uri**: Source Redis URI<br />**compression**: Compression level for the replication link<br />**status**: Sync status of this source<br />**rdb_transferred**: Number of bytes transferred from the source's RDB during the syncing phase<br />**rdb_size**: The source's RDB size to be transferred during the syncing phase<br />**last_update**: Time last update was received from the source<br />**lag**: Lag in millisec between source and destination (while synced)<br />**last_error**: Last error encountered when syncing from the source |
| syncer_log_level | Minimum syncer log level to log. Only logs with this level or higher will be logged.<br />Values:<br />‘crit’<br />‘error’<br />‘warn’<br />**‘info’**<br />‘trace’<br />‘debug’ |
| syncer_mode | The syncer for replication between database instances is either on a single node (centralized) or on each node that has a proxy according to the proxy policy (distributed). (read-only)<br />Values:<br />'distributed'<br />'centralized' |
| tags | {{<code>}}[{<br />  "key": string,<br />  "value": string<br />}, ...]{{</code>}} Optional list of tag objects attached to the database. Each tag requires a key-value pair.<br />**key**: Represents the tag's meaning and must be unique among tags (pattern does not allow special characters &,\<,>,")<br />**value**: The tag's value.|
| timeseries | [complex object]({{< relref "/operate/rs/references/rest-api/objects/bdb/timeseries" >}}); Configuration fields for timeseries. |
| tls_mode | Require TLS-authenticated and encrypted connections to the database<br />Values:<br />'enabled'<br /> **'disabled'** <br />'replica_ssl' |
| tracking_table_max_keys | integer; The client-side caching invalidation table size. 0 makes the cache unlimited. |
| type | Type of database<br />Values:<br />**'redis'** <br />'memcached' |
| use_nodes | array of strings; Cluster node UIDs to use for database shards and bound endpoints |
| use_selective_flush | boolean (default: true); If true, enable selective flush of destination shards |
| version | string; Database compatibility version: full Redis/memcached version number, such as 6.0.6. This value can only change during database creation and database upgrades.|
| wait_command | boolean (default:&nbsp;true); Supports Redis wait command (read-only) |
